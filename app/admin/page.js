'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

function getSupabase(){ const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim(); const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim(); if(!url||!key||!url.startsWith('http')) return null; return createClient(url,key) }

export default function SuperAdmin(){
  const [stores,setStores]=useState([])
  const [filter,setFilter]=useState('all')
  const [q,setQ]=useState('')
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    const supabase=getSupabase()
    supabase.from('stores').select('*, products(count)').order('created_at',{ascending:false}).then(({data})=>{ setStores(data||[]); setLoading(false) })
  },[])

  const del=async(id)=>{ if(!confirm('Borrar tienda y productos?')) return; const s=getSupabase(); await s.from('stores').delete().eq('id',id); setStores(v=>v.filter(x=>x.id!==id)) }

  let filtered=[...stores]
  if(filter!=='all') filtered=filtered.filter(s=>s.tipo_tienda===filter)
  if(q) filtered=filtered.filter(s=>s.name.toLowerCase().includes(q.toLowerCase())||s.slug.includes(q.toLowerCase()))

  const counts={all:stores.length, boutique:stores.filter(s=>s.tipo_tienda==='boutique').length, comida:stores.filter(s=>s.tipo_tienda==='comida').length, general:stores.filter(s=>s.tipo_tienda==='general').length}

  if(loading) return <div style={{padding:40}}>Cargando...</div>

  return (
    <main style={{padding:20, maxWidth:1100, margin:'0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1 style={{fontWeight:900, fontSize:24}}>Super Admin - {stores.length} tiendas</h1>
        <Link href="/" style={{background:'#000', color:'#fff', padding:'10px 16px', borderRadius:999, textDecoration:'none', fontWeight:700}}>+ Crear</Link>
      </div>

      <div style={{marginTop:16, background:'#fff', border:'1px solid #eee', borderRadius:16, padding:12, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar tienda..." style={{border:'1px solid #ddd', borderRadius:999, padding:'8px 14px', fontSize:13, minWidth:200}}/>
        {Object.keys(counts).map(k=><button key={k} onClick={()=>setFilter(k)} style={{padding:'6px 14px', borderRadius:999, border:'1px solid #ddd', background:filter===k?'#000':'#fff', color:filter===k?'#fff':'#000', fontSize:12, fontWeight:700}}>{k} ({counts[k]})</button>)}
      </div>

      <div style={{marginTop:16, display:'grid', gap:12}}>
        {filtered.map(s=>(
          <div key={s.id} style={{border:'1px solid #eee', borderRadius:16, padding:14, display:'flex', gap:12, alignItems:'center', background:'#fff'}}>
            <img src={s.logo_url||s.cover_image||'https://via.placeholder.com/80'} style={{width:56,height:56,borderRadius:12,objectFit:'cover',background:'#f5f5f5'}}/>
            <div style={{flex:1}}>
              <div style={{display:'flex', gap:6, alignItems:'center'}}><b>{s.name}</b><span style={{fontSize:10, background: s.tipo_tienda==='boutique'?'#F6F3F0': s.tipo_tienda==='comida'?'#FFE9D6':'#D6E9FF', padding:'2px 8px', borderRadius:99, textTransform:'uppercase', fontWeight:800}}>{s.tipo_tienda}</span><span style={{fontSize:11, opacity:0.5}}>/{s.slug}</span></div>
              <div style={{fontSize:11, opacity:0.6, marginTop:2}}>WA: {s.whatsapp} • {new Date(s.created_at).toLocaleDateString()} • {s.products?.[0]?.count||0} productos</div>
              <div style={{marginTop:8, display:'flex', gap:6, flexWrap:'wrap'}}>
                <a href={`/${s.slug}`} target="_blank" style={{fontSize:11, background:'#00E676', color:'#000', padding:'6px 12px', borderRadius:999, textDecoration:'none', fontWeight:700}}>Ver tienda</a>
                <a href={`/${s.slug}/admin`} style={{fontSize:11, background:'#000', color:'#fff', padding:'6px 12px', borderRadius:999, textDecoration:'none', fontWeight:700}}>Admin dueño</a>
                <button onClick={()=>{navigator.clipboard.writeText(`https://tiendanica.store/${s.slug}/admin`); alert('Link copiado para el dueño')}} style={{fontSize:11, background:'#f5f5f5', border:'1px solid #ddd', padding:'6px 12px', borderRadius:999}}>Copiar link dueño</button>
              </div>
            </div>
            <button onClick={()=>del(s.id)} style={{background:'#ff4444', color:'#fff', border:'none', padding:'8px 12px', borderRadius:999, fontSize:12}}>Borrar</button>
          </div>
        ))}
      </div>
    </main>
  )
}
