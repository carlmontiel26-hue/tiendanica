'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if(!url || !key) return null
  return createClient(url,key)
}

export default function SuperAdminCompleto(){
  const [auth,setAuth]=useState(false)
  const [pass,setPass]=useState('')
  const [tab,setTab]=useState('tiendas')
  const [stores,setStores]=useState([])
  const [products,setProducts]=useState([])
  const [pendientes,setPendientes]=useState([])
  const [reportes,setReportes]=useState([])
  const [loading,setLoading]=useState(false)
  const [qTienda,setQTienda]=useState('')
  const [selectedStoreForProduct,setSelectedStoreForProduct]=useState('')
  const fileLogoRef = useRef(null)
  const fileProductRef = useRef(null)

  // Form crear tienda
  const [formTienda,setFormTienda]=useState({
    name:'', slug:'', whatsapp:'', tipo_tienda:'boutique', 
    departamento:'Managua', direccion:'', lat:'', lng:'',
    logo_file:null, logo_preview:'', logo_url:''
  })
  
  // Form crear producto
  const [formProd,setFormProd]=useState({
    name:'', price:'', categoria:'vestidos', descripcion:'', 
    tipo:'boutique', tallas:'S,M,L,XL', video_url:'',
    image_files:[], image_previews:[]
  })

  const CATEGORIAS = ['vestidos','blusas','jeans','conjuntos','faldas','shorts','pijamas','zapatos','carteras','accesorios','belleza','salud','general','hogar','comida','otros','nuevo']
  const TIPOS = ['boutique','general','comida']

  const login = ()=>{
    if(pass === 'tiendanica2025' || pass === 'admin123' || pass === 'Nica2024'){
      setAuth(true)
      cargarTodo()
    } else alert('Clave incorrecta - prueba tiendanica2025')
  }

  const cargarTodo = async ()=>{
    setLoading(true)
    const supabase = getSupabase()
    if(!supabase){ setLoading(false); return }
    const {data: s} = await supabase.from('stores').select('*').order('created_at',{ascending:false}).limit(200)
    const {data: p} = await supabase.from('products').select('*, stores(name,slug)').order('created_at',{ascending:false}).limit(200)
    const {data: v} = await supabase.from('store_verifications').select('*, stores(name, whatsapp, slug)').in('status',['pendiente','revision']).order('created_at',{ascending:false}).limit(50)
    const {data: r} = await supabase.from('fraud_reports').select('*, stores(name, whatsapp)').in('status',['abierto','investigando']).order('created_at',{ascending:false}).limit(50)
    setStores(s||[])
    setProducts(p||[])
    setPendientes(v||[])
    setReportes(r||[])
    setLoading(false)
  }

  // --- CREAR TIENDA CON FOTO LOCAL ---
  const handleLogoFile = (e)=>{
    const file = e.target.files[0]
    if(!file) return
    setFormTienda({...formTienda, logo_file:file, logo_preview: URL.createObjectURL(file)})
  }

  const uploadLogo = async (file)=>{
    const supabase = getSupabase()
    if(!file) return null
    const fileName = `store-${Date.now()}-${file.name}`
    // Intenta subir a bucket store-logos, si no existe usa product-images o devuelve local
    let bucket = 'store-logos'
    let {data, error} = await supabase.storage.from(bucket).upload(fileName, file)
    if(error){
      // fallback a bucket publico que seguro existe
      bucket = 'product-images'
      const res2 = await supabase.storage.from(bucket).upload(fileName, file)
      if(res2.error) {
        console.log('Error upload logo', res2.error)
        return null
      }
      data = res2.data
    }
    const {data: urlData} = supabase.storage.from(bucket).getPublicUrl(fileName)
    return urlData.publicUrl
  }

  const crearTienda = async (e)=>{
    e.preventDefault()
    const supabase = getSupabase()
    if(!supabase) return alert('Falta env')
    if(!formTienda.name || !formTienda.slug || !formTienda.whatsapp) return alert('Falta nombre, slug, whatsapp')

    let finalLogoUrl = formTienda.logo_url
    if(formTienda.logo_file){
      finalLogoUrl = await uploadLogo(formTienda.logo_file)
      if(!finalLogoUrl) return alert('Error subiendo logo, verifica buckets en Supabase Storage')
    }
    if(!finalLogoUrl) finalLogoUrl = '/tienda-nica-logo.png'

    const payload = {
      name: formTienda.name,
      slug: formTienda.slug.toLowerCase().replace(/ /g,'-').replace(/[^a-z0-9-]/g,''),
      whatsapp: formTienda.whatsapp,
      tipo_tienda: formTienda.tipo_tienda,
      logo_url: finalLogoUrl,
      departamento: formTienda.departamento,
      direccion: formTienda.direccion,
      lat: formTienda.lat ? parseFloat(formTienda.lat) : null,
      lng: formTienda.lng ? parseFloat(formTienda.lng) : null,
      verification_status: 'nueva',
      verification_badge: 'nueva'
    }

    const {data, error} = await supabase.from('stores').insert(payload).select()
    if(error) alert('Error: '+error.message)
    else {
      alert('Tienda creada ✓ '+formTienda.name)
      setFormTienda({name:'', slug:'', whatsapp:'', tipo_tienda:'boutique', departamento:'Managua', direccion:'', lat:'', lng:'', logo_file:null, logo_preview:'', logo_url:''})
      if(fileLogoRef.current) fileLogoRef.current.value=''
      cargarTodo()
      setTab('tiendas')
    }
  }

  // --- CREAR PRODUCTO CON FOTOS LOCALES ---
  const handleProductFiles = (e)=>{
    const files = Array.from(e.target.files)
    const previews = files.map(f=>URL.createObjectURL(f))
    setFormProd({...formProd, image_files:files, image_previews:previews})
  }

  const uploadProductImages = async (files)=>{
    const supabase = getSupabase()
    const urls = []
    for(let file of files){
      const fileName = `prod-${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`
      const {error} = await supabase.storage.from('product-images').upload(fileName, file)
      if(!error){
        const {data} = supabase.storage.from('product-images').getPublicUrl(fileName)
        urls.push(data.publicUrl)
      }
    }
    return urls
  }

  const crearProducto = async (e)=>{
    e.preventDefault()
    const supabase = getSupabase()
    if(!supabase) return
    if(!selectedStoreForProduct) return alert('Selecciona una tienda primero')
    if(!formProd.name || !formProd.price) return alert('Falta nombre y precio')

    const storeObj = stores.find(s=>s.id===selectedStoreForProduct)
    let imageUrls = []
    if(formProd.image_files.length>0){
      imageUrls = await uploadProductImages(formProd.image_files)
    }
    if(imageUrls.length===0) return alert('Sube al menos 1 foto local del producto')

    const payload = {
      store_id: selectedStoreForProduct,
      name: formProd.name,
      price: parseFloat(formProd.price),
      categoria: formProd.categoria,
      description: formProd.descripcion,
      image_url: imageUrls[0],
      images: imageUrls,
      extra_images: imageUrls.slice(1),
      video_url: formProd.video_url || null,
      tallas: formProd.tipo==='boutique' ? formProd.tallas.split(',').map(s=>s.trim()).filter(Boolean) : null,
    }

    const {error} = await supabase.from('products').insert(payload)
    if(error) alert('Error producto: '+error.message)
    else {
      alert('Producto agregado a '+storeObj?.name+' ✓')
      setFormProd({name:'', price:'', categoria:'vestidos', descripcion:'', tipo:storeObj?.tipo_tienda||'boutique', tallas:'S,M,L,XL', video_url:'', image_files:[], image_previews:[]})
      if(fileProductRef.current) fileProductRef.current.value=''
      cargarTodo()
    }
  }

  const copiar = (txt)=>{ navigator.clipboard.writeText(txt); alert('Link copiado: '+txt) }

  const tiendasFiltradas = stores.filter(s=> !qTienda || s.name.toLowerCase().includes(qTienda.toLowerCase()) || s.slug.includes(qTienda.toLowerCase()))

  if(!auth){
    return (
      <div style={{minHeight:'100vh', background:'#111', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'Inter, system-ui'}}>
        <div style={{background:'#fff', borderRadius:20, padding:24, maxWidth:400, width:'100%'}}>
          <h2 style={{fontWeight:900}}>🛡️ Super Admin TiendaNica</h2>
          <p style={{fontSize:12, color:'#666', marginTop:6}}>Boutique, General y Comida + productos + ubicación + verificación</p>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Clave admin" style={{width:'100%', border:'1.5px solid #ddd', borderRadius:12, padding:12, marginTop:14}}/>
          <button onClick={login} style={{width:'100%', marginTop:12, background:'#0066FF', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:800}}>Entrar al Super Admin</button>
          <p style={{fontSize:10, color:'#999', marginTop:10, textAlign:'center'}}>Clave por defecto: tiendanica2025</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh', background:'#F5F1ED', padding:12, fontFamily:'Inter, system-ui'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:1200, margin:'0 auto'}}>
        <h1 style={{fontWeight:900, fontSize:20}}>🛡️ Super Admin TiendaNica • {stores.length} tiendas</h1>
        <div style={{display:'flex', gap:6}}>
          <a href="/" style={{background:'#fff', border:'1px solid #ddd', padding:'8px 12px', borderRadius:999, fontSize:11, textDecoration:'none', color:'#111'}}>Ver Market</a>
          <button onClick={()=>setAuth(false)} style={{background:'#111', color:'#fff', border:'none', padding:'8px 12px', borderRadius:999, fontSize:11}}>Salir</button>
        </div>
      </div>

      <div style={{display:'flex', gap:6, marginTop:14, maxWidth:1200, marginLeft:'auto', marginRight:'auto', overflowX:'auto', paddingBottom:4}}>
        <button onClick={()=>setTab('tiendas')} style={{padding:'10px 14px', borderRadius:999, border:'none', fontWeight:800, fontSize:11, background: tab==='tiendas' ? '#111' : '#fff', color: tab==='tiendas' ? '#fff' : '#111', whiteSpace:'nowrap'}}>🏪 Tiendas ({tiendasFiltradas.length})</button>
        <button onClick={()=>setTab('crear')} style={{padding:'10px 14px', borderRadius:999, border:'none', fontWeight:800, fontSize:11, background: tab==='crear' ? '#FF6A00' : '#fff', color: tab==='crear' ? '#fff' : '#111', whiteSpace:'nowrap'}}>➕ Crear Tienda</button>
        <button onClick={()=>setTab('productos')} style={{padding:'10px 14px', borderRadius:999, border:'none', fontWeight:800, fontSize:11, background: tab==='productos' ? '#0066FF' : '#fff', color: tab==='productos' ? '#fff' : '#111', whiteSpace:'nowrap'}}>📦 Agregar Productos</button>
        <button onClick={()=>setTab('verificaciones')} style={{padding:'10px 14px', borderRadius:999, border:'none', fontWeight:800, fontSize:11, background: tab==='verificaciones' ? '#7000FF' : '#fff', color: tab==='verificaciones' ? '#fff' : '#111', whiteSpace:'nowrap'}}>🛡️ Verificaciones ({pendientes.length})</button>
        <button onClick={()=>setTab('reportes')} style={{padding:'10px 14px', borderRadius:999, border:'none', fontWeight:800, fontSize:11, background: tab==='reportes' ? '#FF3B30' : '#fff', color: tab==='reportes' ? '#fff' : '#111', whiteSpace:'nowrap'}}>🚨 Reportes ({reportes.length})</button>
      </div>

      <div style={{maxWidth:1200, margin:'14px auto 0'}}>
        {tab==='tiendas' && (
          <div style={{background:'#fff', borderRadius:16, padding:12, border:'1px solid #EDE6E3'}}>
            <div style={{display:'flex', gap:8, marginBottom:10}}>
              <input value={qTienda} onChange={e=>setQTienda(e.target.value)} placeholder="Buscar tienda..." style={{flex:1, border:'1.5px solid #ddd', borderRadius:999, padding:'10px 14px'}}/>
              <button onClick={cargarTodo} style={{background:'#F0F0F0', border:'none', padding:'10px 14px', borderRadius:999, fontSize:11}}>↻ Actualizar</button>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:10}}>
              {tiendasFiltradas.map(s=>(
                <div key={s.id} style={{border:'1px solid #eee', borderRadius:14, padding:10, background:'#fff'}}>
                  <div style={{display:'flex', gap:10}}>
                    <img src={s.logo_url || '/tienda-nica-logo.png'} style={{width:50, height:50, borderRadius:10, objectFit:'cover', background:'#f5f5f5'}}/>
                    <div style={{flex:1}}>
                      <b style={{fontSize:13}}>{s.name}</b><br/>
                      <span style={{fontSize:10, background: s.tipo_tienda==='boutique' ? '#0066FF' : s.tipo_tienda==='comida' ? '#FF3B30' : '#888', color:'#fff', padding:'2px 6px', borderRadius:999, textTransform:'uppercase'}}>{s.tipo_tienda}</span>
                      <span style={{fontSize:10, color:'#666', marginLeft:6}}>{s.departamento || ''} • {s.verification_status || 'nueva'}</span><br/>
                      <span style={{fontSize:10, color:'#999'}}>{s.whatsapp}</span>
                    </div>
                  </div>
                  {s.direccion && <p style={{fontSize:11, color:'#666', marginTop:6}}>📍 {s.direccion}</p>}
                  <div style={{display:'flex', gap:6, marginTop:8, flexWrap:'wrap'}}>
                    <a href={`/${s.slug}`} target="_blank" style={{background:'#111', color:'#fff', padding:'6px 10px', borderRadius:999, fontSize:10, textDecoration:'none', fontWeight:700}}>👁️ Vista previa</a>
                    <button onClick={()=>copiar(`https://tiendanica.store/${s.slug}`)} style={{background:'#F0F0F0', border:'none', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:700}}>🔗 Link tienda</button>
                    <button onClick={()=>copiar(`https://tiendanica.store/${s.slug} - Admin dueño: https://wa.me/50581732620?text=Hola%20soy%20${encodeURIComponent(s.name)}%20quiero%20mi%20panel`)} style={{background:'#FFF7ED', border:'1px solid #FED7AA', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:700}}>👑 Link admin dueño</button>
                    <button onClick={()=>{setSelectedStoreForProduct(s.id); setTab('productos')}} style={{background:'#0066FF', color:'#fff', border:'none', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:700}}>➕ Agregar producto</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='crear' && (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div style={{background:'#fff', borderRadius:16, padding:16, border:'1px solid #EDE6E3'}}>
              <h3 style={{fontWeight:800}}>➕ Crear tienda (boutique, general, comida)</h3>
              <form onSubmit={crearTienda} style={{display:'flex', flexDirection:'column', gap:10, marginTop:12}}>
                <input required value={formTienda.name} onChange={e=>setFormTienda({...formTienda, name:e.target.value, slug:e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')})} placeholder="Nombre tienda" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}/>
                <input required value={formTienda.slug} onChange={e=>setFormTienda({...formTienda, slug:e.target.value})} placeholder="slug (link) ej: ileana-closet" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, fontSize:12}}/>
                <input required value={formTienda.whatsapp} onChange={e=>setFormTienda({...formTienda, whatsapp:e.target.value})} placeholder="WhatsApp 505..." style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}/>
                <select value={formTienda.tipo_tienda} onChange={e=>setFormTienda({...formTienda, tipo_tienda:e.target.value})} style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}>
                  <option value="boutique">BOUTIQUE (con tallas S,M,L)</option>
                  <option value="general">GENERAL (sin tallas)</option>
                  <option value="comida">COMIDA (con ubicación)</option>
                </select>
                <input value={formTienda.departamento} onChange={e=>setFormTienda({...formTienda, departamento:e.target.value})} placeholder="Departamento Ej: Managua, León" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}/>
                <input value={formTienda.direccion} onChange={e=>setFormTienda({...formTienda, direccion:e.target.value})} placeholder="Dirección exacta / referencia" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}/>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                  <input value={formTienda.lat} onChange={e=>setFormTienda({...formTienda, lat:e.target.value})} placeholder="Latitud (ej: 12.13) - ubicación futura" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, fontSize:11}}/>
                  <input value={formTienda.lng} onChange={e=>setFormTienda({...formTienda, lng:e.target.value})} placeholder="Longitud (ej: -86.25)" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, fontSize:11}}/>
                </div>
                <div style={{border:'1.5px dashed #0066FF', borderRadius:12, padding:12, background:'#F0F7FF'}}>
                  <p style={{fontSize:11, fontWeight:700}}>📸 Foto de portada / logo (subida local)</p>
                  <input ref={fileLogoRef} type="file" accept="image/*" onChange={handleLogoFile} style={{marginTop:6, fontSize:11}}/>
                  {formTienda.logo_preview && <img src={formTienda.logo_preview} style={{width:'100%', height:120, objectFit:'cover', borderRadius:10, marginTop:8}}/>}
                </div>
                <button type="submit" style={{background:'#FF6A00', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:800}}>Crear tienda ahora</button>
              </form>
            </div>
            <div style={{background:'#111', color:'#fff', borderRadius:16, padding:16}}>
              <h3 style={{fontWeight:800}}>📍 Ubicación (próximamente)</h3>
              <p style={{fontSize:11, opacity:0.7, marginTop:8}}>Estamos guardando lat/lng y dirección para cuando activemos mapa en TiendaNica. Por ahora se guarda en DB y lo ves en la tarjeta de tienda.</p>
              <p style={{fontSize:11, marginTop:10}}>Cuando lo actives, la tienda aparecerá con botón "Cómo llegar" que abre Google Maps con esas coordenadas.</p>
              <div style={{background:'#222', borderRadius:10, padding:10, marginTop:12, fontSize:11}}>
                <b>Buckets necesarios en Supabase Storage:</b><br/>
                - store-logos (privado o público)<br/>
                - product-images (público)<br/>
                Crea ambos como Public bucket si no existen.
              </div>
              <div style={{marginTop:16}}>
                <p style={{fontSize:12, fontWeight:800}}>🔗 Links que generamos automático:</p>
                <ul style={{fontSize:11, opacity:0.8, marginTop:6, paddingLeft:16, lineHeight:'1.7'}}>
                  <li>Link tienda: tiendanica.store/slug</li>
                  <li>Link admin dueño: WhatsApp con acceso</li>
                  <li>Vista previa: /slug</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {tab==='productos' && (
          <div style={{display:'grid', gridTemplateColumns:'350px 1fr', gap:12}}>
            <div style={{background:'#fff', borderRadius:16, padding:16, border:'1px solid #EDE6E3'}}>
              <h3 style={{fontWeight:800}}>📦 Agregar producto a cliente</h3>
              <select value={selectedStoreForProduct} onChange={e=>setSelectedStoreForProduct(e.target.value)} style={{width:'100%', border:'1.5px solid #0066FF', borderRadius:10, padding:10, marginTop:10, fontWeight:700}}>
                <option value="">-- Selecciona tienda --</option>
                {stores.map(s=><option key={s.id} value={s.id}>{s.name} - {s.tipo_tienda}</option>)}
              </select>
              {selectedStoreForProduct && (
                <form onSubmit={crearProducto} style={{display:'flex', flexDirection:'column', gap:8, marginTop:12}}>
                  <input required value={formProd.name} onChange={e=>setFormProd({...formProd, name:e.target.value})} placeholder="Nombre producto Ej: Vestido rojo" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}/>
                  <input required value={formProd.price} onChange={e=>setFormProd({...formProd, price:e.target.value})} placeholder="Precio C$ Ej: 850" type="number" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}/>
                  <select value={formProd.categoria} onChange={e=>setFormProd({...formProd, categoria:e.target.value})} style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}>
                    {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <textarea value={formProd.descripcion} onChange={e=>setFormProd({...formProd, descripcion:e.target.value})} placeholder="Descripción" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, minHeight:60}}/>
                  <input value={formProd.video_url} onChange={e=>setFormProd({...formProd, video_url:e.target.value})} placeholder="Video URL opcional (mp4)" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, fontSize:11}}/>
                  <div style={{display:'flex', gap:6}}>
                    <select value={formProd.tipo} onChange={e=>setFormProd({...formProd, tipo:e.target.value})} style={{flex:1, border:'1.5px solid #ddd', borderRadius:10, padding:10, fontSize:11}}>
                      <option value="boutique">Boutique (con tallas)</option>
                      <option value="general">General</option>
                      <option value="comida">Comida</option>
                    </select>
                    {formProd.tipo==='boutique' && <input value={formProd.tallas} onChange={e=>setFormProd({...formProd, tallas:e.target.value})} placeholder="Tallas S,M,L" style={{flex:1, border:'1.5px solid #ddd', borderRadius:10, padding:10, fontSize:11}}/>}
                  </div>
                  <div style={{border:'1.5px dashed #FF6A00', borderRadius:12, padding:10, background:'#FFF7ED'}}>
                    <p style={{fontSize:11, fontWeight:700}}>📸 Fotos producto (subida local, varias)</p>
                    <input ref={fileProductRef} type="file" accept="image/*" multiple onChange={handleProductFiles} style={{marginTop:6, fontSize:11}}/>
                    <div style={{display:'flex', gap:4, marginTop:6, flexWrap:'wrap'}}>
                      {formProd.image_previews.map((src,i)=><img key={i} src={src} style={{width:50, height:50, objectFit:'cover', borderRadius:6}}/>)}
                    </div>
                  </div>
                  <button type="submit" style={{background:'#0066FF', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:800}}>Agregar producto a tienda</button>
                </form>
              )}
            </div>
            <div style={{background:'#fff', borderRadius:16, padding:16, border:'1px solid #EDE6E3'}}>
              <h3 style={{fontWeight:800}}>Productos recientes ({products.length})</h3>
              <div style={{maxHeight:700, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, marginTop:10}}>
                {products.filter(p=> !selectedStoreForProduct || p.store_id===selectedStoreForProduct).map(p=>(
                  <div key={p.id} style={{display:'flex', gap:8, border:'1px solid #f0f0f0', borderRadius:10, padding:8, alignItems:'center'}}>
                    <img src={p.image_url} style={{width:45, height:45, objectFit:'cover', borderRadius:8}}/>
                    <div style={{flex:1}}><b style={{fontSize:12}}>{p.name}</b><br/><span style={{fontSize:10, color:'#666'}}>C$ {p.price} • {p.stores?.name || p.categoria}</span></div>
                    <a href={`/${p.stores?.slug}`} target="_blank" style={{background:'#F0F0F0', padding:'6px 10px', borderRadius:999, fontSize:10, textDecoration:'none', color:'#111'}}>Ver</a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==='verificaciones' && (
          <div style={{background:'#fff', borderRadius:16, padding:16, border:'1px solid #EDE6E3'}}>
            <h3 style={{fontWeight:800}}>🛡️ Verificaciones pendientes ({pendientes.length})</h3>
            {pendientes.map(v=>(
              <div key={v.id} style={{border:'1px solid #eee', borderRadius:12, padding:12, marginTop:10}}>
                <b>{v.stores?.name}</b> - {v.stores?.whatsapp} - {v.stores?.slug}<br/>
                <span style={{fontSize:11, color:'#666'}}>Cédula: {v.cedula_nombre} • {new Date(v.created_at).toLocaleString()}</span>
                <div style={{display:'flex', gap:6, marginTop:8, flexWrap:'wrap'}}>
                  <button onClick={async()=>{
                    const supabase=getSupabase()
                    await supabase.from('store_verifications').update({status:'verificada', nivel:'verificada', verificada_at:new Date().toISOString()}).eq('id',v.id)
                    await supabase.from('stores').update({verification_status:'verificada', verification_badge:'verificada'}).eq('id',v.store_id)
                    setPendientes(p=>p.filter(x=>x.id!==v.id))
                  }} style={{background:'#0066FF', color:'#fff', border:'none', padding:'8px 14px', borderRadius:999, fontSize:12, fontWeight:800}}>✓ Aprobar</button>
                  <button onClick={async()=>{
                    const supabase=getSupabase()
                    await supabase.from('store_verifications').update({status:'rechazada'}).eq('id',v.id)
                    setPendientes(p=>p.filter(x=>x.id!==v.id))
                  }} style={{background:'#F0F0F0', border:'none', padding:'8px 14px', borderRadius:999, fontSize:12}}>Rechazar</button>
                  <a href={`https://wa.me/${v.stores?.whatsapp}`} target="_blank" style={{background:'#25D366', color:'#fff', padding:'8px 14px', borderRadius:999, fontSize:12, textDecoration:'none'}}>WhatsApp</a>
                </div>
              </div>
            ))}
            {pendientes.length===0 && <p style={{fontSize:12, color:'#999', marginTop:10}}>No hay pendientes.</p>}
          </div>
        )}

        {tab==='reportes' && (
          <div style={{background:'#fff', borderRadius:16, padding:16, border:'1px solid #EDE6E3'}}>
            <h3 style={{fontWeight:800}}>🚨 Reportes fraude ({reportes.length})</h3>
            {reportes.map(r=>(
              <div key={r.id} style={{border:'1px solid #FFD6D6', background:'#FFF5F5', borderRadius:12, padding:12, marginTop:10}}>
                <b>{r.stores?.name}</b> - <span style={{background:'#FF3B30', color:'#fff', padding:'2px 6px', borderRadius:999, fontSize:10}}>{r.tipo}</span>
                <p style={{fontSize:12, marginTop:6}}>{r.descripcion}</p>
                <p style={{fontSize:10, color:'#666'}}>Reportó: {r.reporter_name} - {r.reporter_whatsapp}</p>
              </div>
            ))}
            {reportes.length===0 && <p style={{fontSize:12, color:'#999', marginTop:10}}>Sin reportes.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
