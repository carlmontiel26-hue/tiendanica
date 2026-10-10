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
    if(error){
      const msg = (error.message||'').toLowerCase()
      if(msg.includes('not found') || msg.includes('does not exist')){
        const { error: createError } = await supabase.storage.createBucket(bucketName, { public: true })
        if(createError) return false
        return true
      }
      return false
    }
    return true
  }catch{
    return false
  }
}

async function uploadSafe(supabase, bucket, file){
  if(!file) return null
  try{
    const ok = await ensureBucket(supabase, bucket)
    if(!ok) throw new Error('Bucket not found')
    const ext = (file.name.split('.').pop()||'png')
    const fileName = Date.now() + '_' + Math.random().toString(36).slice(2) + '.' + ext
    const { error: upError } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true })
    if(upError) throw upError
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return data.publicUrl
  }catch(e){
    if((e.message||'').toLowerCase().includes('bucket')){
      throw new Error('Bucket not found')
    }
    throw e
  }
}

export default function SuperAdmin(){
  const [stores,setStores]=useState([])
  const [form,setForm]=useState({tipo:'boutique', slug:'', name:'', whatsapp:'', description:''})
  const [logoFile,setLogoFile]=useState(null)
  const [coverFile,setCoverFile]=useState(null)
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
      let logoUrl=null
      let coverUrl=null
      try{
        logoUrl = await uploadSafe(supabase, 'store-assets', logoFile)
      }catch(err){
        console.log('logo upload skip', err.message)
      }
      try{
        coverUrl = await uploadSafe(supabase, 'store-assets', coverFile)
      }catch(err){
        console.log('cover upload skip', err.message)
      }
      const payload={
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
      setForm({tipo:'boutique', slug:'', name:'', whatsapp:'', description:''})
      setLogoFile(null)
      setCoverFile(null)
      load()
      setTimeout(()=>setMsg(''),2500)
    }catch(e){
      console.error(e)
      if((e.message||'').toLowerCase().includes('bucket')){
        alert('Bucket store-assets no existe. Ya ejecutaste el SQL en Supabase. Si aun falla, la tienda se creara sin imagen.')
        try{
          const supabase2=getSupabase()
          const payload2={
            slug: form.slug.toLowerCase().trim().replace(/\s+/g,'-'),
            name: form.name,
            whatsapp: form.whatsapp,
            description: form.description,
            tipo_tienda: form.tipo,
          }
          const { error } = await supabase2.from('stores').insert(payload2)
          if(!error){
            alert('Tienda creada sin logo por falta de bucket. Crea el bucket store-assets publico en Storage y luego edita.')
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
    if(search && !s.name.toLowerCase().includes(search.toLowerCase()) && !String(s.slug||'').includes(search.toLowerCase())) return false
    return true
  })

  return (
    <main style={{background:'#F7F5F3', minHeight:'100vh', padding:20, fontFamily:'Inter, system-ui'}}>
      <style>{`
        .card{background:#fff; border:1px solid #EAE6E1; border-radius:20px; padding:16px; margin-bottom:14px}
        .input{padding:12px; border-radius:12px; border:1px solid #EAE6E1; width:100%; font-size:13px; background:#FBF9F7}
        .btn-black{background:#0A0A0A; color:#fff; padding:14px; border-radius:999px; font-weight:800; width:100%; cursor:pointer; border:none}
      `}</style>
      <h1 style={{fontWeight:900, fontSize:18}}>Super Admin Privado - {stores.length} tiendas {msg ? <span style={{color:'#00D084', fontSize:12}}> - {msg}</span> : null}</h1>
      
      <div className="card" style={{marginTop:12}}>
        <b style={{fontSize:13}}>Crear nueva tienda premium</b>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10}}>
          <select value={form.tipo} onChange={(e)=>setForm({...form, tipo:e.target.value})} className="input">
            <option value="boutique">Boutique - Ropa y moda</option>
            <option value="comida">Comida - Restaurante</option>
            <option value="general">General - Hogar y mas</option>
          </select>
          <input value={form.slug} onChange={(e)=>setForm({...form, slug:e.target.value})} placeholder="slug ej: agdin-luna" className="input"/>
        </div>
        <input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} placeholder="Nombre tienda" className="input" style={{marginTop:8}}/>
        <input value={form.whatsapp} onChange={(e)=>setForm({...form, whatsapp:e.target.value})} placeholder="WhatsApp 505..." className="input" style={{marginTop:8}}/>
        <input value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} placeholder="Descripcion corta" className="input" style={{marginTop:8}}/>
        
        <div style={{display:'flex', gap:12, marginTop:12, flexWrap:'wrap'}}>
          <div style={{flex:1, minWidth:140}}>
            <div style={{fontSize:11, fontWeight:700, marginBottom:4}}>Logo dueno (local)</div>
            <input type="file" onChange={(e)=>setLogoFile(e.target.files ? e.target.files[0] : null)} style={{fontSize:11}}/>
          </div>
          <div style={{flex:1, minWidth:140}}>
            <div style={{fontSize:11, fontWeight:700, marginBottom:4}}>Portada editable (local)</div>
            <input type="file" onChange={(e)=>setCoverFile(e.target.files ? e.target.files[0] : null)} style={{fontSize:11}}/>
          </div>
        </div>

        <button onClick={crearTienda} className="btn-black" style={{marginTop:14}}>Crear tienda premium</button>
        <p style={{fontSize:10, color:'#9A9590', marginTop:8}}>Si sale Bucket not found, crea el bucket store-assets publico en Supabase Storage.</p>
      </div>

      <div className="card">
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar..." className="input" style={{maxWidth:200}}/>
          <button onClick={()=>setFilterTipo('all')} style={{padding:'8px 12px', borderRadius:999, border:'1px solid #EAE6E1', background: filterTipo==='all'?'#0A0A0A':'#fff', color:filterTipo==='all'?'#fff':'#000', fontSize:11}}>all</button>
          <button onClick={()=>setFilterTipo('boutique')} style={{padding:'8px 12px', borderRadius:999, border:'1px solid #EAE6E1', background: filterTipo==='boutique'?'#0A0A0A':'#fff', color:filterTipo==='boutique'?'#fff':'#000', fontSize:11}}>boutique</button>
          <button onClick={()=>setFilterTipo('comida')} style={{padding:'8px 12px', borderRadius:999, border:'1px solid #EAE6E1', background: filterTipo==='comida'?'#0A0A0A':'#fff', color:filterTipo==='comida'?'#fff':'#000', fontSize:11}}>comida</button>
          <button onClick={()=>setFilterTipo('general')} style={{padding:'8px 12px', borderRadius:999, border:'1px solid #EAE6E1', background: filterTipo==='general'?'#0A0A0A':'#fff', color:filterTipo==='general'?'#fff':'#000', fontSize:11}}>general</button>
        </div>
        <div style={{marginTop:12}}>
          {filtered.map((s)=>(
            <div key={s.id} style={{padding:'8px 0', borderBottom:'1px solid #F0EDE8', fontSize:12, display:'flex', justifyContent:'space-between'}}>
              <span><b>{s.name}</b> - {s.slug} - {s.tipo_tienda}</span>
              <a href={'/'+s.slug} style={{color:'#00D084', fontWeight:700}}>ver</a>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
