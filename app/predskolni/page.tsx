'use client'

import { useEffect, useState } from 'react'
import { Plus, CheckCircle, Circle, Minus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MODULE_CONFIG } from '@/lib/config'
import { BackHeader } from '@/components/BackHeader'
import type { Item } from '@/lib/types'

const cfg = MODULE_CONFIG.predskolni

const STATUS_LABELS = {
  not_yet: 'zatím ne',
  almost: 'skoro',
  done: 'umí',
}

const STATUS_COLORS = {
  not_yet: '#d1d5db',
  almost: '#f59e0b',
  done: '#3B6D11',
}

export default function PredskolniPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('module', 'predskolni')
      .order('order_index')
    setItems(data || [])
    setLoading(false)
  }

  async function addItem() {
    if (!newTitle.trim()) return
    const { data } = await supabase
      .from('items')
      .insert({ module: 'predskolni', title: newTitle.trim(), description: newDesc.trim() || null, order_index: items.length })
      .select()
      .single()
    if (data) setItems(prev => [...prev, data])
    setNewTitle('')
    setNewDesc('')
    setAdding(false)
  }

  async function cycleStatus(item: Item) {
    const next = item.status === 'not_yet' ? 'almost' : item.status === 'almost' ? 'done' : 'not_yet'
    await supabase.from('items').update({ status: next }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: next } : i))
  }

  if (loading) return <Spinner />

  const grouped = {
    not_yet: items.filter(i => i.status === 'not_yet'),
    almost: items.filter(i => i.status === 'almost'),
    done: items.filter(i => i.status === 'done'),
  }

  return (
    <main className="min-h-screen max-w-sm mx-auto pb-10">
      <BackHeader
        title="Předškolní příprava"
        href="/"
        action={
          <button
            onClick={() => setAdding(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: cfg.bg }}
          >
            <Plus size={18} style={{ color: cfg.accent }} />
          </button>
        }
      />

      {adding && (
        <div className="mx-4 mb-5 p-4 rounded-2xl border" style={{ borderColor: cfg.border, background: cfg.bg }}>
          <p className="text-xs font-medium mb-3" style={{ color: cfg.dark }}>Nová dovednost</p>
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Název (např. pozná všechna písmena)"
            className="w-full text-sm bg-white rounded-xl px-3 py-2.5 border border-gray-200 mb-2 outline-none"
          />
          <textarea
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Poznámka (nepovinné)"
            rows={2}
            className="w-full text-sm bg-white rounded-xl px-3 py-2.5 border border-gray-200 mb-3 outline-none resize-none"
          />
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-xl text-sm text-gray-500 border border-gray-200 bg-white">
              Zrušit
            </button>
            <button
              onClick={addItem}
              className="flex-1 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: cfg.accent }}
            >
              Přidat
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !adding ? (
        <EmptyState onAdd={() => setAdding(true)} />
      ) : (
        <div className="px-4 space-y-6">
          {(['not_yet', 'almost', 'done'] as const).map(status => (
            grouped[status].length > 0 && (
              <div key={status}>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  {STATUS_LABELS[status]} ({grouped[status].length})
                </p>
                <div className="space-y-2">
                  {grouped[status].map(item => (
                    <div key={item.id} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-start gap-3">
                      <button onClick={() => cycleStatus(item)} className="mt-0.5 flex-shrink-0 active:scale-90 transition-transform">
                        {item.status === 'done'
                          ? <CheckCircle size={20} style={{ color: STATUS_COLORS.done }} />
                          : item.status === 'almost'
                          ? <Minus size={20} style={{ color: STATUS_COLORS.almost }} />
                          : <Circle size={20} style={{ color: STATUS_COLORS.not_yet }} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </main>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="px-4 pt-10 text-center">
      <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: cfg.bg }}>
        <Plus size={28} style={{ color: cfg.accent }} />
      </div>
      <h2 className="text-lg font-medium text-gray-900 mb-2">Zatím prázdné</h2>
      <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
        Přidávej dovednosti, které chceš se synem postupně rozvíjet před nástupem do školy.
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 rounded-2xl text-sm font-medium text-white active:opacity-80"
        style={{ background: cfg.accent }}
      >
        Přidat první dovednost
      </button>
    </div>
  )
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: cfg.border, borderTopColor: cfg.accent }} />
    </div>
  )
}
