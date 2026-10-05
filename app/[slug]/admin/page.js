'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){ const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim(); const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim(); if(!url||!key||!url.startsWith('http')) return null; return createClient(url,key) }

const BOUTIQUE_CATS = ['vestidos','blusas','jeans','faldas','conjuntos','shorts','ropa interior','pijamas','accesorios','zapatos','carteras','nuevo','oferta']

export default function OwnerAdminBoutiqueFix(){
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
      if(!payload.image_url){ alert('Sube la foto principal del producto'); setUploading(false); return }
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

  if(loading) return <div style={{padding:40}}>Cargando...</div>
  if(!store) return <div style={{padding:40}}>Tienda no encontrada</div>

  if(!auth){
    return (
      <main style={{minHeight:'100vh', background:'#F6F3F0', display:'flex', alignItems:'center', justifyContent:'center', padding:16}}>
        <div style={{background:'#fff', borderRadius:20, padding:20, width:'100%', maxWidth:360, boxShadow:'0 10px 30px rgba(0,0,0,0.08)', boxSizing:'border-box'}}>
          <h2 style={{fontWeight:900, fontSize:18}}>👗 {store.name}</h2><p style={{fontSize:12, opacity:0.6, marginTop:4}}>Admin privado - entra con tu WhatsApp</p>
          <div style={{position:'relative', marginTop:12, width:'100%'}}>
            <input type={showPin?'text':'password'} value={pin} onChange={e=>setPin(e.target.value)} placeholder="Tu WhatsApp como clave" style={{width:'100%', border:'1px solid #ddd', padding:'12px 40px 12px 12px', borderRadius:12, boxSizing:'border-box'}}/>
            <button type="button" onClick={()=>setShowPin(!showPin)} style={{position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', fontSize:18, cursor:'pointer', padding:4}}>{showPin?'🙈':'👁️'}</button>
          </div>
          <button onClick={tryAuth} style={{marginTop:10, width:'100%', background:'#000', color:'#fff', padding:12, borderRadius:999, fontWeight:800, border:'none'}}>Entrar</button>
        </div>
      </main>
    )
  }

  return (
    <main style={{padding:10, maxWidth:'100vw', margin:'0 auto', paddingBottom:90, background:'#F6F3F0', minHeight:'100vh', overflowX:'hidden', boxSizing:'border-box'}}>
      <style>{`
        * { box-sizing: border-box; }
        .admin-wrap { max-width: 560px; margin: 0 auto; width: 100%; }
        .top-bar { display:flex; justify-content:space-between; align-items:center; background:#fff; padding:10px 12px; border-radius:14px; box-shadow:0 1px 3px rgba(0,0,0,0.05); gap:8px; }
        .top-left { min-width:0; flex:1; }
        .top-right { display:flex; gap:6px; flex-shrink:0; }
        .form-card { margin-top:12px; background:#fff; border-radius:18px; padding:14px; box-shadow:0 4px 12px rgba(0,0,0,0.05); border:1.5px solid #000; width:100%; overflow:hidden; }
        .row-2 { display:grid; grid-template-columns: 1fr 1fr; gap:8px; width:100%; }
        .input-base { padding:11px 12px; border-radius:12px; border:1px solid #ddd; font-size:13px; width:100%; }
        @media (max-width: 480px) {
          .top-bar { padding:8px 10px; }
          .form-card { padding:12px; border-radius:16px; }
          .row-2 { grid-template-columns: 1fr; }
          .top-right a, .top-right button { padding:7px 10px !important; font-size:12px !important; }
        }
      `}</style>

      <div className="admin-wrap">
        <div className="top-bar">
          <div className="top-left">
            <h1 style={{fontWeight:900, fontSize:15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>👗 {store.name}</h1>
            <p style={{fontSize:11, opacity:0.5}}>{prods.length} productos • Boutique</p>
          </div>
          <div className="top-right">
            <a href={`/${slug}`} target="_blank" style={{background:'#00E676', color:'#000', padding:'8px 12px', borderRadius:999, textDecoration:'none', fontSize:12, fontWeight:700, whiteSpace:'nowrap'}}>Ver tienda</a>
            <button onClick={()=>{localStorage.removeItem(`tn_owner_${slug}`); setAuth(false)}} style={{background:'#eee', border:'none', padding:'8px 12px', borderRadius:999, fontSize:12, whiteSpace:'nowrap'}}>Salir</button>
          </div>
        </div>

        <div className="form-card">
          <h3 style={{fontWeight:900, fontSize:14}}>{editing?'✏️ Editar producto':'➕ Añadir producto'}</h3>
          <p style={{fontSize:11, opacity:0.6, marginTop:2}}>Sube fotos desde tu celular - se guardan automático</p>
          
          <form onSubmit={save} style={{display:'grid', gap:10, marginTop:12}}>
            <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nombre: Ej. Vestido rojo elegante" className="input-base"/>

            <div className="row-2">
              <input required type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="Precio C$" className="input-base"/>
              <select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} className="input-base" style={{fontWeight:600, background:'#fff'}}>
                {BOUTIQUE_CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>

            <input value={form.tallas} onChange={e=>setForm({...form,tallas:e.target.value})} placeholder="Tallas: S, M, L, XL" className="input-base"/>

            <div style={{background:'#000', borderRadius:14, padding:10, color:'#fff', width:'100%'}}>
              <label style={{fontSize:11, fontWeight:800, display:'block', marginBottom:8}}>📸 FOTO PRINCIPAL *</label>
              <label style={{display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#fff', color:'#000', padding:'14px 10px', borderRadius:10, fontWeight:900, cursor:'pointer', border:'2px dashed #000', width:'100%', textAlign:'center', fontSize:12}}>
                <span style={{fontSize:18}}>📷</span> <span style={{lineHeight:1.2}}>{mainPreview? 'Cambiar foto principal' : 'TOCA AQUÍ PARA SUBIR FOTO PRINCIPAL'}</span>
                <input type="file" accept="image/*" onChange={handleMain} style={{display:'none'}} required={!editing}/>
              </label>
              {mainPreview&&<img src={mainPreview} style={{width:'100%', height:200, objectFit:'cover', borderRadius:10, marginTop:10, border:'2px solid #fff'}}/>}
            </div>

            <div style={{background:'#F6F3F0', borderRadius:14, padding:10, border:'1px solid #eee', width:'100%'}}>
              <label style={{fontSize:11, fontWeight:800, display:'block', marginBottom:8}}>🖼️ Fotos extra carrusel (opcional, máx 4)</label>
              <label style={{display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'#fff', color:'#000', padding:'11px', borderRadius:10, fontWeight:700, cursor:'pointer', border:'1px solid #ddd', width:'100%', fontSize:12, textAlign:'center'}}>
                ➕ Añadir más fotos del mismo producto
                <input type="file" multiple accept="image/*" onChange={handleExtra} style={{display:'none'}}/>
              </label>
              {extraPreviews.length>0&&<div style={{display:'flex', gap:6, marginTop:8, overflowX:'auto'}}>{extraPreviews.map((u,i)=><img key={i} src={u} style={{width:60,height:60,borderRadius:8,objectFit:'cover',border:'1px solid #ddd', flexShrink:0}}/>)}</div>}
            </div>

            <label style={{fontSize:12, display:'flex', alignItems:'center', gap:6}}><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> Producto activo (visible en tienda)</label>

            <button type="submit" disabled={uploading} style={{background:'#00E676', color:'#000', padding:13, borderRadius:999, fontWeight:900, border:'none', fontSize:13, width:'100%'}}>{uploading?'⏳ Subiendo...': editing?'✅ Actualizar producto':'✅ Añadir producto a mi tienda'}</button>
            {editing&&<button type="button" onClick={()=>{setEditing(null); setForm({name:'',price:'',categoria:'vestidos',tallas:'S,M,L',is_active:true}); setMainPreview(null); setExtraPreviews([]); setMainFile(null); setExtraFiles([])}} style={{background:'#eee', padding:11, borderRadius:999, border:'none', fontWeight:700, width:'100%', fontSize:12}}>Cancelar edición</button>}
          </form>
        </div>

        <div style={{marginTop:14}}>
          <h3 style={{fontWeight:800, fontSize:13}}>📦 Mis productos ({prods.length})</h3>
          <div style={{display:'grid', gap:8, marginTop:8}}>
            {prods.map(p=>(
              <div key={p.id} style={{background:'#fff', borderRadius:12, padding:8, display:'flex', gap:8, alignItems:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', width:'100%', overflow:'hidden'}}>
                <img src={p.image_url} style={{width:54,height:54,borderRadius:8,objectFit:'cover', flexShrink:0}}/>
                <div style={{flex:1, minWidth:0}}><b style={{fontSize:12, display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.name}</b><span style={{fontSize:10, opacity:0.7}}>C$ {p.price} • {p.categoria} • {(p.tallas||[]).join(' ')}</span></div>
                <div style={{display:'flex', flexDirection:'column', gap:4, flexShrink:0}}>
                  <button onClick={()=>edit(p)} style={{background:'#000',color:'#fff',border:'none',padding:'5px 10px',borderRadius:999,fontSize:11,fontWeight:700}}>Editar</button>
                  <button onClick={()=>del(p.id)} style={{background:'#fff',color:'#ff4444',border:'1px solid #ffcccc',padding:'5px 10px',borderRadius:999,fontSize:11}}>Borrar</button>
                </div>
              </div>
            ))}
            {prods.length===0&&<div style={{background:'#fff', borderRadius:12, padding:16, textAlign:'center', opacity:0.5, fontSize:11}}>Aún no tienes productos. ¡Añade el primero! 👆</div>}
          </div>
        </div>
      </div>
    </main>
  )
}
