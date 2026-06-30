export const MODULE_CONFIG = {
  logopedie: {
    label: 'Logopedie',
    bg: '#FBEAF0',
    accent: '#D4537E',
    medium: '#ED93B1',
    dark: '#72243E',
    border: '#F4C0D1',
    href: '/logopedie',
  },
  fyzioterapie: {
    label: 'Fyzioterapie',
    bg: '#EAF3DE',
    accent: '#3B6D11',
    medium: '#97C459',
    dark: '#27500A',
    border: '#C0DD97',
    href: '/fyzioterapie',
  },
  predskolni: {
    label: 'Předškolní příprava',
    bg: '#EEEDFE',
    accent: '#534AB7',
    medium: '#AFA9EC',
    dark: '#3C3489',
    border: '#CECBF6',
    href: '/predskolni',
  },
  letni: {
    label: 'Letní aktivity',
    bg: '#E6F1FB',
    accent: '#185FA5',
    medium: '#85B7EB',
    dark: '#0C447C',
    border: '#B5D4F4',
    href: '/letni',
  },
} as const

export type ModuleKey = keyof typeof MODULE_CONFIG

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function daysUntil(dateStr: string): number {
  const date = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function nextSessionLabel(dateStr: string | null): string {
  if (!dateStr) return 'příště: nenastaveno'
  const days = daysUntil(dateStr)
  if (days === 0) return 'schůzka dnes'
  if (days === 1) return 'schůzka zítra'
  if (days < 0) return 'termín uplynul'
  return `příště: za ${days} dní`
}
