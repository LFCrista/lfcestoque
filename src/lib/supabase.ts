// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Usando as variáveis que já existem no seu .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'As variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY precisam estar definidas.'
  )
}

// Cliente supabase para uso no frontend (browser)
export const supabase = createClient(supabaseUrl, supabaseKey)
