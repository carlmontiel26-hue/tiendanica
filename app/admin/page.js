'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key||!url.startsWith('http')) return null
  return createClient(url,key)
}

export default function AdminGlobal(){
  const [stores,setStores]=useState([])
  const [loading,setLoading]=useState(true)
  const [err,setErr]=useState(null)

  useEffect(()=>{
    const supabase=getSupabase()
    if(!supabase){ setErr('Falta env vars'); setLoading(false); return }
    supabase.from('stores').select('*').order('created_at',{ascending:false}).then(({data,error})=>{
      if(error) setErr(error.message)
      else setStores(data||[])
      setLoading(false)
    })
  },[])

  const deleteStore=async(id)=>{
    if(!confirm('Borrar tienda y todos sus productos?')) return
    const supabase=getSupabase()
    await supabase.from('stores').delete().eq('id',id)
    setStores(v=>v.filter(s=>s.id!==id))
  }

  if(loading) return <div style={{padding:40}}>Cargando...</div>
  if(err) return <div style={{padding:40}}>Error: {err}</div>

  return (
    <main style={{padding:20, maxWidth:900, margin:'0 auto'}}>
      <h1 style={{fontWeight:900, fontSize:24}}>Admin - Todas las tiendas ({stores.length})</h1>
      <div style={{marginTop:12, display:'flex', gap:10}}>
        <Link href="/" style={{background:'#000', color:'#fff', padding:'10px 16px', borderRadius:999, textDecoration:'none', fontWeight:700}}> + Crear tienda</Link>
        <a href="https://supabase.com/dashboard" target="_blank" style={{background:'#eee', padding:'10px 16px', borderRadius:999, textDecoration:'none', color:'#000'}}>Supabase</a>
      </div>

      <div style={{marginTop:20, display:'grid', gap:12}}>
        {stores.length===0 && <p>No hay tiendas. Crea una en /</p>}
        {stores.map(s=>(
          <div key={s.id} style={{border:'1px solid #eee', padding:16, borderRadius:16, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <b style={{fontSize:16}}>{s.name}</b> <span style={{opacity:0.6}}>/{s.slug}</span><br/>
              <span style={{fontSize:12, opacity:0.7}}>WhatsApp: {s.whatsapp} • {s.tipo_tienda} • {new Date(s.created_at).toLocaleDateString()}</span><br/>
              <div style={{marginTop:8, display:'flex', gap:8}}>
                <a href={`/${s.slug}`} target="_blank" style={{fontSize:12, background:'#00E676', padding:'6px 12px', borderRadius:999, textDecoration:'none', color:'#000', fontWeight:700}}>Ver tienda</a>
                <a href={`/${s.slug}/admin`} style={{fontSize:12, background:'#000', padding:'6px 12px', borderRadius:999, textDecoration:'none', color:'#fff', fontWeight:700}}>Admin</a>
                <button onClick={()=>navigator.clipboard.writeText(`https://tiendanica.store/${s.slug}/admin`)} style={{fontSize:12, background:'#f5f5f5', padding:'6px 12px', borderRadius:999, border:'1px solid #ddd'}}>Copiar link admin</button>
              </div>
            </div>
            <button onClick={()=>deleteStore(s.id)} style={{background:'#ff4444', color:'#fff', border:'none', padding:'8px 12px', borderRadius:999}}>Borrar</button>
          </div>
        ))}
      </div>
    </main>
  )
}
