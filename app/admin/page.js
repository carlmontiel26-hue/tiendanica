'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){ const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim(); const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim(); if(!url||!key||!url.startsWith('http')) return null; return createClient(url,key) }

const SUPER_KEY = process.env.NEXT_PUBLIC_SUPER_ADMIN_KEY || 'Nica2025!' // Cambia en Vercel env

export default function SuperAdminLocked(){
  const [auth,setAuth]=useState(false)
  const [inputKey,setInputKey]=useState('')
  const [stores,setStores]=useState([])
  const [filter,setFilter]=useState('all')
  const [q,setQ]=useState('')
  const [form,setForm]=useState({slug:'',name:'',whatsapp:'',desc:'',tipo:'boutique'})
  const [logoFile,setLogoFile]=useState(null)
  const [coverFile,setCoverFile]=useState(null)
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState('')

  useEffect(()=>{
    const saved = localStorage.getItem('tn_super_auth')
    if(saved===SUPER_KEY) { setAuth(true); loadStores() }
  },[])

  const loadStores=()=>{
    const supabase=getSupabase()
    if(!supabase) return
    supabase.from('stores').select('*, products(count)').order('created_at',{ascending:false}).then(({data})=> setStores(data||[]))
  }

  const tryAuth=()=>{
    if(inputKey===SUPER_KEY){ localStorage.setItem('tn_super_auth', SUPER_KEY); setAuth(true); loadStores() } else alert('Clave incorrecta')
  }

  const uploadFile=async(file)=>{
    const supabase=getSupabase()
    const ext=file.name.split('.').pop()
    const path=`super/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const bucket = file.type.includes('image') ? 'store-assets' : 'store-assets'
    const {data,error}=await supabase.storage.from(bucket).upload(path,file)
    if(error) throw error
    const {data:urlData}=supabase.storage.from(bucket).getPublicUrl(data.path)
    return urlData.publicUrl
  }

  const createStore=async(e)=>{
    e.preventDefault()
    const supabase=getSupabase()
    if(!form.slug.match(/^[a-z0-9-]+$/)){ setMsg('Slug invalido'); return }
    setLoading(true)
    try{
      let logoUrl=null, coverUrl=null
      if(logoFile) logoUrl=await uploadFile(logoFile)
      if(coverFile) coverUrl=await uploadFile(coverFile)
      const {data,error}=await supabase.from('stores').insert({
        slug:form.slug.toLowerCase(),
        name:form.name,
        whatsapp:form.whatsapp.replace(/[^0-9]/g,''),
        description:form.desc,
        tipo_tienda:form.tipo,
        logo_url:logoUrl,
        cover_image:coverUrl
      }).select().single()
      if(error) throw error
      setMsg(`✅ ${data.name} creada - Link dueño: /${data.slug}/admin con clave = ${data.whatsapp}`)
      setForm({slug:'',name:'',whatsapp:'',desc:'',tipo:'boutique'}); setLogoFile(null); setCoverFile(null); loadStores()
    }catch(err){ setMsg('Error: '+err.message) }
    setLoading(false)
  }

  const del=async(id)=>{ if(!confirm('Borrar?')) return; const s=getSupabase(); await s.from('stores').delete().eq('id',id); loadStores() }

  if(!auth){
    return (
      <main style={{minHeight:'100vh', background:'#0A0A0A', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
        <div style={{background:'#fff', color:'#000', borderRadius:20, padding:20, width:'100%', maxWidth:380}}>
          <h2 style={{fontWeight:900}}>Super Admin - Privado</h2>
          <p style={{fontSize:12, opacity:0.6, marginTop:4}}>Ingresa clave para gestionar tiendas. Esta pantalla es solo tuya, no se muestra en portada.</p>
          <input type="password" value={inputKey} onChange={e=>setInputKey(e.target.value)} placeholder="Clave super admin" style={{marginTop:12, width:'100%', border:'1px solid #ddd', padding:12, borderRadius:12}}/>
          <button onClick={tryAuth} style={{marginTop:10, width:'100%', background:'#000', color:'#fff', padding:12, borderRadius:999, fontWeight:800, border:'none'}}>Entrar</button>
          <p style={{fontSize:10, opacity:0.4, marginTop:10}}>Clave por defecto: Nica2025! - Cambiala en Vercel env NEXT_PUBLIC_SUPER_ADMIN_KEY</p>
        </div>
      </main>
    )
  }

  let filtered=[...stores]
  if(filter!=='all') filtered=filtered.filter(s=>s.tipo_tienda===filter)
  if(q) filtered=filtered.filter(s=>s.name.toLowerCase().includes(q.toLowerCase())||s.slug.includes(q.toLowerCase()))

  return (
    <main style={{padding:20, maxWidth:1100, margin:'0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1 style={{fontWeight:900, fontSize:20}}>Super Admin Privado - {stores.length} tiendas</h1>
        <button onClick={()=>{localStorage.removeItem('tn_super_auth'); setAuth(false)}} style={{background:'#eee', border:'none', padding:'8px 12px', borderRadius:999, fontSize:12}}>Salir</button>
      </div>

      <div style={{marginTop:16, background:'#fff', border:'2px solid #000', borderRadius:20, padding:16}}>
        <h3 style={{fontWeight:900}}>Crear nueva tienda premium (esta es la pantalla de tu captura)</h3>
        <form onSubmit={createStore} style={{marginTop:12, display:'grid', gap:10}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} style={{border:'1px solid #ddd', padding:12, borderRadius:12, fontWeight:700}}>
              <option value="boutique">👗 Boutique - Ropa y moda</option>
              <option value="comida">🍔 Comida - Restaurante</option>
              <option value="general">🛠️ General - Ferreteria/Variedad</option>
            </select>
            <input required value={form.slug} onChange={e=>setForm({...form,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-')})} placeholder="slug unico: moda-nica" style={{border:'1px solid #ddd', padding:12, borderRadius:12}}/>
          </div>
          <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nombre tienda" style={{border:'1px solid #ddd', padding:12, borderRadius:12}}/>
          <input required value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} placeholder="WhatsApp con pais: 505..." style={{border:'1px solid #ddd', padding:12, borderRadius:12}}/>
          <input value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Descripcion corta" style={{border:'1px solid #ddd', padding:12, borderRadius:12}}/>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <div><label style={{fontSize:11, fontWeight:700}}>Logo dueño (local)</label><input type="file" accept="image/*" onChange={e=>setLogoFile(e.target.files[0])} style={{width:'100%', fontSize:12, marginTop:4}}/></div>
            <div><label style={{fontSize:11, fontWeight:700}}>Portada editable (local)</label><input type="file" accept="image/*" onChange={e=>setCoverFile(e.target.files[0])} style={{width:'100%', fontSize:12, marginTop:4}}/></div>
          </div>
          <button disabled={loading} style={{background:'#000', color:'#fff', padding:14, borderRadius:999, fontWeight:900, border:'none'}}>{loading?'Creando...':'Crear tienda premium'}</button>
        </form>
        {msg && <div style={{marginTop:10, background:'#F6F3F0', padding:10, borderRadius:12, fontSize:12, fontWeight:600}}>{msg}</div>}
      </div>

      <div style={{marginTop:16, background:'#fff', border:'1px solid #eee', borderRadius:16, padding:12, display:'flex', gap:8, flexWrap:'wrap'}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar..." style={{border:'1px solid #ddd', borderRadius:999, padding:'8px 14px', fontSize:13, minWidth:200}}/>
        {['all','boutique','comida','general'].map(k=><button key={k} onClick={()=>setFilter(k)} style={{padding:'6px 14px', borderRadius:999, border:'1px solid #ddd', background:filter===k?'#000':'#fff', color:filter===k?'#fff':'#000', fontSize:12, fontWeight:700}}>{k}</button>)}
      </div>

      <div style={{marginTop:16, display:'grid', gap:10}}>
        {filtered.map(s=>(
          <div key={s.id} style={{border:'1px solid #eee', borderRadius:16, padding:12, display:'flex', gap:10, background:'#fff'}}>
            <img src={s.logo_url||s.cover_image||'https://via.placeholder.com/80'} style={{width:56,height:56,borderRadius:12,objectFit:'cover'}}/>
            <div style={{flex:1}}>
              <b>{s.name}</b> <span style={{fontSize:10, background:'#F6F3F0', padding:'2px 6px', borderRadius:99}}>{s.tipo_tienda}</span> <span style={{fontSize:11, opacity:0.5}}>/{s.slug}</span>
              <div style={{fontSize:11, opacity:0.6}}>WA clave: {s.whatsapp} • {s.products?.[0]?.count||0} prod</div>
              <div style={{marginTop:6, display:'flex', gap:6}}>
                <a href={`/${s.slug}`} target="_blank" style={{fontSize:11, background:'#00E676', color:'#000', padding:'6px 12px', borderRadius:999, textDecoration:'none', fontWeight:700}}>Ver tienda</a>
                <a href={`/${s.slug}/admin`} style={{fontSize:11, background:'#000', color:'#fff', padding:'6px 12px', borderRadius:999, textDecoration:'none'}}>Admin dueño (clave=WA)</a>
              </div>
            </div>
            <button onClick={()=>del(s.id)} style={{background:'#ff4444', color:'#fff', border:'none', padding:'8px 12px', borderRadius:999, fontSize:12, height:32}}>Borrar</button>
          </div>
        ))}
      </div>
    </main>
  )
}
