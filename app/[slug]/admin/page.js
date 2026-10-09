'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){ const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim(); const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim(); if(!url||!key||!url.startsWith('http')) return null; return createClient(url,key) }

const BOUTIQUE_CATS = ['vestidos','blusas','jeans','faldas','conjuntos','shorts','ropa interior','pijamas','accesorios','zapatos','carteras','nuevo','oferta']

export default function AdminEliteProfesional(){
  const { slug } = useParams()
  const [store,setStore]=useState(null)
  const [prods,setProds]=useState([])
  const [auth,setAuth]=useState(false)
  const [pin,setPin]=useState('')
  const [showPin,setShowPin]=useState(false)
  const [loading,setLoading]=useState(true)
  const [form,setForm]=useState({name:'',price:'',categoria:'vestidos',tallas:'S,M,L',is_active:true})
  const [mainFile,setMainFile]=useState(null)
  const [mainPreview,setMainPreview]=useState(null)
  const [extraFiles,setExtraFiles]=useState([])
  const [extraPreviews,setExtraPreviews]=useState([])
  const [editing,setEditing]=useState(null)
  const [uploading,setUploading]=useState(false)

  useEffect(()=>{ init() },[slug])

  const init=async()=>{
    const supabase=getSupabase()
    const {data:s}=await supabase.from('stores').select('*').eq('slug',slug).single()
    if(s){
      setStore(s)
      const saved=localStorage.getItem(`tn_owner_${slug}`)
      if(saved===s.whatsapp){ setAuth(true); loadProds(s.id) }
    }
    setLoading(false)
  }

  const loadProds=async(id)=>{
    const supabase=getSupabase()
    const {data}=await supabase.from('products').select('*').eq('store_id',id).order('created_at',{ascending:false})
    setProds(data||[])
  }

  const tryAuth=()=>{
    if(pin.replace(/[^0-9]/g,'')===store.whatsapp.replace(/[^0-9]/g,'')){
      localStorage.setItem(`tn_owner_${slug}`, store.whatsapp)
      setAuth(true); loadProds(store.id)
    } else alert('Clave incorrecta - tu WhatsApp')
  }

  const uploadFile=async(file)=>{
    const supabase=getSupabase()
    const ext=file.name.split('.').pop()
    const path=`${slug}/prod/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const {data,error}=await supabase.storage.from('product-images').upload(path,file)
    if(error) throw error
    const {data:url}=supabase.storage.from('product-images').getPublicUrl(data.path)
    return url.publicUrl
  }

  const handleMain=(e)=>{
    const f=e.target.files[0]
    if(f){ setMainFile(f); setMainPreview(URL.createObjectURL(f)) }
  }
  const handleExtra=(e)=>{
    const files=Array.from(e.target.files).slice(0,4)
    setExtraFiles(files)
    setExtraPreviews(files.map(f=>URL.createObjectURL(f)))
  }

  const save=async(e)=>{
    e.preventDefault()
    if(!form.name||!form.price){ alert('Nombre y precio'); return }
    setUploading(true)
    try{
      const supabase=getSupabase()
      let mainUrl=null, extraUrls=[]
      if(mainFile) mainUrl=await uploadFile(mainFile)
      if(extraFiles.length>0){ for(let f of extraFiles){ const u=await uploadFile(f); extraUrls.push(u) } }
      const payload={
        store_id:store.id,
        name:form.name,
        price:Number(form.price),
        image_url: mainUrl || (editing? prods.find(x=>x.id===editing)?.image_url : null),
        extra_images: extraUrls.length>0? extraUrls : (editing? prods.find(x=>x.id===editing)?.extra_images : []),
        tallas: form.tallas.split(',').map(t=>t.trim()).filter(Boolean),
        categoria: form.categoria,
        is_active: form.is_active
      }
      if(!payload.image_url){ alert('Sube la foto principal'); setUploading(false); return }
      if(editing){ const {error}=await supabase.from('products').update(payload).eq('id',editing); if(error) throw error }
      else { const {error}=await supabase.from('products').insert(payload); if(error) throw error }
      setForm({name:'',price:'',categoria:'vestidos',tallas:'S,M,L',is_active:true}); setMainFile(null); setMainPreview(null); setExtraFiles([]); setExtraPreviews([]); setEditing(null); loadProds(store.id)
    }catch(err){ alert(err.message) }
    setUploading(false)
  }

  const edit=(p)=>{
    setEditing(p.id)
    setForm({name:p.name,price:p.price,categoria:p.categoria||'vestidos',tallas:(p.tallas||[]).join(','),is_active:p.is_active})
    setMainPreview(p.image_url)
    setExtraPreviews(p.extra_images||[])
    window.scrollTo({top:0,behavior:'smooth'})
  }
  const del=async(id)=>{ if(!confirm('¿Borrar producto?')) return; const s=getSupabase(); await s.from('products').delete().eq('id',id); loadProds(store.id) }

  if(loading) return <div style={{padding:40, background:'#F7F5F3', minHeight:'100vh'}}>Cargando...</div>
  if(!store) return <div style={{padding:40}}>Tienda no encontrada</div>

  if(!auth){
    return (
      <main style={{minHeight:'100vh', background:'#F7F5F3', display:'flex', alignItems:'center', justifyContent:'center', padding:16}}>
        <div style={{background:'#FFFFFF', borderRadius:22, padding:22, width:'100%', maxWidth:360, boxShadow:'0 12px 32px rgba(0,0,0,0.08)', border:'1px solid #EAE6E1', boxSizing:'border-box'}}>
          <h2 style={{fontWeight:900, fontSize:18, letterSpacing:'-0.3px'}}>👗 {store.name}</h2><p style={{fontSize:12, color:'#9A9590', marginTop:4}}>Admin privado - entra con tu WhatsApp</p>
          <div style={{position:'relative', marginTop:16, width:'100%'}}>
            <input type={showPin?'text':'password'} value={pin} onChange={e=>setPin(e.target.value)} placeholder="Tu WhatsApp como clave" style={{width:'100%', border:'1px solid #E8E3DD', background:'#FBF9F7', padding:'13px 44px 13px 14px', borderRadius:14, fontSize:13, boxSizing:'border-box'}}/>
            <button type="button" onClick={()=>setShowPin(!showPin)} style={{position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'#fff', border:'1px solid #EAE6E1', borderRadius:999, width:32, height:32, fontSize:14, cursor:'pointer'}}>{showPin?'🙈':'👁️'}</button>
          </div>
          <button onClick={tryAuth} style={{marginTop:12, width:'100%', background:'#0A0A0A', color:'#fff', padding:13, borderRadius:999, fontWeight:800, border:'none'}}>Entrar</button>
        </div>
      </main>
    )
  }

  return (
    <main style={{padding:'12px', maxWidth:'100vw', margin:'0 auto', paddingBottom:90, background:'#F7F5F3', minHeight:'100vh', overflowX:'hidden', boxSizing:'border-box', fontFamily:'Inter, system-ui, sans-serif'}}>
      <style>{`
        * { box-sizing: border-box; }
        .admin-wrap { max-width: 560px; margin: 0 auto; width: 100%; }
        .top-bar { display:flex; justify-content:space-between; align-items:center; background:#FFFFFF; padding:12px 14px; border-radius:18px; box-shadow:0 8px 24px rgba(0,0,0,0.06); border:1px solid #EAE6E1; gap:8px; }
        .form-card { margin-top:14px; background:#FFFFFF; border-radius:22px; padding:18px; box-shadow:0 12px 32px rgba(0,0,0,0.06); border:1px solid #EAE6E1; width:100%; overflow:hidden; }
        .row-2 { display:grid; grid-template-columns: 1fr 1fr; gap:10px; width:100%; }
        .input-base { padding:13px 14px; border-radius:14px; border:1px solid #E8E3DD; background:#FBF9F7; font-size:13px; width:100%; outline:none; transition: all 0.2s; }
        .input-base:focus { border-color:#0A0A0A; background:#fff; box-shadow:0 0 0 3px rgba(0,0,0,0.06); }
        .photo-main { background:#FFFFFF; border:1.5px dashed #0A0A0A; border-radius:16px; padding:14px; width:100%; }
        .photo-extra { background:#F9F6F2; border-radius:16px; padding:14px; border:1px solid #EAE6E1; width:100%; }
        @media (max-width: 480px) {
          .row-2 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="admin-wrap">
        <div className="top-bar">
          <div style={{minWidth:0, flex:1}}>
            <h1 style={{fontWeight:900, fontSize:16, letterSpacing:'-0.4px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'#0A0A0A'}}>👗 {store.name}</h1>
            <p style={{fontSize:11, color:'#9A9590', marginTop:2, fontWeight:500}}>{prods.length} productos • Boutique</p>
          </div>
          <div style={{display:'flex', gap:8, flexShrink:0}}>
            <a href={`/${slug}`} target="_blank" style={{background:'#0A0A0A', color:'#fff', padding:'9px 14px', borderRadius:999, textDecoration:'none', fontSize:12, fontWeight:800, whiteSpace:'nowrap'}}>Ver tienda</a>
            <button onClick={()=>{localStorage.removeItem(`tn_owner_${slug}`); setAuth(false)}} style={{background:'#F1EDE8', border:'1px solid #EAE6E1', padding:'9px 14px', borderRadius:999, fontSize:12, fontWeight:600, whiteSpace:'nowrap', color:'#0A0A0A'}}>Salir</button>
          </div>
        </div>

        <div className="form-card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h3 style={{fontWeight:900, fontSize:16, letterSpacing:'-0.3px', color:'#0A0A0A'}}>{editing?'✏️ Editar producto':'➕ Añadir producto'}</h3>
            {editing&&<span style={{background:'#F1EDE8', color:'#0A0A0A', fontSize:10, padding:'4px 8px', borderRadius:999, fontWeight:700}}>EDITANDO</span>}
          </div>
          <p style={{fontSize:11, color:'#9A9590', marginTop:4}}>Sube fotos desde tu celular - se guarda automático</p>
          
          <form onSubmit={save} style={{display:'grid', gap:12, marginTop:16}}>
            <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nombre: Ej. Vestido rojo elegante" className="input-base"/>

            <div className="row-2">
              <input required type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="Precio C$" className="input-base"/>
              <select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} className="input-base" style={{fontWeight:700, background:'#FBF9F7'}}>
                {BOUTIQUE_CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>

            <input value={form.tallas} onChange={e=>setForm({...form,tallas:e.target.value})} placeholder="Tallas: S, M, L, XL" className="input-base"/>

            <div className="photo-main">
              <label style={{fontSize:11, fontWeight:800, display:'block', marginBottom:10, letterSpacing:'0.4px', color:'#0A0A0A'}}>📸 FOTO PRINCIPAL *</label>
              <label style={{display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#0A0A0A', color:'#fff', padding:'14px 12px', borderRadius:12, fontWeight:800, cursor:'pointer', width:'100%', textAlign:'center', fontSize:12, letterSpacing:'-0.2px'}}>
                <span style={{fontSize:16}}>📷</span> <span>{mainPreview? 'Cambiar foto principal' : 'TOCA AQUÍ PARA SUBIR FOTO PRINCIPAL'}</span>
                <input type="file" accept="image/*" onChange={handleMain} style={{display:'none'}} required={!editing}/>
              </label>
              {mainPreview&&<img src={mainPreview} style={{width:'100%', height:220, objectFit:'cover', borderRadius:12, marginTop:12, border:'1px solid #EAE6E1'}}/>}
            </div>

            <div className="photo-extra">
              <label style={{fontSize:11, fontWeight:700, display:'block', marginBottom:10, color:'#0A0A0A'}}>🖼️ Fotos extra carrusel (opcional, máx 4)</label>
              <label style={{display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'#FFFFFF', color:'#0A0A0A', padding:'12px', borderRadius:12, fontWeight:700, cursor:'pointer', border:'1px solid #EAE6E1', width:'100%', fontSize:12, textAlign:'center'}}>
                ➕ Añadir más fotos del mismo producto
                <input type="file" multiple accept="image/*" onChange={handleExtra} style={{display:'none'}}/>
              </label>
              {extraPreviews.length>0&&<div style={{display:'flex', gap:8, marginTop:10, overflowX:'auto', paddingBottom:2}}>{extraPreviews.map((u,i)=><img key={i} src={u} style={{width:64,height:64,borderRadius:10,objectFit:'cover',border:'1px solid #EAE6E1', flexShrink:0}}/>)}</div>}
            </div>

            <label style={{fontSize:12, display:'flex', alignItems:'center', gap:8, color:'#0A0A0A', fontWeight:500}}><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})} style={{width:16,height:16, accentColor:'#0A0A0A'}}/> Producto activo (visible en tienda)</label>

            <button type="submit" disabled={uploading} style={{background:'#0A0A0A', color:'#fff', padding:15, borderRadius:999, fontWeight:900, border:'none', fontSize:13, width:'100%', letterSpacing:'-0.2px', boxShadow:'0 8px 20px rgba(0,0,0,0.12)'}}>{uploading?'⏳ Subiendo...': editing?'✅ Actualizar producto':'✅ Añadir producto a mi tienda'}</button>
            {editing&&<button type="button" onClick={()=>{setEditing(null); setForm({name:'',price:'',categoria:'vestidos',tallas:'S,M,L',is_active:true}); setMainPreview(null); setExtraPreviews([]); setMainFile(null); setExtraFiles([])}} style={{background:'#F1EDE8', padding:12, borderRadius:999, border:'1px solid #EAE6E1', fontWeight:700, width:'100%', fontSize:12, color:'#0A0A0A'}}>Cancelar edición</button>}
          </form>
        </div>

        <div style={{marginTop:18}}>
          <h3 style={{fontWeight:800, fontSize:13, color:'#0A0A0A', letterSpacing:'-0.2px'}}>📦 Mis productos ({prods.length})</h3>
          <div style={{display:'grid', gap:10, marginTop:10}}>
            {prods.map(p=>(
              <div key={p.id} style={{background:'#FFFFFF', borderRadius:16, padding:10, display:'flex', gap:10, alignItems:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.04)', border:'1px solid #EAE6E1', width:'100%', overflow:'hidden'}}>
                <img src={p.image_url} style={{width:56,height:56,borderRadius:12,objectFit:'cover', flexShrink:0, border:'1px solid #F1EDE8'}}/>
                <div style={{flex:1, minWidth:0}}><b style={{fontSize:12.5, display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'#0A0A0A', letterSpacing:'-0.2px'}}>{p.name}</b><span style={{fontSize:11, color:'#9A9590'}}>C$ {p.price} • {p.categoria} • {(p.tallas||[]).join(' ')}</span></div>
                <div style={{display:'flex', flexDirection:'column', gap:6, flexShrink:0}}>
                  <button onClick={()=>edit(p)} style={{background:'#0A0A0A',color:'#fff',border:'none',padding:'7px 14px',borderRadius:999,fontSize:11,fontWeight:800}}>Editar</button>
                  <button onClick={()=>del(p.id)} style={{background:'#fff',color:'#FF4D4D',border:'1px solid #FFD9D9',padding:'6px 14px',borderRadius:999,fontSize:11, fontWeight:600}}>Borrar</button>
                </div>
              </div>
            ))}
            {prods.length===0&&<div style={{background:'#FFFFFF', borderRadius:16, padding:18, textAlign:'center', color:'#9A9590', fontSize:12, border:'1px solid #EAE6E1'}}>Aún no tienes productos. ¡Añade el primero! 👆</div>}
          </div>
        </div>
      </div>
    </main>
  )
}
