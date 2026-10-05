'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){ const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim(); const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim(); if(!url||!key||!url.startsWith('http')) return null; return createClient(url,key) }

export default function OwnerAdmin(){
  const { slug } = useParams()
  const [store,setStore]=useState(null)
  const [prods,setProds]=useState([])
  const [loading,setLoading]=useState(true)
  const [storeForm,setStoreForm]=useState({name:'',whatsapp:'',description:''})
  const [logoFile,setLogoFile]=useState(null)
  const [coverFile,setCoverFile]=useState(null)
  const [pForm,setPForm]=useState({name:'',price:'',categoria:'',tallas:'S,M,L',sku:'',stock:'999', is_active:true})
  const [mainFile,setMainFile]=useState(null)
  const [extraFiles,setExtraFiles]=useState([])
  const [editing,setEditing]=useState(null)
  const [uploading,setUploading]=useState(false)

  const uploadFile=async(file, bucket)=>{
    const supabase=getSupabase()
    const ext=file.name.split('.').pop()
    const path=`${slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const {data,error}=await supabase.storage.from(bucket).upload(path, file, {upsert:true})
    if(error) throw error
    const {data:urlData}=supabase.storage.from(bucket).getPublicUrl(data.path)
    return urlData.publicUrl
  }

  const load=async()=>{
    const supabase=getSupabase()
    const {data:s}=await supabase.from('stores').select('*').eq('slug',slug).single()
    if(s){
      setStore(s)
      setStoreForm({name:s.name, whatsapp:s.whatsapp, description:s.description||''})
      const {data:p}=await supabase.from('products').select('*').eq('store_id',s.id).order('created_at',{ascending:false})
      setProds(p||[])
    }
    setLoading(false)
  }
  useEffect(()=>{ load() },[slug])

  const saveStore=async()=>{
    setUploading(true)
    try{
      const supabase=getSupabase()
      let logoUrl=store.logo_url, coverUrl=store.cover_image
      if(logoFile) logoUrl=await uploadFile(logoFile,'store-assets')
      if(coverFile) coverUrl=await uploadFile(coverFile,'store-assets')
      const {error}=await supabase.from('stores').update({name:storeForm.name, whatsapp:storeForm.whatsapp.replace(/[^0-9]/g,''), description:storeForm.description, logo_url:logoUrl, cover_image:coverUrl}).eq('id',store.id)
      if(error) throw error
      alert('Tienda actualizada'); load()
    }catch(e){ alert(e.message) }
    setUploading(false)
  }

  const saveProduct=async(e)=>{
    e.preventDefault()
    setUploading(true)
    try{
      const supabase=getSupabase()
      let mainUrl=null, extraUrls=[]
      if(mainFile) mainUrl=await uploadFile(mainFile,'product-images')
      if(extraFiles.length>0){
        for(let f of extraFiles.slice(0,3)){
          const u=await uploadFile(f,'product-images')
          extraUrls.push(u)
        }
      }
      const payload={
        store_id: store.id,
        name: pForm.name,
        price: Number(pForm.price),
        image_url: mainUrl || (editing? prods.find(x=>x.id===editing)?.image_url : null),
        extra_images: extraUrls.length>0? extraUrls : (editing? prods.find(x=>x.id===editing)?.extra_images : []),
        tallas: store.tipo_tienda==='boutique'? pForm.tallas.split(',').map(t=>t.trim()).filter(Boolean) : [],
        categoria: pForm.categoria.toLowerCase()||null,
        sku: pForm.sku||null,
        stock: Number(pForm.stock)||999,
        is_active: pForm.is_active
      }
      if(!payload.image_url){ alert('Sube foto principal'); setUploading(false); return }
      let err
      if(editing){ const {error}=await supabase.from('products').update(payload).eq('id',editing); err=error }
      else { const {error}=await supabase.from('products').insert(payload); err=error }
      if(err) throw err
      setPForm({name:'',price:'',categoria:'',tallas:'S,M,L',sku:'',stock:'999',is_active:true}); setMainFile(null); setExtraFiles([]); setEditing(null); load()
    }catch(err){ alert(err.message) }
    setUploading(false)
  }

  const editProd=(p)=>{
    setEditing(p.id)
    setPForm({name:p.name, price:p.price, categoria:p.categoria||'', tallas:(p.tallas||[]).join(','), sku:p.sku||'', stock:p.stock||999, is_active:p.is_active})
    window.scrollTo({top:0, behavior:'smooth'})
  }

  const delProd=async(id)=>{ if(!confirm('Borrar?')) return; const s=getSupabase(); await s.from('products').delete().eq('id',id); load() }

  if(loading) return <div style={{padding:40}}>Cargando {slug}...</div>
  if(!store) return <div style={{padding:40}}>Tienda {slug} no encontrada</div>

  return (
    <main style={{padding:16, maxWidth:900, margin:'0 auto', paddingBottom:80}}>
      <h1 style={{fontWeight:900, fontSize:20}}>Admin - {store.name} ({store.tipo_tienda})</h1>
      <p style={{fontSize:11, opacity:0.6}}>Link público: tiendanica.store/{slug} • Admin dueño: este link</p>

      <div style={{marginTop:16, background:'#f9f9f9', padding:14, borderRadius:16}}>
        <h3 style={{fontWeight:800, fontSize:14}}>Config tienda - Portada y logo (subida local)</h3>
        <div style={{display:'grid', gap:8, marginTop:10}}>
          <input value={storeForm.name} onChange={e=>setStoreForm({...storeForm,name:e.target.value})} placeholder="Nombre" style={{padding:10, borderRadius:10, border:'1px solid #ddd'}}/>
          <input value={storeForm.whatsapp} onChange={e=>setStoreForm({...storeForm,whatsapp:e.target.value})} placeholder="WhatsApp" style={{padding:10, borderRadius:10, border:'1px solid #ddd'}}/>
          <input value={storeForm.description} onChange={e=>setStoreForm({...storeForm,description:e.target.value})} placeholder="Descripcion" style={{padding:10, borderRadius:10, border:'1px solid #ddd'}}/>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <div><label style={{fontSize:11, fontWeight:700}}>Logo del dueño (local)</label><input type="file" accept="image/*" onChange={e=>setLogoFile(e.target.files[0])} style={{fontSize:12, marginTop:4}}/> {store.logo_url&&<img src={store.logo_url} style={{width:40,height:40,borderRadius:8,objectFit:'cover',marginTop:4}}/>}</div>
            <div><label style={{fontSize:11, fontWeight:700}}>Portada editable (local)</label><input type="file" accept="image/*" onChange={e=>setCoverFile(e.target.files[0])} style={{fontSize:12, marginTop:4}}/> {store.cover_image&&<img src={store.cover_image} style={{width:80,height:40,borderRadius:8,objectFit:'cover',marginTop:4}}/>}</div>
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
            <input value={pForm.categoria} onChange={e=>setPForm({...pForm,categoria:e.target.value})} placeholder={store.tipo_tienda==='comida'?'Categoria: platos, bebidas, extras': store.tipo_tienda==='general'?'Categoria: herramientas, hogar...':'Categoria: vestidos, blusas...'} style={{padding:10, borderRadius:10, border:'1px solid #ddd'}}/>
          </div>
          {store.tipo_tienda==='boutique'&&<input value={pForm.tallas} onChange={e=>setPForm({...pForm,tallas:e.target.value})} placeholder="Tallas: S,M,L,XL" style={{padding:10, borderRadius:10, border:'1px solid #ddd'}}/>}
          {store.tipo_tienda==='general'&&<div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}><input value={pForm.sku} onChange={e=>setPForm({...pForm,sku:e.target.value})} placeholder="SKU (opcional)" style={{padding:10, borderRadius:10, border:'1px solid #ddd'}}/><input value={pForm.stock} onChange={e=>setPForm({...pForm,stock:e.target.value})} placeholder="Stock" style={{padding:10, borderRadius:10, border:'1px solid #ddd'}}/></div>}
          <div style={{background:'#F6F3F0', padding:10, borderRadius:10}}>
            <label style={{fontSize:11, fontWeight:800}}>Foto principal (obligatoria - local)</label><input required={!editing} type="file" accept="image/*" onChange={e=>setMainFile(e.target.files[0])} style={{width:'100%', marginTop:4, fontSize:12}}/>
            <label style={{fontSize:11, fontWeight:800, marginTop:8, display:'block'}}>Fotos extra 2-3 (opcional - local)</label><input type="file" multiple accept="image/*" onChange={e=>setExtraFiles(Array.from(e.target.files))} style={{width:'100%', marginTop:4, fontSize:12}}/>
          </div>
          <label style={{fontSize:12}}><input type="checkbox" checked={pForm.is_active} onChange={e=>setPForm({...pForm,is_active:e.target.checked})}/> Activo</label>
          <div style={{display:'flex', gap:8}}>
            <button type="submit" disabled={uploading} style={{flex:1, background:'#00E676', color:'#000', padding:12, borderRadius:999, fontWeight:900, border:'none'}}>{uploading?'Subiendo fotos...': editing?'Actualizar':'Añadir producto'}</button>
            {editing&&<button type="button" onClick={()=>{setEditing(null); setPForm({name:'',price:'',categoria:'',tallas:'S,M,L',sku:'',stock:'999',is_active:true}); setMainFile(null); setExtraFiles([])}} style={{background:'#eee', padding:12, borderRadius:999, border:'none'}}>Cancelar</button>}
          </div>
        </form>
      </div>

      <div style={{marginTop:16}}>
        <h3 style={{fontWeight:800}}>{prods.length} productos</h3>
        <div style={{display:'grid', gap:8, marginTop:10}}>
          {prods.map(p=><div key={p.id} style={{border:'1px solid #eee', padding:10, borderRadius:12, display:'flex', gap:10, alignItems:'center', background:'#fff'}}><img src={p.image_url} style={{width:56,height:56,borderRadius:8,objectFit:'cover'}}/><div style={{flex:1}}><b style={{fontSize:13}}>{p.name}</b> - C$ {p.price} {p.categoria&&<span style={{fontSize:10, background:'#eee', padding:'2px 6px', borderRadius:99}}>{p.categoria}</span>}<br/><span style={{fontSize:11, opacity:0.6}}>{store.tipo_tienda==='boutique'? (p.tallas||[]).join(', '): `Stock:${p.stock}`}</span></div><button onClick={()=>editProd(p)} style={{background:'#000',color:'#fff',border:'none',padding:'6px 10px',borderRadius:999,fontSize:12}}>Editar</button><button onClick={()=>delProd(p.id)} style={{background:'#ff4444',color:'#fff',border:'none',padding:'6px 10px',borderRadius:999,fontSize:12}}>X</button></div>)}
        </div>
      </div>
    </main>
  )
}
