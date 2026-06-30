'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Mic, Activity, BookOpen, Sun, CalendarPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MODULE_CONFIG, nextSessionLabel } from '@/lib/config'
import type { Session } from '@/lib/types'

interface ModuleData {
  session: Session | null
  taskCount: number
  itemCount: number
}

const MODULE_ICONS = {
  logopedie: Mic,
  fyzioterapie: Activity,
  predskolni: BookOpen,
  letni: Sun,
}

export default function HomePage() {
  const [data, setData] = useState<Record<string, ModuleData>>({})
  const today = new Date()

  useEffect(() => {
    async function load() {
      const result: Record<string, ModuleData> = {
        logopedie: { session: null, taskCount: 0, itemCount: 0 },
        fyzioterapie: { session: null, taskCount: 0, itemCount: 0 },
        predskolni: { session: null, taskCount: 0, itemCount: 0 },
        letni: { session: null, taskCount: 0, itemCount: 0 },
      }

      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .order('date', { ascending: false })

      if (sessions) {
        for (const s of sessions) {
          if (!result[s.module].session) result[s.module].session = s
        }
        const sessionIds = Object.values(result)
          .map(d => d.session?.id)
          .filter(Boolean) as string[]

        if (sessionIds.length > 0) {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('session_id')
            .in('session_id', sessionIds)
            .eq('is_archived', false)

          if (tasks) {
            for (const t of tasks) {
              const entry = Object.entries(result).find(([, d]) => d.session?.id === t.session_id)
              if (entry) entry[1].taskCount++
            }
          }
        }
      }

      const { data: items } = await supabase.from('items').select('module')
      if (items) {
        for (const item of items) {
          if (result[item.module]) result[item.module].itemCount++
        }
      }

      setData(result)
    }
    load()
  }, [])

  return (
    <main className="min-h-screen max-w-sm mx-auto px-4 pb-10">
      <div className="flex justify-between items-start pt-12 pb-7">
        <div>
          <p className="text-sm text-gray-400 capitalize">
            {today.toLocaleDateString('cs-CZ', { weekday: 'long' })}
          </p>
          <h1 className="text-2xl font-medium text-gray-900">
            {today.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' })}
          </h1>
        </div>
        <button
          className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400"
          aria-label="Přehled termínů"
        >
          <Calendar size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(MODULE_CONFIG) as (keyof typeof MODULE_CONFIG)[]).map(key => {
          const cfg = MODULE_CONFIG[key]
          const Icon = MODULE_ICONS[key]
          const d = data[key]
          const isTherapy = key === 'logopedie' || key === 'fyzioterapie'

          return (
            <Link key={key} href={cfg.href}>
              <div
                className="rounded-2xl p-4 min-h-36 flex flex-col justify-between active:scale-95 transition-transform"
                style={{ backgroundColor: cfg.bg }}
              >
                <div>
                  <Icon size={22} style={{ color: cfg.accent }} />
                  <p className="mt-2 text-sm font-medium" style={{ color: cfg.dark }}>
                    {cfg.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: cfg.accent }}>
                    {isTherapy
                      ? `${d?.taskCount ?? 0} úkolů`
                      : `${d?.itemCount ?? 0} položek`}
                  </p>
                </div>
                {isTherapy && (
                  <div
                    className="flex justify-between items-center pt-2 mt-2"
                    style={{ borderTop: `0.5px solid ${cfg.border}` }}
                  >
                    <span className="text-xs" style={{ color: cfg.accent }}>
                      {nextSessionLabel(d?.session?.next_session_date ?? null)}
                    </span>
                    <CalendarPlus size={14} style={{ color: cfg.accent }} />
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
