'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MODULE_CONFIG } from '@/lib/config'
import { BackHeader } from '@/components/BackHeader'

const cfg = MODULE_CONFIG.fyzioterapie

export default function NovaSchuzeFyzioterapie() {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [tasks, setTasks] = useState<string[]>([''])
  const [saving, setSaving] = useState(false)

  function addTask() { setTasks(prev => [...prev, '']) }
  function removeTask(i: number) { setTasks(prev => prev.filter((_, idx) => idx !== i)) }
  function updateTask(i: number, val: string) { setTasks(prev => prev.map((t, idx) => idx === i ? val : t)) }

  async function save() {
    const validTasks = tasks.map(t => t.trim()).filter(Boolean)
    setSaving(true)

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({ module: 'fyzioterapie', date })
      .select()
      .single()

    if (error || !session) { setSaving(false); return }

    if (validTasks.length > 0) {
      await supabase.from('tasks').insert(
        validTasks.map((title, order_index) => ({ session_id: session.id, title, order_index }))
      )
    }

    router.push('/fyzioterapie')
  }

  return (
    <main className="min-h-screen max-w-sm mx-auto pb-10">
      <BackHeader title="Nová schůzka" href="/fyzioterapie" />

      <div className="px-4 space-y-5">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
            Datum schůzky
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full text-sm bg-white rounded-xl px-4 py-3 border border-gray-200 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
            Úkoly k procvičování
          </label>
          <div className="space-y-2">
            {tasks.map((task, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={task}
                  onChange={e => updateTask(i, e.target.value)}
                  placeholder={`Úkol ${i + 1}`}
                  className="flex-1 text-sm bg-white rounded-xl px-4 py-3 border border-gray-200 outline-none"
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                />
                {tasks.length > 1 && (
                  <button onClick={() => removeTask(i)} className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 flex-shrink-0">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button onClick={addTask} className="mt-2 flex items-center gap-1.5 text-sm py-2" style={{ color: cfg.accent }}>
            <Plus size={16} />
            Přidat další úkol
          </button>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-4 rounded-2xl text-sm font-medium text-white disabled:opacity-60"
          style={{ background: cfg.accent }}
        >
          {saving ? 'Ukládám...' : 'Uložit schůzku'}
        </button>
      </div>
    </main>
  )
}
