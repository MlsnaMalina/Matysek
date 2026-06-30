import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ahjoahtrjbobmdkxonzh.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoam9haHRyamJvYm1ka3hvbnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MTI0MjMsImV4cCI6MjA5ODM4ODQyM30.rUPUWl_mZgyLMTUAadu86P8IH3U_P6JQ1vBH2yE0OKQ'
)
