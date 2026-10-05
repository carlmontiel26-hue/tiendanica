'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){ const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim(); const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim(); if(!url||!key||!url.startsWith('http')) return null; return createClient(url,key) }

export default function OwnerAdminLocked(){
  const { slug } = useParams()
  const [store,setStore]=useState(null)
  const [prods,setProds]=useState([])
  const [auth,setAuth]=useState(false)
  const [inputPin,setInputPin]=useState('')
  const [loading,setLoading]=useState(true)
  const [storeForm,setStoreForm]=useState({name:'',whatsapp:'',description:''})
  const [logoFile,setLogoFile]=useState(null)
  const [coverFile,setCoverFile]=useState(null)
  const [pForm,setPForm]=useState({name:'',price:'',categoria:'',tallas:'S,M,L',sku:'',stock:'999',is_active:true})
  const [mainFile,setMainFile]=useState(null)
  const [extraFiles,setExtraFiles]=useState([])
  const [editing,setEditing]=useState(null)
  const [uploading,setUploading]=useState(false)

  useEffect(()=>{ init() },[slug])

  const init=async()=>{
    const supabase=getSupabase()
    const {data:s}=await supabase.from('stores').select('*').eq('slug',slug).single()
    if(s){
      setStore(s)
      setStoreForm({name:s.name,whatsapp:s.whatsapp,description:s.description||''})
      const saved=localStorage.getItem(`tn_owner_${slug}`)
      if(saved===s.whatsapp){ setAuth(true); loadProds(s.id) }
    }
    setLoading(false)
  }

  const loadProds=async(storeId)=>{
    const supabase=getSupabase()
    const {data:p}=await supabase.from('products').select('*').eq('store_id',storeId).order('created_at',{ascending:false})
    setProds(p||[])
  }

  const tryAuth=()=>{
    if(inputPin.replace(/[^0-9]/g,'')===store.whatsapp.replace(/[^0-9]/g,'')){
      localStorage.setItem(`tn_owner_${slug}`, store.whatsapp)
      setAuth(true)
      loadProds(store.id)
    } else alert('Clave incorrecta - usa tu numero de WhatsApp sin espacios')
  }

  const uploadFile=async(file)=>{
    const supabase=getSupabase()
    const ext=file.name.split('.').pop()
    const path=`${slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const {data,error}=await supabase.storage.from('store-assets').upload(path,file).catch(async()=>{
      const {data,error}=await supabase.storage.from('product-images').upload(path,file)
      if(error) throw error
      return {data}
    })
    // try both buckets
    let urlData
    try{
      const supabase=getSupabase()
      const {data} = await supabase.storage.from('store-assets').getPublicUrl(path)
      if(data.publicUrl) { 
        // check if exists, if not try product-images
        urlData=data
      }
    }catch{}
    // simplified: upload to product-images for all
    const supabase2=getSupabase()
    const {data:d2}=await supabase2.storage.from('store-assets').getPublicUrl(path)
    // fallback
    const {data:d3}=await supabase2.storage.from('product-images').getPublicUrl(path)
    return d2.publicUrl || d3.publicUrl
  }

  const uploadProductFile=async(file)=>{
    const supabase=getSupabase()
    const ext=file.name.split('.').pop()
    const path=`${slug}/prod/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const {data,error}=await supabase.storage.from('product-images').upload(path,file)
    if(error) throw error
    const {data:urlData}=supabase.storage.from('product-images').getPublicUrl(data.path)
    return urlData.publicUrl
  }

  const saveStore=async()=>{
    setUploading(true)
    try{
      const supabase=getSupabase()
      let logoUrl=store.logo_url, coverUrl=store.cover_image
      if(logoFile){ const ext=logoFile.name.split('.').pop(); const path=`${slug}/logo/${Date.now()}.${ext}`; const {data}=await supabase.storage.from('store-assets').upload(path,logoFile,{upsert:true}); const {data:url}=supabase.storage.from('store-assets').getPublicUrl(data.path); logoUrl=url.publicUrl }
      if(coverFile){ const ext=coverFile.name.split('.').pop(); const path=`${slug}/cover/${Date.now()}.${ext}`; const {data}=await supabase.storage.from('store-assets').upload(path,coverFile,{upsert:true}); const {data:url}=supabase.storage.from('store-assets').getPublicUrl(data.path); coverUrl=url.publicUrl }
      const {error}=await supabase.from('stores').update({name:storeForm.name, whatsapp:storeForm.whatsapp.replace(/[^0-9]/g,''), description:storeForm.description, logo_url:logoUrl, cover_image:coverUrl}).eq('id',store.id)
      if(error) throw error
      alert('Tienda actualizada'); init()
    }catch(e){ alert(e.message) }
    setUploading(false)
  }

  const saveProduct=async(e)=>{
    e.preventDefault()
    setUploading(true)
    try{
      const supabase=getSupabase()
      let mainUrl=null, extraUrls=[]
      if(mainFile) mainUrl=await uploadProductFile(mainFile)
      if(extraFiles.length>0){ for(let f of extraFiles.slice(0,3)){ const u=await uploadProductFile(f); extraUrls.push(u) } }
      const payload={
        store_id:store.id,
        name:pForm.name,
        price:Number(pForm.price),
        image_url: mainUrl || (editing? prods.find(x=>x.id===editing)?.image_url : null),
        extra_images: extraUrls.length>0? extraUrls : (editing? prods.find(x=>x.id===editing)?.extra_images : []),
        tallas: store.tipo_tienda==='boutique'? pForm.tallas.split(',').map(t=>t.trim()).filter(Boolean):[],
        categoria:pForm.categoria.toLowerCase()||null,
        sku:pForm.sku||null,
        stock:Number(pForm.stock)||999,
        is_active:pForm.is_active
      }
      if(!payload.image_url){ alert('Sube foto principal'); setUploading(false); return }
      if(editing){ const {error}=await supabase.from('products').update(payload).eq('id',editing); if(error) throw error }
      else { const {error}=await supabase.from('products').insert(payload); if(error) throw error }
      setPForm({name:'',price:'',categoria:'',tallas:'S,M,L',sku:'',stock:'999',is_active:true}); setMainFile(null); setExtraFiles([]); setEditing(null); loadProds(store.id)
    }catch(err){ alert(err.message) }
    setUploading(false)
  }

  const editProd=(p)=>{ setEditing(p.id); setPForm({name:p.name,price:p.price,categoria:p.categoria||'',tallas:(p.tallas||[]).join(','),sku:p.sku||'',stock:p.stock||999,is_active:p.is_active}); window.scrollTo({top:0,behavior:'smooth'}) }
  const delProd=async(id)=>{ if(!confirm('Borrar?')) return; const s=getSupabase(); await s.from('products').delete().eq('id',id); loadProds(store.id) }

  if(loading) return <div style={{padding:40}}>Cargando...</div>
  if(!store) return <div style={{padding:40}}>Tienda {slug} no encontrada</div>

  if(!auth){
    return (
      <main style={{minHeight:'100vh', background:'#F6F3F0', display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
        <div style={{background:'#fff', borderRadius:20, padding:20, width:'100%', maxWidth:360, boxShadow:'0 10px 30px rgba(0,0,0,0.1)'}}>
          <div style={{display:'flex', gap:10, alignItems:'center'}}>{store.logo_url&&<img src={store.logo_url} style={{width:40,height:40,borderRadius:10,objectFit:'cover'}}/>}<div><b>{store.name}</b><br/><span style={{fontSize:11, opacity:0.6}}>Admin privado del dueño</span></div></div>
          <p style={{fontSize:12, opacity:0.7, marginTop:12}}>Ingresa tu clave para gestionar tu tienda. Tu clave es tu <b>numero de WhatsApp</b> con codigo pais.</p>
          <p style={{fontSize:11, background:'#F6F3F0', padding:8, borderRadius:10, marginTop:8}}>Ej: {store.whatsapp}</p>
          <input type="password" value={inputPin} onChange={e=>setInputPin(e.target.value)} placeholder="Tu WhatsApp como clave" style={{marginTop:12, width:'100%', border:'1px solid #ddd', padding:12, borderRadius:12}}/>
          <button onClick={tryAuth} style={{marginTop:10, width:'100%', background:'#000', color:'#fff', padding:12, borderRadius:999, fontWeight:800, border:'none'}}>Entrar a mi admin</button>
          <a href={`/${slug}`} style={{display:'block', marginTop:10, textAlign:'center', fontSize:11, color:'#666'}}>Volver a mi tienda</a>
        </div>
      </main>
    )
  }

  return (
    <main style={{padding:16, maxWidth:900, margin:'0 auto', paddingBottom:80}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1 style={{fontWeight:900, fontSize:18}}>Admin - {store.name} ({store.tipo_tienda})</h1>
        <div style={{display:'flex', gap:8}}><a href={`/${slug}`} target="_blank" style={{background:'#00E676', color:'#000', padding:'8px 12px', borderRadius:999, textDecoration:'none', fontSize:12, fontWeight:700}}>Ver tienda</a><button onClick={()=>{localStorage.removeItem(`tn_owner_${slug}`); setAuth(false)}} style={{background:'#eee', border:'none', padding:'8px 12px', borderRadius:999, fontSize:12}}>Salir</button></div>
      </div>

      <div style={{marginTop:16, background:'#f9f9f9', padding:14, borderRadius:16}}>
        <h3 style={{fontWeight:800, fontSize:14}}>Config tienda - Portada y logo (local)</h3>
        <div style={{display:'grid', gap:8, marginTop:10}}>
          <input value={storeForm.name} onChange={e=>setStoreForm({...storeForm,name:e.target.value})} placeholder="Nombre" style={{padding:10, borderRadius:10, border:'1px solid #ddd'}}/>
          <input value={storeForm.whatsapp} onChange={e=>setStoreForm({...storeForm,whatsapp:e.target.value})} placeholder="WhatsApp" style={{padding:10, borderRadius:10, border:'1px solid #ddd'}}/>
          <input value={storeForm.description} onChange={e=>setStoreForm({...storeForm,description:e.target.value})} placeholder="Descripcion" style={{padding:10, borderRadius:10, border:'1px solid #ddd'}}/>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <div><label style={{fontSize:11, fontWeight:700}}>Logo (local)</label><input type="file" accept="image/*" onChange={e=>setLogoFile(e.target.files[0])} style={{fontSize:12, marginTop:4, width:'100%'}}/>{store.logo_url&&<img src={store.logo_url} style={{width:40,height:40,borderRadius:8,objectFit:'cover',marginTop:4}}/>}</div>
            <div><label style={{fontSize:11, fontWeight:700}}>Portada (local)</label><input type="file" accept="image/*" onChange={e=>setCoverFile(e.target.files[0])} style={{fontSize:12, marginTop:4, width:'100%'}}/>{store.cover_image&&<img src={store.cover_image} style={{width:80,height:40,borderRadius:8,objectFit:'cover',marginTop:4}}/>}</div>
          </div>
          <button onClick={saveStore} disabled={uploading} style={{background:'#000', color:'#fff', padding:10, borderRadius:999, fontWeight:700, border:'none'}}>{uploading?'Subiendo...':'Guardar tienda'}</button>
        </div>
      </div>

      <div style={{marginTop:16, background:'#fff', border:'2px solid #000', padding:14, borderRadius:16}}>
        <h3 style={{fontWeight:800}}>{editing?'Editar producto':'Añadir producto (fotos locales)'}</h3>
        <form onSubmit={saveProduct} style={{display:'grid', gap:8, marginTop:10}}>
          <input required value={pForm.name} onChange={e=>setPForm({...pForm,name:e.target.value})} placeholder="Nombre producto" style={{padding:10, borderRadius:10, border:'1px solid #ddd'}}/>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <input required type="number" value={pForm.price} onChange={e=>setPForm({...pForm,price:e.target.value})} placeholder="Precio C$" style={{padding:10, borderRadius:10, border:'1px solid #ddd'}}/>
            <input value={pForm.categoria} onChange={e=>setPForm({...pForm,categoria:e.target.value})} placeholder={store.tipo_tienda==='comida'?'Categoria: platos/bebidas': store.tipo_tienda==='general'?'Categoria: herramientas...':'Categoria: vestidos...'} style={{padding:10, borderRadius:10, border:'1px solid #ddd'}}/>
          </div>
          {store.tipo_tienda==='boutique'&&<input value={pForm.tallas} onChange={e=>setPForm({...pForm,tallas:e.target.value})} placeholder="Tallas: S,M,L,XL" style={{padding:10, borderRadius:10, border:'1px solid #ddd'}}/>}
          {store.tipo_tienda==='general'&&<div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}><input value={pForm.sku} onChange={e=>setPForm({...pForm,sku:e.target.value})} placeholder="SKU" style={{padding:10, borderRadius:10, border:'1px solid #ddd'}}/><input value={pForm.stock} onChange={e=>setPForm({...pForm,stock:e.target.value})} placeholder="Stock" style={{padding:10, borderRadius:10, border:'1px solid #ddd'}}/></div>}
          <div style={{background:'#F6F3F0', padding:10, borderRadius:10}}>
            <label style={{fontSize:11, fontWeight:800}}>Foto principal (local obligatoria)</label><input required={!editing} type="file" accept="image/*" onChange={e=>setMainFile(e.target.files[0])} style={{width:'100%', marginTop:4, fontSize:12}}/>
            <label style={{fontSize:11, fontWeight:800, marginTop:8, display:'block'}}>Fotos extra 2-3 (local opcional)</label><input type="file" multiple accept="image/*" onChange={e=>setExtraFiles(Array.from(e.target.files))} style={{width:'100%', marginTop:4, fontSize:12}}/>
          </div>
          <label style={{fontSize:12}}><input type="checkbox" checked={pForm.is_active} onChange={e=>setPForm({...pForm,is_active:e.target.checked})}/> Activo</label>
          <div style={{display:'flex', gap:8}}>
            <button type="submit" disabled={uploading} style={{flex:1, background:'#00E676', color:'#000', padding:12, borderRadius:999, fontWeight:900, border:'none'}}>{uploading?'Subiendo...': editing?'Actualizar':'Añadir producto'}</button>
            {editing&&<button type="button" onClick={()=>{setEditing(null); setPForm({name:'',price:'',categoria:'',tallas:'S,M,L',sku:'',stock:'999',is_active:true}); setMainFile(null); setExtraFiles([])}} style={{background:'#eee', padding:12, borderRadius:999, border:'none'}}>Cancelar</button>}
          </div>
        </form>
      </div>

      <div style={{marginTop:16}}>
        <h3 style={{fontWeight:800}}>{prods.length} productos</h3>
        <div style={{display:'grid', gap:8, marginTop:10}}>
          {prods.map(p=><div key={p.id} style={{border:'1px solid #eee', padding:10, borderRadius:12, display:'flex', gap:10, alignItems:'center', background:'#fff'}}><img src={p.image_url} style={{width:56,height:56,borderRadius:8,objectFit:'cover'}}/><div style={{flex:1}}><b style={{fontSize:13}}>{p.name}</b> - C$ {p.price}<br/><span style={{fontSize:11, opacity:0.6}}>{p.categoria||''}</span></div><button onClick={()=>editProd(p)} style={{background:'#000',color:'#fff',border:'none',padding:'6px 10px',borderRadius:999,fontSize:12}}>Editar</button><button onClick={()=>delProd(p.id)} style={{background:'#ff4444',color:'#fff',border:'none',padding:'6px 10px',borderRadius:999,fontSize:12}}>X</button></div>)}
        </div>
      </div>
    </main>
  )
}
