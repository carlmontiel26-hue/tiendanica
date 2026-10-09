import { createClient } from '@supabase/supabase-js'

let client = null

export function getSupabase(){
  if(client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if(!url || !key){
    console.warn('Falta NEXT_PUBLIC_SUPABASE_URL o ANON_KEY')
    return null
  }
  client = createClient(url, key)
  return client
}
