'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if(!url || !key) return null
  return createClient(url,key)
}

const DEPARTAMENTOS_NI = ['Managua','León','Granada','Masaya','Chinandega','Estelí','Matagalpa','Jinotega','Carazo','Rivas','Boaco','Chontales','Madriz','Nueva Segovia','Río San Juan','RAAN','RAAS','Otro']

export default function SuperAdminConEdicion(){
  const [auth,setAuth]=useState(false)
  const [pass,setPass]=useState('')
  const [tab,setTab]=useState('tiendas')
  const [stores,setStores]=useState([])
  const [products,setProducts]=useState([])
  const [pendientes,setPendientes]=useState([])
  const [reportes,setReportes]=useState([])
  const [loading,setLoading]=useState(false)
  const [qTienda,setQTienda]=useState('')
  const [editingStore,setEditingStore]=useState(null)
  const [selectedStoreForProduct,setSelectedStoreForProduct]=useState('')
  const fileLogoRef = useRef(null)
  const fileEditLogoRef = useRef(null)
  const fileProductRef = useRef(null)

  const [formTienda,setFormTienda]=useState({
    name:'', slug:'', whatsapp:'', tipo_tienda:'boutique', 
    departamento:'Managua', municipio:'', direccion:'',
    logo_file:null, logo_preview:''
  })
  const [formEdit,setFormEdit]=useState({})
  const [formProd,setFormProd]=useState({
    name:'', price:'', categoria:'vestidos', descripcion:'', 
    tallas:'S,M,L,XL', video_url:'', image_files:[], image_previews:[]
  })

  const CATEGORIAS = ['vestidos','blusas','jeans','conjuntos','faldas','shorts','pijamas','zapatos','carteras','accesorios','belleza','salud','general','hogar','comida','otros','nuevo']

  const login = ()=>{
    if(pass === 'tiendanica2025' || pass === 'admin123' || pass === 'Nica2024'){
      setAuth(true)
      cargarTodo()
    } else alert('Clave incorrecta')
  }

  const cargarTodo = async ()=>{
    setLoading(true)
    const supabase = getSupabase()
    if(!supabase){ setLoading(false); return }
    const {data: s} = await supabase.from('stores').select('*').order('created_at',{ascending:false}).limit(300)
    const {data: p} = await supabase.from('products').select('*, stores(name,slug)').order('created_at',{ascending:false}).limit(300)
    const {data: v} = await supabase.from('store_verifications').select('*, stores(name, whatsapp, slug)').in('status',['pendiente','revision']).order('created_at',{ascending:false}).limit(100)
    const {data: r} = await supabase.from('fraud_reports').select('*, stores(name, whatsapp)').in('status',['abierto','investigando']).order('created_at',{ascending:false}).limit(100)
    setStores(s||[]); setProducts(p||[]); setPendientes(v||[]); setReportes(r||[]); setLoading(false)
  }

  const uploadFile = async (file, bucket='product-images')=>{
    const supabase = getSupabase()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`
    const {error} = await supabase.storage.from(bucket).upload(fileName, file)
    if(error){
      const other = bucket==='store-logos' ? 'product-images' : 'store-logos'
      const res2 = await supabase.storage.from(other).upload(fileName, file)
      if(res2.error) return null
      const {data} = supabase.storage.from(other).getPublicUrl(fileName)
      return data.publicUrl
    }
    const {data} = supabase.storage.from(bucket).getPublicUrl(fileName)
    return data.publicUrl
  }

  const crearTienda = async (e)=>{
    e.preventDefault()
    const supabase = getSupabase()
    if(!formTienda.name || !formTienda.slug || !formTienda.whatsapp) return alert('Falta nombre, slug, whatsapp')
    let logoUrl = '/tienda-nica-logo.png'
    if(formTienda.logo_file){
      const uploaded = await uploadFile(formTienda.logo_file, 'store-logos')
      if(uploaded) logoUrl = uploaded
    }
    const payload = {
      name: formTienda.name,
      slug: formTienda.slug.toLowerCase().replace(/ /g,'-').replace(/[^a-z0-9-]/g,''),
      whatsapp: formTienda.whatsapp,
      tipo_tienda: formTienda.tipo_tienda,
      logo_url: logoUrl,
      departamento: formTienda.departamento,
      municipio: formTienda.municipio,
      direccion: formTienda.direccion,
      verification_status: 'nueva',
      verification_badge: 'nueva'
    }
    const {error} = await supabase.from('stores').insert(payload)
    if(error) alert('Error: '+error.message)
    else {
      alert('Tienda creada ✓ '+formTienda.name+' en '+formTienda.departamento+' - '+formTienda.municipio)
      setFormTienda({name:'', slug:'', whatsapp:'', tipo_tienda:'boutique', departamento:'Managua', municipio:'', direccion:'', logo_file:null, logo_preview:''})
      if(fileLogoRef.current) fileLogoRef.current.value=''
      cargarTodo(); setTab('tiendas')
    }
  }

  const abrirEdicion = (store)=>{
    setEditingStore(store)
    setFormEdit({
      name: store.name, slug: store.slug, whatsapp: store.whatsapp, tipo_tienda: store.tipo_tienda,
      departamento: store.departamento || 'Managua', municipio: store.municipio || '', direccion: store.direccion || '',
      logo_url: store.logo_url, logo_file: null, logo_preview: ''
    })
  }

  const guardarEdicion = async (e)=>{
    e.preventDefault()
    const supabase = getSupabase()
    let logoUrl = formEdit.logo_url
    if(formEdit.logo_file){
      const uploaded = await uploadFile(formEdit.logo_file, 'store-logos')
      if(uploaded) logoUrl = uploaded
    }
    const payload = {
      name: formEdit.name,
      slug: formEdit.slug.toLowerCase().replace(/[^a-z0-9-]/g,''),
      whatsapp: formEdit.whatsapp,
      tipo_tienda: formEdit.tipo_tienda,
      logo_url: logoUrl,
      departamento: formEdit.departamento,
      municipio: formEdit.municipio,
      direccion: formEdit.direccion,
    }
    const {error} = await supabase.from('stores').update(payload).eq('id', editingStore.id)
    if(error) alert('Error editar: '+error.message)
    else {
      alert('Tienda actualizada ✓')
      setEditingStore(null)
      cargarTodo()
    }
  }

  const eliminarTienda = async (store)=>{
    if(!confirm(`¿Seguro eliminar ${store.name}? Esto borrará también sus ${products.filter(p=>p.store_id===store.id).length} productos. Usar si es fraude comprobado.`)) return
    if(!confirm(`CONFIRMACIÓN FINAL: ¿Eliminar ${store.name} y mandarla a blacklist?`)) return
    const supabase = getSupabase()
    await supabase.from('products').delete().eq('store_id', store.id)
    await supabase.from('store_verifications').delete().eq('store_id', store.id)
    const {error} = await supabase.from('stores').delete().eq('id', store.id)
    if(error) alert('Error: '+error.message)
    else {
      await supabase.from('blacklist').insert({whatsapp: store.whatsapp, nombre: store.name, motivo: 'Eliminada por fraude / admin', evidencia: 'Eliminada desde super admin'})
      alert('Tienda eliminada y WhatsApp agregado a blacklist ✓')
      cargarTodo()
    }
  }

  const aprobarVerificacion = async (id, store_id)=>{
    const supabase=getSupabase()
    await supabase.from('store_verifications').update({status:'verificada', nivel:'verificada', verificada_at:new Date().toISOString()}).eq('id',id)
    await supabase.from('stores').update({verification_status:'verificada', verification_badge:'verificada'}).eq('id',store_id)
    setPendientes(p=>p.filter(x=>x.id!==id))
    alert('¡Tienda verificada! Ahora tiene badge azul ✓')
  }

  const crearProducto = async (e)=>{
    e.preventDefault()
    const supabase = getSupabase()
    if(!selectedStoreForProduct) return alert('Selecciona tienda')
    if(!formProd.name || !formProd.price) return alert('Falta nombre y precio')
    let imageUrls = []
    if(formProd.image_files.length>0){
      for(let file of formProd.image_files){
        const url = await uploadFile(file, 'product-images')
        if(url) imageUrls.push(url)
      }
    }
    if(imageUrls.length===0) return alert('Sube al menos 1 foto')
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
      tallas: formProd.categoria==='boutique' || stores.find(s=>s.id===selectedStoreForProduct)?.tipo_tienda==='boutique' ? formProd.tallas.split(',').map(s=>s.trim()).filter(Boolean) : null,
    }
    const {error} = await supabase.from('products').insert(payload)
    if(error) alert('Error: '+error.message)
    else {
      alert('Producto agregado ✓')
      setFormProd({name:'', price:'', categoria:'vestidos', descripcion:'', tallas:'S,M,L,XL', video_url:'', image_files:[], image_previews:[]})
      if(fileProductRef.current) fileProductRef.current.value=''
      cargarTodo()
    }
  }

  const copiar = (txt)=>{ navigator.clipboard.writeText(txt); alert('Copiado: '+txt) }

  const tiendasFiltradas = stores.filter(s=> !qTienda || s.name.toLowerCase().includes(qTienda.toLowerCase()) || s.slug.includes(qTienda.toLowerCase()) || (s.municipio||'').toLowerCase().includes(qTienda.toLowerCase()))

  if(!auth){
    return (
      <div style={{minHeight:'100vh', background:'#111', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'Inter, system-ui'}}>
        <div style={{background:'#fff', borderRadius:20, padding:24, maxWidth:400, width:'100%'}}>
          <h2 style={{fontWeight:900}}>🛡️ Super Admin TiendaNica</h2>
          <p style={{fontSize:12, color:'#666', marginTop:6}}>Boutique, General, Comida + Editar + Ubicación Nicaragua</p>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Clave" style={{width:'100%', border:'1.5px solid #ddd', borderRadius:12, padding:12, marginTop:14}}/>
          <button onClick={login} style={{width:'100%', marginTop:12, background:'#0066FF', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:800}}>Entrar</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh', background:'#F5F1ED', padding:12, fontFamily:'Inter, system-ui'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:1250, margin:'0 auto', flexWrap:'wrap', gap:8}}>
        <h1 style={{fontWeight:900, fontSize:19}}>🛡️ Super Admin • {stores.length} tiendas • {products.length} productos</h1>
        <div style={{display:'flex', gap:6}}>
          <a href="/" style={{background:'#fff', border:'1px solid #ddd', padding:'8px 12px', borderRadius:999, fontSize:11, textDecoration:'none', color:'#111'}}>Market</a>
          <button onClick={()=>setAuth(false)} style={{background:'#111', color:'#fff', border:'none', padding:'8px 12px', borderRadius:999, fontSize:11}}>Salir</button>
        </div>
      </div>

      <div style={{display:'flex', gap:6, marginTop:14, maxWidth:1250, marginLeft:'auto', marginRight:'auto', overflowX:'auto', paddingBottom:4}}>
        <button onClick={()=>setTab('tiendas')} style={{padding:'10px 14px', borderRadius:999, border:'none', fontWeight:800, fontSize:11, background: tab==='tiendas' ? '#111' : '#fff', color: tab==='tiendas' ? '#fff' : '#111', whiteSpace:'nowrap'}}>🏪 Tiendas ({tiendasFiltradas.length})</button>
        <button onClick={()=>setTab('crear')} style={{padding:'10px 14px', borderRadius:999, border:'none', fontWeight:800, fontSize:11, background: tab==='crear' ? '#FF6A00' : '#fff', color: tab==='crear' ? '#fff' : '#111', whiteSpace:'nowrap'}}>➕ Crear</button>
        <button onClick={()=>setTab('productos')} style={{padding:'10px 14px', borderRadius:999, border:'none', fontWeight:800, fontSize:11, background: tab==='productos' ? '#0066FF' : '#fff', color: tab==='productos' ? '#fff' : '#111', whiteSpace:'nowrap'}}>📦 Productos</button>
        <button onClick={()=>setTab('verificaciones')} style={{padding:'10px 14px', borderRadius:999, border:'none', fontWeight:800, fontSize:11, background: tab==='verificaciones' ? '#7000FF' : '#fff', color: tab==='verificaciones' ? '#fff' : '#111', whiteSpace:'nowrap'}}>🛡️ Verificar ({pendientes.length})</button>
        <button onClick={()=>setTab('reportes')} style={{padding:'10px 14px', borderRadius:999, border:'none', fontWeight:800, fontSize:11, background: tab==='reportes' ? '#FF3B30' : '#fff', color: tab==='reportes' ? '#fff' : '#111', whiteSpace:'nowrap'}}>🚨 Reportes ({reportes.length})</button>
      </div>

      <div style={{maxWidth:1250, margin:'14px auto 0'}}>
        {tab==='tiendas' && (
          <div style={{background:'#fff', borderRadius:16, padding:12, border:'1px solid #EDE6E3'}}>
            <div style={{display:'flex', gap:8, marginBottom:10}}>
              <input value={qTienda} onChange={e=>setQTienda(e.target.value)} placeholder="Buscar por nombre, slug o municipio..." style={{flex:1, border:'1.5px solid #ddd', borderRadius:999, padding:'10px 14px'}}/>
              <button onClick={cargarTodo} style={{background:'#F0F0F0', border:'none', padding:'10px 14px', borderRadius:999, fontSize:11}}>↻ Actualizar</button>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:10}}>
              {tiendasFiltradas.map(s=>(
                <div key={s.id} style={{border:'1px solid #eee', borderRadius:14, padding:10, background:'#fff', position:'relative'}}>
                  <div style={{display:'flex', gap:10}}>
                    <img src={s.logo_url || '/tienda-nica-logo.png'} style={{width:50, height:50, borderRadius:10, objectFit:'cover', background:'#f5f5f5'}}/>
                    <div style={{flex:1}}>
                      <b style={{fontSize:13}}>{s.name}</b><br/>
                      <span style={{fontSize:10, background: s.tipo_tienda==='boutique' ? '#0066FF' : s.tipo_tienda==='comida' ? '#FF3B30' : '#888', color:'#fff', padding:'2px 6px', borderRadius:999, textTransform:'uppercase'}}>{s.tipo_tienda}</span>
                      <span style={{fontSize:10, color:'#666', marginLeft:6}}>{s.departamento || ''} {s.municipio ? `• ${s.municipio}` : ''} • {s.verification_status || 'nueva'}</span><br/>
                      <span style={{fontSize:10, color:'#999'}}>{s.whatsapp}</span>
                    </div>
                  </div>
                  {s.direccion && <p style={{fontSize:11, color:'#666', marginTop:6}}>📍 {s.direccion}</p>}
                  <div style={{display:'flex', gap:5, marginTop:8, flexWrap:'wrap'}}>
                    <a href={`/${s.slug}`} target="_blank" style={{background:'#111', color:'#fff', padding:'6px 10px', borderRadius:999, fontSize:10, textDecoration:'none', fontWeight:700}}>👁️ Ver tienda</a>
                    <button onClick={()=>copiar(`https://tiendanica.store/${s.slug}`)} style={{background:'#F0F0F0', border:'none', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:700}}>🔗 Link tienda</button>
                    <button onClick={()=>copiar(`https://tiendanica.store/${s.slug}/admin`)} style={{background:'#0066FF', color:'#fff', border:'none', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:700}}>👑 Admin dueño</button>
                    <button onClick={()=>abrirEdicion(s)} style={{background:'#FF6A00', color:'#fff', border:'none', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:700}}>✏️ Editar</button>
                    <button onClick={()=>eliminarTienda(s)} style={{background:'#FFE0E0', color:'#C00', border:'1px solid #FCC', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:700}}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='crear' && (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div style={{background:'#fff', borderRadius:16, padding:16, border:'1px solid #EDE6E3'}}>
              <h3 style={{fontWeight:800}}>➕ Crear tienda - Nicaragua</h3>
              <form onSubmit={crearTienda} style={{display:'flex', flexDirection:'column', gap:10, marginTop:12}}>
                <input required value={formTienda.name} onChange={e=>setFormTienda({...formTienda, name:e.target.value, slug:e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')})} placeholder="Nombre tienda" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}/>
                <input required value={formTienda.slug} onChange={e=>setFormTienda({...formTienda, slug:e.target.value})} placeholder="slug ej: farmacia-mas-vida" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, fontSize:12}}/>
                <input required value={formTienda.whatsapp} onChange={e=>setFormTienda({...formTienda, whatsapp:e.target.value})} placeholder="WhatsApp 505..." style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}/>
                <select value={formTienda.tipo_tienda} onChange={e=>setFormTienda({...formTienda, tipo_tienda:e.target.value})} style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}>
                  <option value="boutique">BOUTIQUE (con tallas)</option>
                  <option value="general">GENERAL</option>
                  <option value="comida">COMIDA</option>
                </select>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                  <select value={formTienda.departamento} onChange={e=>setFormTienda({...formTienda, departamento:e.target.value})} style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}>
                    {DEPARTAMENTOS_NI.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                  <input value={formTienda.municipio} onChange={e=>setFormTienda({...formTienda, municipio:e.target.value})} placeholder="Municipio / Comunidad" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}/>
                </div>
                <input value={formTienda.direccion} onChange={e=>setFormTienda({...formTienda, direccion:e.target.value})} placeholder="Dirección libre (opcional)" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, fontSize:12}}/>
                <div style={{border:'1.5px dashed #0066FF', borderRadius:12, padding:10, background:'#F0F7FF'}}>
                  <p style={{fontSize:11, fontWeight:700}}>📸 Portada / Logo (local)</p>
                  <input ref={fileLogoRef} type="file" accept="image/*" onChange={(e)=>{const f=e.target.files[0]; if(f) setFormTienda({...formTienda, logo_file:f, logo_preview:URL.createObjectURL(f)})}} style={{marginTop:6, fontSize:11}}/>
                  {formTienda.logo_preview && <img src={formTienda.logo_preview} style={{width:'100%', height:120, objectFit:'cover', borderRadius:10, marginTop:8}}/>}
                </div>
                <button type="submit" style={{background:'#FF6A00', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:800}}>Crear tienda</button>
              </form>
            </div>
            <div style={{background:'#111', color:'#fff', borderRadius:16, padding:16}}>
              <h3 style={{fontWeight:800}}>👑 Link admin del dueño - CORREGIDO</h3>
              <p style={{fontSize:12, opacity:0.8, marginTop:8}}>Ahora el botón 👑 Admin dueño copia exactamente:</p>
              <div style={{background:'#222', borderRadius:10, padding:10, marginTop:10, fontSize:12, fontFamily:'monospace', color:'#00FF88'}}>https://tiendanica.store/su-slug/admin</div>
              <p style={{fontSize:11, opacity:0.6, marginTop:10}}>Ejemplo: https://tiendanica.store/farmacia-mas-vida/admin<br/>Ese es el panel real del dueño donde él sube sus productos.</p>
              <div style={{background:'#222', borderRadius:10, padding:10, marginTop:12, fontSize:11}}>
                <b>Cómo compartir al dueño:</b><br/>
                1. Creas su tienda<br/>
                2. Click en 👑 Admin dueño (copia link)<br/>
                3. Se lo mandas por WhatsApp: "Hola {formTienda.name}! Tu tienda ya está lista: https://tiendanica.store/su-slug y tu panel admin es: https://tiendanica.store/su-slug/admin"
              </div>
            </div>
          </div>
        )}

        {editingStore && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16}}>
            <div style={{background:'#fff', borderRadius:20, padding:20, maxWidth:500, width:'100%', maxHeight:'90vh', overflowY:'auto'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h3 style={{fontWeight:800}}>✏️ Editar: {editingStore.name}</h3>
                <button onClick={()=>setEditingStore(null)} style={{background:'#F0F0F0', border:'none', width:30, height:30, borderRadius:999}}>X</button>
              </div>
              <form onSubmit={guardarEdicion} style={{display:'flex', flexDirection:'column', gap:10, marginTop:12}}>
                <input required value={formEdit.name} onChange={e=>setFormEdit({...formEdit, name:e.target.value})} placeholder="Nombre" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}/>
                <input required value={formEdit.slug} onChange={e=>setFormEdit({...formEdit, slug:e.target.value})} placeholder="slug" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, fontSize:12}}/>
                <input required value={formEdit.whatsapp} onChange={e=>setFormEdit({...formEdit, whatsapp:e.target.value})} placeholder="WhatsApp" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}/>
                <select value={formEdit.tipo_tienda} onChange={e=>setFormEdit({...formEdit, tipo_tienda:e.target.value})} style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}>
                  <option value="boutique">BOUTIQUE</option><option value="general">GENERAL</option><option value="comida">COMIDA</option>
                </select>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                  <select value={formEdit.departamento} onChange={e=>setFormEdit({...formEdit, departamento:e.target.value})} style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}>
                    {DEPARTAMENTOS_NI.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                  <input value={formEdit.municipio} onChange={e=>setFormEdit({...formEdit, municipio:e.target.value})} placeholder="Municipio / Comunidad" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}/>
                </div>
                <input value={formEdit.direccion} onChange={e=>setFormEdit({...formEdit, direccion:e.target.value})} placeholder="Dirección libre" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, fontSize:12}}/>
                <div style={{border:'1.5px dashed #0066FF', borderRadius:12, padding:10, background:'#F0F7FF'}}>
                  <p style={{fontSize:11, fontWeight:700}}>Cambiar portada / logo</p>
                  <input ref={fileEditLogoRef} type="file" accept="image/*" onChange={(e)=>{const f=e.target.files[0]; if(f) setFormEdit({...formEdit, logo_file:f, logo_preview:URL.createObjectURL(f)})}} style={{marginTop:6, fontSize:11}}/>
                  {(formEdit.logo_preview || formEdit.logo_url) && <img src={formEdit.logo_preview || formEdit.logo_url} style={{width:'100%', height:120, objectFit:'cover', borderRadius:10, marginTop:8}}/>}
                </div>
                <div style={{display:'flex', gap:8}}>
                  <button type="button" onClick={()=>setEditingStore(null)} style={{flex:1, background:'#F0F0F0', border:'none', padding:12, borderRadius:999, fontWeight:700}}>Cancelar</button>
                  <button type="submit" style={{flex:2, background:'#0066FF', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:800}}>Guardar cambios</button>
                </div>
                <div style={{background:'#FFF7ED', borderRadius:10, padding:8, marginTop:4, fontSize:11}}>
                  <b>Admin del dueño:</b><br/>
                  <span style={{fontFamily:'monospace', fontSize:10}}>https://tiendanica.store/{formEdit.slug}/admin</span>
                </div>
              </form>
            </div>
          </div>
        )}

        {tab==='productos' && (
          <div style={{display:'grid', gridTemplateColumns:'360px 1fr', gap:12}}>
            <div style={{background:'#fff', borderRadius:16, padding:16, border:'1px solid #EDE6E3'}}>
              <h3 style={{fontWeight:800}}>📦 Agregar producto</h3>
              <select value={selectedStoreForProduct} onChange={e=>setSelectedStoreForProduct(e.target.value)} style={{width:'100%', border:'1.5px solid #0066FF', borderRadius:10, padding:10, marginTop:10, fontWeight:700}}>
                <option value="">-- Selecciona tienda --</option>
                {stores.map(s=><option key={s.id} value={s.id}>{s.name} - {s.tipo_tienda}</option>)}
              </select>
              {selectedStoreForProduct && (
                <form onSubmit={crearProducto} style={{display:'flex', flexDirection:'column', gap:8, marginTop:12}}>
                  <input required value={formProd.name} onChange={e=>setFormProd({...formProd, name:e.target.value})} placeholder="Nombre producto" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}/>
                  <input required value={formProd.price} onChange={e=>setFormProd({...formProd, price:e.target.value})} placeholder="Precio C$" type="number" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}/>
                  <select value={formProd.categoria} onChange={e=>setFormProd({...formProd, categoria:e.target.value})} style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}>
                    {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <textarea value={formProd.descripcion} onChange={e=>setFormProd({...formProd, descripcion:e.target.value})} placeholder="Descripción" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, minHeight:60}}/>
                  <input value={formProd.video_url} onChange={e=>setFormProd({...formProd, video_url:e.target.value})} placeholder="Video URL opcional" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, fontSize:11}}/>
                  <input value={formProd.tallas} onChange={e=>setFormProd({...formProd, tallas:e.target.value})} placeholder="Tallas S,M,L,XL" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, fontSize:11}}/>
                  <div style={{border:'1.5px dashed #FF6A00', borderRadius:12, padding:10, background:'#FFF7ED'}}>
                    <p style={{fontSize:11, fontWeight:700}}>Fotos producto (local)</p>
                    <input ref={fileProductRef} type="file" accept="image/*" multiple onChange={(e)=>{const files=Array.from(e.target.files); const previews=files.map(f=>URL.createObjectURL(f)); setFormProd({...formProd, image_files:files, image_previews:previews})}} style={{marginTop:6, fontSize:11}}/>
                    <div style={{display:'flex', gap:4, marginTop:6, flexWrap:'wrap'}}>{formProd.image_previews.map((src,i)=><img key={i} src={src} style={{width:50, height:50, objectFit:'cover', borderRadius:6}}/>)}</div>
                  </div>
                  <button type="submit" style={{background:'#0066FF', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:800}}>Agregar producto</button>
                </form>
              )}
            </div>
            <div style={{background:'#fff', borderRadius:16, padding:16, border:'1px solid #EDE6E3'}}>
              <h3 style={{fontWeight:800}}>Productos ({products.length})</h3>
              <div style={{maxHeight:700, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, marginTop:10}}>
                {products.filter(p=> !selectedStoreForProduct || p.store_id===selectedStoreForProduct).map(p=>(
                  <div key={p.id} style={{display:'flex', gap:8, border:'1px solid #f0f0f0', borderRadius:10, padding:8, alignItems:'center'}}>
                    <img src={p.image_url} style={{width:45, height:45, objectFit:'cover', borderRadius:8}}/>
                    <div style={{flex:1}}><b style={{fontSize:12}}>{p.name}</b><br/><span style={{fontSize:10, color:'#666'}}>C$ {p.price} • {p.stores?.name || p.categoria}</span></div>
                    <button onClick={async()=>{if(confirm('¿Eliminar producto?')){const supabase=getSupabase(); await supabase.from('products').delete().eq('id',p.id); cargarTodo()}}} style={{background:'#FFE0E0', border:'none', padding:'6px 10px', borderRadius:999, fontSize:10}}>🗑️</button>
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
                  <button onClick={()=>aprobarVerificacion(v.id, v.store_id)} style={{background:'#0066FF', color:'#fff', border:'none', padding:'8px 14px', borderRadius:999, fontSize:12, fontWeight:800}}>✓ Aprobar</button>
                  <button onClick={async()=>{const supabase=getSupabase(); await supabase.from('store_verifications').update({status:'rechazada'}).eq('id',v.id); setPendientes(p=>p.filter(x=>x.id!==v.id))}} style={{background:'#F0F0F0', border:'none', padding:'8px 14px', borderRadius:999, fontSize:12}}>Rechazar</button>
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
