'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){ const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim(); const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim(); if(!url||!key) return null; return createClient(url,key) }

const TYPES = [{v:'boutique',l:'👗 Boutique - Ropa y moda'}, {v:'comida',l:'🍔 Comida - Restaurante'}, {v:'general',l:'🛍️ General - Todo'}]

const CATS_BY_TIPO = {
  boutique: ['vestidos','blusas','jeans','faldas','conjuntos','shorts','ropa interior','pijamas','accesorios','zapatos','carteras','nuevo','oferta'],
  comida: ['entradas','platos fuertes','pizzas','hamburguesas','pollo','mariscos','bebidas','postres','combos','vegano','desayunos','ofertas'],
  general: ['hogar','tecnologia','belleza','juguetes','ferreteria','salud','deportes','libros','mascotas','electrodomesticos','otros','oferta','nuevo']
}
const LABELS = {
  boutique: { icon:'👗', name_ph:'Nombre: Ej. Vestido rojo elegante', extra_ph:'Tallas: S, M, L, XL', foto_hint:'Sube fotos desde tu celular - se guarda automático', foto_btn:'TOCA AQUÍ PARA SUBIR FOTO PRINCIPAL' },
  comida: { icon:'🍔', name_ph:'Nombre del plato: Ej. Burger doble queso', extra_ph:'Ej. Con papas, sin cebolla, picante medio', foto_hint:'Sube fotos del plato - que se vea provocativo', foto_btn:'TOCA PARA SUBIR FOTO DEL PLATO' },
  general: { icon:'🛍️', name_ph:'Nombre del producto: Ej. Licuadora Oster', extra_ph:'Ej. Rojo, 12 velocidades, 1 año garantía', foto_hint:'Sube fotos del producto - varias vistas ayuda a vender', foto_btn:'TOCA AQUÍ PARA SUBIR FOTO PRINCIPAL' }
}

