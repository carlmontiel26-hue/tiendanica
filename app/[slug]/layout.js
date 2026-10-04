'use client'
import { useEffect, useState, use } from 'react'
import { getSupabase } from '../lib/supabaseClient'

export default function Layout({ children, params }){
  const { slug } = use(params || {})
  const [store, setStore] = useState(null)

  useEffect(()=>{
    const supabase = getSupabase()
    if(!supabase || !slug) return
    ;(async()=>{
      const { data } = await supabase.from('stores').select('name').eq('slug', slug).single()
      if(data) setStore(data)
    })()
  },[slug])

  return <>{children}</>
}
