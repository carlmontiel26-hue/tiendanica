'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key) return null
  return createClient(url,key)
}

async function uploadToBucket(supabase, bucket, file){
  if(!file) return null
  const ext = file.name.split('.').pop()||'png'
  const name = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(name, file, { upsert: true })
  if(error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(name)
  return data.publicUrl
}

export default function SuperAdminPremium(){
  const [stores,setStores]=useState([])
  const [form,setForm]=useState({tipo:'boutique', slug:'', name:'', whatsapp:'', description:''})
  const [logoFile,setLogoFile]=useState(null)
  const [coverFile,setCoverFile]=useState(null)
  const [logoPreview,setLogoPreview]=useState(null)
  const [coverPreview,setCoverPreview]=useState(null)
  const [search,setSearch]=useState('')
  const [filterTipo,setFilterTipo]=useState('all')
  const [msg,setMsg]=useState('')
  const [creating,setCreating]=useState(false)

  useEffect(()=>{ load() },[])
  useEffect(()=>{
    if(logoFile){ setLogoPreview(URL.createObjectURL(logoFile)) } else { setLogoPreview(null) }
  },[logoFile])
  useEffect(()=>{
    if(coverFile){ setCoverPreview(URL.createObjectURL(coverFile)) } else { setCoverPreview(null) }
  },[coverFile])

  const load=async()=>{
    const supabase=getSupabase()
    if(!supabase) return
    const {data}=await supabase.from('stores').select('*').order('created_at',{ascending:false})
    setStores(data||[])
  }

  const crearTienda=async()=>{
    if(!form.slug || !form.name || !form.whatsapp){
      alert('Falta slug, nombre o WhatsApp')
      return
    }
    setCreating(true)
    setMsg('Subiendo imagenes...')
    const supabase=getSupabase()
    try{
      let logoUrl=null
      let coverUrl=null
      // intentamos subir al bucket que ya creaste con el SQL
      if(logoFile){
        try{ logoUrl = await uploadToBucket(supabase,'store-assets',logoFile) }catch(e){ console.warn('logo upload error', e.message); try{ logoUrl = await uploadToBucket(supabase,'product-images',logoFile) }catch{} }
      }
      if(coverFile){
        try{ coverUrl = await uploadToBucket(supabase,'store-assets',coverFile) }catch(e){ console.warn('cover upload error', e.message); try{ coverUrl = await uploadToBucket(supabase,'product-images',coverFile) }catch{} }
      }

      const payload={
        slug: form.slug.toLowerCase().trim().replace(/\s+/g,'-'),
        name: form.name,
        whatsapp: form.whatsapp.replace(/[^0-9]/g,''),
        description: form.description,
        tipo_tienda: form.tipo,
        logo_url: logoUrl,
        cover_image: coverUrl,
      }
      const { error } = await supabase.from('stores').insert(payload)
      if(error) throw error
      setMsg('✅ Tienda creada!')
      setForm({tipo:'boutique', slug:'', name:'', whatsapp:'', description:''})
      setLogoFile(null); setCoverFile(null); setLogoPreview(null); setCoverPreview(null)
      load()
      setTimeout(()=>setMsg(''),3000)
    }catch(e){
      alert('Error: '+e.message)
      setMsg('')
    } finally { setCreating(false) }
  }

  const filtered = stores.filter(s=>{
    if(filterTipo!=='all' && s.tipo_tienda!==filterTipo) return false
    if(search && !s.name.toLowerCase().includes(search.toLowerCase()) && !String(s.slug||'').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const previewStore = {
    name: form.name || 'TIENDA AGDIN',
    slug: form.slug || 'agdin-luna',
    tipo: form.tipo,
    logo: logoPreview,
    cover: coverPreview,
  }

  return (
    <main style={{background:'#F7F5F3', minHeight:'100vh', padding:16, fontFamily:'Inter, system-ui, -apple-system'}}>
      <style>{`
        .card{background:#fff; border:1px solid #EAE6E1; border-radius:20px; padding:18px; box-shadow:0 8px 24px rgba(0,0,0,0.04); margin-bottom:14px}
        .input{padding:12px 14px; border-radius:12px; border:1px solid #EAE6E1; width:100%; font-size:13px; background:#FBF9F7; outline:none}
        .input:focus{border-color:#0A0A0A}
        .btn-black{background:#0A0A0A; color:#fff; padding:14px; border-radius:999px; font-weight:800; width:100%; cursor:pointer; border:none; letter-spacing:-0.3px}
        .pill{padding:8px 14px; border-radius:999px; border:1px solid #EAE6E1; background:#fff; font-size:11px; font-weight:700; cursor:pointer}
        .pill.active{background:#0A0A0A; color:#fff}
        .preview-cover{height:180px; background:linear-gradient(120deg,#E8E2DD,#F7F5F3); border-radius:16px; overflow:hidden; position:relative}
        .preview-cover img{width:100%; height:100%; object-fit:cover}
      `}</style>

      <div style={{maxWidth:900, margin:'0 auto'}}>
        <h1 style={{fontWeight:900, fontSize:20, letterSpacing:'-0.6px', color:'#0A0A0A'}}>Super Admin Privado <span style={{fontWeight:500, fontSize:12, color:'#9A9590'}}>• {stores.length} tiendas</span> {msg ? <span style={{fontSize:11, background:'#00E676', color:'#000', padding:'4px 10px', borderRadius:999, marginLeft:8}}>{msg}</span> : null}</h1>
        <p style={{fontSize:11, color:'#9A9590', marginTop:4}}>Crea tiendas boutique, comida y general con logo local y portada editable como antes</p>

        <div style={{display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:14, marginTop:14}}>
          <div className="card">
            <b style={{fontSize:13, color:'#0A0A0A'}}>Crear nueva tienda premium</b>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
              <select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})} className="input">
                <option value="boutique">👗 Boutique - Ropa y moda</option>
                <option value="comida">🍔 Comida - Restaurante</option>
                <option value="general">🛍️ General - Hogar y más</option>
              </select>
              <input value={form.slug} onChange={e=>setForm({...form, slug:e.target.value})} placeholder="slug ej: agdin-luna" className="input"/>
            </div>
            <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Nombre tienda ej: TIENDA AGDIN" className="input" style={{marginTop:8}}/>
            <input value={form.whatsapp} onChange={e=>setForm({...form, whatsapp:e.target.value})} placeholder="WhatsApp 50581732620" className="input" style={{marginTop:8}}/>
            <input value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Descripcion corta de la tienda" className="input" style={{marginTop:8}}/>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12}}>
              <div>
                <div style={{fontSize:11, fontWeight:800, marginBottom:6, color:'#0A0A0A'}}>Logo dueño (local)</div>
                <input type="file" accept="image/*" onChange={e=>setLogoFile(e.target.files?.[0]||null)} style={{fontSize:11, width:'100%'}}/>
                {logoPreview ? <img src={logoPreview} style={{width:52, height:52, borderRadius:12, marginTop:8, objectFit:'cover', border:'1px solid #EAE6E1'}}/> : <div style={{fontSize:10, color:'#9A9590', marginTop:6}}>Se mostrará en la tienda y en la cajita de WhatsApp</div>}
              </div>
              <div>
                <div style={{fontSize:11, fontWeight:800, marginBottom:6, color:'#0A0A0A'}}>Portada editable (local)</div>
                <input type="file" accept="image/*" onChange={e=>setCoverFile(e.target.files?.[0]||null)} style={{fontSize:11, width:'100%'}}/>
                {coverPreview ? <img src={coverPreview} style={{width:'100%', height:52, borderRadius:12, marginTop:8, objectFit:'cover', border:'1px solid #EAE6E1'}}/> : <div style={{fontSize:10, color:'#9A9590', marginTop:6}}>Imagen grande tipo boutique de tu captura</div>}
              </div>
            </div>

            <button onClick={crearTienda} disabled={creating} className="btn-black" style={{marginTop:14, opacity: creating?0.6:1}}>{creating ? 'Creando...' : 'Crear tienda premium →'}</button>
          </div>

          <div>
            <div style={{fontSize:11, fontWeight:800, color:'#9A9590', letterSpacing:'0.8px', marginBottom:8}}>VISTA PREVIA EN VIVO COMO ANTES</div>
            <div className="card" style={{padding:0, overflow:'hidden'}}>
              <div className="preview-cover">
                {previewStore.cover ? <img src={previewStore.cover}/> : <div style={{width:'100%', height:'100%', background:'linear-gradient(120deg,#D6CFC8,#F7F5F3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#9A9590'}}>Portada por defecto si no subes</div>}
                <div style={{position:'absolute', top:10, left:10, background:'#fff', padding:'4px 10px', borderRadius:999, fontSize:10, fontWeight:800}}>{previewStore.tipo.toUpperCase()}</div>
                <div style={{position:'absolute', top:10, right:10, background:'#fff', padding:'4px 10px', borderRadius:999, fontSize:10, fontWeight:800}}>• Abierto</div>
              </div>
              <div style={{padding:12, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  {previewStore.logo ? <img src={previewStore.logo} style={{width:36, height:36, borderRadius:10, objectFit:'cover', border:'1px solid #EAE6E1'}}/> : <div style={{width:36, height:36, borderRadius:10, background:'#0A0A0A', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14}}>A</div>}
                  <b style={{fontSize:13}}>{previewStore.name}</b>
                </div>
                <div style={{background:'#00E676', padding:'6px 12px', borderRadius:999, fontSize:10, fontWeight:800}}>WA</div>
              </div>
              <div style={{padding:'0 12px 12px'}}>
                <div style={{background:'#FBF9F7', border:'1px solid #EAE6E1', borderRadius:12, padding:10, fontSize:11, color:'#9A9590'}}>Buscar: vestido, blusa...<br/>tiendanica.store/{previewStore.slug}</div>
              </div>
            </div>
            <div style={{fontSize:10, color:'#9A9590', textAlign:'center', marginTop:6}}>Así se verá agdin-luna como tu captura</div>
          </div>
        </div>

        <div className="card">
          <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar tienda..." className="input" style={{maxWidth:220}}/>
            <button onClick={()=>setFilterTipo('all')} className={`pill ${filterTipo==='all'?'active':''}`}>all</button>
            <button onClick={()=>setFilterTipo('boutique')} className={`pill ${filterTipo==='boutique'?'active':''}`}>boutique</button>
            <button onClick={()=>setFilterTipo('comida')} className={`pill ${filterTipo==='comida'?'active':''}`}>comida</button>
            <button onClick={()=>setFilterTipo('general')} className={`pill ${filterTipo==='general'?'active':''}`}>general</button>
          </div>
          <div style={{marginTop:14}}>
            {filtered.map(s=>(
              <div key={s.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #F0EDE8'}}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <img src={s.logo_url || s.cover_image || ''} style={{width:32, height:32, borderRadius:8, objectFit:'cover', background:'#F7F5F3', border:'1px solid #EAE6E1'}} onError={e=>e.currentTarget.style.display='none'}/>
                  <div><b style={{fontSize:12}}>{s.name}</b><div style={{fontSize:10, color:'#9A9590'}}>{s.slug} • {s.tipo_tienda||'boutique'} • {s.whatsapp}</div></div>
                </div>
                <a href={'/'+s.slug} target="_blank" style={{background:'#0A0A0A', color:'#fff', padding:'6px 12px', borderRadius:999, fontSize:10, fontWeight:800, textDecoration:'none'}}>ver tienda →</a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
