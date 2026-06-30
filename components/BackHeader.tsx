'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  title: string
  href: string
  action?: React.ReactNode
}

export function BackHeader({ title, href, action }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 pt-12 pb-4">
      <Link href={href} className="text-gray-400 active:opacity-60">
        <ArrowLeft size={20} />
      </Link>
      <h1 className="flex-1 text-lg font-medium text-gray-900">{title}</h1>
      {action}
    </div>
  )
}
