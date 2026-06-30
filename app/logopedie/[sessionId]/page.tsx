'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { Plus, X, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MODULE_CONFIG, formatDate } from '@/lib/config'
import { BackHeader } from '@/components/BackHeader'
import type { Session, Task } from '@/lib/types'

const cfg = MODULE_CONFIG.logopedie

export default function SessionDetailLogopedie({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const [session, setSession] = useState<Session | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: t }] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', sessionId).single(),
        supabase.from('tasks').select('*').eq('session_id', sessionId).order('order_index'),
      ])
      setSession(s)
      setTasks(t || [])
      setLoading(false)
    }
    load()
  }, [sessionId])

  async function addTask() {
    const title = newTitle.trim()
    if (!title || adding) return
    setAdding(true)
    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order_index ?? 0)) + 1 : 0
    const { data } = await supabase
      .from('tasks')
      .insert({ session_id: sessionId, title, order_index: maxOrder })
      .select()
      .single()
    if (data) {
      setTasks(prev => [...prev, data])
      setNewTitle('')
    }
    setAdding(false)
  }

  async function deleteTask(taskId: string) {
    await supabase.from('tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: cfg.border, borderTopColor: cfg.accent }} />
    </div>
  )

  return (
    <main className="min-h-screen max-w-sm mx-auto pb-10">
      <BackHeader
        title={session ? formatDate(session.date) : 'Schůzka'}
        href="/logopedie"
      />

      <div className="px-4">
        {tasks.length > 0 ? (
          <>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Úkoly</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {tasks.map(task => (
                <div key={task.id} className="relative group">
                  <Link href={`/logopedie/${sessionId}/ukol/${task.id}`}>
                    <div
                      className="bg-white border rounded-2xl p-3.5 active:scale-95 transition-transform"
                      style={{ borderColor: cfg.border }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center mb-2.5 text-xs font-medium"
                        style={{ background: cfg.bg, color: cfg.accent }}
                      >
                        {task.title.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-medium text-gray-900 leading-snug pr-5">{task.title}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-xs text-gray-300">detail →</p>
                        <ChevronRight size={12} className="text-gray-300" />
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full text-gray-300 active:text-gray-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400 mb-6">Zatím žádné úkoly.</p>
        )}

        <div className="border-t border-gray-100 pt-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Přidat úkol</p>
          <div className="flex gap-2">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Název úkolu…"
              className="flex-1 text-sm bg-white rounded-xl px-4 py-3 border border-gray-200 outline-none"
            />
            <button
              onClick={addTask}
              disabled={adding || !newTitle.trim()}
              className="w-11 h-11 flex items-center justify-center rounded-xl text-white flex-shrink-0 disabled:opacity-40"
              style={{ background: cfg.accent }}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
