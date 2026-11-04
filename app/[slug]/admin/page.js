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

// ===== CATEGORIAS POR TIPO DE TIENDA - NO TOCADO, SOLO AGREGADO VEHICULOS =====
function getCategoriasPorTipo(store){
  const tipo = (store?.tipo_tienda || store?.store_type || '').toLowerCase()
  
  if(tipo.includes('vehiculos') || tipo.includes('vehículo') || tipo.includes('moto') || tipo.includes('auto') || tipo.includes('carro')){
    return ['motos','autos','camionetas','moto usada','auto usado','repuestos','accesorios moto','cascos','llantas','aceites','otros','oferta','nuevo']
  }
  if(tipo.includes('comida') || tipo.includes('restaurante') || tipo.includes('food')){
    return ['comidas','desayunos','almuerzos','cenas','bebidas','postres','snacks','combos','entradas','sopas','asados','mariscos','vegetariano','otros','eskimos','comida rapida']
  }
  if(tipo.includes('boutique') || tipo.includes('ropa') || tipo.includes('moda')){
    return [
      'vestidos','blusas','jeans','faldas','conjuntos','shorts',
      'hombres','niños','niñas','bebes','pantalon',
      'accesorios','zapatos','carteras','belleza','hogar','oferta','nuevo','otros'
    ]
  }
  // GENERAL / ABARROTES / TIENDA GENERAL - como estaba antes genial
  return ['abarrotes','bebidas','limpieza','hogar','tecnologia','belleza','ropa','zapatos','accesorios','juguetes','ferreteria','medicina natural','otros','oferta','nuevo','servicios','chaquetas','ropa usada como nueva']
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
  const [categoria,setCategoria]=useState('')
  const [description,setDescription]=useState('')
  const [images,setImages]=useState([''])
  const [videoUrl,setVideoUrl]=useState('')
  const [saving,setSaving]=useState(false)
  const [uploading,setUploading]=useState(false)
  const [showCoverEdit,setShowCoverEdit]=useState(false)
  const [coverPreview,setCoverPreview]=useState('')
  const [coverUploading,setCoverUploading]=useState(false)
  const [coverSaving,setCoverSaving]=useState(false)

  // ===== SOLO PARA VEHICULOS - NUEVO ESTADO =====
  const [vehiculo,setVehiculo]=useState({
    marca:'', modelo:'', anio:'', km:'', combustible:'gasolina', transmision:'mecanica', condicion:'usado', papeles:'en regla', ubicacion:''
  })

  const categoriasDisponibles = store ? getCategoriasPorTipo(store) : ['otros']
  const isVehiculos = (store?.tipo_tienda||'').toLowerCase().includes('vehiculos') || (store?.tipo_tienda||'').toLowerCase().includes('moto') || (store?.tipo_tienda||'').toLowerCase().includes('auto')

  useEffect(()=>{ if(slug) loadData() },[slug])

  useEffect(()=>{
    if(store && categoriasDisponibles.length>0){
      if(!categoria || !categoriasDisponibles.includes(categoria)){
        setCategoria(categoriasDisponibles[0])
      }
    }
    if(store){
      const currentCover = store.cover_url || store.portada_url || store.cover_image || store.portada || store.image_url || ''
      if(currentCover) setCoverPreview(currentCover)
    }
  },[store])

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

  const uploadCover = async(file)=>{
    const supabase=getSupabase()
    if(!supabase || !store) return null
    setCoverUploading(true)
    try{
      const ext = file.name.split('.').pop()
      const fileName = `${store.id}/cover-${Date.now()}.${ext}`
      let bucket = 'covers'
      let upload = await supabase.storage.from(bucket).upload(fileName, file)
      if(upload.error){
        bucket = 'productos'
        upload = await supabase.storage.from(bucket).upload(fileName, file)
        if(upload.error) throw upload.error
      }
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
      return urlData.publicUrl
    }catch(e){ alert('Error subiendo portada: '+e.message); return null } finally{ setCoverUploading(false) }
  }

  const handleCoverUpload = async(e)=>{
    const file = e.target.files[0]
    if(!file) return
    if(file.size > 8*1024*1024) return alert('Portada max 8MB')
    const url = await uploadCover(file)
    if(url) setCoverPreview(url)
  }

  const handleSaveCover = async()=>{
    if(!coverPreview) return alert('Sube una portada primero')
    const supabase=getSupabase()
    if(!supabase || !store) return
    setCoverSaving(true)
    try{
      const { error } = await supabase.from('stores').update({ 
        cover_url: coverPreview,
        portada_url: coverPreview,
        cover_image: coverPreview
      }).eq('id', store.id)
      if(error){
        const { error: err2 } = await supabase.from('stores').update({ cover_url: coverPreview }).eq('id', store.id)
        if(err2) throw err2
      }
      setStore(prev=> ({...prev, cover_url: coverPreview, portada_url: coverPreview, cover_image: coverPreview}))
      setShowCoverEdit(false)
      alert('Portada actualizada!')
    }catch(e){ alert('Error: '+e.message) } finally{ setCoverSaving(false) }
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
    if(file.size > 20*1024*1024) return alert('Video máximo 20MB')
    const url = await uploadFile(file, 'productos-videos')
    if(url) setVideoUrl(url)
  }

  const resetForm = ()=>{
    setName(''); setPrice(''); setDescription(''); setImages(['']); setVideoUrl(''); setEditing(null); setShowForm(false)
    setVehiculo({marca:'', modelo:'', anio:'', km:'', combustible:'gasolina', transmision:'mecanica', condicion:'usado', papeles:'en regla', ubicacion:''})
    if(store) setCategoria(getCategoriasPorTipo(store)[0])
  }

  const parseVehiculoFromDescription = (desc)=>{
    // intenta extraer si viene formato viejo
    try{
      if(!desc) return {}
      if(desc.includes('MARCA:')){
        const obj={}
        desc.split('|').forEach(p=>{
          const [k,v]=p.split(':')
          if(k&&v) obj[k.trim().toLowerCase()] = v.trim()
        })
        return obj
      }
    }catch{}
    return {}
  }

  const openEdit = (p)=>{
    setEditing(p); 
    setName(p.name||''); 
    setPrice(p.price||''); 
    setCategoria(p.categoria||categoriasDisponibles[0]); 
    setDescription(p.description||'');
    // si es vehiculo, intentar parsear campos extra del producto
    if(p.marca || p.modelo || p.anio){
      setVehiculo({
        marca: p.marca||'', modelo: p.modelo||'', anio: p.anio||'', km: p.kilometraje||p.km||'',
        combustible: p.combustible||'gasolina', transmision: p.transmision||'mecanica',
        condicion: p.condicion||p.estado_vehiculo||'usado', papeles: p.papeles||'en regla', ubicacion: p.ubicacion||''
      })
    } else {
      // fallback parse desde description
      const parsed = parseVehiculoFromDescription(p.description||'')
      setVehiculo({
        marca: parsed.marca||'', modelo: parsed.modelo||'', anio: parsed['año']||parsed.anio||'', km: parsed.km||parsed.kilometraje||'',
        combustible: parsed.combustible||'gasolina', transmision: parsed.transmision||'mecanica',
        condicion: parsed.condicion||'usado', papeles: parsed.papeles||'en regla', ubicacion: parsed.ubicacion||''
      })
    }
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

    // Si es vehiculos, construir descripcion pro
    let finalDescription = description.trim()
    let extraPayload = {}
    if(isVehiculos){
      if(!vehiculo.marca || !vehiculo.modelo) {
        setSaving(false)
        return alert('Para vehiculos: marca y modelo son obligatorios')
      }
      const descVehiculo = `MARCA: ${vehiculo.marca} | MODELO: ${vehiculo.modelo} | AÑO: ${vehiculo.anio} | KM: ${vehiculo.km} | COMBUSTIBLE: ${vehiculo.combustible} | TRANSMISION: ${vehiculo.transmision} | CONDICION: ${vehiculo.condicion} | PAPELES: ${vehiculo.papeles} | UBICACION: ${vehiculo.ubicacion} | DETALLES: ${description.trim()}`
      finalDescription = descVehiculo
      // intentar guardar columnas extra si existen (no rompe si no existen, hace fallback)
      extraPayload = {
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        anio: vehiculo.anio ? parseInt(vehiculo.anio) : null,
        kilometraje: vehiculo.km,
        combustible: vehiculo.combustible,
        transmision: vehiculo.transmision,
        estado_vehiculo: vehiculo.condicion,
        papeles: vehiculo.papeles,
        ubicacion_vehiculo: vehiculo.ubicacion
      }
    }

    const basePayload = {
      store_id: store.id,
      name: name.trim(),
      price: Number(price),
      categoria,
      description: finalDescription,
      image_url: mainImage,
      images: cleanImages,
      video_url: videoUrl || null
    }

    try{
      let payloadToSave = {...basePayload, ...extraPayload}
      let res
      if(editing) res = await supabase.from('products').update(payloadToSave).eq('id', editing.id)
      else res = await supabase.from('products').insert(payloadToSave)

      if(res.error){
        // si falla por columnas vehiculo que no existen, guardar solo base
        console.log('Fallback sin columnas vehiculo:', res.error.message)
        if(editing) res = await supabase.from('products').update(basePayload).eq('id', editing.id)
        else res = await supabase.from('products').insert(basePayload)
        if(res.error) throw res.error
      }

      await loadData(); resetForm(); alert(editing ? 'Vehículo actualizado!' : isVehiculos ? 'Vehículo publicado!' : 'Producto creado!')
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

  const tipoLabel = (store.tipo_tienda || 'general').toUpperCase()

  return (
    <main style={{background:'#F7F5F3', minHeight:'100vh', fontFamily:'Inter, system-ui', padding:14}}>
      <div style={{maxWidth:1100, margin:'0 auto'}}>
        <div style={{background:'#fff', border:'1px solid #EAE6E1', borderRadius:16, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
          <div style={{display:'flex', gap:12, alignItems:'center'}}>
            <img src={store.logo_url||'/tienda-nica-logo.png'} style={{width:48,height:48, borderRadius:12, objectFit:'cover'}}/>
            <div><b>{store.name}</b><div style={{fontSize:11, color:'#9A9590'}}>{slug} • {products.length} productos • {tipoLabel} {isVehiculos ? '🏍' : ''}</div></div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button onClick={()=>setShowCoverEdit(true)} style={{background:'#fff', color:'#111', border:'1.5px solid #111', padding:'10px 14px', borderRadius:999, fontSize:11, fontWeight:800, cursor:'pointer'}}>🖼 Portada</button>
            <button onClick={()=>{resetForm(); setShowForm(true)}} style={{background: isVehiculos ? '#FF6A00' : '#0A0A0A', color:'#fff', border:'none', padding:'10px 16px', borderRadius:999, fontSize:12, fontWeight:900, cursor:'pointer'}}>+ {isVehiculos ? 'Nuevo Vehículo' : 'Nuevo'}</button>
          </div>
        </div>

        {showCoverEdit && (
          <div style={{background:'#fff', border:'2px solid #0A0A0A', borderRadius:16, padding:18, marginBottom:16}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:12}}>
              <h3 style={{fontWeight:900, fontSize:13}}>🖼 Editar portada de tienda</h3>
              <button onClick={()=>setShowCoverEdit(false)} style={{width:28,height:28, borderRadius:999, border:'1px solid #EAE6E1', background:'#fff'}}>✕</button>
            </div>
            <div style={{width:'100%', height:160, borderRadius:12, overflow:'hidden', background:'#F0F0F0', border:'1px dashed #ccc', display:'flex', alignItems:'center', justifyContent:'center', position:'relative'}}>
              {coverPreview ? <img src={coverPreview} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <span style={{fontSize:11, color:'#999'}}>Sin portada</span>}
            </div>
            <input type="file" accept="image/*" onChange={handleCoverUpload} style={{marginTop:10, fontSize:12, width:'100%'}}/>
            <div style={{display:'flex', gap:8, marginTop:12}}>
              <button onClick={()=>setShowCoverEdit(false)} style={{flex:1, background:'#F0F0F0', border:'none', padding:'12px', borderRadius:999, fontWeight:700}}>Cancelar</button>
              <button onClick={handleSaveCover} disabled={coverUploading||coverSaving} style={{flex:2, background:'#0066FF', color:'#fff', border:'none', padding:'12px', borderRadius:999, fontWeight:900}}>{coverUploading ? 'Subiendo...' : coverSaving ? 'Guardando...' : 'Guardar portada'}</button>
            </div>
          </div>
        )}

        {showForm && (
          <div style={{background:'#fff', border:'1px solid #EAE6E1', borderRadius:16, padding:18, marginBottom:16, border: isVehiculos ? '2px solid #FF6A00' : '2px solid #0A0A0A'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:14}}>
              <h3 style={{fontWeight:900, fontSize:14}}>{editing ? 'Editar' : isVehiculos ? '🏍 Nuevo Vehículo Profesional' : `Nuevo producto - ${tipoLabel}`}</h3>
              <button onClick={resetForm} style={{width:28,height:28, borderRadius:999, border:'1px solid #EAE6E1', background:'#fff'}}>✕</button>
            </div>

            {/* ===== SI ES VEHICULOS: FORMULARIO PRO ===== */}
            {isVehiculos ? (
              <>
                <div style={{background:'linear-gradient(135deg, #FFF7ED, #FFFBF8)', border:'1px solid #FFE0C0', borderRadius:12, padding:12, marginBottom:12}}>
                  <p style={{fontSize:11, fontWeight:900, color:'#FF6A00'}}>🏍 DATOS DEL VEHÍCULO (OBLIGATORIO MARCA Y MODELO)</p>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:10}}>
                    <div><label style={{fontSize:10, fontWeight:800}}>MARCA *</label><input value={vehiculo.marca} onChange={e=>setVehiculo({...vehiculo, marca:e.target.value})} placeholder="Ej: Yamaha, Toyota, Pulsar" style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1.5px solid #FF6A00', marginTop:4, background:'#fff'}}/></div>
                    <div><label style={{fontSize:10, fontWeight:800}}>MODELO *</label><input value={vehiculo.modelo} onChange={e=>setVehiculo({...vehiculo, modelo:e.target.value})} placeholder="Ej: YBR 125, Corolla 2020" style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1.5px solid #FF6A00', marginTop:4, background:'#fff'}}/></div>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:10}}>
                    <div><label style={{fontSize:10, fontWeight:700}}>AÑO</label><input value={vehiculo.anio} onChange={e=>setVehiculo({...vehiculo, anio:e.target.value})} placeholder="2023" type="number" style={{width:'100%', padding:'11px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4}}/></div>
                    <div><label style={{fontSize:10, fontWeight:700}}>KILOMETRAJE / KM</label><input value={vehiculo.km} onChange={e=>setVehiculo({...vehiculo, km:e.target.value})} placeholder="Ej: 12,000 km" style={{width:'100%', padding:'11px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4}}/></div>
                    <div><label style={{fontSize:10, fontWeight:700}}>UBICACIÓN</label><input value={vehiculo.ubicacion} onChange={e=>setVehiculo({...vehiculo, ubicacion:e.target.value})} placeholder="Ej: Managua, Matagalpa" style={{width:'100%', padding:'11px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4}}/></div>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginTop:10}}>
                    <div><label style={{fontSize:10, fontWeight:700}}>COMBUSTIBLE</label>
                      <select value={vehiculo.combustible} onChange={e=>setVehiculo({...vehiculo, combustible:e.target.value})} style={{width:'100%', padding:'11px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4}}>
                        <option value="gasolina">Gasolina</option><option value="diesel">Diésel</option><option value="electrico">Eléctrico</option><option value="hibrido">Híbrido</option>
                      </select>
                    </div>
                    <div><label style={{fontSize:10, fontWeight:700}}>TRANSMISIÓN</label>
                      <select value={vehiculo.transmision} onChange={e=>setVehiculo({...vehiculo, transmision:e.target.value})} style={{width:'100%', padding:'11px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4}}>
                        <option value="mecanica">Mecánica</option><option value="automatica">Automática</option><option value="semiautomatica">Semi-aut.</option>
                      </select>
                    </div>
                    <div><label style={{fontSize:10, fontWeight:700}}>CONDICIÓN</label>
                      <select value={vehiculo.condicion} onChange={e=>setVehiculo({...vehiculo, condicion:e.target.value})} style={{width:'100%', padding:'11px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4}}>
                        <option value="usado">Usado</option><option value="nuevo">Nuevo</option><option value="seminuevo">Seminuevo</option>
                      </select>
                    </div>
                    <div><label style={{fontSize:10, fontWeight:700}}>PAPELES</label>
                      <select value={vehiculo.papeles} onChange={e=>setVehiculo({...vehiculo, papeles:e.target.value})} style={{width:'100%', padding:'11px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4}}>
                        <option value="en regla">En regla</option><option value="pendiente">Pendiente</option><option value="sin papeles">Sin papeles</option>
                      </select>
                    </div>
                  </div>
                </div>

                <label style={{fontSize:11, fontWeight:700}}>TÍTULO ANUNCIO * (Ej: Yamaha YBR 125 2023 poco uso)</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Yamaha YBR 125 2023 - 12mil km - Papeles en regla" style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1.5px solid #0A0A0A', marginTop:4, marginBottom:12, fontWeight:700}}/>
                
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12}}>
                  <div><label style={{fontSize:11, fontWeight:700}}>Precio C$ *</label><input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="55000" style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1.5px solid #FF6A00', marginTop:4, fontWeight:900, fontSize:14}}/></div>
                  <div><label style={{fontSize:11, fontWeight:700}}>Categoría</label>
                    <select value={categoria} onChange={e=>setCategoria(e.target.value)} style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4}}>
                      {categoriasDisponibles.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <label style={{fontSize:11, fontWeight:700}}>Descripción / Detalles extras (por qué vender, detalles, contacto)</label>
                <textarea value={description} onChange={e=>setDescription(e.target.value.slice(0,500))} placeholder="Ej: Moto cuidada, llantas nuevas, mantenimiento al día, negociable, financiamiento disponible..." style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4, marginBottom:12, minHeight:80}}/>
              </>
            ) : (
              <>
                {/* FORMULARIO ORIGINAL PARA BOUTIQUE/COMIDA/GENERAL - NO TOCADO */}
                <label style={{fontSize:11, fontWeight:700}}>Nombre *</label>
                <input value={name} onChange={e=>setName(e.target.value)} style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4, marginBottom:12}}/>
                <label style={{fontSize:11, fontWeight:700}}>Descripción</label>
                <textarea value={description} onChange={e=>setDescription(e.target.value.slice(0,200))} style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4, marginBottom:12, minHeight:70}}/>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12}}>
                  <div><label style={{fontSize:11, fontWeight:700}}>Precio C$ *</label><input type="number" value={price} onChange={e=>setPrice(e.target.value)} style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4}}/></div>
                  <div><label style={{fontSize:11, fontWeight:700}}>Categoría ({tipoLabel})</label>
                    <select value={categoria} onChange={e=>setCategoria(e.target.value)} style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4, textTransform:'capitalize'}}>
                      {categoriasDisponibles.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            <label style={{fontSize:12, fontWeight:900, marginTop:8, display:'block'}}>{isVehiculos ? '📸 Fotos del vehículo (hasta 5 - exterior, interior, motor, papeles)' : '📸 Carrusel (hasta 5 fotos) - vista completa'}</label>
            <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8, marginTop:8, marginBottom:16}}>
              {[0,1,2,3,4].map(i=>(
                <div key={i} style={{aspectRatio:'1/1', border: isVehiculos ? '1.5px dashed #FF6A00' : '1px dashed #EAE6E1', borderRadius:12, overflow:'hidden', position:'relative', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  {images[i] ? <img src={images[i]} style={{width:'100%', height:'100%', objectFit:'cover', background:'#fff'}}/> : <div style={{fontSize:10, color:'#9A9590', textAlign:'center'}}>{isVehiculos ? ['Frente','Lateral','Interior','Motor','Papeles'][i] : `Foto ${i+1}`}</div>}
                  <input type="file" accept="image/*" onChange={e=>handleImageUpload(e,i)} style={{position:'absolute', inset:0, opacity:0, cursor:'pointer'}}/>
                  {images[i] && <button onClick={()=>{const n=[...images]; n[i]=''; setImages(n)}} style={{position:'absolute', top:2, right:2, background:'rgba(0,0,0,0.7)', color:'#fff', border:'none', width:18, height:18, borderRadius:999, fontSize:10}}>✕</button>}
                </div>
              ))}
            </div>

            <label style={{fontSize:12, fontWeight:900, display:'block'}}>{isVehiculos ? '🎬 Video del vehículo arrancando / funcionando (15 seg)' : '🎬 Video corto (15 seg, opcional)'}</label>
            <div style={{border:'1px dashed #00C853', borderRadius:12, padding:12, marginTop:8, background:'#F0FFF4'}}>
              {videoUrl ? <video src={videoUrl} controls style={{width:'100%', borderRadius:8, maxHeight:200}}/> : <div style={{fontSize:11, color:'#555'}}>{isVehiculos ? 'Sube video del vehículo encendido, motor sonando, prueba de manejo.' : 'Sube un video corto mostrando el producto.'}</div>}
              <input type="file" accept="video/*" onChange={handleVideoUpload} style={{marginTop:8, fontSize:12}}/>
            </div>
            <button onClick={handleSave} disabled={saving||uploading} style={{width:'100%', marginTop:16, background: isVehiculos ? '#FF6A00' : '#0A0A0A', color:'#fff', border:'none', padding:'13px', borderRadius:999, fontWeight:900, cursor:'pointer'}}>
              {saving ? 'Guardando...' : uploading ? 'Subiendo...' : editing ? (isVehiculos ? 'Actualizar Vehículo' : 'Actualizar') : (isVehiculos ? 'Publicar Vehículo 🏍' : 'Guardar')}
            </button>
          </div>
        )}

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12}}>
          {products.map(p=>{
            const isVeh = (p.marca || p.modelo || (p.description||'').includes('MARCA:'))
            return (
            <div key={p.id} style={{background:'#fff', border: isVeh ? '1.5px solid #FF6A00' : '1px solid #EAE6E1', borderRadius:16, padding:10, position:'relative'}}>
              {isVeh && <span style={{position:'absolute', top:8, left:8, background:'#FF6A00', color:'#fff', fontSize:9, padding:'3px 8px', borderRadius:999, fontWeight:900, zIndex:2}}>🏍 VEHICULO</span>}
              <div style={{position:'relative', width:'100%', aspectRatio:'1/1', background:'#fff', borderRadius:12, overflow:'hidden', border:'1px solid #F0F0F0', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <img src={p.images?.[0]||p.image_url} style={{width:'100%', height:'100%', objectFit: isVeh ? 'cover' : 'contain', background:'#fff'}}/>
                {p.video_url && <span style={{position:'absolute', top:6, left: isVeh ? 90 : 6, background:'#000', color:'#fff', fontSize:9, padding:'3px 6px', borderRadius:999}}>▶ VIDEO</span>}
                <span style={{position:'absolute', bottom:6, right:6, background:'#F7F5F3', color:'#000', fontSize:9, padding:'3px 6px', borderRadius:999, textTransform:'capitalize'}}>{p.categoria}</span>
              </div>
              <b style={{fontSize:12, marginTop:6, display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.name}</b>
              {p.marca && <div style={{fontSize:10, color:'#FF6A00', fontWeight:800, marginTop:2}}>{p.marca} {p.modelo} {p.anio ? `• ${p.anio}` : ''} {p.kilometraje ? `• ${p.kilometraje}` : ''}</div>}
              <b style={{fontSize:12}}>C$ {p.price}</b>
              {p.description && !p.marca && <div style={{fontSize:10, color:'#666', marginTop:2, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{p.description.slice(0,80)}</div>}
              <div style={{display:'flex', gap:6, marginTop:8}}><button onClick={()=>openEdit(p)} style={{flex:1, background:'#fff', border:'1px solid #EAE6E1', padding:'6px', borderRadius:999, fontSize:10}}>Editar</button><button onClick={()=>handleDelete(p.id)} style={{flex:1, background:'#fff', border:'1px solid #FFE0E0', color:'#ff5555', padding:'6px', borderRadius:999, fontSize:10}}>Borrar</button></div>
            </div>
          )})}
        </div>
      </div>
    </main>
  )
}
