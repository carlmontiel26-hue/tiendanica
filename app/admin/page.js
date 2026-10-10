'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key) return null
  return createClient(url,key)
}

async function ensureBucket(supabase, bucketName){
  try{
    const { data, error } = await supabase.storage.getBucket(bucketName)
    if(error && error.message?.toLowerCase().includes('not found')){
      console.log(`Bucket ${bucketName} no existe, creando...`)
      const { error: createError } = await supabase.storage.createBucket(bucketName, { public: true })
      if(createError) {
        console.warn('No se pudo crear bucket automaticamente, continuamos sin bucket:', createError.message)
        return false
      }
      return true
    }
    return true
  }catch(e){
    console.warn('ensureBucket error', e)
    return false
  }
}

async function uploadSafe(supabase, bucket, file){
  if(!file) return null
  try{
    const ok = await ensureBucket(supabase, bucket)
    if(!ok){
      // fallback: no bucket, devolvemos null y el super admin guardara sin logo (luego lo editas)
      throw new Error('Bucket not found')
    }
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upError } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true })
    if(upError) throw upError
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return data.publicUrl
  }catch(e){
    console.warn('uploadSafe fallo:', e.message)
    // si es bucket not found, lanzamos para que el creador de tienda siga sin imagen
    if(e.message?.toLowerCase().includes('bucket')){
      throw new Error('Bucket not found')
    }
    throw e
  }
}

