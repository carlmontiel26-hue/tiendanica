'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key||!url.startsWith('http')) return null
  return createClient(url,key)
}

export default function Home(){
  const [form,setForm]=useState({slug:'',name:'',whatsapp:'',desc:'',tipo:'boutique'})
  const [logoFile,setLogoFile]=useState(null)
  const [coverFile,setCoverFile]=useState(null)
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState('')

  const uploadFile=async(supabase, file, bucket)=>{
    const ext=file.name.split('.').pop()
    const name=`${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const {data,error}=await supabase.storage.from(bucket).upload(name, file)
    if(error) throw error
    const {data:urlData}=supabase.storage.from(bucket).getPublicUrl(data.path)
    return urlData.publicUrl
  }

  const createStore=async(e)=>{
    e.preventDefault()
    const supabase=getSupabase()
    if(!supabase){ setMsg('Falta env vars'); return }
    if(!form.slug.match(/^[a-z0-9-]+$/)){ setMsg('Slug solo minusculas, numeros y guiones'); return }
    setLoading(true)
    try{
      let logoUrl=null, coverUrl=null
      if(logoFile) logoUrl=await uploadFile(supabase, logoFile, 'store-assets')
      if(coverFile) coverUrl=await uploadFile(supabase, coverFile, 'store-assets')
      const {data,error}=await supabase.from('stores').insert({
        slug: form.slug.toLowerCase(),
        name: form.name,
        whatsapp: form.whatsapp.replace(/[^0-9]/g,''),
        description: form.desc,
        tipo_tienda: form.tipo,
        logo_url: logoUrl,
        cover_image: coverUrl
      }).select().single()
      if(error) throw error
      setMsg(`✅ ${data.name} creada! Link: /${data.slug} - Admin: /${data.slug}/admin`)
      setForm({slug:'',name:'',whatsapp:'',desc:'',tipo:'boutique'}); setLogoFile(null); setCoverFile(null)
    }catch(err){ setMsg('Error: '+err.message) }
    setLoading(false)
  }

  return (
    <main style={{minHeight:'100vh', background:'#0A0A0A', color:'#fff', padding:20}}>
      <div style={{maxWidth:1000, margin:'0 auto'}}>
        <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:20}}>
          <img src="https://tiendanica.store/logo.png" alt="logo" style={{height:36}} onError={(e)=>e.target.style.display='none'}/>
          <div><h1 style={{fontSize:28, fontWeight:900, letterSpacing:-1}}>Tienda<span style={{color:'#00E676'}}>Nica</span>.Store</h1><p style={{opacity:0.6, fontSize:12}}>Plataforma premium - crea tiendas ilimitadas</p></div>
        </div>

        <div style={{background:'#fff', color:'#000', borderRadius:24, padding:22}}>
          <h2 style={{fontWeight:900, fontSize:18}}>Crear nueva tienda premium</h2>
          <p style={{fontSize:12, opacity:0.6, marginTop:4}}>Elige tipo: boutique (ropa), comida (restaurante), general (ferreteria/pulperia). Todo se vende por WhatsApp.</p>
          <form onSubmit={createStore} style={{marginTop:16, display:'grid', gap:12}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} style={{border:'1px solid #ddd', padding:12, borderRadius:12, fontWeight:700}}>
                <option value="boutique">👗 Boutique - Ropa y moda</option>
                <option value="comida">🍔 Comida - Restaurante</option>
                <option value="general">🛠️ General - Ferreteria / Variedad</option>
              </select>
              <input required value={form.slug} onChange={e=>setForm({...form,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-')})} placeholder="slug unico: moda-nica" style={{border:'1px solid #ddd', padding:12, borderRadius:12}}/>
            </div>
            <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nombre tienda" style={{border:'1px solid #ddd', padding:12, borderRadius:12}}/>
            <input required value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} placeholder="WhatsApp con pais: 505..." style={{border:'1px solid #ddd', padding:12, borderRadius:12}}/>
            <input value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Descripcion corta" style={{border:'1px solid #ddd', padding:12, borderRadius:12}}/>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <div><label style={{fontSize:11, fontWeight:700}}>Logo del dueño (subida local)</label><input type="file" accept="image/*" onChange={e=>setLogoFile(e.target.files[0])} style={{width:'100%', marginTop:6, fontSize:12}}/></div>
              <div><label style={{fontSize:11, fontWeight:700}}>Portada editable (subida local)</label><input type="file" accept="image/*" onChange={e=>setCoverFile(e.target.files[0])} style={{width:'100%', marginTop:6, fontSize:12}}/></div>
            </div>
            <button disabled={loading} style={{background:'#000', color:'#fff', padding:14, borderRadius:999, fontWeight:900, border:'none'}}>{loading?'Creando...':'Crear tienda premium'}</button>
          </form>
          {msg && <div style={{marginTop:12, background:'#F6F3F0', padding:12, borderRadius:12, fontSize:13, fontWeight:600}}>{msg}</div>}
        </div>

        <div style={{marginTop:24, display:'flex', gap:10}}>
          <a href="/admin" style={{background:'#00E676', color:'#000', padding:'12px 18px', borderRadius:999, textDecoration:'none', fontWeight:800}}>Super Admin → Ver todas</a>
          <span style={{fontSize:12, opacity:0.5, alignSelf:'center'}}>Crea tiendas ilimitadas para monetizar</span>
        </div>
      </div>
    </main>
  )
}
