'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MODULE_CONFIG, formatDate } from '@/lib/config'
import { BackHeader } from '@/components/BackHeader'
import type { Session } from '@/lib/types'

const cfg = MODULE_CONFIG.logopedie

export default function HistorieLogopedie() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('module', 'logopedie')
        .order('date', { ascending: false })

      if (data && data.length > 0) {
        setSessions(data)
        const { data: allTasks } = await supabase
          .from('tasks')
          .select('session_id')
          .in('session_id', data.map(s => s.id))
        const counts: Record<string, number> = {}
        data.forEach(s => { counts[s.id] = 0 })
        allTasks?.forEach(t => { counts[t.session_id] = (counts[t.session_id] || 0) + 1 })
        setTaskCounts(counts)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: cfg.border, borderTopColor: cfg.accent }} />
    </div>
  )

  return (
    <main className="min-h-screen max-w-sm mx-auto pb-10">
      <BackHeader
        title="Všechny schůzky"
        href="/logopedie"
        action={
          <Link href="/logopedie/nova-schuze">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: cfg.bg }}>
              <Plus size={18} style={{ color: cfg.accent }} />
            </div>
          </Link>
        }
      />

      <div className="px-4">
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-400 pt-4">Zatím žádné schůzky.</p>
        ) : (
          <div>
            {sessions.map(s => (
              <Link key={s.id} href={`/logopedie/${s.id}`}>
                <div className="flex items-center gap-3 py-3.5 border-b border-gray-100 active:bg-gray-50 -mx-4 px-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-medium"
                    style={{ background: cfg.bg, color: cfg.accent }}
                  >
                    {new Date(s.date).getDate()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{formatDate(s.date)}</p>
                    <p className="text-xs text-gray-400">
                      {taskCounts[s.id] === 1 ? '1 úkol' : `${taskCounts[s.id] ?? 0} úkolů`}
                      {s.next_session_date
                        ? ` · příště ${new Date(s.next_session_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}`
                        : ''}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
