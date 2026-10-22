'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key||!url.startsWith('http')) return null
  return createClient(url,key)
}

export default function AdminPage(){
  const { slug } = useParams()
  const [store,setStore]=useState(null)
  const [products,setProducts]=useState([])
  const [loading,setLoading]=useState(true)
  const [showForm,setShowForm]=useState(false)
  const [editing,setEditing]=useState(null)
  const [name,setName]=useState('')
  const [price,setPrice]=useState('')
  const [categoria,setCategoria]=useState('vestidos')
  const [description,setDescription]=useState('')
  const [images,setImages]=useState([''])
  const [videoUrl,setVideoUrl]=useState('')
  const [saving,setSaving]=useState(false)
  const [uploading,setUploading]=useState(false)

  useEffect(()=>{ if(slug) loadData() },[slug])

  const loadData = async()=>{
    const supabase=getSupabase()
    if(!supabase){ setLoading(false); return }
    setLoading(true)
    try{
      const { data: storeData } = await supabase.from('stores').select('*').eq('slug', slug).single()
      setStore(storeData)
      const { data: prodData } = await supabase.from('products').select('*').eq('store_id', storeData.id).order('created_at',{ascending:false})
      setProducts(prodData||[])
    }catch(e){ console.error(e) } finally{ setLoading(false) }
  }

  const uploadFile = async(file, folder='productos')=>{
    const supabase=getSupabase()
    if(!supabase || !store) return null
    setUploading(true)
    try{
      const ext = file.name.split('.').pop()
      const fileName = `${store.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
      const { data, error } = await supabase.storage.from(folder).upload(fileName, file)
      if(error) throw error
      const { data: urlData } = supabase.storage.from(folder).getPublicUrl(fileName)
      return urlData.publicUrl
    }catch(e){ alert('Error subiendo: '+e.message); return null } finally{ setUploading(false) }
  }

  const handleImageUpload = async(e, index)=>{
    const file = e.target.files[0]
    if(!file) return
    const url = await uploadFile(file, 'productos')
    if(url){
      const newImages = [...images]
      newImages[index]=url
      setImages(newImages)
    }
  }

  const handleVideoUpload = async(e)=>{
    const file = e.target.files[0]
    if(!file) return
    if(file.size > 20*1024*1024) return alert('Video máximo 20MB, 15 segundos como Temu')
    const url = await uploadFile(file, 'productos-videos')
    if(url) setVideoUrl(url)
  }

  const resetForm = ()=>{
    setName(''); setPrice(''); setCategoria('vestidos'); setDescription(''); setImages(['']); setVideoUrl(''); setEditing(null); setShowForm(false)
  }

  const openEdit = (p)=>{
    setEditing(p); setName(p.name||''); setPrice(p.price||''); setCategoria(p.categoria||'vestidos'); setDescription(p.description||'');
    if(p.images && p.images.length>0) setImages(p.images)
    else if(p.image_url) setImages([p.image_url])
    else setImages([''])
    setVideoUrl(p.video_url||''); setShowForm(true)
  }

  const handleSave = async()=>{
    if(!name.trim() || !price) return alert('Nombre y precio obligatorios')
    const supabase=getSupabase()
    if(!supabase || !store) return alert('No hay conexión')
    setSaving(true)
    const cleanImages = images.filter(Boolean)
    const mainImage = cleanImages[0] || ''
    const payload = {
      store_id: store.id,
      name: name.trim(),
      price: Number(price),
      categoria,
      description: description.trim(),
      image_url: mainImage,
      images: cleanImages,
      video_url: videoUrl || null
    }
    try{
      let res
      if(editing) res = await supabase.from('products').update(payload).eq('id', editing.id)
      else res = await supabase.from('products').insert(payload)
      if(res.error) throw res.error
      await loadData(); resetForm(); alert(editing ? 'Actualizado con video!' : 'Producto con carrusel + video creado!')
    }catch(e){ alert('Error: '+e.message) } finally{ setSaving(false) }
  }

  const handleDelete = async(id)=>{
    if(!confirm('¿Borrar?')) return
    const supabase=getSupabase()
    await supabase.from('products').delete().eq('id', id)
    loadData()
  }

  if(loading) return <div style={{padding:40, textAlign:'center'}}>Cargando {slug}...</div>
  if(!store) return <div style={{padding:40, textAlign:'center'}}>Tienda no encontrada: {slug}</div>

  return (
    <main style={{background:'#F7F5F3', minHeight:'100vh', fontFamily:'Inter, system-ui', padding:14}}>
      <div style={{maxWidth:1100, margin:'0 auto'}}>
        <div style={{background:'#fff', border:'1px solid #EAE6E1', borderRadius:16, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
          <div style={{display:'flex', gap:12, alignItems:'center'}}>
            <img src={store.logo_url||'/tienda-nica-logo.png'} style={{width:48,height:48, borderRadius:12, objectFit:'cover'}}/>
            <div><b>{store.name}</b><div style={{fontSize:11, color:'#9A9590'}}>{slug} • {products.length} productos</div></div>
          </div>
          <button onClick={()=>{resetForm(); setShowForm(true)}} style={{background:'#0A0A0A', color:'#fff', border:'none', padding:'10px 16px', borderRadius:999, fontSize:12, fontWeight:900, cursor:'pointer'}}>+ Nuevo con video</button>
        </div>

        {showForm && (
          <div style={{background:'#fff', border:'1px solid #EAE6E1', borderRadius:16, padding:18, marginBottom:16, border:'2px solid #0A0A0A'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:14}}>
              <h3 style={{fontWeight:900, fontSize:14}}>{editing ? 'Editar producto Temu-style' : 'Nuevo producto con carrusel + video'}</h3>
              <button onClick={resetForm} style={{width:28,height:28, borderRadius:999, border:'1px solid #EAE6E1', background:'#fff'}}>✕</button>
            </div>
            <label style={{fontSize:11, fontWeight:700}}>Nombre *</label>
            <input value={name} onChange={e=>setName(e.target.value)} style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4, marginBottom:12}}/>
            <label style={{fontSize:11, fontWeight:700}}>Descripción corta estilo Temu</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value.slice(0,200))} style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4, marginBottom:12, minHeight:70}}/>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12}}>
              <div><label style={{fontSize:11, fontWeight:700}}>Precio C$ *</label><input type="number" value={price} onChange={e=>setPrice(e.target.value)} style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4}}/></div>
              <div><label style={{fontSize:11, fontWeight:700}}>Categoría</label><select value={categoria} onChange={e=>setCategoria(e.target.value)} style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4}}><option>vestidos</option><option>blusas</option><option>jeans</option><option>faldas</option><option>accesorios</option><option>zapatos</option><option>hogar</option><option>otros</option></select></div>
            </div>
            <label style={{fontSize:12, fontWeight:900, marginTop:8, display:'block'}}>📸 Carrusel (hasta 5 fotos)</label>
            <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8, marginTop:8, marginBottom:16}}>
              {[0,1,2,3,4].map(i=>(
                <div key={i} style={{aspectRatio:'1/1', border:'1px dashed #EAE6E1', borderRadius:12, overflow:'hidden', position:'relative', background:'#FBF9F7'}}>
                  {images[i] ? <img src={images[i]} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', fontSize:10, color:'#9A9590'}}>Foto {i+1}</div>}
                  <input type="file" accept="image/*" onChange={e=>handleImageUpload(e,i)} style={{position:'absolute', inset:0, opacity:0, cursor:'pointer'}}/>
                </div>
              ))}
            </div>
            <label style={{fontSize:12, fontWeight:900, display:'block'}}>🎬 Video corto (15 seg, opcional)</label>
            <div style={{border:'1px dashed #00C853', borderRadius:12, padding:12, marginTop:8, background:'#F0FFF4'}}>
              {videoUrl ? <video src={videoUrl} controls style={{width:'100%', borderRadius:8, maxHeight:200}}/> : <div style={{fontSize:11, color:'#555'}}>Sube un video corto mostrando el producto puesto.</div>}
              <input type="file" accept="video/*" onChange={handleVideoUpload} style={{marginTop:8, fontSize:12}}/>
            </div>
            <button onClick={handleSave} disabled={saving||uploading} style={{width:'100%', marginTop:16, background:'#0A0A0A', color:'#fff', border:'none', padding:'13px', borderRadius:999, fontWeight:900, cursor:'pointer'}}>
              {saving ? 'Guardando...' : uploading ? 'Subiendo...' : editing ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        )}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12}}>
          {products.map(p=>(
            <div key={p.id} style={{background:'#fff', border:'1px solid #EAE6E1', borderRadius:16, padding:10}}>
              <div style={{position:'relative'}}><img src={p.images?.[0]||p.image_url} style={{width:'100%', aspectRatio:'1/1', objectFit:'cover', borderRadius:12}}/>
                {p.video_url && <span style={{position:'absolute', top:6, left:6, background:'#000', color:'#fff', fontSize:9, padding:'3px 6px', borderRadius:999}}>▶ VIDEO</span>}
              </div>
              <b style={{fontSize:12, marginTop:6, display:'block'}}>{p.name}</b>
              <b style={{fontSize:12}}>C$ {p.price}</b>
              <div style={{display:'flex', gap:6, marginTop:8}}><button onClick={()=>openEdit(p)} style={{flex:1, background:'#fff', border:'1px solid #EAE6E1', padding:'6px', borderRadius:999, fontSize:10}}>Editar</button><button onClick={()=>handleDelete(p.id)} style={{flex:1, background:'#fff', border:'1px solid #FFE0E0', color:'#ff5555', padding:'6px', borderRadius:999, fontSize:10}}>Borrar</button></div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
