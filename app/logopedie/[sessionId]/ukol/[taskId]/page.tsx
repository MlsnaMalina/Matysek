'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { supabase } from '@/lib/supabase'
import { MODULE_CONFIG } from '@/lib/config'
import { BackHeader } from '@/components/BackHeader'
import RecordingWidget from '@/components/RecordingWidget'
import type { Task } from '@/lib/types'

const cfg = MODULE_CONFIG.logopedie

export default function UkolDetailPage({ params }: { params: Promise<{ sessionId: string; taskId: string }> }) {
  const { sessionId, taskId } = use(params)
  const [task, setTask] = useState<Task | null>(null)
  const [editingDesc, setEditingDesc] = useState(false)
  const [desc, setDesc] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('tasks').select('*').eq('id', taskId).single()
      if (data) { setTask(data); setDesc(data.description || '') }
    }
    load()
  }, [taskId])

  async function saveDesc() {
    if (!task) return
    await supabase.from('tasks').update({ description: desc }).eq('id', task.id)
    setTask(prev => prev ? { ...prev, description: desc } : prev)
    setEditingDesc(false)
  }

  if (!task) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: cfg.border, borderTopColor: cfg.accent }} />
    </div>
  )

  return (
    <main className="min-h-screen max-w-sm mx-auto pb-10">
      <BackHeader title={task.title} href="/logopedie" />

      <RecordingWidget
        taskId={taskId}
        sessionId={sessionId}
        accent={cfg.accent}
        dark={cfg.dark}
        bg={cfg.bg}
        medium={cfg.medium}
      />

      {/* Instructions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Jak na to</p>
          {!editingDesc && (
            <button onClick={() => setEditingDesc(true)} className="text-xs" style={{ color: cfg.accent }}>
              {task.description ? 'upravit' : '+ přidat'}
            </button>
          )}
        </div>

        {editingDesc ? (
          <div>
            <textarea
              autoFocus
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={6}
              placeholder="Napiš instrukce k tomuto úkolu..."
              className="w-full text-sm bg-white rounded-2xl px-4 py-3 border border-gray-200 outline-none resize-none mb-2"
            />
            <div className="flex gap-2">
              <button onClick={() => { setEditingDesc(false); setDesc(task.description || '') }}
                className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500">
                Zrušit
              </button>
              <button onClick={saveDesc}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: cfg.accent }}>
                Uložit
              </button>
            </div>
          </div>
        ) : task.description ? (
          <div className="bg-gray-50 rounded-2xl px-4 py-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
          </div>
        ) : (
          <button
            onClick={() => setEditingDesc(true)}
            className="w-full py-10 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400"
          >
            Klepnutím přidej instrukce k tomuto úkolu
          </button>
        )}
      </div>
    </main>
  )
}