export default function SuperAdminPremium(){
  const [stores,setStores]=useState([])
  const [filter,setFilter]=useState('all')
  const [search,setSearch]=useState('')
  const [form,setForm]=useState({tipo:'boutique', slug:'', name:'', whatsapp:'', descripcion:'', logo:null, cover:null})
  const [loading,setLoading]=useState(false)
  const [auth,setAuth]=useState(false)
  const [pin,setPin]=useState('')
  const [selected,setSelected]=useState(null)
  const [products,setProducts]=useState([])
  const [prodForm,setProdForm]=useState({name:'',price:'',categoria:'vestidos',tallas:'S,M,L',is_active:true})
  const [mainFile,setMainFile]=useState(null)
  const [mainPrev,setMainPrev]=useState(null)
  const [extraFiles,setExtraFiles]=useState([])
  const [extraPrevs,setExtraPrevs]=useState([])
  const [editingProd,setEditingProd]=useState(null)
  const [uploading,setUploading]=useState(false)

  useEffect(()=>{ const s=localStorage.getItem('tn_super_auth'); if(s==='ok') setAuth(true); loadStores() },[])

  const loadStores=async()=>{
    const supabase=getSupabase()
    const {data}=await supabase.from('stores').select('*').order('created_at',{ascending:false})
    if(data){
      const counts={}
      const {data:prods}=await supabase.from('products').select('store_id')
      prods?.forEach(p=>counts[p.store_id]=(counts[p.store_id]||0)+1)
      setStores(data.map(s=>({...s, _count: counts[s.id]||0})))
    }
  }

  const tryAuth=()=>{ if(pin==='tiendanica2025'){ localStorage.setItem('tn_super_auth','ok'); setAuth(true) } else alert('Clave incorrecta') }
  const uploadFile=async(file, folder)=>{
    const supabase=getSupabase()
    const ext=file.name.split('.').pop()
    const path=`${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const bucket = folder==='stores'? 'store-images' : 'product-images'
    const {data,error}=await supabase.storage.from(bucket).upload(path,file)
    if(error) throw error
    const {data:url}=supabase.storage.from(bucket).getPublicUrl(data.path)
    return url.publicUrl
  }
  const createStore=async(e)=>{
    e.preventDefault()
    if(!form.slug||!form.name||!form.whatsapp){ alert('Slug, nombre y WhatsApp obligatorios'); return }
    setLoading(true)
    try{
      const supabase=getSupabase()
      let logoUrl=null, coverUrl=null
      if(form.logo) logoUrl=await uploadFile(form.logo,'stores')
      if(form.cover) coverUrl=await uploadFile(form.cover,'stores')
      const payload={ slug:form.slug.toLowerCase().replace(/\s+/g,'-'), name:form.name, whatsapp:form.whatsapp.replace(/[^0-9]/g,''), description:form.descripcion, tipo_tienda:form.tipo, logo_url:logoUrl, cover_image:coverUrl||logoUrl }
      const {error}=await supabase.from('stores').insert(payload)
      if(error) throw error
      setForm({tipo:'boutique', slug:'', name:'', whatsapp:'', descripcion:'', logo:null, cover:null})
      loadStores()
      alert('Tienda premium creada')
    }catch(err){ alert(err.message) }
    setLoading(false)
  }
  const deleteStore=async(id)=>{
    if(!confirm('¿Borrar tienda y sus productos?')) return
    const supabase=getSupabase()
    await supabase.from('products').delete().eq('store_id',id)
    await supabase.from('stores').delete().eq('id',id)
    if(selected?.id===id) setSelected(null)
    loadStores()
  }
  const selectStore=async(s)=>{
    setSelected(s)
    setEditingProd(null)
    const tipo = s.tipo_tienda||'boutique'
    const cats = CATS_BY_TIPO[tipo]||CATS_BY_TIPO.boutique
    setProdForm({name:'',price:'',categoria:cats[0],tallas:tipo==='boutique'?'S,M,L':'',is_active:true})
    setMainFile(null); setMainPrev(null); setExtraFiles([]); setExtraPrevs([])
    const supabase=getSupabase()
    const {data}=await supabase.from('products').select('*').eq('store_id',s.id).order('created_at',{ascending:false})
    setProducts(data||[])
    setTimeout(()=>{ document.getElementById('gestion-anchor')?.scrollIntoView({behavior:'smooth'}) },100)
  }
  const saveProduct=async(e)=>{
    e.preventDefault()
    if(!prodForm.name||!prodForm.price){ alert('Nombre y precio'); return }
    if(!selected) return
    setUploading(true)
    try{
      const supabase=getSupabase()
      let mainUrl=null, extraUrls=[]
      if(mainFile) mainUrl=await uploadFile(mainFile, `prod/${selected.slug}`)
      if(extraFiles.length>0){ for(let f of extraFiles){ const u=await uploadFile(f, `prod/${selected.slug}`); extraUrls.push(u) } }
      const payload={
        store_id:selected.id,
        name:prodForm.name,
        price:Number(prodForm.price),
        image_url: mainUrl || (editingProd? products.find(x=>x.id===editingProd)?.image_url : null),
        extra_images: extraUrls.length>0? extraUrls : (editingProd? products.find(x=>x.id===editingProd)?.extra_images : []),
        tallas: prodForm.tallas? prodForm.tallas.split(',').map(t=>t.trim()).filter(Boolean) : [],
        categoria: prodForm.categoria,
        is_active: prodForm.is_active
      }
      if(!payload.image_url){ alert('Sube foto principal'); setUploading(false); return }
      if(editingProd){ const {error}=await supabase.from('products').update(payload).eq('id',editingProd); if(error) throw error }
      else { const {error}=await supabase.from('products').insert(payload); if(error) throw error }
      const tipo = selected.tipo_tienda||'boutique'
      const cats = CATS_BY_TIPO[tipo]||CATS_BY_TIPO.boutique
      setProdForm({name:'',price:'',categoria:cats[0],tallas:tipo==='boutique'?'S,M,L':'',is_active:true}); setMainFile(null); setMainPrev(null); setExtraFiles([]); setExtraPrevs([]); setEditingProd(null)
      const {data}=await supabase.from('products').select('*').eq('store_id',selected.id).order('created_at',{ascending:false})
      setProducts(data||[]); loadStores()
    }catch(err){ alert(err.message) }
    setUploading(false)
  }
  const editProduct=(p)=>{
    setEditingProd(p.id)
    setProdForm({name:p.name,price:p.price,categoria:p.categoria||'vestidos',tallas:(p.tallas||[]).join(','),is_active:p.is_active})
    setMainPrev(p.image_url)
    setExtraPrevs(p.extra_images||[])
  }
  const deleteProduct=async(id)=>{ if(!confirm('¿Borrar producto?')) return; const s=getSupabase(); await s.from('products').delete().eq('id',id); const {data}=await s.from('products').select('*').eq('store_id',selected.id).order('created_at',{ascending:false}); setProducts(data||[]); loadStores() }

  const filtered = stores.filter(s=>{
    const matchFilter = filter==='all' || s.tipo_tienda===filter
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.slug.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  if(!auth){
    return <main style={{minHeight:'100vh', background:'#F7F5F3', display:'flex', alignItems:'center', justifyContent:'center', padding:16}}><div style={{background:'#fff', borderRadius:22, padding:22, width:'100%', maxWidth:360, boxShadow:'0 12px 32px rgba(0,0,0,0.08)', border:'1px solid #EAE6E1'}}><h2 style={{fontWeight:900}}>Super Admin Privado</h2><p style={{fontSize:12, color:'#9A9590', marginTop:4}}>Clave maestra</p><input type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="Clave super admin" style={{marginTop:16, width:'100%', border:'1px solid #E8E3DD', background:'#FBF9F7', padding:13, borderRadius:14}}/><button onClick={tryAuth} style={{marginTop:12, width:'100%', background:'#0A0A0A', color:'#fff', padding:13, borderRadius:999, fontWeight:800, border:'none'}}>Entrar</button></div></main>
  }

  return (
    <main style={{background:'#F7F5F3', minHeight:'100vh', padding:'14px', maxWidth:'100vw', overflowX:'hidden', boxSizing:'border-box', fontFamily:'Inter, system-ui'}}>
      <style>{`
        *{box-sizing:border-box}
        .wrap{max-width:980px; margin:0 auto; width:100%}
        .top{display:flex; justify-content:space-between; align-items:center; margin-bottom:12px}
        .card-white{background:#fff; border:1px solid #EAE6E1; border-radius:20px; box-shadow:0 8px 28px rgba(0,0,0,0.05); padding:16px}
        .input-base{padding:12px 14px; border-radius:14px; border:1px solid #E8E3DD; background:#FBF9F7; font-size:13px; width:100%; outline:none; transition: all 0.2s}
        .input-base:focus{border-color:#0A0A0A; background:#fff; box-shadow:0 0 0 3px rgba(0,0,0,0.06)}
        .pill{padding:8px 14px; border-radius:999px; border:1px solid #EAE6E1; background:#fff; font-size:12px; font-weight:600; cursor:pointer}
        .pill.active{background:#0A0A0A; color:#fff; border-color:#0A0A0A}
        .btn-black{background:#0A0A0A; color:#fff; border:none; border-radius:999px; padding:12px 16px; font-weight:800; cursor:pointer}
        .row-2{display:grid; grid-template-columns:1fr 1fr; gap:10px; width:100%}
        @media(max-width:480px){.row-2{grid-template-columns:1fr}}
      `}</style>

      <div className="wrap">
        <div className="top">
          <h1 style={{fontWeight:900, fontSize:18, color:'#0A0A0A'}}>Super Admin Privado - {stores.length} tiendas</h1>
          <button onClick={()=>{localStorage.removeItem('tn_super_auth'); setAuth(false)}} className="pill">Salir</button>
        </div>

        <div className="card-white" style={{border:'1.5px solid #0A0A0A'}}>
          <h3 style={{fontWeight:900, fontSize:14, marginBottom:10}}>Crear nueva tienda premium (esta es la pantalla de tu captura)</h3>
          <form onSubmit={createStore} style={{display:'grid', gap:10}}>
            <div className="row-2">
              <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} className="input-base" style={{fontWeight:700}}>{TYPES.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}</select>
              <input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="slug unico: moda-nica" className="input-base"/>
            </div>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nombre tienda" className="input-base"/>
            <input value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} placeholder="WhatsApp con pais: 505..." className="input-base"/>
            <input value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Descripcion corta" className="input-base"/>
            <div className="row-2">
              <div><label style={{fontSize:11, fontWeight:700}}>Logo dueño (local)</label><input type="file" accept="image/*" onChange={e=>setForm({...form,logo:e.target.files[0]})} style={{fontSize:11, marginTop:4}}/></div>
              <div><label style={{fontSize:11, fontWeight:700}}>Portada editable (local)</label><input type="file" accept="image/*" onChange={e=>setForm({...form,cover:e.target.files[0]})} style={{fontSize:11, marginTop:4}}/></div>
            </div>
            <button type="submit" disabled={loading} className="btn-black" style={{width:'100%', padding:14, fontSize:13}}>{loading?'⏳ Creando...':'Crear tienda premium'}</button>
          </form>
        </div>

        <div className="card-white" style={{marginTop:12, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="input-base" style={{maxWidth:200}}/>
          <button onClick={()=>setFilter('all')} className={`pill ${filter==='all'?'active':''}`}>all</button>
          <button onClick={()=>setFilter('boutique')} className={`pill ${filter==='boutique'?'active':''}`}>boutique</button>
          <button onClick={()=>setFilter('comida')} className={`pill ${filter==='comida'?'active':''}`}>comida</button>
          <button onClick={()=>setFilter('general')} className={`pill ${filter==='general'?'active':''}`}>general</button>
        </div>

        <div style={{display:'grid', gap:10, marginTop:12}}>
          {filtered.map(s=>(
            <div key={s.id} onClick={()=>selectStore(s)} className="card-white" style={{display:'flex', gap:12, alignItems:'center', cursor:'pointer', borderColor: selected?.id===s.id? '#0A0A0A':'#EAE6E1', borderWidth: selected?.id===s.id? '1.5px':'1px'}}>
              <img src={s.logo_url||s.cover_image||'https://via.placeholder.com/80'} style={{width:52,height:52,borderRadius:12,objectFit:'cover', border:'1px solid #EAE6E1'}}/>
              <div style={{flex:1, minWidth:0}}>
                <b style={{fontSize:13, color:'#0A0A0A'}}>{s.name} <span style={{fontSize:10, background:'#F1EDE8', padding:'2px 6px', borderRadius:999, fontWeight:600, marginLeft:4}}>{s.tipo_tienda}</span> <span style={{fontSize:10, color:'#9A9590', fontWeight:400}}>/{s.slug}</span></b>
                <div style={{fontSize:11, color:'#9A9590', marginTop:2}}>WA clave: {s.whatsapp} • {s._count} prod</div>
                <div style={{display:'flex', gap:6, marginTop:6}}>
                  <a href={`/${s.slug}`} target="_blank" onClick={e=>e.stopPropagation()} style={{background:'#00E676', color:'#000', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:800, textDecoration:'none'}}>Ver tienda</a>
                  <a href={`/${s.slug}/admin`} target="_blank" onClick={e=>e.stopPropagation()} style={{background:'#0A0A0A', color:'#fff', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:700, textDecoration:'none'}}>Admin dueño (clave=WA)</a>
                </div>
              </div>
              <button onClick={e=>{e.stopPropagation(); deleteStore(s.id)}} style={{background:'#FF4D4D', color:'#fff', border:'none', padding:'8px 12px', borderRadius:999, fontSize:11, fontWeight:700}}>Borrar</button>
            </div>
          ))}
        </div>

        {selected && (()=>{ const tipo = selected.tipo_tienda||'boutique'; const cats = CATS_BY_TIPO[tipo]||CATS_BY_TIPO.boutique; const labels = LABELS[tipo]||LABELS.boutique; return (
          <div id="gestion-anchor" style={{marginTop:22}}>
            {/* PREVIEW ELITE - MISMO QUE ADMIN DUEÑO VE */}
            <div style={{background:'#FFFFFF', borderRadius:22, padding:18, boxShadow:'0 12px 32px rgba(0,0,0,0.06)', border:'1px solid #EAE6E1', width:'100%'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                <h3 style={{fontWeight:900, fontSize:16, color:'#0A0A0A'}}>{labels.icon} {selected.name} • Vista previa premium</h3>
                <button onClick={()=>setSelected(null)} style={{background:'#F1EDE8', color:'#0A0A0A', border:'1px solid #EAE6E1', padding:'7px 12px', borderRadius:999, fontSize:11, fontWeight:700}}>Cerrar vista</button>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <a href={`/${selected.slug}`} target="_blank" style={{background:'#0A0A0A', color:'#fff', textAlign:'center', padding:12, borderRadius:999, fontWeight:800, textDecoration:'none', fontSize:12}}>🔍 Abrir tienda real</a>
                <div style={{background:'#FBF9F7', borderRadius:999, padding:12, fontSize:11, border:'1px solid #EAE6E1', textAlign:'center', fontWeight:600}}>{selected._count} productos • /{selected.slug} • {tipo}</div>
              </div>

              <div style={{marginTop:12, background:'#F7F5F3', borderRadius:16, overflow:'hidden', height:380, border:'1px solid #EAE6E1', padding:6}}>
                <iframe src={`/${selected.slug}`} style={{width:'100%', height:'100%', border:'none', borderRadius:12, background:'#fff'}} title="preview tienda"/>
              </div>
            </div>

            {/* GESTION PRODUCTOS - IDENTICA A ADMIN DUEÑO ELITE */}
            <div style={{marginTop:14, background:'#FFFFFF', borderRadius:22, padding:18, boxShadow:'0 12px 32px rgba(0,0,0,0.06)', border:'1px solid #EAE6E1'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h3 style={{fontWeight:900, fontSize:16, color:'#0A0A0A'}}>{editingProd?'✏️ Editar':'➕ Añadir'} {tipo==='comida'?'plato': 'producto'} en {selected.name}</h3>
                {editingProd&&<span style={{background:'#F1EDE8', fontSize:10, padding:'4px 8px', borderRadius:999, fontWeight:700}}>EDITANDO</span>}
              </div>
              <p style={{fontSize:11, color:'#9A9590', marginTop:4}}>{labels.foto_hint}</p>

              <form onSubmit={saveProduct} style={{display:'grid', gap:12, marginTop:16}}>
                <input required value={prodForm.name} onChange={e=>setProdForm({...prodForm,name:e.target.value})} placeholder={labels.name_ph} className="input-base"/>

                <div className="row-2">
                  <input required type="number" value={prodForm.price} onChange={e=>setProdForm({...prodForm,price:e.target.value})} placeholder="Precio C$" className="input-base"/>
                  <select value={prodForm.categoria} onChange={e=>setProdForm({...prodForm,categoria:e.target.value})} className="input-base" style={{fontWeight:700}}>
                    {cats.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>

                <input value={prodForm.tallas} onChange={e=>setProdForm({...prodForm,tallas:e.target.value})} placeholder={labels.extra_ph} className="input-base"/>

                <div style={{background:'#FFFFFF', border:'1.5px dashed #0A0A0A', borderRadius:16, padding:14}}>
                  <label style={{fontSize:11, fontWeight:800, display:'block', marginBottom:10}}>📸 FOTO PRINCIPAL *</label>
                  <label style={{display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#0A0A0A', color:'#fff', padding:'14px 12px', borderRadius:12, fontWeight:800, cursor:'pointer', width:'100%', fontSize:12}}>
                    📷 {mainPrev?'Cambiar foto principal': labels.foto_btn}
                    <input type="file" accept="image/*" onChange={e=>{const f=e.target.files[0]; if(f){setMainFile(f); setMainPrev(URL.createObjectURL(f))}}} style={{display:'none'}} required={!editingProd}/>
                  </label>
                  {mainPrev&&<img src={mainPrev} style={{width:'100%', height:220, objectFit:'cover', borderRadius:12, marginTop:12, border:'1px solid #EAE6E1'}}/>}
                </div>

                <div style={{background:'#F9F6F2', borderRadius:16, padding:14, border:'1px solid #EAE6E1'}}>
                  <label style={{fontSize:11, fontWeight:700, display:'block', marginBottom:10}}>🖼️ Fotos extra carrusel (opcional, máx 4)</label>
                  <label style={{display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'#fff', color:'#0A0A0A', padding:'12px', borderRadius:12, fontWeight:700, cursor:'pointer', border:'1px solid #EAE6E1', width:'100%', fontSize:12}}>
                    ➕ Añadir más fotos del mismo {tipo==='comida'?'plato':'producto'}
                    <input type="file" multiple accept="image/*" onChange={e=>{const fs=Array.from(e.target.files).slice(0,4); setExtraFiles(fs); setExtraPrevs(fs.map(f=>URL.createObjectURL(f)))}} style={{display:'none'}}/>
                  </label>
                  {extraPrevs.length>0&&<div style={{display:'flex', gap:8, marginTop:10, overflowX:'auto'}}>{extraPrevs.map((u,i)=><img key={i} src={u} style={{width:64,height:64,borderRadius:10,objectFit:'cover',border:'1px solid #EAE6E1', flexShrink:0}}/>)}</div>}
                </div>

                <label style={{fontSize:12, display:'flex', alignItems:'center', gap:8, fontWeight:500}}><input type="checkbox" checked={prodForm.is_active} onChange={e=>setProdForm({...prodForm,is_active:e.target.checked})} style={{width:16,height:16}}/> {tipo==='comida'?'Plato disponible':'Producto activo'} (visible en tienda)</label>

                <button type="submit" disabled={uploading} style={{background:'#0A0A0A', color:'#fff', padding:15, borderRadius:999, fontWeight:900, border:'none', fontSize:13, width:'100%', boxShadow:'0 8px 20px rgba(0,0,0,0.12)'}}>{uploading?'⏳ Subiendo...': editingProd?'✅ Actualizar producto':'✅ Añadir producto a mi tienda'}</button>
                {editingProd&&<button type="button" onClick={()=>{const c=CATS_BY_TIPO[tipo]||CATS_BY_TIPO.boutique; setEditingProd(null); setProdForm({name:'',price:'',categoria:c[0],tallas:tipo==='boutique'?'S,M,L':'',is_active:true}); setMainPrev(null); setExtraPrevs([]); setMainFile(null); setExtraFiles([])}} style={{background:'#F1EDE8', padding:12, borderRadius:999, border:'1px solid #EAE6E1', fontWeight:700, width:'100%', fontSize:12}}>Cancelar edición</button>}
              </form>

              <div style={{marginTop:20}}>
                <h3 style={{fontWeight:800, fontSize:13, color:'#0A0A0A'}}>📦 Mis {tipo==='comida'?'platos':'productos'} ({products.length})</h3>
                <div style={{display:'grid', gap:10, marginTop:10}}>
                  {products.map(p=>(
                    <div key={p.id} style={{background:'#FBF9F7', borderRadius:16, padding:10, display:'flex', gap:10, alignItems:'center', border:'1px solid #EAE6E1', width:'100%', overflow:'hidden'}}>
                      <img src={p.image_url} style={{width:56,height:56,borderRadius:12,objectFit:'cover', flexShrink:0, border:'1px solid #EAE6E1'}}/>
                      <div style={{flex:1, minWidth:0}}><b style={{fontSize:12.5, display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'#0A0A0A'}}>{p.name}</b><span style={{fontSize:11, color:'#9A9590'}}>C$ {p.price} • {p.categoria} {p.tallas?.length? `• ${p.tallas.join(' ')}`:''}</span></div>
                      <div style={{display:'flex', flexDirection:'column', gap:6, flexShrink:0}}>
                        <button onClick={()=>editProduct(p)} style={{background:'#0A0A0A',color:'#fff',border:'none',padding:'7px 14px',borderRadius:999,fontSize:11,fontWeight:800}}>Editar</button>
                        <button onClick={()=>deleteProduct(p.id)} style={{background:'#fff',color:'#FF4D4D',border:'1px solid #FFD9D9',padding:'6px 14px',borderRadius:999,fontSize:11}}>Borrar</button>
                      </div>
                    </div>
                  ))}
                  {products.length===0&&<div style={{background:'#FBF9F7', borderRadius:12, padding:14, textAlign:'center', color:'#9A9590', fontSize:12, border:'1px solid #EAE6E1'}}>Aún sin productos en {selected.name}</div>}
                </div>
              </div>
            </div>
          </div>
        )})()}
      </div>
    </main>
  )
}
