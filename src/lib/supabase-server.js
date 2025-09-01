// @ts-nocheck
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRole) {
    throw new Error('Variáveis de ambiente do Supabase faltando')
  }

  return createClient(url, serviceRole, {
    auth: { persistSession: false },
  })
}
