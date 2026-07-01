'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Play, Pause, Trash2, Loader, Video } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type WidgetState = 'loading' | 'idle' | 'recording' | 'uploading' | 'saved'
type MediaType = 'audio' | 'video'

interface Props {
  taskId: string
  sessionId: string
  accent: string
  dark: string
  bg: string
  medium: string
}

const MAX_FILE_MB = 50

export default function RecordingWidget({ taskId, sessionId, accent, dark, bg, medium }: Props) {
  const [widgetState, setWidgetState] = useState<WidgetState>('loading')
  const [mediaType, setMediaType] = useState<MediaType>('audio')
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const [storagePath, setStoragePath] = useState<string | null>(null)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
        setMediaType((data.type as MediaType) ?? 'audio')
        const { data: urlData } = supabase.storage.from('recordings').getPublicUrl(data.storage_path)
        setMediaUrl(urlData.publicUrl)
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
      recorder.onstop = () => handleAudioUpload(mimeType)

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

  async function handleAudioUpload(mimeType: string) {
    const ext = mimeType.includes('webm') ? 'webm' : 'm4a'
    const path = `audio/${taskId}.${ext}`
    const blob = new Blob(chunksRef.current, { type: mimeType })
    await saveMedia(blob, path, mimeType, 'audio', elapsedRef.current)
  }

  function openVideoPicker() {
    fileInputRef.current?.click()
  }

  async function handleVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > MAX_FILE_MB) {
      setUploadError(`Video je příliš velké (${Math.round(sizeMB)} MB). Maximum je ${MAX_FILE_MB} MB.`)
      e.target.value = ''
      return
    }

    setUploadError(null)
    setWidgetState('uploading')

    const ext = file.name.split('.').pop() ?? 'mp4'
    const path = `video/${taskId}.${ext}`
    await saveMedia(file, path, file.type, 'video', 0)
    e.target.value = ''
  }

  async function saveMedia(blob: Blob, path: string, contentType: string, type: MediaType, durationSecs: number) {
    if (storagePath) await supabase.storage.from('recordings').remove([storagePath])
    if (recordingId) await supabase.from('recordings').delete().eq('id', recordingId)

    const { error } = await supabase.storage
      .from('recordings')
      .upload(path, blob, { upsert: true, contentType })

    if (error) {
      setUploadError('Nahrávku se nepodařilo uložit: ' + error.message)
      setWidgetState('idle')
      return
    }

    const { data: row } = await supabase
      .from('recordings')
      .insert({ session_id: sessionId, task_id: taskId, storage_path: path, duration_seconds: durationSecs, type })
      .select()
      .single()

    const { data: urlData } = supabase.storage.from('recordings').getPublicUrl(path)

    setRecordingId(row?.id ?? null)
    setStoragePath(path)
    setMediaUrl(urlData.publicUrl)
    setMediaType(type)
    setDuration(durationSecs)
    setIsPlaying(false)
    setWidgetState('saved')
  }

  async function deleteRecording() {
    if (!storagePath || !recordingId) return
    await supabase.storage.from('recordings').remove([storagePath])
    await supabase.from('recordings').delete().eq('id', recordingId)
    setRecordingId(null)
    setStoragePath(null)
    setMediaUrl(null)
    setDuration(0)
    setIsPlaying(false)
    setWidgetState('idle')
  }

  function togglePlay() {
    const el = mediaType === 'video' ? videoRef.current : audioRef.current
    if (!el) return
    if (isPlaying) { el.pause(); setIsPlaying(false) }
    else { el.play(); setIsPlaying(true) }
  }

  function fmt(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <div className="mx-4 mb-5 rounded-2xl px-4 py-3" style={{ background: bg }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoFile}
      />

      {mediaUrl && mediaType === 'audio' && (
        <audio ref={audioRef} src={mediaUrl} onEnded={() => setIsPlaying(false)} />
      )}

      {widgetState === 'loading' && (
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: medium }}>
          <Loader size={16} className="text-white animate-spin" />
        </div>
      )}

      {widgetState === 'idle' && (
        <div className="flex items-center gap-3">
          <button onClick={startRecording} className="flex items-center gap-2.5 flex-1 text-left">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: medium }}>
              <Mic size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: dark }}>Nahrát hlas</p>
              <p className="text-xs" style={{ color: accent }}>klepnutím spustíš</p>
            </div>
          </button>
          <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
          <button onClick={openVideoPicker} className="flex items-center gap-2.5 flex-1 text-left">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: medium }}>
              <Video size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: dark }}>Nahrát video</p>
              <p className="text-xs" style={{ color: accent }}>z galerie telefonu</p>
            </div>
          </button>
        </div>
      )}

      {widgetState === 'recording' && (
        <button onClick={stopRecording} className="flex items-center gap-3 w-full text-left">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse" style={{ background: '#EF4444' }}>
            <Square size={14} className="text-white" fill="white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: dark }}>Nahrávám… {fmt(elapsed)}</p>
            <p className="text-xs" style={{ color: accent }}>klepnutím zastavíš</p>
          </div>
        </button>
      )}

      {widgetState === 'uploading' && (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: medium }}>
            <Loader size={16} className="text-white animate-spin" />
          </div>
          <p className="text-sm font-medium" style={{ color: dark }}>Ukládám…</p>
        </div>
      )}

      {widgetState === 'saved' && mediaType === 'audio' && (
        <div className="flex items-center gap-3">
          <button onClick={togglePlay} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: medium }}>
            {isPlaying ? <Pause size={14} className="text-white" /> : <Play size={14} className="text-white ml-0.5" />}
          </button>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: dark }}>Hlasová nahrávka · {fmt(duration)}</p>
            <p className="text-xs" style={{ color: accent }}>{isPlaying ? 'přehrávám…' : 'klepnutím přehraješ'}</p>
          </div>
          <button onClick={startRecording} className="text-xs px-2.5 py-1 rounded-lg" style={{ color: accent, background: `${accent}22` }}>znovu</button>
          <button onClick={deleteRecording} className="p-1 text-gray-400"><Trash2 size={15} /></button>
        </div>
      )}

      {widgetState === 'saved' && mediaType === 'video' && (
        <div>
          <video
            ref={videoRef}
            src={mediaUrl ?? undefined}
            onEnded={() => setIsPlaying(false)}
            className="w-full rounded-xl mb-3"
            style={{ maxHeight: '200px', objectFit: 'cover', background: '#000' }}
            playsInline
          />
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: medium }}>
              {isPlaying ? <Pause size={13} className="text-white" /> : <Play size={13} className="text-white ml-0.5" />}
            </button>
            <p className="text-xs flex-1" style={{ color: accent }}>{isPlaying ? 'přehrávám…' : 'video z galerie'}</p>
            <button onClick={openVideoPicker} className="text-xs px-2.5 py-1 rounded-lg" style={{ color: accent, background: `${accent}22` }}>změnit</button>
            <button onClick={deleteRecording} className="p-1 text-gray-400"><Trash2 size={15} /></button>
          </div>
        </div>
      )}

      {uploadError && (
        <p className="text-xs mt-2 px-1" style={{ color: '#ef4444' }}>{uploadError}</p>
      )}
    </div>
  )
}