export default function SuperAdmin(){
  const [stores,setStores]=useState([])
  const [form,setForm]=useState({tipo:'boutique', slug:'', name:'', whatsapp:'', description:'', logoFile:null, coverFile:null})
  const [search,setSearch]=useState('')
  const [filterTipo,setFilterTipo]=useState('all')
  const [msg,setMsg]=useState('')

  useEffect(()=>{ load() },[])

  const load=async()=>{
    const supabase=getSupabase()
    if(!supabase) return
    const {data}=await supabase.from('stores').select('*').order('created_at',{ascending:false})
    setStores(data||[])
  }

  const crearTienda=async()=>{
    if(!form.slug || !form.name || !form.whatsapp){
      alert('Falta slug, nombre o whatsapp')
      return
    }
    const supabase=getSupabase()
    if(!supabase) return
    setMsg('Creando...')
    try{
      let logoUrl = null
      let coverUrl = null
      try{
        logoUrl = await uploadSafe(supabase, 'store-assets', form.logoFile)
      }catch(err){
        if(err.message==='Bucket not found'){
          console.log('Bucket store-assets no existe, creando tienda sin logo por ahora')
          // no bloqueamos, creamos sin logo y avisamos
        }
      }
      try{
        coverUrl = await uploadSafe(supabase, 'store-assets', form.coverFile)
      }catch(err){
        // igual
      }

      const payload = {
        slug: form.slug.toLowerCase().trim().replace(/\s+/g,'-'),
        name: form.name,
        whatsapp: form.whatsapp,
        description: form.description,
        tipo_tienda: form.tipo,
        logo_url: logoUrl,
        cover_image: coverUrl,
      }
      const { error } = await supabase.from('stores').insert(payload)
      if(error) throw error
      setMsg('Tienda creada premium!')
      setForm({tipo:'boutique', slug:'', name:'', whatsapp:'', description:'', logoFile:null, coverFile:null})
      load()
      setTimeout(()=>setMsg(''),2000)
    }catch(e){
      console.error(e)
      if(e.message?.includes('Bucket not found')){
        alert('Bucket not found en Supabase Storage. SOLUCIÓN RÁPIDA: Ve a Supabase > Storage > Create bucket > nombre: store-assets > Public: ON. Luego intenta de nuevo. Tu tienda se creará sin imagen si lo intentas de nuevo ahora.')
        // intentamos crear sin imagen como fallback final
        try{
          const supabase2=getSupabase()
          const payload2 = {
            slug: form.slug.toLowerCase().trim().replace(/\s+/g,'-'),
            name: form.name,
            whatsapp: form.whatsapp,
            description: form.description,
            tipo_tienda: form.tipo,
          }
          const { error } = await supabase2.from('stores').insert(payload2)
          if(!error){
            alert('Tienda creada sin logo/portada por falta de bucket. Ahora crea el bucket store-assets y luego edita la tienda para subir logo.')
            load()
          }
        }catch{}
      } else {
        alert('Error: '+e.message)
      }
      setMsg('')
    }
  }

  const filtered = stores.filter(s=>{
    if(filterTipo!=='all' && s.tipo_tienda!==filterTipo) return false
    if(search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.slug.includes(search.toLowerCase())) return false
    return true
  })

  return (
    <main style={{background:'#F7F5F3', minHeight:'100vh', padding:20, fontFamily:'Inter, system-ui'}}>
      <style>{`
        .card{background:#fff; border:1px solid #EAE6E1; border-radius:20px; padding:16px; margin-bottom:14px}
        .input{padding:12px; border-radius:12px; border:1px solid #EAE6E1; width:100%; font-size:13px; background:#FBF9F7}
        .btn-black{background:#0A0A0A; color:#fff; padding:14px; border-radius:999px; font-weight:800; width:100%; cursor:pointer; border:none}
      `}</style>
      <h1 style={{fontWeight:900, fontSize:18}}>Super Admin Privado - {stores.length} tiendas {msg && <span style={{color:'#00D084', fontSize:12}}>• {msg}</span>}</h1>
      <div className="card" style={{marginTop:12}}>
        <b style={{fontSize:13}}>Crear nueva tienda premium (esta es la que falla por bucket)</b>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10}}>
          <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} className="input">
            <option value="boutique">👗 Boutique - Ropa y moda</option>
            <option value="comida">🍔 Comida - Restaurante</option>
            <option value="general">🛍️ General - Hogar y más</option>
          </select>
          <input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="slug ej: agdin-luna" className="input"/>
        </div>
        <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nombre tienda" className="input" style={{marginTop:8}}/>
        <input value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} placeholder="WhatsApp 505..." className="input" style={{marginTop:8}}/>
        <input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Descripcion corta" className="input" style={{marginTop:8}}/>
        <div style={{display:'flex', gap:12, marginTop:10, fontSize:11}}>
          <label>Logo dueño (local) <input type="file" onChange={e=>setForm({...form,logoFile:e.target.files?.[0]})}/></label>
          <label>Portada editable (local) <input type="file" onChange={e=>setForm({...form,coverFile:e.target.files?.[0]})}/></label>
        </div>
        <button onClick={crearTienda} className="btn-black" style={{marginTop:12}}>Crear tienda premium</button>
        <p style={{fontSize:10, color:'#9A9590', marginTop:8}}>Si sale Bucket not found, la tienda se creará sin imagen y luego creas el bucket store-assets en Supabase > Storage > Public ON</p>
      </div>
      <div className="card">
        <div style={{display:'flex', gap:8}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="input" style={{maxWidth:200}}/>
          <button onClick={()=>setFilterTipo('all')} style={{padding:'8px 12px', borderRadius:999, border:'1px solid #EAE6E1', background: filterTipo==='all'?'#0A0A0A':'#fff', color:filterTipo==='all'?'#fff':'#000', fontSize:11}}>all</button>
          <button onClick={()=>setFilterTipo('boutique')} style={{padding:'8px 12px', borderRadius:999, border:'1px solid #EAE6E1', background: filterTipo==='boutique'?'#0A0A0A':'#fff', color:filterTipo==='boutique'?'#fff':'#000', fontSize:11}}>boutique</button>
          <button onClick={()=>setFilterTipo('comida')} style={{padding:'8px 12px', borderRadius:999, border:'1px solid #EAE6E1', background: filterTipo==='comida'?'#0A0A0A':'#fff', color:filterTipo==='comida'?'#fff':'#000', fontSize:11}}>comida</button>
          <button onClick={()=>setFilterTipo('general')} style={{padding:'8px 12px', borderRadius:999, border:'1px solid #EAE6E1', background: filterTipo==='general'?'#0A0A0A':'#fff', color:filterTipo==='general'?'#fff':'#000', fontSize:11}}>general</button>
        </div>
        <div style={{marginTop:12}}>
          {filtered.map(s=><div key={s.id} style={{padding:'8px 0', borderBottom:'1px solid #F0EDE8', fontSize:12, display:'flex', justifyContent:'space-between'}}><span><b>{s.name}</b> - {s.slug} - {s.tipo_tienda}</span><a href={`/${s.slug}`} style={{color:'#00D084', fontWeight:700}}>ver</a></div>)}
        </div>
      </div>
    </main>
  )
}
