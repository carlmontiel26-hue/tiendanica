
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

function getCategoriasPorTipo(store){
  const tipo = (store?.tipo_tienda || store?.store_type || '').toLowerCase()
  if(tipo.includes('vehiculos') || tipo.includes('vehículo') || tipo.includes('moto') || tipo.includes('auto') || tipo.includes('carro')){
    return ['motos','autos','camionetas','moto usada','auto usado','repuestos','accesorios moto','cascos','llantas','aceites','otros','oferta','nuevo']
  }
  if(tipo.includes('comida') || tipo.includes('restaurante') || tipo.includes('food')){
    return ['comidas','desayunos','almuerzos','cenas','bebidas','postres','snacks','combos','entradas','sopas','asados','mariscos','vegetariano','otros','eskimos','comida rapida']
  }
  if(tipo.includes('boutique') || tipo.includes('ropa') || tipo.includes('moda')){
    return ['vestidos','blusas','jeans','faldas','conjuntos','shorts','hombres','niños','niñas','bebes','pantalon','accesorios','zapatos','carteras','belleza','hogar','oferta','nuevo','licras','chaquetas','ropa usada como nueva','sudaderas','mujer','taloneras','calcetines','medias','boxer','lloguer','cárdigans','chaleco','gorras','gorras','gorros','chor','variado','sabanas','colchas','pañuelos','camisas','playeras','camiasetas']
  }
  return ['abarrotes','bebidas','limpieza','hogar','tecnologia','belleza','ropa','zapatos','accesorios','juguetes','ferreteria','medicina natural','otros','oferta','nuevo','servicios','salud']
}

function parseTallas(raw){
  if(!raw) return []
  if(Array.isArray(raw) && raw.length>0) return raw
  if(typeof raw === 'string' && raw.length>0){
    try{ const j=JSON.parse(raw); if(Array.isArray(j)) return j }catch{}
    return raw.split(',').map(s=>s.trim()).filter(Boolean)
  }
  return []
}

