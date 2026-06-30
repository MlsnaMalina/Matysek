'use client'

import { useEffect, useState } from 'react'
import { Plus, Check, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MODULE_CONFIG } from '@/lib/config'
import { BackHeader } from '@/components/BackHeader'
import type { Item } from '@/lib/types'

const cfg = MODULE_CONFIG.letni

const CATEGORIES = [
  { value: '', label: 'Vše' },
  { value: 'venku', label: 'Venku' },
  { value: 'doma', label: 'Doma' },
  { value: 'kreativni', label: 'Kreativní' },
  { value: 'pohybova', label: 'Pohybová' },
]

export default function LetniPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCategory, setNewCategory] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('module', 'letni')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  async function addItem() {
    if (!newTitle.trim()) return
    const { data } = await supabase
      .from('items')
      .insert({ module: 'letni', title: newTitle.trim(), description: newDesc.trim() || null, category: newCategory || null, order_index: items.length })
      .select()
      .single()
    if (data) setItems(prev => [data, ...prev])
    setNewTitle('')
    setNewDesc('')
    setNewCategory('')
    setAdding(false)
  }

  async function toggleDone(item: Item) {
    const next = !item.is_completed
    await supabase.from('items').update({ is_completed: next }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_completed: next } : i))
  }

  async function toggleFavorite(item: Item) {
    const next = !item.is_favorite
    await supabase.from('items').update({ is_favorite: next }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_favorite: next } : i))
  }

  if (loading) return <Spinner />

  const filtered = filter ? items.filter(i => i.category === filter) : items

  return (
    <main className="min-h-screen max-w-sm mx-auto pb-10">
      <BackHeader
        title="Letní aktivity"
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
          <p className="text-xs font-medium mb-3" style={{ color: cfg.dark }}>Nová aktivita</p>
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Název aktivity"
            className="w-full text-sm bg-white rounded-xl px-3 py-2.5 border border-gray-200 mb-2 outline-none"
          />
          <textarea
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Popis (nepovinné)"
            rows={2}
            className="w-full text-sm bg-white rounded-xl px-3 py-2.5 border border-gray-200 mb-2 outline-none resize-none"
          />
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="w-full text-sm bg-white rounded-xl px-3 py-2.5 border border-gray-200 mb-3 outline-none"
          >
            <option value="">Kategorie (nepovinné)</option>
            {CATEGORIES.slice(1).map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
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

      {items.length > 0 && (
        <div className="px-4 mb-4 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                background: filter === c.value ? cfg.accent : cfg.bg,
                color: filter === c.value ? 'white' : cfg.accent,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && !adding ? (
        <EmptyState onAdd={() => setAdding(true)} />
      ) : (
        <div className="px-4 space-y-2">
          {filtered.map(item => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
              <div className="flex items-start gap-3">
                <button onClick={() => toggleDone(item)} className="mt-0.5 flex-shrink-0 active:scale-90 transition-transform">
                  {item.is_completed
                    ? <Check size={20} style={{ color: cfg.accent }} />
                    : <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: '#d1d5db' }} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                  )}
                  {item.category && (
                    <span
                      className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs"
                      style={{ background: cfg.bg, color: cfg.accent }}
                    >
                      {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                    </span>
                  )}
                </div>
                <button onClick={() => toggleFavorite(item)} className="flex-shrink-0 active:scale-90 transition-transform">
                  <Heart
                    size={18}
                    style={{ color: item.is_favorite ? cfg.accent : '#d1d5db', fill: item.is_favorite ? cfg.accent : 'none' }}
                  />
                </button>
              </div>
            </div>
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
        Přidávej nápady na aktivity pro letní prázdniny.
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 rounded-2xl text-sm font-medium text-white active:opacity-80"
        style={{ background: cfg.accent }}
      >
        Přidat první aktivitu
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
