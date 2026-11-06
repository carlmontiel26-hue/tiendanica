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
  const [previewStore,setPreviewStore]=useState(null)
  const [editingProduct,setEditingProduct]=useState(null)
  const [viewMode,setViewMode]=useState('grid')
  const fileLogoRef = useRef(null)
  const fileEditLogoRef = useRef(null)
  const fileProductRef = useRef(null)
  const fileEditProductRef = useRef(null)

  // ===== SOLO AGREGADO PIN - NO TOCA LO DEMAS =====
  const genPIN = ()=> Math.floor(100000 + Math.random()*900000).toString()

  const [formTienda,setFormTienda]=useState({
    name:'', slug:'', whatsapp:'', tipo_tienda:'boutique', 
    departamento:'Managua', municipio:'', direccion:'',
    logo_file:null, logo_preview:'', admin_password: genPIN()
  })
  const [formEdit,setFormEdit]=useState({})
  const [formProd,setFormProd]=useState({
    name:'', price:'', categoria:'vestidos', descripcion:'', 
    tallas:'S,M,L,XL', video_url:'', image_files:[], image_previews:[]
  })
  const [formEditProd,setFormEditProd]=useState({})

  const CATEGORIAS = ['vestidos','blusas','jeans','conjuntos','faldas','shorts','pijamas','zapatos','carteras','accesorios','belleza','salud','general','hogar','comida','vehiculos','motos','autos','repuestos','otros','nuevo']

  const login = ()=>{
    if(pass === 'tiendanica2025' || pass === 'admin123' || pass === 'Nica2024' || pass === '6052611890000'){
      setAuth(true)
      cargarTodo()
    } else alert('Clave incorrecta')
  }

  const cargarTodo = async ()=>{
    setLoading(true)
    const supabase = getSupabase()
    if(!supabase){ setLoading(false); return }
    const {data: s} = await supabase.from('stores').select('*').order('created_at',{ascending:false}).limit(300)
    const {data: p} = await supabase.from('products').select('*, stores(name,slug,tipo_tienda)').order('created_at',{ascending:false}).limit(500)
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

  const cambiarVerificacion = async (storeId, tipo)=>{
    const supabase = getSupabase()
    if(!supabase) return
    const payload = { verification_status: tipo, verification_badge: tipo }
    const { error } = await supabase.from('stores').update(payload).eq('id', storeId)
    if(error){
      const { error: err2 } = await supabase.from('stores').update({ verification_status: tipo }).eq('id', storeId)
      if(err2){ alert('Error: '+err2.message); return }
    }
    setStores(prev=> prev.map(s=> s.id===storeId ? {...s, verification_status: tipo, verification_badge: tipo} : s))
    if(previewStore && previewStore.id===storeId) setPreviewStore(prev=>({...prev, verification_status: tipo, verification_badge: tipo}))
  }

  const crearTienda = async (e)=>{
    e.preventDefault()
    const supabase = getSupabase()
    if(!formTienda.name || !formTienda.slug || !formTienda.whatsapp) return alert('Falta nombre, slug, whatsapp')
    if(!/^\d{6}$/.test(formTienda.admin_password)) return alert('PIN debe ser 6 dígitos')
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
      verification_badge: 'nueva',
      admin_password: formTienda.admin_password
    }
    const {error} = await supabase.from('stores').insert(payload)
    if(error){
      if(error.message.includes('admin_password')){
        alert('⚠ Falta crear columna admin_password en Supabase. Ejecuta SQL: ALTER TABLE stores ADD COLUMN admin_password TEXT; Luego intenta de nuevo.')
        return
      }
      alert('Error: '+error.message)
    }
    else {
      alert(`Tienda creada ✓ ${formTienda.name} - PIN DUEÑO: ${formTienda.admin_password} \n\nGuárdalo para mandárselo por WhatsApp al dueño!\nLink: https://tiendanica.store/${formTienda.slug}/admin`)
      setFormTienda({name:'', slug:'', whatsapp:'', tipo_tienda:'boutique', departamento:'Managua', municipio:'', direccion:'', logo_file:null, logo_preview:'', admin_password: genPIN()})
      if(fileLogoRef.current) fileLogoRef.current.value=''
      cargarTodo(); setTab('tiendas')
    }
  }

  const abrirEdicion = (store)=>{
    setEditingStore(store)
    setFormEdit({
      name: store.name, slug: store.slug, whatsapp: store.whatsapp, tipo_tienda: store.tipo_tienda,
      departamento: store.departamento || 'Managua', municipio: store.municipio || '', direccion: store.direccion || '',
      logo_url: store.logo_url, logo_file: null, logo_preview: '', admin_password: store.admin_password || genPIN()
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
      admin_password: formEdit.admin_password
    }
    const {error} = await supabase.from('stores').update(payload).eq('id', editingStore.id)
    if(error) alert('Error editar: '+error.message)
    else {
      alert(`Tienda actualizada ✓ PIN: ${formEdit.admin_password}`)
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

  const abrirEdicionProducto = (prod)=>{
    setEditingProduct(prod)
    setFormEditProd({
      name: prod.name, price: prod.price, categoria: prod.categoria, descripcion: prod.description||'',
      video_url: prod.video_url||'', tallas: prod.tallas?.join(',')||'S,M,L,XL',
      image_url: prod.image_url, images: prod.images||[], logo_file:null, logo_preview:''
    })
  }

  const guardarEdicionProducto = async (e)=>{
    e.preventDefault()
    const supabase = getSupabase()
    let imageUrls = formEditProd.images || []
    if(formEditProd.logo_file){
      const uploaded = await uploadFile(formEditProd.logo_file, 'product-images')
      if(uploaded) imageUrls = [uploaded, ...imageUrls.slice(1)]
    }
    const payload = {
      name: formEditProd.name,
      price: parseFloat(formEditProd.price),
      categoria: formEditProd.categoria,
      description: formEditProd.descripcion,
      image_url: imageUrls[0]||formEditProd.image_url,
      images: imageUrls,
      video_url: formEditProd.video_url||null,
      tallas: formEditProd.tallas.split(',').map(s=>s.trim()).filter(Boolean)
    }
    const {error} = await supabase.from('products').update(payload).eq('id', editingProduct.id)
    if(error) alert('Error: '+error.message)
    else {
      alert('Producto actualizado ✓')
      setEditingProduct(null)
      cargarTodo()
    }
  }

  const copiar = (txt)=>{ navigator.clipboard.writeText(txt); }

  const tiendasFiltradas = stores.filter(s=> !qTienda || s.name.toLowerCase().includes(qTienda.toLowerCase()) || s.slug.includes(qTienda.toLowerCase()) || (s.municipio||'').toLowerCase().includes(qTienda.toLowerCase()) || (s.departamento||'').toLowerCase().includes(qTienda.toLowerCase()))
  const stats = {
    total: stores.length,
    boutique: stores.filter(s=>s.tipo_tienda==='boutique').length,
    general: stores.filter(s=>s.tipo_tienda==='general').length,
    comida: stores.filter(s=>s.tipo_tienda==='comida').length,
    vehiculos: stores.filter(s=>s.tipo_tienda==='vehiculos').length,
    verificadas: stores.filter(s=>s.verification_status==='verificada' || s.verification_status==='premium').length,
    productos: products.length
  }

  if(!auth){
    return (
      <div style={{minHeight:'100vh', background:'radial-gradient(1200px 600px at 20% -10%, #FF6A00 0%, transparent 50%), radial-gradient(1000px 500px at 80% 100%, #0066FF 0%, transparent 50%), #0A0A0B', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'Inter, system-ui'}}>
        <div style={{background:'rgba(255,255,255,0.98)', backdropFilter:'blur(20px)', borderRadius:28, padding:32, maxWidth:420, width:'100%', boxShadow:'0 20px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.2)'}}>
          <div style={{width:64, height:64, borderRadius:18, background:'linear-gradient(135deg, #FF6A00, #FF3B30, #0066FF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:900, color:'#fff', marginBottom:16}}>TN</div>
          <h2 style={{fontWeight:900, fontSize:22, letterSpacing:-0.5}}>Super Admin</h2>
          <p style={{fontSize:13, color:'#666', marginTop:6, lineHeight:1.4}}>Escritorio profesional • TiendaNica.store<br/>Control total de tiendas, productos y verificación</p>
          <div style={{marginTop:20, position:'relative'}}>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder="Clave de acceso" style={{width:'100%', border:'1.5px solid #E8E0DC', borderRadius:14, padding:'14px 16px', fontSize:14, background:'#FFFBF8', outline:'none'}}/>
          </div>
          <button onClick={login} style={{width:'100%', marginTop:14, background:'#111', color:'#fff', border:'none', padding:14, borderRadius:14, fontWeight:800, fontSize:14, letterSpacing:0.2, cursor:'pointer'}}>Entrar al escritorio →</button>
          <p style={{fontSize:10, color:'#999', marginTop:12, textAlign:'center'}}>Protegido • Acceso solo fundadores</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh', background:'#F6F1EC', fontFamily:'Inter, system-ui'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        *{font-family:'Inter', system-ui}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-thumb{background:#D9D0C8;border-radius:999px}
        /* === MOBILE ONLY - NO TOCA DESKTOP === */
        @media (max-width: 768px){
          input, select, textarea{ font-size:16px !important; }
          .super-header{ padding:10px 12px !important; }
          .super-header h1{ font-size:14px !important; }
          .super-stats{ grid-template-columns:repeat(2,1fr) !important; gap:8px !important; padding:0 12px !important; }
          .super-tabs{ padding:0 12px !important; gap:6px !important; }
          .super-tabs button{ padding:10px 14px !important; font-size:11px !important; min-height:40px !important; }
          .super-main{ padding:0 12px 20px !important; }
          .tiendas-grid{ grid-template-columns:1fr !important; gap:12px !important; }
          .tiendas-col{ display:flex !important; flex-direction:column !important; }
          .tiendas-card{ padding:12px !important; }
          .crear-grid{ grid-template-columns:1fr !important; gap:12px !important; }
          .productos-grid{ grid-template-columns:1fr !important; gap:12px !important; }
          .productos-form{ position:relative !important; top:0 !important; }
          .preview-col{ position:relative !important; top:0 !important; }
          .form-2col{ grid-template-columns:1fr !important; gap:10px !important; }
          .btn-action{ min-height:44px !important; padding:12px !important; font-size:13px !important; }
          .modal-box{ margin:10px !important; max-width:calc(100vw - 20px) !important; border-radius:20px !important; max-height:90vh !important; }
        }
      `}</style>

      <div className="super-header" style={{position:'sticky', top:0, zIndex:40, background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)', borderBottom:'1px solid #EDE6E3'}}>
        <div style={{maxWidth:1400, margin:'0 auto', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap'}}>
          <div style={{display:'flex', alignItems:'center', gap:14}}>
            <div style={{width:42, height:42, borderRadius:12, background:'linear-gradient(135deg, #111 0%, #333 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:14}}>TN</div>
            <div>
              <h1 style={{fontWeight:900, fontSize:16, letterSpacing:-0.3, lineHeight:1}}>TiendaNica • Super Admin</h1>
              <p style={{fontSize:11, color:'#8A7F78', marginTop:2}}>{stats.total} tiendas • {stats.productos} productos • {stats.verificadas} verificadas • {pendientes.length} por verificar • {stats.vehiculos} vehiculos</p>
            </div>
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <div style={{display:'flex', gap:6, background:'#F0E9E2', padding:4, borderRadius:999}}>
              <span style={{fontSize:11, padding:'6px 10px', borderRadius:999, background:'#fff', fontWeight:700, boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>⚡ {loading?'Cargando...':'En vivo'}</span>
              <button onClick={cargarTodo} style={{fontSize:11, padding:'6px 10px', borderRadius:999, border:'none', background:'transparent', fontWeight:700, cursor:'pointer'}}>↻ Sync</button>
            </div>
            <a href="/" style={{background:'#fff', border:'1px solid #E8E0DC', padding:'8px 14px', borderRadius:999, fontSize:11, textDecoration:'none', color:'#111', fontWeight:700}}>Market ↗</a>
            <button onClick={()=>setAuth(false)} style={{background:'#111', color:'#fff', border:'none', padding:'8px 14px', borderRadius:999, fontSize:11, fontWeight:700, cursor:'pointer'}}>Salir</button>
          </div>
        </div>
      </div>

      <div className="super-stats" style={{maxWidth:1400, margin:'14px auto 0', padding:'0 20px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:10}}>
        {[
          {k:'Total', v:stats.total, c:'#111', bg:'linear-gradient(135deg, #111, #333)'},
          {k:'Boutique', v:stats.boutique, c:'#fff', bg:'linear-gradient(135deg, #0066FF, #00C2FF)'},
          {k:'General', v:stats.general, c:'#111', bg:'linear-gradient(135deg, #FFD60A, #FFA500)'},
          {k:'Comida', v:stats.comida, c:'#fff', bg:'linear-gradient(135deg, #FF3B30, #FF6A00)'},
          {k:'Vehiculos', v:stats.vehiculos, c:'#fff', bg:'linear-gradient(135deg, #111, #FF6A00)'},
          {k:'Verificadas', v:stats.verificadas, c:'#fff', bg:'linear-gradient(135deg, #00C853, #00E676)'},
          {k:'Productos', v:stats.productos, c:'#111', bg:'linear-gradient(135deg, #EDE6E3, #F6F1EC)'},
        ].map(s=>(
          <div key={s.k} style={{background:s.bg, color:s.c, borderRadius:16, padding:'14px 16px', position:'relative', overflow:'hidden'}}>
            <p style={{fontSize:10, fontWeight:800, opacity:0.7, textTransform:'uppercase', letterSpacing:0.5}}>{s.k}</p>
            <p style={{fontSize:22, fontWeight:900, marginTop:4}}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="super-tabs" style={{maxWidth:1400, margin:'14px auto 0', padding:'0 20px', display:'flex', gap:8, overflowX:'auto'}}>
        {[
          {id:'tiendas', label:`🏪 Tiendas (${tiendasFiltradas.length})`, active:'#111'},
          {id:'crear', label:'➕ Crear Premium', active:'#FF6A00'},
          {id:'productos', label:`📦 Productos (${products.length})`, active:'#0066FF'},
          {id:'verificaciones', label:`🛡 Verificar (${pendientes.length})`, active:'#7000FF'},
          {id:'reportes', label:`🚨 Reportes (${reportes.length})`, active:'#FF3B30'},
          {id:'herramientas', label:'🛠 Herramientas', active:'#111'},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'11px 18px', borderRadius:999, border:'1px solid', borderColor: tab===t.id ? t.active : '#EDE6E3', fontWeight:800, fontSize:12, background: tab===t.id ? t.active : '#fff', color: tab===t.id ? '#fff' : '#111', whiteSpace:'nowrap', cursor:'pointer', transition:'all 0.2s'}}>{t.label}</button>
        ))}
      </div>

      <div className="super-main" style={{maxWidth:1400, margin:'16px auto', padding:'0 20px 40px'}}>
        {tab==='tiendas' && (
          <div className="tiendas-grid" style={{display:'grid', gridTemplateColumns:'1fr 380px', gap:16, alignItems:'start'}}>
            <div style={{background:'#fff', borderRadius:20, padding:16, border:'1px solid #EDE6E3', boxShadow:'0 4px 24px rgba(0,0,0,0.04)'}}>
              <div style={{display:'flex', gap:10, marginBottom:14, flexWrap:'wrap'}}>
                <div style={{flex:1, minWidth:240, position:'relative'}}>
                  <span style={{position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:14, opacity:0.4}}>🔍</span>
                  <input value={qTienda} onChange={e=>setQTienda(e.target.value)} placeholder="Buscar por nombre, slug, departamento, municipio..." style={{width:'100%', border:'1.5px solid #E8E0DC', borderRadius:12, padding:'12px 16px 12px 40px', background:'#FFFBF8', outline:'none', fontSize:13}}/>
                </div>
                <div style={{display:'flex', gap:6}}>
                  <button onClick={()=>setViewMode('grid')} style={{background: viewMode==='grid'?'#111':'#F5F1EC', color: viewMode==='grid'?'#fff':'#111', border:'none', padding:'10px 14px', borderRadius:12, fontSize:12, fontWeight:700, cursor:'pointer'}}>⊞ Grid</button>
                  <button onClick={()=>setViewMode('list')} style={{background: viewMode==='list'?'#111':'#F5F1EC', color: viewMode==='list'?'#fff':'#111', border:'none', padding:'10px 14px', borderRadius:12, fontSize:12, fontWeight:700, cursor:'pointer'}}>☰ Lista</button>
                </div>
              </div>

              <div style={{display: viewMode==='grid' ? 'grid' : 'flex', gridTemplateColumns: viewMode==='grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr', flexDirection: viewMode==='list' ? 'column' : 'row', gap:12}}>
                {tiendasFiltradas.map(s=>{
                  const countProd = products.filter(p=>p.store_id===s.id).length
                  const badge = (s.verification_status || s.verification_badge || 'nueva').toLowerCase()
                  return (
                    <div key={s.id} className="tiendas-card" style={{border:'1px solid #EDE6E3', borderRadius:16, padding:12, background:'#fff', position:'relative', transition:'all 0.2s', cursor:'default'}}>
                      <div style={{display:'flex', gap:12}}>
                        <img src={s.logo_url || '/tienda-nica-logo.png'} style={{width:56, height:56, borderRadius:12, objectFit:'cover', background:'#F5F1EC', border:'1px solid #EDE6E3'}}/>
                        <div style={{flex:1, minWidth:0}}>
                          <div style={{display:'flex', gap:6, alignItems:'center', flexWrap:'wrap'}}>
                            <b style={{fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{s.name}</b>
                            {badge==='verificada' && <span style={{fontSize:9, background:'#0066FF', color:'#fff', padding:'2px 6px', borderRadius:999, fontWeight:800}}>✓ VERIFICADA</span>}
                            {badge==='premium' && <span style={{fontSize:9, background:'#FF6A00', color:'#fff', padding:'2px 6px', borderRadius:999, fontWeight:800}}>⭐ PREMIUM</span>}
                            {badge==='nueva' && <span style={{fontSize:9, background:'#eee', color:'#666', padding:'2px 6px', borderRadius:999, fontWeight:700}}>NUEVA</span>}
                            {s.admin_password && <span style={{fontSize:9, background:'#111', color:'#FFD60A', padding:'2px 6px', borderRadius:999, fontWeight:800}}>🔐 PIN:{s.admin_password}</span>}
                          </div>
                          <div style={{display:'flex', gap:4, marginTop:4, flexWrap:'wrap'}}>
                            <span style={{fontSize:9, background: s.tipo_tienda==='boutique' ? '#0066FF' : s.tipo_tienda==='comida' ? '#FF3B30' : s.tipo_tienda==='vehiculos' ? '#111' : '#111', color:'#fff', padding:'3px 8px', borderRadius:999, textTransform:'uppercase', fontWeight:800}}>{s.tipo_tienda}</span>
                            <span style={{fontSize:9, background:'#F5F1EC', color:'#6B5E55', padding:'3px 8px', borderRadius:999}}>📍 {s.departamento} {s.municipio?`• ${s.municipio}`:''}</span>
                            <span style={{fontSize:9, background:'#F0F7FF', color:'#0066FF', padding:'3px 8px', borderRadius:999, fontWeight:700}}>{countProd} prod.</span>
                          </div>
                          <p style={{fontSize:11, color:'#8A7F78', marginTop:4}}>{s.whatsapp} • /{s.slug}</p>
                        </div>
                      </div>
                      {s.direccion && <p style={{fontSize:11, color:'#6B5E55', marginTop:8, background:'#FFFBF8', padding:'6px 8px', borderRadius:8, border:'1px dashed #EDE6E3'}}>📍 {s.direccion}</p>}
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginTop:10, background:'#F9F6F2', padding:8, borderRadius:10}}>
                        <button onClick={()=>cambiarVerificacion(s.id,'premium')} style={{background: badge==='premium' ? '#FF6A00' : '#fff', color: badge==='premium' ? '#fff' : '#FF6A00', border: badge==='premium' ? 'none' : '1.5px solid #FF6A00', padding:'8px 4px', borderRadius:8, fontSize:10, fontWeight:900, cursor:'pointer'}}>⭐ Premium</button>
                        <button onClick={()=>cambiarVerificacion(s.id,'verificada')} style={{background: badge==='verificada' ? '#0066FF' : '#fff', color: badge==='verificada' ? '#fff' : '#0066FF', border: badge==='verificada' ? 'none' : '1.5px solid #0066FF', padding:'8px 4px', borderRadius:8, fontSize:10, fontWeight:800, cursor:'pointer'}}>✓ Verif.</button>
                        <button onClick={()=>cambiarVerificacion(s.id,'nueva')} style={{background: badge==='nueva' ? '#111' : '#fff', color: badge==='nueva' ? '#fff' : '#666', border:'1px solid #ddd', padding:'8px 4px', borderRadius:8, fontSize:10, fontWeight:700, cursor:'pointer'}}>Nueva</button>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginTop:10}}>
                        <button onClick={()=>setPreviewStore(s)} style={{background:'#111', color:'#fff', border:'none', padding:'8px 6px', borderRadius:10, fontSize:10, fontWeight:800, cursor:'pointer'}}>👁 Vista previa</button>
                        <button onClick={()=>{setSelectedStoreForProduct(s.id); setTab('productos')}} style={{background:'#F5F1EC', border:'1px solid #EDE6E3', padding:'8px 6px', borderRadius:10, fontSize:10, fontWeight:700, cursor:'pointer'}}>📦 {countProd} Productos</button>
                        <button onClick={()=>abrirEdicion(s)} style={{background:'#FF6A00', color:'#fff', border:'none', padding:'8px 6px', borderRadius:10, fontSize:10, fontWeight:800, cursor:'pointer'}}>✏ Editar</button>
                      </div>
                      <div style={{display:'flex', gap:6, marginTop:6}}>
                        <button onClick={()=>{copiar(`https://tiendanica.store/${s.slug}`); alert('Link copiado')}} style={{flex:1, background:'#fff', border:'1px solid #EDE6E3', padding:'7px', borderRadius:10, fontSize:10, fontWeight:700, cursor:'pointer'}}>🔗 Link</button>
                        <button onClick={()=>{copiar(`https://tiendanica.store/${s.slug}/admin - PIN:${s.admin_password||'sin PIN'}`); alert(`Admin dueño copiado con PIN: ${s.admin_password||'sin PIN'}`)}} style={{flex:1, background:'#0066FF', color:'#fff', border:'none', padding:'7px', borderRadius:10, fontSize:10, fontWeight:700, cursor:'pointer'}}>👑 Admin dueño</button>
                        <button onClick={()=>eliminarTienda(s)} style={{background:'#FFE9E9', color:'#C00', border:'1px solid #FFD0D0', padding:'7px 10px', borderRadius:10, fontSize:10, fontWeight:800, cursor:'pointer'}}>🗑</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="preview-col" style={{position:'sticky', top:84, display:'flex', flexDirection:'column', gap:12}}>
              {previewStore ? (
                <div style={{background:'#111', color:'#fff', borderRadius:20, padding:16, border:'1px solid #222'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h3 style={{fontWeight:800, fontSize:13}}>👁 Vista previa en vivo</h3>
                    <button onClick={()=>setPreviewStore(null)} style={{background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:28, height:28, borderRadius:999, cursor:'pointer'}}>X</button>
                  </div>
                  <div style={{background:'#fff', borderRadius:14, overflow:'hidden', marginTop:12, border:'1px solid #222'}}>
                    <div style={{height:360, background:'#F5F1EC', position:'relative'}}>
                      <iframe src={`/${previewStore.slug}`} style={{width:'100%', height:'100%', border:'none', background:'#fff'}} title="preview"/>
                    </div>
                    <div style={{padding:12, background:'#fff', color:'#111'}}>
                      <b style={{fontSize:13}}>{previewStore.name}</b>
                      <p style={{fontSize:11, color:'#666', marginTop:4}}>{products.filter(p=>p.store_id===previewStore.id).length} productos • {previewStore.departamento} • {previewStore.municipio} • PIN:{previewStore.admin_password}</p>
                      <div style={{display:'flex', gap:6, marginTop:10}}>
                        <a href={`/${previewStore.slug}`} target="_blank" style={{flex:1, background:'#111', color:'#fff', padding:'8px', borderRadius:10, fontSize:11, textAlign:'center', textDecoration:'none', fontWeight:700}}>Abrir tienda ↗</a>
                        <button onClick={()=>abrirEdicion(previewStore)} style={{flex:1, background:'#F5F1EC', border:'none', padding:'8px', borderRadius:10, fontSize:11, fontWeight:700, cursor:'pointer'}}>Editar</button>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginTop:10}}>
                        <button onClick={()=>cambiarVerificacion(previewStore.id,'premium')} style={{background: (previewStore.verification_status==='premium') ? '#FF6A00' : '#F5F1EC', color: (previewStore.verification_status==='premium') ? '#fff' : '#FF6A00', border:'1.5px solid #FF6A00', padding:'8px', borderRadius:10, fontSize:10, fontWeight:900}}>⭐ Premium</button>
                        <button onClick={()=>cambiarVerificacion(previewStore.id,'verificada')} style={{background: (previewStore.verification_status==='verificada') ? '#0066FF' : '#F5F1EC', color: (previewStore.verification_status==='verificada') ? '#fff' : '#0066FF', border:'1.5px solid #0066FF', padding:'8px', borderRadius:10, fontSize:10, fontWeight:800}}>✓ Verificada</button>
                        <button onClick={()=>cambiarVerificacion(previewStore.id,'nueva')} style={{background:'#fff', border:'1px solid #ddd', padding:'8px', borderRadius:10, fontSize:10}}>Nueva</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{background:'#fff', borderRadius:20, padding:20, border:'1px dashed #E0D5CC', textAlign:'center'}}>
                  <p style={{fontSize:28}}>👁</p>
                  <p style={{fontSize:13, fontWeight:800, marginTop:8}}>Selecciona una tienda</p>
                  <p style={{fontSize:11, color:'#8A7F78', marginTop:4}}>Haz click en "Vista previa" para verla aquí en vivo sin salir del admin, como escritorio pro.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab==='crear' && (
          <div className="crear-grid" style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:16, alignItems:'start'}}>
            <div style={{background:'linear-gradient(180deg, #fff 0%, #FFFBF8 100%)', borderRadius:24, padding:22, border:'1px solid #EDE6E3', boxShadow:'0 8px 32px rgba(0,0,0,0.06)'}}>
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                <div style={{width:48, height:48, borderRadius:14, background:'linear-gradient(135deg, #FF6A00, #FF3B30)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:20, fontWeight:900}}>➕</div>
                <div>
                  <h3 style={{fontWeight:900, fontSize:18, letterSpacing:-0.3}}>Crear tienda Premium Nicaragua</h3>
                  <p style={{fontSize:12, color:'#8A7F78', marginTop:2}}>Clasificación automática • Ubicación real • Portada pro • Link admin dueño instantáneo</p>
                </div>
              </div>
              <form onSubmit={crearTienda} style={{display:'flex', flexDirection:'column', gap:12, marginTop:18}}>
                <div className="form-2col" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                  <div>
                    <label style={{fontSize:11, fontWeight:800, color:'#6B5E55'}}>NOMBRE TIENDA *</label>
                    <input required value={formTienda.name} onChange={e=>setFormTienda({...formTienda, name:e.target.value, slug:e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')})} placeholder="Ej: Motos El Chele" style={{width:'100%', border:'1.5px solid #E8E0DC', borderRadius:12, padding:'12px 14px', marginTop:6, background:'#fff', outline:'none'}}/>
                  </div>
                  <div>
                    <label style={{fontSize:11, fontWeight:800, color:'#6B5E55'}}>SLUG URL *</label>
                    <input required value={formTienda.slug} onChange={e=>setFormTienda({...formTienda, slug:e.target.value})} placeholder="motos-el-chele" style={{width:'100%', border:'1.5px solid #E8E0DC', borderRadius:12, padding:'12px 14px', marginTop:6, background:'#F5F1EC', fontSize:12, fontFamily:'monospace'}}/>
                  </div>
                </div>
                <div className="form-2col" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                  <div>
                    <label style={{fontSize:11, fontWeight:800, color:'#6B5E55'}}>WHATSAPP *</label>
                    <input required value={formTienda.whatsapp} onChange={e=>setFormTienda({...formTienda, whatsapp:e.target.value})} placeholder="50581732620" style={{width:'100%', border:'1.5px solid #E8E0DC', borderRadius:12, padding:'12px 14px', marginTop:6, background:'#fff'}}/>
                  </div>
                  <div>
                    <label style={{fontSize:11, fontWeight:800, color:'#6B5E55'}}>TIPO TIENDA *</label>
                    <select value={formTienda.tipo_tienda} onChange={e=>setFormTienda({...formTienda, tipo_tienda:e.target.value})} style={{width:'100%', border:'1.5px solid #E8E0DC', borderRadius:12, padding:'12px 14px', marginTop:6, background:'#fff', fontWeight:700}}>
                      <option value="boutique">👗 BOUTIQUE (con tallas, premium)</option>
                      <option value="general">🛍 GENERAL</option>
                      <option value="comida">🍔 COMIDA</option>
                      <option value="vehiculos">🏍 VEHICULOS / MOTOS</option>
                    </select>
                  </div>
                </div>

                <div style={{background:'linear-gradient(135deg, #111, #222)', borderRadius:14, padding:14, border:'1px solid #333'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <label style={{fontSize:11, fontWeight:800, color:'#FFD60A'}}>🔐 PIN DE 6 DÍGITOS DUEÑO * (Contraseña panel dueño)</label>
                    <button type="button" onClick={()=>setFormTienda({...formTienda, admin_password: genPIN()})} style={{background:'#FFD60A', color:'#000', border:'none', padding:'6px 12px', borderRadius:999, fontSize:10, fontWeight:800, cursor:'pointer'}}>🎲 Generar random</button>
                  </div>
                  <input required value={formTienda.admin_password} onChange={e=>setFormTienda({...formTienda, admin_password:e.target.value.replace(/\D/g,'').slice(0,6)})} placeholder="Ej: 123456" maxLength={6} inputMode="numeric" style={{width:'100%', border:'2px solid #FFD60A', borderRadius:12, padding:'12px 14px', marginTop:8, background:'#fff', fontWeight:900, fontSize:16, letterSpacing:4, textAlign:'center'}}/>
                  <p style={{fontSize:10, color:'#aaa', marginTop:6}}>Este PIN se lo mandas al dueño por WhatsApp. Ej: "Tu panel es tiendanica.store/{formTienda.slug||'slug'}/admin PIN: {formTienda.admin_password}"</p>
                </div>

                <div style={{background:'#F5F1EC', borderRadius:14, padding:14, border:'1px solid #EDE6E3'}}>
                  <p style={{fontSize:11, fontWeight:800, color:'#6B5E55'}}>UBICACIÓN REAL NICARAGUA</p>
                  <div className="form-2col" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:10}}>
                    <select value={formTienda.departamento} onChange={e=>setFormTienda({...formTienda, departamento:e.target.value})} style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:'12px', background:'#fff'}}>
                      {DEPARTAMENTOS_NI.map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                    <input value={formTienda.municipio} onChange={e=>setFormTienda({...formTienda, municipio:e.target.value})} placeholder="Municipio / Comunidad" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:'12px', background:'#fff'}}/>
                  </div>
                  <input value={formTienda.direccion} onChange={e=>setFormTienda({...formTienda, direccion:e.target.value})} placeholder="Dirección exacta (opcional, para entrega)" style={{width:'100%', border:'1.5px solid #E8E0DC', borderRadius:12, padding:'12px', marginTop:10, background:'#fff', fontSize:12}}/>
                </div>
                <div style={{border:'1.5px dashed #FF6A00', borderRadius:16, padding:14, background:'linear-gradient(135deg, #FFF7ED, #FFFBF8)'}}>
                  <p style={{fontSize:12, fontWeight:800}}>📸 Portada / Logo Premium</p>
                  <p style={{fontSize:11, color:'#8A7F78', marginTop:2}}>Sube desde tu PC, se comprime automático y queda pro</p>
                  <input ref={fileLogoRef} type="file" accept="image/*" onChange={(e)=>{const f=e.target.files[0]; if(f) setFormTienda({...formTienda, logo_file:f, logo_preview:URL.createObjectURL(f)})}} style={{marginTop:10, fontSize:12, width:'100%'}}/>
                  {formTienda.logo_preview && <img src={formTienda.logo_preview} style={{width:'100%', height:160, objectFit:'cover', borderRadius:12, marginTop:12, border:'1px solid #EDE6E3'}}/>}
                </div>
                <button type="submit" className="btn-action" style={{background:'linear-gradient(135deg, #111, #333)', color:'#fff', border:'none', padding:14, borderRadius:14, fontWeight:900, fontSize:14, cursor:'pointer', boxShadow:'0 8px 20px rgba(0,0,0,0.2)'}}>Crear tienda premium + PIN →</button>
              </form>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              <div style={{background:'#111', color:'#fff', borderRadius:20, padding:18}}>
                <h3 style={{fontWeight:800, fontSize:14}}>👑 Link admin dueño - Automático con PIN</h3>
                <div style={{background:'#1E1E1E', borderRadius:12, padding:12, marginTop:12, fontSize:12, fontFamily:'monospace', color:'#00FF88', border:'1px solid #2A2A2A'}}>https://tiendanica.store/{formTienda.slug||'tu-slug'}/admin</div>
                <div style={{background:'#FFD60A', color:'#000', borderRadius:12, padding:12, marginTop:10, fontSize:14, fontWeight:900, textAlign:'center', letterSpacing:2}}>🔐 PIN DUEÑO: {formTienda.admin_password}</div>
                <div style={{background:'rgba(255,255,255,0.06)', borderRadius:12, padding:12, marginTop:12, fontSize:11, lineHeight:1.5}}>
                  <b style={{color:'#FFD60A'}}>Nuevo con PIN seguro:</b><br/>
                  - Cada tienda nace con PIN de 6 dígitos<br/>
                  - El dueño entra a /{formTienda.slug||'slug'}/admin + PIN<br/>
                  - Puede cambiar su PIN adentro<br/>
                  - Link admin dueño + PIN se manda por WhatsApp<br/>
                </div>
                <button onClick={()=>{const msg=`🏪 Tu tienda ${formTienda.name||'TiendaNica'} está lista!\n\n👑 Tu panel de dueño:\nhttps://tiendanica.store/${formTienda.slug||'tu-slug'}/admin\n\n🔐 Tu PIN secreto: ${formTienda.admin_password}\n\nGuárdalo! Con eso entras a editar tus productos.\n\n- TiendaNica.store`; navigator.clipboard.writeText(msg); alert('Mensaje WhatsApp copiado con PIN!')}} style={{width:'100%', marginTop:12, background:'#25D366', color:'#fff', border:'none', padding:'12px', borderRadius:12, fontWeight:800, fontSize:12, cursor:'pointer'}}>📲 Copiar mensaje WhatsApp con PIN</button>
              </div>
            </div>
          </div>
        )}

        {editingStore && (
          <div style={{position:'fixed', inset:0, background:'rgba(10,6,4,0.6)', backdropFilter:'blur(12px)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16}}>
            <div className="modal-box" style={{background:'#fff', borderRadius:24, padding:22, maxWidth:560, width:'100%', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.4)', border:'1px solid #EDE6E3'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                  <img src={formEdit.logo_url||editingStore.logo_url} style={{width:44, height:44, borderRadius:10, objectFit:'cover'}}/>
                  <div>
                    <h3 style={{fontWeight:900, fontSize:15}}>Editar tienda</h3>
                    <p style={{fontSize:11, color:'#8A7F78'}}>{editingStore.name} • {editingStore.slug}</p>
                  </div>
                </div>
                <button onClick={()=>setEditingStore(null)} style={{background:'#F5F1EC', border:'1px solid #EDE6E3', width:32, height:32, borderRadius:999, fontWeight:800, cursor:'pointer'}}>✕</button>
              </div>
              <form onSubmit={guardarEdicion} style={{display:'flex', flexDirection:'column', gap:10, marginTop:16}}>
                <div className="form-2col" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                  <input required value={formEdit.name} onChange={e=>setFormEdit({...formEdit, name:e.target.value})} placeholder="Nombre" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}/>
                  <input required value={formEdit.slug} onChange={e=>setFormEdit({...formEdit, slug:e.target.value})} placeholder="slug" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12, fontSize:12, fontFamily:'monospace'}}/>
                </div>
                <div className="form-2col" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                  <input required value={formEdit.whatsapp} onChange={e=>setFormEdit({...formEdit, whatsapp:e.target.value})} placeholder="WhatsApp" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}/>
                  <select value={formEdit.tipo_tienda} onChange={e=>setFormEdit({...formEdit, tipo_tienda:e.target.value})} style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}>
                    <option value="boutique">BOUTIQUE</option><option value="general">GENERAL</option><option value="comida">COMIDA</option><option value="vehiculos">VEHICULOS</option>
                  </select>
                </div>
                <div style={{background:'#111', borderRadius:12, padding:12}}>
                  <label style={{fontSize:11, fontWeight:800, color:'#FFD60A'}}>🔐 PIN DUEÑO (6 dígitos)</label>
                  <div style={{display:'flex', gap:8, marginTop:6}}>
                    <input value={formEdit.admin_password} onChange={e=>setFormEdit({...formEdit, admin_password:e.target.value.replace(/\D/g,'').slice(0,6)})} placeholder="123456" style={{flex:1, border:'1.5px solid #FFD60A', borderRadius:10, padding:10, fontWeight:900, letterSpacing:2, textAlign:'center'}}/>
                    <button type="button" onClick={()=>setFormEdit({...formEdit, admin_password: genPIN()})} style={{background:'#FFD60A', border:'none', padding:'10px 12px', borderRadius:10, fontWeight:800, fontSize:11}}>🎲 Nuevo</button>
                  </div>
                </div>
                <div className="form-2col" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                  <select value={formEdit.departamento} onChange={e=>setFormEdit({...formEdit, departamento:e.target.value})} style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}>
                    {DEPARTAMENTOS_NI.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                  <input value={formEdit.municipio} onChange={e=>setFormEdit({...formEdit, municipio:e.target.value})} placeholder="Municipio" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}/>
                </div>
                <input value={formEdit.direccion} onChange={e=>setFormEdit({...formEdit, direccion:e.target.value})} placeholder="Dirección" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12, fontSize:12}}/>
                <div style={{border:'1.5px dashed #0066FF', borderRadius:14, padding:12, background:'#F0F7FF'}}>
                  <p style={{fontSize:11, fontWeight:700}}>Cambiar portada</p>
                  <input ref={fileEditLogoRef} type="file" accept="image/*" onChange={(e)=>{const f=e.target.files[0]; if(f) setFormEdit({...formEdit, logo_file:f, logo_preview:URL.createObjectURL(f)})}} style={{marginTop:6, fontSize:11, width:'100%'}}/>
                  {(formEdit.logo_preview || formEdit.logo_url) && <img src={formEdit.logo_preview || formEdit.logo_url} style={{width:'100%', height:140, objectFit:'cover', borderRadius:12, marginTop:8}}/>}
                </div>
                <div style={{display:'flex', gap:8, marginTop:4}}>
                  <button type="button" onClick={()=>setEditingStore(null)} style={{flex:1, background:'#F5F1EC', border:'1px solid #EDE6E3', padding:12, borderRadius:12, fontWeight:700, cursor:'pointer'}}>Cancelar</button>
                  <button type="submit" style={{flex:2, background:'#111', color:'#fff', border:'none', padding:12, borderRadius:12, fontWeight:800, cursor:'pointer'}}>Guardar cambios + PIN ✓</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {tab==='productos' && (
          <div className="productos-grid" style={{display:'grid', gridTemplateColumns:'380px 1fr', gap:16, alignItems:'start'}}>
            <div className="productos-form" style={{background:'#fff', borderRadius:20, padding:18, border:'1px solid #EDE6E3', position:'sticky', top:84}}>
              <h3 style={{fontWeight:900, fontSize:15}}>📦 Agregar producto pro</h3>
              <select value={selectedStoreForProduct} onChange={e=>setSelectedStoreForProduct(e.target.value)} style={{width:'100%', border:'1.5px solid #0066FF', borderRadius:12, padding:12, marginTop:14, fontWeight:700, background:'#F0F7FF'}}>
                <option value="">-- Selecciona tienda --</option>
                {stores.map(s=><option key={s.id} value={s.id}>{s.name} - {s.tipo_tienda} - {s.municipio}</option>)}
              </select>
              {selectedStoreForProduct && (
                <form onSubmit={crearProducto} style={{display:'flex', flexDirection:'column', gap:10, marginTop:14}}>
                  <input required value={formProd.name} onChange={e=>setFormProd({...formProd, name:e.target.value})} placeholder="Nombre producto (Ej: Moto Pulsar 2023)" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}/>
                  <div className="form-2col" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                    <input required value={formProd.price} onChange={e=>setFormProd({...formProd, price:e.target.value})} placeholder="Precio C$" type="number" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}/>
                    <select value={formProd.categoria} onChange={e=>setFormProd({...formProd, categoria:e.target.value})} style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}>
                      {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <textarea value={formProd.descripcion} onChange={e=>setFormProd({...formProd, descripcion:e.target.value})} placeholder="Descripción (Ej: Año, kilometraje, papeles en regla)" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12, minHeight:70, fontSize:12}}/>
                  <div className="form-2col" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                    <input value={formProd.video_url} onChange={e=>setFormProd({...formProd, video_url:e.target.value})} placeholder="Video URL (opcional)" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:10, fontSize:11}}/>
                    <input value={formProd.tallas} onChange={e=>setFormProd({...formProd, tallas:e.target.value})} placeholder="Tallas S,M,L,XL (solo boutique)" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:10, fontSize:11}}/>
                  </div>
                  <div style={{border:'1.5px dashed #FF6A00', borderRadius:14, padding:12, background:'#FFF7ED'}}>
                    <p style={{fontSize:11, fontWeight:800}}>Fotos producto (multi)</p>
                    <input ref={fileProductRef} type="file" accept="image/*" multiple onChange={(e)=>{const files=Array.from(e.target.files); const previews=files.map(f=>URL.createObjectURL(f)); setFormProd({...formProd, image_files:files, image_previews:previews})}} style={{marginTop:8, fontSize:11, width:'100%'}}/>
                    <div style={{display:'flex', gap:6, marginTop:10, flexWrap:'wrap'}}>{formProd.image_previews.map((src,i)=><img key={i} src={src} style={{width:52, height:52, objectFit:'cover', borderRadius:10, border:'1px solid #EDE6E3'}}/>)}</div>
                  </div>
                  <button type="submit" className="btn-action" style={{background:'#0066FF', color:'#fff', border:'none', padding:12, borderRadius:12, fontWeight:800, cursor:'pointer'}}>Agregar producto ✓</button>
                </form>
              )}
            </div>
            <div style={{background:'#fff', borderRadius:20, padding:18, border:'1px solid #EDE6E3'}}>
              <h3 style={{fontWeight:900, fontSize:15}}>Productos {selectedStoreForProduct?`de ${stores.find(s=>s.id===selectedStoreForProduct)?.name}`:''} ({products.filter(p=> !selectedStoreForProduct || p.store_id===selectedStoreForProduct).length})</h3>
              <div style={{marginTop:14, display:'flex', flexDirection:'column', gap:10, maxHeight:'80vh', overflowY:'auto'}}>
                {products.filter(p=> !selectedStoreForProduct || p.store_id===selectedStoreForProduct).map(p=>(
                  <div key={p.id} style={{display:'flex', gap:10, border:'1px solid #EDE6E3', borderRadius:14, padding:10, alignItems:'center', background:'#fff'}}>
                    <img src={p.image_url} style={{width:56, height:56, objectFit:'cover', borderRadius:10, background:'#F5F1EC'}}/>
                    <div style={{flex:1, minWidth:0}}>
                      <b style={{fontSize:12, display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.name}</b>
                      <span style={{fontSize:11, color:'#0066FF', fontWeight:800}}>C$ {p.price}</span>
                      <span style={{fontSize:10, color:'#8A7F78', marginLeft:6}}>{p.stores?.name || p.categoria}</span>
                    </div>
                    <div style={{display:'flex', flexDirection:'column', gap:4}}>
                      <button onClick={()=>abrirEdicionProducto(p)} style={{background:'#111', color:'#fff', border:'none', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:700, cursor:'pointer'}}>✏ Editar</button>
                      <button onClick={async()=>{if(confirm('¿Eliminar producto?')){const supabase=getSupabase(); await supabase.from('products').delete().eq('id',p.id); cargarTodo()}}} style={{background:'#FFE9E9', color:'#C00', border:'1px solid #FFD0D0', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:700, cursor:'pointer'}}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {editingProduct && (
          <div style={{position:'fixed', inset:0, background:'rgba(10,6,4,0.6)', backdropFilter:'blur(12px)', zIndex:101, display:'flex', alignItems:'center', justifyContent:'center', padding:16}}>
            <div className="modal-box" style={{background:'#fff', borderRadius:20, padding:18, maxWidth:520, width:'100%', maxHeight:'92vh', overflowY:'auto'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h3 style={{fontWeight:900, fontSize:14}}>✏ Editar producto</h3>
                <button onClick={()=>setEditingProduct(null)} style={{background:'#F5F1EC', border:'1px solid #EDE6E3', width:30, height:30, borderRadius:999, cursor:'pointer'}}>✕</button>
              </div>
              <form onSubmit={guardarEdicionProducto} style={{display:'flex', flexDirection:'column', gap:10, marginTop:12}}>
                <input required value={formEditProd.name} onChange={e=>setFormEditProd({...formEditProd, name:e.target.value})} placeholder="Nombre" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}/>
                <div className="form-2col" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                  <input required value={formEditProd.price} onChange={e=>setFormEditProd({...formEditProd, price:e.target.value})} placeholder="Precio" type="number" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}/>
                  <select value={formEditProd.categoria} onChange={e=>setFormEditProd({...formEditProd, categoria:e.target.value})} style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}>
                    {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <textarea value={formEditProd.descripcion} onChange={e=>setFormEditProd({...formEditProd, descripcion:e.target.value})} placeholder="Descripción" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12, minHeight:60}}/>
                <div className="form-2col" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                  <input value={formEditProd.video_url} onChange={e=>setFormEditProd({...formEditProd, video_url:e.target.value})} placeholder="Video URL" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:10, fontSize:11}}/>
                  <input value={formEditProd.tallas} onChange={e=>setFormEditProd({...formEditProd, tallas:e.target.value})} placeholder="Tallas" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:10, fontSize:11}}/>
                </div>
                <div style={{border:'1.5px dashed #0066FF', borderRadius:14, padding:12, background:'#F0F7FF'}}>
                  <p style={{fontSize:11, fontWeight:700}}>Cambiar foto principal</p>
                  <input ref={fileEditProductRef} type="file" accept="image/*" onChange={(e)=>{const f=e.target.files[0]; if(f) setFormEditProd({...formEditProd, logo_file:f, logo_preview:URL.createObjectURL(f)})}} style={{marginTop:6, fontSize:11, width:'100%'}}/>
                  {(formEditProd.logo_preview || formEditProd.image_url) && <img src={formEditProd.logo_preview || formEditProd.image_url} style={{width:'100%', height:140, objectFit:'cover', borderRadius:12, marginTop:8}}/>}
                </div>
                <div style={{display:'flex', gap:8}}>
                  <button type="button" onClick={()=>setEditingProduct(null)} style={{flex:1, background:'#F5F1EC', border:'1px solid #EDE6E3', padding:12, borderRadius:12, fontWeight:700, cursor:'pointer'}}>Cancelar</button>
                  <button type="submit" style={{flex:2, background:'#111', color:'#fff', border:'none', padding:12, borderRadius:12, fontWeight:800, cursor:'pointer'}}>Guardar producto ✓</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {tab==='verificaciones' && (
          <div style={{background:'#fff', borderRadius:20, padding:18, border:'1px solid #EDE6E3'}}>
            <h3 style={{fontWeight:900, fontSize:15}}>🛡 Verificaciones pendientes ({pendientes.length})</h3>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:12, marginTop:14}}>
              {pendientes.map(v=>(
                <div key={v.id} style={{border:'1px solid #E0D0FF', background:'linear-gradient(180deg, #FBF8FF, #fff)', borderRadius:16, padding:14}}>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                    <b style={{fontSize:13}}>{v.stores?.name}</b>
                    <span style={{fontSize:10, background:'#7000FF', color:'#fff', padding:'3px 8px', borderRadius:999, fontWeight:800}}>{v.status}</span>
                  </div>
                  <p style={{fontSize:11, color:'#666', marginTop:4}}>{v.stores?.whatsapp} • {v.stores?.slug} • {new Date(v.created_at).toLocaleString()}</p>
                  <div style={{display:'flex', gap:6, marginTop:10}}>
                    <button onClick={()=>aprobarVerificacion(v.id, v.store_id)} style={{flex:1, background:'#111', color:'#fff', border:'none', padding:'10px', borderRadius:12, fontSize:12, fontWeight:800, cursor:'pointer'}}>✓ Aprobar + badge azul</button>
                    <button onClick={async()=>{const supabase=getSupabase(); await supabase.from('store_verifications').update({status:'rechazada'}).eq('id',v.id); setPendientes(p=>p.filter(x=>x.id!==v.id))}} style={{background:'#F5F1EC', border:'1px solid #EDE6E3', padding:'10px', borderRadius:12, fontSize:12, fontWeight:700, cursor:'pointer'}}>Rechazar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='reportes' && (
          <div style={{background:'#fff', borderRadius:20, padding:18, border:'1px solid #EDE6E3'}}>
            <h3 style={{fontWeight:900, fontSize:15}}>🚨 Reportes fraude ({reportes.length})</h3>
            <div style={{display:'grid', gap:12, marginTop:14}}>
              {reportes.map(r=>(
                <div key={r.id} style={{border:'1px solid #FFD6D6', background:'#FFF5F5', borderRadius:14, padding:14}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <b style={{fontSize:13}}>{r.stores?.name}</b>
                    <span style={{background:'#FF3B30', color:'#fff', padding:'3px 8px', borderRadius:999, fontSize:10, fontWeight:800}}>{r.tipo}</span>
                  </div>
                  <p style={{fontSize:12, marginTop:6, lineHeight:1.4}}>{r.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='herramientas' && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:14}}>
            <div style={{background:'#111', color:'#fff', borderRadius:20, padding:18}}>
              <h3 style={{fontWeight:800, fontSize:14}}>📊 Analítica rápida</h3>
              <div style={{marginTop:14, display:'flex', flexDirection:'column', gap:10}}>
                <div style={{background:'rgba(255,255,255,0.06)', borderRadius:12, padding:12, display:'flex', justifyContent:'space-between'}}><span style={{fontSize:12, opacity:0.6}}>Vehiculos</span><b>{stats.vehiculos}</b></div>
                <div style={{background:'rgba(255,255,255,0.06)', borderRadius:12, padding:12, display:'flex', justifyContent:'space-between'}}><span style={{fontSize:12, opacity:0.6}}>Tiendas activas</span><b>{stats.total}</b></div>
                <div style={{background:'rgba(255,255,255,0.06)', borderRadius:12, padding:12, display:'flex', justifyContent:'space-between'}}><span style={{fontSize:12, opacity:0.6}}>Productos totales</span><b>{stats.productos}</b></div>
                <button onClick={async()=>{
                  const sql = `ALTER TABLE stores ADD COLUMN IF NOT EXISTS admin_password TEXT;`
                  alert('Ejecuta esto en Supabase SQL Editor:\n\n'+sql+'\n\nLuego UPDATE stores SET admin_password = RIGHT(whatsapp,6) WHERE admin_password IS NULL;')
                }} style={{background:'#FFD60A', color:'#000', border:'none', padding:'12px', borderRadius:12, fontWeight:800, fontSize:12, cursor:'pointer', marginTop:8}}>🔧 Ver SQL PIN</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
