'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if(!url || !key) return null
  return createClient(url, key)
}

export default function AdminGlobal(){
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(()=>{
    const supabase = getSupabase()
    if(!supabase){ setErr('Falta env var'); setLoading(false); return }
    ;(async()=>{
      try{
        const { data, error } = await supabase.from('stores').select('*').order('created_at',{ascending:false})
        if(error) throw error
        setStores(data||[])
      }catch(e){ setErr(e.message) }
      setLoading(false)
    })()
  },[])

  if(loading) return <div style={{padding:40}}>Cargando tiendas...</div>
  if(err) return <div style={{padding:40}}>Error: {err}</div>

  return (
    <main style={{padding:20, maxWidth:800, margin:'0 auto'}}>
      <h1 style={{fontWeight:900, fontSize:20}}>Admin - Todas las tiendas</h1>
      {stores.length===0 && <p style={{marginTop:20}}>No hay tiendas en tabla stores</p>}
      <div style={{marginTop:20, display:'grid', gap:10}}>
        {stores.map(s=>(
          <a key={s.id} href={`/${s.slug}/admin`} style={{border:'1px solid #eee', padding:12, borderRadius:10, display:'block', textDecoration:'none', color:'#000'}}>
            <b>{s.name}</b> - /{s.slug} - {s.whatsapp}
          </a>
        ))}
      </div>
    </main>
  )
}
