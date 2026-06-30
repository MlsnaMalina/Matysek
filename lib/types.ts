export interface Session {
  id: string
  module: 'logopedie' | 'fyzioterapie'
  date: string
  next_session_date: string | null
  created_at: string
}

export interface Recording {
  id: string
  session_id: string
  storage_path: string
  duration_seconds: number | null
  created_at: string
}

export interface Task {
  id: string
  session_id: string
  title: string
  description: string | null
  order_index: number
  is_archived: boolean
  archived_at: string | null
  created_at: string
}

export interface PracticeLog {
  id: string
  session_id: string
  date: string
  note: string | null
  created_at: string
}

export interface Item {
  id: string
  module: 'predskolni' | 'letni'
  title: string
  description: string | null
  status: 'not_yet' | 'almost' | 'done'
  category: string | null
  is_completed: boolean
  is_favorite: boolean
  order_index: number
  created_at: string
}
