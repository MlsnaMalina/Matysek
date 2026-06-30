'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('pwa-dismissed')) return

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as Record<string, unknown>).MSStream
    setIsIOS(ios)

    if (ios) {
      setTimeout(() => setShow(true), 1500)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  function dismiss() {
    setShow(false)
    localStorage.setItem('pwa-dismissed', '1')
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 px-4 max-w-sm mx-auto">
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ background: '#FBEAF0', border: '1px solid #F4C0D1' }}
      >
        <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden">
          <svg width="40" height="40" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <defs><clipPath id="ic"><rect width="64" height="64" rx="14"/></clipPath></defs>
            <rect x="0" y="0" width="32" height="32" fill="#D4537E" clipPath="url(#ic)"/>
            <rect x="32" y="0" width="32" height="32" fill="#534AB7" clipPath="url(#ic)"/>
            <rect x="0" y="32" width="32" height="32" fill="#3B6D11" clipPath="url(#ic)"/>
            <rect x="32" y="32" width="32" height="32" fill="#185FA5" clipPath="url(#ic)"/>
            <text x="32" y="44" fontFamily="Georgia, serif" fontSize="30" fontWeight="700" fill="white" textAnchor="middle">M</text>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: '#72243E' }}>Přidat Matýsek na plochu</p>
          {isIOS ? (
            <p className="text-xs leading-relaxed" style={{ color: '#D4537E' }}>
              Klepni na <strong>Sdílet</strong> → „Přidat na plochu"
            </p>
          ) : (
            <p className="text-xs" style={{ color: '#D4537E' }}>Funguje i offline, rychlejší spuštění</p>
          )}
        </div>

        {!isIOS && (
          <button
            onClick={install}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
            style={{ background: '#D4537E' }}
          >
            Stáhnout
          </button>
        )}

        <button onClick={dismiss} className="flex-shrink-0 text-gray-400 p-1 -mr-1">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