export default function AdminPage(){
  const { slug } = useParams()
  const [pinAuthed, setPinAuthed] = useState(false)
  const [pinChecking, setPinChecking] = useState(true)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [showChangePin, setShowChangePin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

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
  const [vehiculo,setVehiculo]=useState({
    marca:'', modelo:'', anio:'', km:'', combustible:'gasolina', transmision:'mecanica', condicion:'usado', papeles:'en regla', ubicacion:''
  })
  const [tallas,setTallas]=useState([])
  const [tallaInput,setTallaInput]=useState('')

  const categoriasDisponibles = store ? getCategoriasPorTipo(store) : ['otros']
  const isVehiculos = (store?.tipo_tienda||'').toLowerCase().includes('vehiculos') || (store?.tipo_tienda||'').toLowerCase().includes('moto') || (store?.tipo_tienda||'').toLowerCase().includes('auto')
  const isBoutique = (store?.tipo_tienda||'').toLowerCase().includes('boutique') || (store?.tipo_tienda||'').toLowerCase().includes('ropa') || (store?.tipo_tienda||'').toLowerCase().includes('moda')

  useEffect(()=>{
    const check = async ()=>{
      const savedAuth = localStorage.getItem('tn_my_store_auth')
      const savedPin = localStorage.getItem('tn_my_store_pin')
      const savedSlug = localStorage.getItem('tn_my_store_slug')
      if(savedAuth && savedPin && savedSlug === slug){
        try{
          const auth = JSON.parse(savedAuth)
          if(Date.now() - auth.at < 7*24*60*60*1000){
            setPinAuthed(true)
            setPinChecking(false)
            return
          }
        }catch{}
      }
      setPinChecking(false)
    }
    if(slug) check()
  },[slug])

  const verificarPin = async()=>{
    setPinError('')
    if(!/^\d{6}$/.test(pinInput)){ setPinError('El PIN debe ser 6 números'); return }
    setLoading(true)
    const supabase=getSupabase()
    if(!supabase){ setPinError('Sin conexión'); setLoading(false); return }
    const { data, error } = await supabase.from('stores').select('id, admin_password, name').eq('slug', slug).single()
    if(error || !data){ setPinError('Tienda no encontrada'); setLoading(false); return }
    if(!data.admin_password){
      setPinError('Esta tienda aún no tiene PIN. Ve a /acceso para crear uno.');
      setLoading(false); return
    }
    if(data.admin_password !== pinInput){
      setPinError('PIN incorrecto. Contacta a soporte.'); setLoading(false); return
    }
    localStorage.setItem('tn_my_store_slug', slug)
    localStorage.setItem('tn_my_store_pin', pinInput)
    localStorage.setItem('tn_my_store_auth', JSON.stringify({ slug, at: Date.now() }))
    setPinAuthed(true)
    setLoading(false)
  }

  const cambiarPinAdmin = async()=>{
    setPinError('')
    if(!/^\d{6}$/.test(newPin)){ setPinError('Nuevo PIN debe ser 6 números'); return }
    if(newPin !== confirmPin){ setPinError('No coinciden'); return }
    const supabase=getSupabase()
    if(!supabase) return
    setSaving(true)
    const { error } = await supabase.from('stores').update({ admin_password: newPin }).eq('slug', slug)
    if(error){ setPinError('Error: '+error.message); setSaving(false); return }
    localStorage.setItem('tn_my_store_pin', newPin)
    setNewPin(''); setConfirmPin(''); setShowChangePin(false)
    setSaving(false)
    alert('✅ PIN cambiado con éxito')
  }

  useEffect(()=>{ if(slug && pinAuthed) loadData() },[slug, pinAuthed])

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
    setTallas([]); setTallaInput('')
    setVehiculo({marca:'', modelo:'', anio:'', km:'', combustible:'gasolina', transmision:'mecanica', condicion:'usado', papeles:'en regla', ubicacion:''})
    if(store) setCategoria(getCategoriasPorTipo(store)[0])
  }

  const parseVehiculoFromDescription = (desc)=>{
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
    const tallasExistentes = parseTallas(p.tallas || p.sizes || p.talla || p.size || p.sizes_available || p.tallas_disponibles)
    setTallas(tallasExistentes)
    setTallaInput('')
    if(p.marca || p.modelo || p.anio){
      setVehiculo({
        marca: p.marca||'', modelo: p.modelo||'', anio: p.anio||'', km: p.kilometraje||p.km||'',
        combustible: p.combustible||'gasolina', transmision: p.transmision||'mecanica',
        condicion: p.condicion||p.estado_vehiculo||'usado', papeles: p.papeles||'en regla', ubicacion: p.ubicacion||''
      })
    } else {
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
    let finalDescription = description.trim()
    let extraPayload = {}
    if(isVehiculos){
      if(!vehiculo.marca || !vehiculo.modelo) {
        setSaving(false)
        return alert('Para vehiculos: marca y modelo son obligatorios')
      }
      const descVehiculo = `MARCA: ${vehiculo.marca} | MODELO: ${vehiculo.modelo} | AÑO: ${vehiculo.anio} | KM: ${vehiculo.km} | COMBUSTIBLE: ${vehiculo.combustible} | TRANSMISION: ${vehiculo.transmision} | CONDICION: ${vehiculo.condicion} | PAPELES: ${vehiculo.papeles} | UBICACION: ${vehiculo.ubicacion} | DETALLES: ${description.trim()}`
      finalDescription = descVehiculo
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
    if(isBoutique){
      extraPayload = {
        ...extraPayload,
        tallas: tallas,
        sizes: tallas,
        tallas_disponibles: tallas,
        sizes_available: tallas
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
        console.log('Fallback sin columnas extra:', res.error.message)
        if(editing) res = await supabase.from('products').update(basePayload).eq('id', editing.id)
        else res = await supabase.from('products').insert(basePayload)
        if(res.error) throw res.error
      }
      await loadData(); resetForm(); alert(editing ? (isVehiculos ? 'Vehículo actualizado!' : 'Producto actualizado!') : isVehiculos ? 'Vehículo publicado!' : 'Producto creado!')
    }catch(e){ alert('Error: '+e.message) } finally{ setSaving(false) }
  }

  const handleDelete = async(id)=>{
    if(!confirm('¿Borrar?')) return
    const supabase=getSupabase()
    await supabase.from('products').delete().eq('id', id)
    loadData()
  }

  if(pinChecking) return <div style={{padding:40, textAlign:'center', fontFamily:'Inter'}}>🔐 Verificando acceso seguro...</div>

  if(!pinAuthed){
    return (
      <main style={{minHeight:'100vh', background:'#F5F1ED', display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:'Inter, system-ui'}}>
        <div style={{background:'#fff', borderRadius:22, padding:22, border:'1px solid #EDE6DF', maxWidth:380, width:'100%', textAlign:'center', boxShadow:'0 12px 40px rgba(0,0,0,0.08)'}}>
          <p style={{fontSize:40}}>🔒</p>
          <h2 style={{fontWeight:900, fontSize:20, marginTop:8}}>Panel protegido con PIN</h2>
          <p style={{fontSize:13, color:'#666', marginTop:6, lineHeight:1.4}}>Esta tienda <b>{slug}</b> está protegida. Ingresa tu PIN de 6 dígitos.</p>
          <input type="password" value={pinInput} onChange={e=>setPinInput(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="••••••" maxLength={6} inputMode="numeric"
            style={{width:'100%', border:'2px solid #111', borderRadius:14, padding:'14px', fontSize:24, fontWeight:900, letterSpacing:10, textAlign:'center', marginTop:16, outline:'none', background:'#FFFEFD'}}/>
          {pinError && <p style={{fontSize:12, color:'#FF3B30', background:'#FFF0F0', padding:'8px 10px', borderRadius:10, marginTop:10, fontWeight:700}}>{pinError}</p>}
          <button onClick={verificarPin} style={{width:'100%', background:'#111', color:'#fff', border:'none', padding:'14px', borderRadius:999, fontWeight:900, marginTop:12, cursor:'pointer'}}>🔓 Entrar al panel</button>
          <div style={{marginTop:14, display:'flex', gap:8}}>
            <a href="/acceso" style={{flex:1, background:'#FFF7E8', border:'1px solid #FFD9A0', padding:'10px', borderRadius:999, fontWeight:700, fontSize:12, textAlign:'center', textDecoration:'none', color:'#000'}}>← Acceso dueños</a>
            <a href="/" style={{flex:1, background:'#F5F1ED', border:'1px solid #EDE6DF', padding:'10px', borderRadius:999, fontWeight:700, fontSize:12, textAlign:'center', textDecoration:'none', color:'#000'}}>Market</a>
          </div>
          <a href={`https://wa.me/50581732620?text=Olvide mi PIN ${slug}`} style={{display:'block', marginTop:12, fontSize:11, color:'#999'}}>Olvidé mi PIN - WhatsApp soporte</a>
        </div>
      </main>
    )
  }

  if(loading) return <div style={{padding:40, textAlign:'center'}}>Cargando {slug}...</div>
  if(!store) return <div style={{padding:40, textAlign:'center'}}>Tienda no encontrada: {slug}</div>

  const tipoLabel = (store.tipo_tienda || 'general').toUpperCase()

  return (
    <main style={{background:'#F7F5F3', minHeight:'100vh', fontFamily:'Inter, system-ui', padding:14}}>
      <div style={{maxWidth:1100, margin:'0 auto 10px', background:'#111', color:'#fff', borderRadius:12, padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11}}>
        <span style={{fontWeight:800}}>🔐 {store.name} • PIN activo • Protegido</span>
        <div style={{display:'flex', gap:6}}>
          <button onClick={()=>setShowChangePin(!showChangePin)} style={{background:'#FF8A00', color:'#fff', border:'none', padding:'6px 12px', borderRadius:999, fontWeight:800, fontSize:11, cursor:'pointer'}}>{showChangePin ? 'Cerrar' : '🔑 Cambiar PIN'}</button>
          <button onClick={()=>{ localStorage.removeItem('tn_my_store_auth'); location.href='/acceso' }} style={{background:'#fff', color:'#000', border:'none', padding:'6px 12px', borderRadius:999, fontWeight:700, fontSize:11, cursor:'pointer'}}>Salir</button>
        </div>
      </div>

      {showChangePin && (
        <div style={{maxWidth:1100, margin:'0 auto 12px', background:'#fff', border:'1.5px solid #FF8A00', borderRadius:14, padding:14, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
          <span style={{fontSize:12, fontWeight:800}}>Nuevo PIN 6 dígitos:</span>
          <input value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="Ej: 123456" maxLength={6} inputMode="numeric" style={{border:'1.5px solid #E8E0D9', borderRadius:999, padding:'8px 12px', fontWeight:800, width:130}}/>
          <input value={confirmPin} onChange={e=>setConfirmPin(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="Confirmar" maxLength={6} inputMode="numeric" style={{border:'1.5px solid #E8E0D9', borderRadius:999, padding:'8px 12px', fontWeight:800, width:110}}/>
          <button onClick={cambiarPinAdmin} disabled={saving} style={{background:'#111', color:'#fff', border:'none', padding:'8px 14px', borderRadius:999, fontWeight:800, cursor:'pointer'}}>{saving ? 'Guardando...' : 'Guardar nuevo PIN'}</button>
          {pinError && <span style={{fontSize:11, color:'#FF3B30', fontWeight:700}}>{pinError}</span>}
        </div>
      )}

      <div style={{maxWidth:1100, margin:'0 auto'}}>
        <div style={{background:'#fff', border:'1px solid #EAE6E1', borderRadius:16, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
          <div style={{display:'flex', gap:12, alignItems:'center'}}>
            <img src={store.logo_url||'/tienda-nica-logo.png'} style={{width:48,height:48, borderRadius:12, objectFit:'cover'}}/>
            <div><b>{store.name}</b><div style={{fontSize:11, color:'#9A9590'}}>{slug} • {products.length} productos • {tipoLabel} {isVehiculos ? '🏍' : isBoutique ? '👗' : ''}</div></div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button onClick={()=>setShowCoverEdit(true)} style={{background:'#fff', color:'#111', border:'1.5px solid #111', padding:'10px 14px', borderRadius:999, fontSize:11, fontWeight:800, cursor:'pointer'}}>🖼 Portada</button>
            <button onClick={()=>{resetForm(); setShowForm(true)}} style={{background: isVehiculos ? '#FF6A00' : '#0A0A0A', color:'#fff', border:'none', padding:'10px 16px', borderRadius:999, fontSize:12, fontWeight:900, cursor:'pointer'}}>+ {isVehiculos ? 'Nuevo Vehículo' : isBoutique ? 'Nueva Prenda' : 'Nuevo'}</button>
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
          <div style={{background:'#fff', border:'1px solid #EAE6E1', borderRadius:16, padding:18, marginBottom:16, border: isVehiculos ? '2px solid #FF6A00' : isBoutique ? '2px solid #0066FF' : '2px solid #0A0A0A'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:14}}>
              <h3 style={{fontWeight:900, fontSize:14}}>{editing ? 'Editar' : isVehiculos ? '🏍 Nuevo Vehículo Profesional' : isBoutique ? '👗 Nueva Prenda con Tallas' : `Nuevo producto - ${tipoLabel}`}</h3>
              <button onClick={resetForm} style={{width:28,height:28, borderRadius:999, border:'1px solid #EAE6E1', background:'#fff'}}>✕</button>
            </div>

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

                {isBoutique && (
                  <div style={{background:'linear-gradient(135deg, #F0F7FF, #F8FBFF)', border:'1.5px solid #0066FF', borderRadius:14, padding:14, marginBottom:14}}>
                    <p style={{fontSize:12, fontWeight:900, color:'#0066FF', marginBottom:8}}>📏 TALLAS DISPONIBLES (Boutique)</p>
                    <p style={{fontSize:11, color:'#666', marginBottom:10}}>Agrega las tallas que tienes en stock. Ej: S, M, L, XL, 32, 34, Única</p>
                    <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:10}}>
                      {tallas.map((t,i)=>(
                        <span key={i} style={{background:'#111', color:'#fff', padding:'6px 12px', borderRadius:999, fontSize:12, fontWeight:800, display:'flex', alignItems:'center', gap:6}}>
                          {t} <button onClick={()=>setTallas(tallas.filter((_,idx)=>idx!==i))} style={{background:'rgba(255,255,255,0.2)', border:'none', color:'#fff', width:18, height:18, borderRadius:999, fontSize:10, cursor:'pointer'}}>✕</button>
                        </span>
                      ))}
                      {tallas.length===0 && <span style={{fontSize:11, color:'#999', fontStyle:'italic'}}>Sin tallas agregadas - se mostrará como talla única</span>}
                    </div>
                    <div style={{display:'flex', gap:8}}>
                      <input value={tallaInput} onChange={e=>setTallaInput(e.target.value.toUpperCase())} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); if(tallaInput.trim() && !tallas.includes(tallaInput.trim().toUpperCase())){ setTallas([...tallas, tallaInput.trim().toUpperCase()]); setTallaInput('') } } }} placeholder="Ej: M, L, XL, 32, ÚNICA" style={{flex:1, padding:'10px 14px', borderRadius:999, border:'1.5px solid #0066FF', fontWeight:700, fontSize:13, textTransform:'uppercase'}}/>
                      <button onClick={()=>{ if(tallaInput.trim() && !tallas.includes(tallaInput.trim().toUpperCase())){ setTallas([...tallas, tallaInput.trim().toUpperCase()]); setTallaInput('') } }} style={{background:'#0066FF', color:'#fff', border:'none', padding:'10px 18px', borderRadius:999, fontWeight:900, fontSize:12, cursor:'pointer'}}>+ Agregar</button>
                    </div>
                    <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:10}}>
                      {['XS','S','M','L','XL','XXL','28','30','32','34','36','38','ÚNICA'].map(s=>(
                        <button key={s} onClick={()=>{ if(!tallas.includes(s)) setTallas([...tallas, s]) }} style={{background: tallas.includes(s) ? '#0066FF' : '#fff', color: tallas.includes(s) ? '#fff' : '#111', border:'1px solid #E0D6CF', padding:'5px 10px', borderRadius:999, fontSize:11, fontWeight:700, cursor:'pointer'}}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <label style={{fontSize:12, fontWeight:900, marginTop:8, display:'block'}}>{isVehiculos ? '📸 Fotos del vehículo (hasta 5 - exterior, interior, motor, papeles)' : isBoutique ? '📸 Fotos de la prenda (hasta 5 - frente, atrás, detalles, etiqueta)' : '📸 Carrusel (hasta 5 fotos) - vista completa'}</label>
            <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8, marginTop:8, marginBottom:16}}>
              {[0,1,2,3,4].map(i=>(
                <div key={i} style={{aspectRatio:'1/1', border: isVehiculos ? '1.5px dashed #FF6A00' : isBoutique ? '1.5px dashed #0066FF' : '1px dashed #EAE6E1', borderRadius:12, overflow:'hidden', position:'relative', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  {images[i] ? <img src={images[i]} style={{width:'100%', height:'100%', objectFit:'cover', background:'#fff'}}/> : <div style={{fontSize:10, color:'#9A9590', textAlign:'center'}}>{isVehiculos ? ['Frente','Lateral','Interior','Motor','Papeles'][i] : isBoutique ? ['Frente','Atrás','Detalle','Etiqueta','Puesta'][i] : `Foto ${i+1}`}</div>}
                  <input type="file" accept="image/*" onChange={e=>handleImageUpload(e,i)} style={{position:'absolute', inset:0, opacity:0, cursor:'pointer'}}/>
                  {images[i] && <button onClick={()=>{const n=[...images]; n[i]=''; setImages(n)}} style={{position:'absolute', top:2, right:2, background:'rgba(0,0,0,0.7)', color:'#fff', border:'none', width:18, height:18, borderRadius:999, fontSize:10}}>✕</button>}
                </div>
              ))}
            </div>

            <label style={{fontSize:12, fontWeight:900, display:'block'}}>{isVehiculos ? '🎬 Video del vehículo arrancando / funcionando (15 seg)' : isBoutique ? '🎬 Video corto de la prenda (15 seg, opcional)' : '🎬 Video corto (15 seg, opcional)'}</label>
            <div style={{border:'1px dashed #00C853', borderRadius:12, padding:12, marginTop:8, background:'#F0FFF4'}}>
              {videoUrl ? <video src={videoUrl} controls style={{width:'100%', borderRadius:8, maxHeight:200}}/> : <div style={{fontSize:11, color:'#555'}}>{isVehiculos ? 'Sube video del vehículo encendido, motor sonando, prueba de manejo.' : isBoutique ? 'Sube video corto mostrando la prenda puesta, caída, tela.' : 'Sube un video corto mostrando el producto.'}</div>}
              <input type="file" accept="video/*" onChange={handleVideoUpload} style={{marginTop:8, fontSize:12}}/>
            </div>
            <button onClick={handleSave} disabled={saving||uploading} style={{width:'100%', marginTop:16, background: isVehiculos ? '#FF6A00' : isBoutique ? '#0066FF' : '#0A0A0A', color:'#fff', border:'none', padding:'13px', borderRadius:999, fontWeight:900, cursor:'pointer'}}>
              {saving ? 'Guardando...' : uploading ? 'Subiendo...' : editing ? (isVehiculos ? 'Actualizar Vehículo' : isBoutique ? 'Actualizar Prenda' : 'Actualizar') : (isVehiculos ? 'Publicar Vehículo 🏍' : isBoutique ? 'Publicar Prenda 👗 con Tallas' : 'Guardar')}
            </button>
          </div>
        )}

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12}}>
          {products.map(p=>{
            const isVeh = (p.marca || p.modelo || (p.description||'').includes('MARCA:'))
            const tallasProd = parseTallas(p.tallas || p.sizes || p.talla || p.size || p.sizes_available || p.tallas_disponibles)
            const isBoutiqueProd = tallasProd.length>0
            return (
            <div key={p.id} style={{background:'#fff', border: isVeh ? '1.5px solid #FF6A00' : isBoutiqueProd ? '1.5px solid #0066FF' : '1px solid #EAE6E1', borderRadius:16, padding:10, position:'relative'}}>
              {isVeh && <span style={{position:'absolute', top:8, left:8, background:'#FF6A00', color:'#fff', fontSize:9, padding:'3px 8px', borderRadius:999, fontWeight:900, zIndex:2}}>🏍 VEHICULO</span>}
              {isBoutiqueProd && !isVeh && <span style={{position:'absolute', top:8, left:8, background:'#0066FF', color:'#fff', fontSize:8, padding:'3px 7px', borderRadius:999, fontWeight:900, zIndex:2}}>📏 {tallasProd.join(' ')}</span>}
              <div style={{position:'relative', width:'100%', aspectRatio:'1/1', background:'#fff', borderRadius:12, overflow:'hidden', border:'1px solid #F0F0F0', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <img src={p.images?.[0]||p.image_url} style={{width:'100%', height:'100%', objectFit: isVeh ? 'cover' : 'contain', background:'#fff'}}/>
                {p.video_url && <span style={{position:'absolute', top:6, left: isVeh || isBoutiqueProd ? 90 : 6, background:'#000', color:'#fff', fontSize:9, padding:'3px 6px', borderRadius:999}}>▶ VIDEO</span>}
                <span style={{position:'absolute', bottom:6, right:6, background:'#F7F5F3', color:'#000', fontSize:9, padding:'3px 6px', borderRadius:999, textTransform:'capitalize'}}>{p.categoria}</span>
              </div>
              <b style={{fontSize:12, marginTop:6, display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.name}</b>
              {p.marca && <div style={{fontSize:10, color:'#FF6A00', fontWeight:800, marginTop:2}}>{p.marca} {p.modelo} {p.anio ? `• ${p.anio}` : ''} {p.kilometraje ? `• ${p.kilometraje}` : ''}</div>}
              {isBoutiqueProd && <div style={{fontSize:10, color:'#0066FF', fontWeight:700, marginTop:2}}>Tallas: {tallasProd.join(' • ')}</div>}
              <b style={{fontSize:12}}>C$ {p.price}</b>
              {p.description && !p.marca && !isBoutiqueProd && <div style={{fontSize:10, color:'#666', marginTop:2, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{p.description.slice(0,80)}</div>}
              <div style={{display:'flex', gap:6, marginTop:8}}><button onClick={()=>openEdit(p)} style={{flex:1, background:'#fff', border:'1px solid #EAE6E1', padding:'6px', borderRadius:999, fontSize:10}}>Editar</button><button onClick={()=>handleDelete(p.id)} style={{flex:1, background:'#fff', border:'1px solid #FFE0E0', color:'#ff5555', padding:'6px', borderRadius:999, fontSize:10}}>Borrar</button></div>
            </div>
          )})}
        </div>
      </div>
    </main>
  )
}
