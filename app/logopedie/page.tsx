'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Play, CalendarPlus, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MODULE_CONFIG, formatDate } from '@/lib/config'
import { PracticeCalendar } from '@/components/PracticeCalendar'
import { BackHeader } from '@/components/BackHeader'
import type { Session, Task, Recording } from '@/lib/types'

const cfg = MODULE_CONFIG.logopedie

export default function LogopediePage() {
  const [session, setSession] = useState<Session | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [recording, setRecording] = useState<Recording | null>(null)
  const [practicedDays, setPracticedDays] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const today = new Date()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('module', 'logopedie')
      .order('date', { ascending: false })
      .limit(1)

    if (!sessions?.length) { setLoading(false); return }
    const s = sessions[0]
    setSession(s)

    const [{ data: taskData }, { data: recData }, { data: logs }] = await Promise.all([
      supabase.from('tasks').select('*').eq('session_id', s.id).eq('is_archived', false).order('order_index'),
      supabase.from('recordings').select('*').eq('session_id', s.id).limit(1),
      supabase.from('practice_log').select('date').eq('session_id', s.id)
        .gte('date', `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`)
        .lte('date', `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-31`),
    ])

    setTasks(taskData || [])
    if (recData?.length) setRecording(recData[0])
    if (logs) setPracticedDays(new Set(logs.map(l => new Date(l.date).getDate())))
    setLoading(false)
  }

  async function toggleDay(day: number) {
    if (!session) return
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (practicedDays.has(day)) {
      await supabase.from('practice_log').delete().eq('session_id', session.id).eq('date', dateStr)
      setPracticedDays(prev => { const n = new Set(prev); n.delete(day); return n })
    } else {
      await supabase.from('practice_log').insert({ session_id: session.id, date: dateStr })
      setPracticedDays(prev => new Set(prev).add(day))
    }
  }

  async function setNextSession() {
    if (!session) return
    const dateStr = prompt('Datum příští schůzky (RRRR-MM-DD):')
    if (!dateStr) return
    await supabase.from('sessions').update({ next_session_date: dateStr }).eq('id', session.id)
    setSession(prev => prev ? { ...prev, next_session_date: dateStr } : prev)
  }

  if (loading) return <Spinner />

  return (
    <main className="min-h-screen max-w-sm mx-auto pb-10">
      <BackHeader
        title="Logopedie"
        href="/"
        action={
          <Link href="/logopedie/nova-schuze">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: cfg.bg }}>
              <Plus size={18} style={{ color: cfg.accent }} />
            </div>
          </Link>
        }
      />

      {session ? (
        <>
          {/* Compact session row */}
          <div className="mx-4 mb-5 bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3">
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: cfg.medium }}
              aria-label="Přehrát nahrávku"
            >
              <Play size={14} className="text-white ml-0.5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Schůzka {formatDate(session.date)}
              </p>
              <p className="text-xs text-gray-400">
                {recording
                  ? `Nahrávka · ${Math.floor((recording.duration_seconds || 0) / 60)} min`
                  : 'bez nahrávky'}
              </p>
            </div>
            <button
              onClick={setNextSession}
              className="flex items-center gap-1 flex-shrink-0 active:opacity-60"
            >
              <span className="text-xs" style={{ color: cfg.accent }}>
                {session.next_session_date
                  ? new Date(session.next_session_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })
                  : 'příště'}
              </span>
              <CalendarPlus size={15} style={{ color: cfg.accent }} />
            </button>
          </div>

          {/* Task chips */}
          {tasks.length > 0 && (
            <div className="px-4 mb-5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Co procvičujeme</p>
              <div className="grid grid-cols-2 gap-2">
                {tasks.map(task => (
                  <Link key={task.id} href={`/logopedie/${session.id}/ukol/${task.id}`}>
                    <div
                      className="bg-white border rounded-2xl p-3.5 h-full active:scale-95 transition-transform"
                      style={{ borderColor: cfg.border }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center mb-2.5 text-xs font-medium"
                        style={{ background: cfg.bg, color: cfg.accent }}
                      >
                        {task.title.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-xs text-gray-300">detail →</p>
                        <ChevronRight size={12} className="text-gray-300" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div className="mx-4 mb-5 p-4 rounded-2xl border border-dashed border-gray-200 text-center">
              <p className="text-sm text-gray-400">Žádné úkoly zatím</p>
              <Link href={`/logopedie/${session.id}/pridat-ukol`} className="text-xs mt-1 block" style={{ color: cfg.accent }}>
                + přidat úkol
              </Link>
            </div>
          )}

          {/* Practice calendar */}
          <div className="px-4 pb-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {today.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })} — cvičení
              </p>
              <span className="text-xs font-medium" style={{ color: cfg.accent }}>
                {practicedDays.size} / {today.getDate() - 1} dní
              </span>
            </div>
            <PracticeCalendar
              year={today.getFullYear()}
              month={today.getMonth()}
              practicedDays={practicedDays}
              onToggle={toggleDay}
              accentColor={cfg.medium}
              darkColor={cfg.dark}
              today={today.getDate()}
            />
            <p className="text-xs text-gray-300 mt-2 text-center">klepnutím na den zaznamenáš cvičení</p>
          </div>

          {/* Previous sessions link */}
          <div className="px-4">
            <Link href="/logopedie/historie">
              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">Předchozí schůzky</span>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </Link>
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </main>
  )
}

function EmptyState() {
  return (
    <div className="px-4 pt-10 text-center">
      <div
        className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: cfg.bg }}
      >
        <Plus size={28} style={{ color: cfg.accent }} />
      </div>
      <h2 className="text-lg font-medium text-gray-900 mb-2">Žádná schůzka zatím</h2>
      <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
        Po první logopedické schůzce tady přidej záznam s úkoly.
      </p>
      <Link href="/logopedie/nova-schuze">
        <button
          className="px-6 py-3 rounded-2xl text-sm font-medium text-white active:opacity-80"
          style={{ background: cfg.accent }}
        >
          Přidat první schůzku
        </button>
      </Link>
    </div>
  )
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: cfg.border, borderTopColor: cfg.accent }}
      />
    </div>
  )
}
