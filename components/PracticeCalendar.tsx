'use client'

interface Props {
  year: number
  month: number
  practicedDays: Set<number>
  onToggle: (day: number) => void
  accentColor: string
  darkColor: string
  today: number
}

const DAY_LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

export function PracticeCalendar({ year, month, practicedDays, onToggle, accentColor, darkColor, today }: Props) {
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs text-gray-300">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const isPracticed = practicedDays.has(day)
          const isToday = day === today
          const isFuture = day > today

          return (
            <button
              key={day}
              onClick={() => !isFuture && onToggle(day)}
              disabled={isFuture}
              className="aspect-square flex items-center justify-center rounded-full text-xs transition-all active:scale-90"
              style={{
                background: isPracticed ? accentColor : 'transparent',
                color: isPracticed ? darkColor : isToday ? accentColor : isFuture ? '#d1d5db' : '#374151',
                border: isToday && !isPracticed
                  ? `1.5px solid ${accentColor}`
                  : isPracticed
                  ? 'none'
                  : isFuture
                  ? 'none'
                  : '0.5px solid #e5e7eb',
                fontWeight: isToday ? 500 : 400,
                cursor: isFuture ? 'default' : 'pointer',
              }}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
