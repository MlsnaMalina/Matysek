'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Play, Pause, Trash2, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type WidgetState = 'loading' | 'idle' | 'recording' | 'uploading' | 'saved'

interface Props {
  taskId: string
  sessionId: string
  accent: string
  dark: string
  bg: string
  medium: string
}

export default function RecordingWidget({ taskId, sessionId, accent, dark, bg, medium }: Props) {
  const [widgetState, setWidgetState] = useState<WidgetState>('loading')
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const [storagePath, setStoragePath] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('recordings')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        setRecordingId(data.id)
        setStoragePath(data.storage_path)
        setDuration(data.duration_seconds ?? 0)
        const { data: urlData } = supabase.storage.from('recordings').getPublicUrl(data.storage_path)
        setAudioUrl(urlData.publicUrl)
        setWidgetState('saved')
      } else {
        setWidgetState('idle')
      }
    }
    load()
  }, [taskId])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })

      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => handleUpload(mimeType)

      recorder.start()
      mediaRecorderRef.current = recorder

      elapsedRef.current = 0
      setElapsed(0)
      setWidgetState('recording')

      timerRef.current = setInterval(() => {
        elapsedRef.current += 1
        setElapsed(elapsedRef.current)
      }, 1000)
    } catch {
      alert('Nepodařilo se získat přístup k mikrofonu.')
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop())
    setWidgetState('uploading')
  }

  async function handleUpload(mimeType: string) {
    const ext = mimeType.includes('webm') ? 'webm' : 'm4a'
    const path = `tasks/${taskId}.${ext}`
    const blob = new Blob(chunksRef.current, { type: mimeType })
    const durationSecs = elapsedRef.current

    if (storagePath) {
      await supabase.storage.from('recordings').remove([storagePath])
    }
    if (recordingId) {
      await supabase.from('recordings').delete().eq('id', recordingId)
    }

    const { error } = await supabase.storage
      .from('recordings')
      .upload(path, blob, { upsert: true, contentType: mimeType })

    if (error) {
      setWidgetState('idle')
      alert('Nahrávku se nepodařilo uložit.')
      return
    }

    const { data: row } = await supabase
      .from('recordings')
      .insert({ session_id: sessionId, task_id: taskId, storage_path: path, duration_seconds: durationSecs })
      .select()
      .single()

    const { data: urlData } = supabase.storage.from('recordings').getPublicUrl(path)

    setRecordingId(row?.id ?? null)
    setStoragePath(path)
    setAudioUrl(urlData.publicUrl)
    setDuration(durationSecs)
    setWidgetState('saved')
  }

  async function deleteRecording() {
    if (!storagePath || !recordingId) return
    await supabase.storage.from('recordings').remove([storagePath])
    await supabase.from('recordings').delete().eq('id', recordingId)
    setRecordingId(null)
    setStoragePath(null)
    setAudioUrl(null)
    setDuration(0)
    setIsPlaying(false)
    setWidgetState('idle')
  }

  function togglePlay() {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  function fmt(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <div className="mx-4 mb-5 rounded-2xl px-4 py-3" style={{ background: bg }}>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {widgetState === 'loading' && (
        <div className="flex items-center gap-3 h-9">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: medium }}>
            <Loader size={16} className="text-white animate-spin" />
          </div>
        </div>
      )}

      {widgetState === 'idle' && (
        <button onClick={startRecording} className="flex items-center gap-3 w-full text-left">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: medium }}>
            <Mic size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: dark }}>Nahrát pokyny</p>
            <p className="text-xs" style={{ color: accent }}>klepnutím spustíš nahrávání</p>
          </div>
        </button>
      )}

      {widgetState === 'recording' && (
        <button onClick={stopRecording} className="flex items-center gap-3 w-full text-left">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse"
            style={{ background: '#EF4444' }}
          >
            <Square size={14} className="text-white" fill="white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: dark }}>
              Nahrávám… {fmt(elapsed)}
            </p>
            <p className="text-xs" style={{ color: accent }}>klepnutím zastavíš</p>
          </div>
        </button>
      )}

      {widgetState === 'uploading' && (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: medium }}>
            <Loader size={16} className="text-white animate-spin" />
          </div>
          <p className="text-sm font-medium" style={{ color: dark }}>Ukládám nahrávku…</p>
        </div>
      )}

      {widgetState === 'saved' && (
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: medium }}
          >
            {isPlaying
              ? <Pause size={14} className="text-white" />
              : <Play size={14} className="text-white ml-0.5" />
            }
          </button>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: dark }}>
              Nahrávka · {fmt(duration)}
            </p>
            <p className="text-xs" style={{ color: accent }}>
              {isPlaying ? 'přehrávám…' : 'klepnutím přehraješ'}
            </p>
          </div>
          <button
            onClick={startRecording}
            className="text-xs px-2.5 py-1 rounded-lg"
            style={{ color: accent, background: `${accent}22` }}
          >
            znovu
          </button>
          <button onClick={deleteRecording} className="p-1 text-gray-400">
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
