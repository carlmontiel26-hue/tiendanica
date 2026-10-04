'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
function getSupabase(){ const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; if(!url||!key) return null; return createClient(url,key) }

export default function AdminGlobal(){
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    const supabase = getSupabase()
    if(!supabase){ setLoading(false); return }
    ;(async()=>{
      const { data } = await supabase.from('stores').select('*').order('created_at',{ascending:false})
      setStores(data||[])
      setLoading(false)
    })()
  },[])

  if(loading) return <div style={{padding:40}}>Cargando tiendas...</div>

  return (
    <main style={{padding:20, maxWidth:800, margin:'0 auto'}}>
      <h1 style={{fontWeight:900, fontSize:20}}>Admin - Todas las tiendas</h1>
      <div style={{marginTop:20, display:'grid', gap:10}}>
        {stores.map(s=>(
          <a key={s.id} href={`/${s.slug}/admin`} style={{border:'1px solid #eee', padding:12, borderRadius:10, display:'block', textDecoration:'none', color:'#000'}}>
            <b>{s.name}</b> - {s.slug}
          </a>
        ))}
      </div>
    </main>
  )
}
