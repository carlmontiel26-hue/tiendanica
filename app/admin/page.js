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

  // ===== VISITAS - PREMIUM =====
  const [visitas,setVisitas]=useState([])
  const [visitasLoading,setVisitasLoading]=useState(false)
  const [filtroVisitas,setFiltroVisitas]=useState('todo')

  const cargarVisitas = async ()=>{
    const supabase = getSupabase()
    if(!supabase) return
    setVisitasLoading(true)
    try{
      const {data, error} = await supabase.from('visitas_market').select('*').order('created_at',{ascending:false}).limit(1000)
      if(error){ console.log('visitas error', error); setVisitas([]) }
      else setVisitas(data||[])
    }catch(e){ console.log(e) }
    setVisitasLoading(false)
  }

  useEffect(()=>{
    if(tab==='visitas') cargarVisitas()
  },[tab])

  // ===== MARKET DIRECTO - SOLO ESTO CAMBIA PARA NO ROMPER NADA =====
  const [marketKey,setMarketKey]=useState(0)
  const [marketUrl,setMarketUrl]=useState('/')
  const [marketConfig,setMarketConfig]=useState(null)
  const [marketBannerPreview,setMarketBannerPreview]=useState('')
  const [marketHeroTitle,setMarketHeroTitle]=useState('')
  const [marketHeroSub,setMarketHeroSub]=useState('')
  const [marketSaving,setMarketSaving]=useState(false)

  const cargarMarketConfig = async ()=>{
    const supabase = getSupabase()
    if(!supabase) return
    try{
      const {data} = await supabase.from('market_config').select('*').eq('id',1).single()
      if(data){
        setMarketConfig(data)
        setMarketBannerPreview(data.banner_url || '')
        setMarketHeroTitle(data.hero_title || '')
        setMarketHeroSub(data.hero_subtitle || '')
      }
    }catch(e){ console.log('market_config no existe aún', e) }
  }
  useEffect(()=>{ if(tab==='market') cargarMarketConfig() },[tab])

  const guardarBannerDirecto = async (file)=>{
    if(!file) return
    const supabase = getSupabase()
    if(!supabase) return alert('Supabase no configurado')
    setMarketSaving(true)
    const fileName = `market-banner-${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi,'')}`
    let publicUrl = null
    // intenta store-logos primero
    let {error: err1} = await supabase.storage.from('store-logos').upload(fileName, file)
    if(err1){
      const {error: err2} = await supabase.storage.from('product-images').upload(fileName, file)
      if(err2){ alert('Error subiendo: '+err2.message); setMarketSaving(false); return }
      const {data} = supabase.storage.from('product-images').getPublicUrl(fileName)
      publicUrl = data.publicUrl
    } else {
      const {data} = supabase.storage.from('store-logos').getPublicUrl(fileName)
      publicUrl = data.publicUrl
    }
    if(!publicUrl){ alert('No se pudo obtener URL'); setMarketSaving(false); return }
    // guarda directo en market_config id=1
    const {error} = await supabase.from('market_config').upsert({id:1, banner_url: publicUrl, updated_at: new Date().toISOString()}, {onConflict:'id'})
    if(error){
      alert('⚠ Falta crear tabla market_config. Ejecuta este SQL en Supabase:\n\nCREATE TABLE IF NOT EXISTS market_config (id INT PRIMARY KEY, banner_url TEXT, hero_title TEXT, hero_subtitle TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()); INSERT INTO market_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING; ALTER TABLE market_config ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "allow_all" ON market_config; CREATE POLICY "allow_all" ON market_config FOR ALL USING (true) WITH CHECK (true);')
      console.log(error)
    } else {
      setMarketConfig(prev=>({...prev, banner_url: publicUrl}))
      setMarketBannerPreview(publicUrl)
      alert('✅ Portada actualizada DIRECTO. Ya sale en tiendanica.store sin tocar código.')
      setMarketKey(k=>k+1)
    }
    setMarketSaving(false)
  }

  const guardarHeroDirecto = async ()=>{
    const supabase = getSupabase()
    if(!supabase) return
    setMarketSaving(true)
    const {error} = await supabase.from('market_config').upsert({id:1, hero_title: marketHeroTitle, hero_subtitle: marketHeroSub, updated_at: new Date().toISOString()}, {onConflict:'id'})
    if(error) alert('Error guardando textos: '+error.message)
    else { alert('✅ Títulos guardados directo'); setMarketKey(k=>k+1); setMarketConfig(prev=>({...prev, hero_title: marketHeroTitle, hero_subtitle: marketHeroSub})) }
    setMarketSaving(false)
  }

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

  const CATEGORIAS = ['vestidos','blusas','jeans','conjuntos','faldas','shorts','pijamas','zapatos','carteras','accesorios','belleza','salud','general','hogar','comida','vehiculos','motos','autos','repuestos','otros','nuevo','herramientas','herramientas electricas','tornilleria','pinturas','electricidad','fontaneria','construccion','madera','cerrajeria','jardineria','soldadura','seguridad','ferreteria','materiales','plomeria','iluminacion']

  const login = ()=>{
    if(pass === 'tiendanica2025' || pass === 'admin123' || pass === 'Nica2024' || pass === '6052611890000'){
      setAuth(true)
      cargarTodo()
    } else alert('Clave incorrecta')
  }

  const cargarTodo = async ()=>{
    setLoading(true)
    try{
      const supabase = getSupabase()
      if(!supabase){ 
        console.error('SUPABASE ENV MISSING')
        alert('Error: NEXT_PUBLIC_SUPABASE_URL o ANON_KEY no configurado en Vercel')
        setLoading(false); return 
      }
      const {data: s, error: errS} = await supabase.from('stores').select('*').order('created_at',{ascending:false}).limit(300)
      if(errS){ console.error('stores error', errS); alert('Error cargando tiendas: '+errS.message) }
      const {data: p, error: errP} = await supabase.from('products').select('*, stores(name,slug,tipo_tienda)').order('created_at',{ascending:false}).limit(500)
      if(errP) console.error('products error', errP)
      let v=[], r=[]
      try{
        const resV = await supabase.from('store_verifications').select('*, stores(name, whatsapp, slug)').in('status',['pendiente','revision']).order('created_at',{ascending:false}).limit(100)
        v = resV.data || []
      }catch(e){ console.log('verifications no existe o vacia', e) }
      try{
        const resR = await supabase.from('fraud_reports').select('*, stores(name, whatsapp)').in('status',['abierto','investigando']).order('created_at',{ascending:false}).limit(100)
        r = resR.data || []
      }catch(e){ console.log('fraud_reports no existe', e) }
      setStores(s||[]); setProducts(p||[]); setPendientes(v||[]); setReportes(r||[])
    }catch(e){
      console.error('cargarTodo fatal', e)
      alert('Error fatal cargando: '+e.message)
    }finally{
      setLoading(false)
    }
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
    ferreteria: stores.filter(s=>s.tipo_tienda==='ferreteria').length,
    verificadas: stores.filter(s=>s.verification_status==='verificada' || s.verification_status==='premium').length,
    productos: products.length
  }

  // ===== CALCULO VISITAS PREMIUM =====
  const ahora = new Date()
  const visitasFiltradas = visitas.filter(v=>{
    const d = new Date(v.created_at)
    if(filtroVisitas==='hoy') return d.toDateString() === ahora.toDateString()
    if(filtroVisitas==='7d') return d >= new Date(ahora - 7*24*60*60*1000)
    return true
  })

  const visitasPorDepto = visitasFiltradas.reduce((acc,v)=>{
    const dep = v.departamento || 'Desconocido'
    if(dep==='Desconocido') return acc
    acc[dep] = (acc[dep]||0)+1
    return acc
  },{})
  const visitasPorDeptoOrdenadas = Object.entries(visitasPorDepto).sort((a,b)=>b[1]-a[1])
  const topDeptos = visitasPorDeptoOrdenadas.slice(0,5)
  const totalReal = visitasPorDeptoOrdenadas.reduce((s,[,c])=>s+c,0) || 1
  const visitasPorPagina = visitasFiltradas.reduce((acc,v)=>{
    const p = v.pagina || '/'
    acc[p] = (acc[p]||0)+1
    return acc
  },{})
  const visitasPorPaginaOrdenadas = Object.entries(visitasPorPagina).sort((a,b)=>b[1]-a[1]).slice(0,8)
  const dias = []
  for(let i=6;i>=0;i--){
    const d = new Date()
    d.setDate(d.getDate()-i)
    const key = d.toISOString().slice(0,10)
    const count = visitas.filter(v=> v.created_at?.slice(0,10)===key).length
    dias.push({label: d.toLocaleDateString('es-NI',{weekday:'short'}), count, key})
  }
  const maxDia = Math.max(...dias.map(d=>d.count),1)
  const colores = ['#7000FF','#0066FF','#FF6A00','#00C853','#FF3B30','#FFD60A','#111']

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
        @media (max-width: 768px){
          input, select, textarea{ font-size:16px !important; }
          .super-header{ padding:10px 12px !important; }
          .super-header h1{ font-size:14px !important; }
          .super-stats{ grid-template-columns:repeat(2,1fr) !important; gap:8px !important; padding:0 12px !important; }
          .super-tabs{ padding:0 12px !important; gap:6px !important; }
          .super-tabs button{ padding:10px 14px !important; font-size:11px !important; min-height:40px !important; }
          .super-main{ padding:0 12px 20px !important; }
          .tiendas-grid{ grid-template-columns:1fr !important; gap:12px !important; }
          .crear-grid{ grid-template-columns:1fr !important; gap:12px !important; }
          .productos-grid{ grid-template-columns:1fr !important; gap:12px !important; }
          .productos-form{ position:relative !important; top:0 !important; }
          .preview-col{ position:relative !important; top:0 !important; }
          .form-2col{ grid-template-columns:1fr !important; gap:10px !important; }
          .btn-action{ min-height:44px !important; padding:12px !important; font-size:13px !important; }
          .modal-box{ margin:10px !important; max-width:calc(100vw - 20px) !important; border-radius:20px !important; max-height:90vh !important; }
          .visitas-premium-grid{ grid-template-columns:1fr !important; }
          .market-grid{ grid-template-columns:1fr !important; }
        }
      `}</style>

      <div className="super-header" style={{position:'sticky', top:0, zIndex:40, background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)', borderBottom:'1px solid #EDE6E3'}}>
        <div style={{maxWidth:1400, margin:'0 auto', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap'}}>
          <div style={{display:'flex', alignItems:'center', gap:14}}>
            <div style={{width:42, height:42, borderRadius:12, background:'linear-gradient(135deg, #111 0%, #333 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:14}}>TN</div>
            <div>
              <h1 style={{fontWeight:900, fontSize:16, letterSpacing:-0.3, lineHeight:1}}>TiendaNica • Super Admin</h1>
              <p style={{fontSize:11, color:'#8A7F78', marginTop:2}}>{stats.total} tiendas • {stats.productos} productos • {stats.verificadas} verificadas • {visitas.length} visitas totales</p>
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
          {k:'Ferreteria', v:stats.ferreteria, c:'#fff', bg:'linear-gradient(135deg, #FF8C00, #FF5500)'},
          {k:'Verificadas', v:stats.verificadas, c:'#fff', bg:'linear-gradient(135deg, #00C853, #00E676)'},
          {k:'Productos', v:stats.productos, c:'#111', bg:'linear-gradient(135deg, #EDE6E3, #F6F1EC)'},
          {k:'Visitas', v:visitasFiltradas.length, c:'#fff', bg:'linear-gradient(135deg, #7000FF, #0066FF)'},
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
          {id:'market', label:'🏬 Market Directo', active:'#FF6A00'},
          {id:'crear', label:'➕ Crear Premium', active:'#FF6A00'},
          {id:'productos', label:`📦 Productos (${products.length})`, active:'#0066FF'},
          {id:'visitas', label:`📊 Visitas (${visitas.length})`, active:'#7000FF'},
          {id:'verificaciones', label:`🛡 Verificar (${pendientes.length})`, active:'#7000FF'},
          {id:'reportes', label:`🚨 Reportes (${reportes.length})`, active:'#FF3B30'},
          {id:'herramientas', label:'🛠 Herramientas', active:'#111'},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'11px 18px', borderRadius:999, border:'1px solid', borderColor: tab===t.id ? t.active : '#EDE6E3', fontWeight:800, fontSize:12, background: tab===t.id ? t.active : '#fff', color: tab===t.id ? '#fff' : '#111', whiteSpace:'nowrap', cursor:'pointer', transition:'all 0.2s'}}>{t.label}</button>
        ))}
      </div>

      <div className="super-main" style={{maxWidth:1400, margin:'16px auto', padding:'0 20px 40px'}}>

        {/* ===== MARKET DIRECTO - NO ROMPE NADA - SOLO DIRECTO ===== */}
        {tab==='market' && (
          <div style={{display:'flex', flexDirection:'column', gap:16}}>
            <div style={{background:'linear-gradient(135deg, #111 0%, #222 100%)', borderRadius:20, padding:18, color:'#fff', border:'1px solid #333', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12, alignItems:'center'}}>
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                <div style={{width:44, height:44, borderRadius:12, background:'linear-gradient(135deg, #FF6A00, #FFD60A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22}}>🏬</div>
                <div>
                  <h2 style={{fontWeight:900, fontSize:16}}>Market Control • Edición DIRECTA</h2>
                  <p style={{fontSize:11, color:'#999', marginTop:2}}>Subes foto y se guarda directo en Supabase. Sin copiar links. Sin tocar código. Sale al instante en tiendanica.store</p>
                </div>
              </div>
              <div style={{display:'flex', gap:8}}>
                <button onClick={()=>setMarketKey(k=>k+1)} style={{background:'#fff', color:'#111', border:'none', padding:'10px 16px', borderRadius:12, fontSize:12, fontWeight:800, cursor:'pointer'}}>↻ Recargar preview</button>
                <a href={marketUrl} target="_blank" style={{background:'#FF6A00', color:'#fff', padding:'10px 16px', borderRadius:12, fontSize:12, fontWeight:800, textDecoration:'none'}}>Abrir Market ↗</a>
              </div>
            </div>

            <div className="market-grid" style={{display:'grid', gridTemplateColumns:'1.2fr 0.6fr', gap:16, alignItems:'start'}}>
              {/* PREVIEW MARKET REAL */}
              <div style={{background:'#111', borderRadius:20, padding:14, border:'1px solid #222'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                  <div style={{display:'flex', gap:8, alignItems:'center'}}>
                    <span style={{width:10, height:10, borderRadius:'50%', background:'#FF5F56'}}/>
                    <span style={{width:10, height:10, borderRadius:'50%', background:'#FFBD2E'}}/>
                    <span style={{width:10, height:10, borderRadius:'50%', background:'#27C93F'}}/>
                    <span style={{fontSize:11, color:'#888', marginLeft:8, fontFamily:'monospace'}}>tiendanica.store • Vista previa REAL</span>
                  </div>
                  <div style={{display:'flex', gap:6}}>
                    <button onClick={()=>setMarketUrl('/')} style={{background: marketUrl==='/' ? '#fff' : '#222', color: marketUrl==='/' ? '#111' : '#888', border:'none', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:800, cursor:'pointer'}}>Home</button>
                    <button onClick={()=>setMarketUrl('/acceso')} style={{background: marketUrl==='/acceso' ? '#fff' : '#222', color: marketUrl==='/acceso' ? '#111' : '#888', border:'none', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:700, cursor:'pointer'}}>/acceso</button>
                  </div>
                </div>
                <div style={{background:'#fff', borderRadius:14, overflow:'hidden', height:640, border:'1px solid #222'}}>
                  <iframe key={marketKey} src={marketUrl} style={{width:'100%', height:'100%', border:'none', background:'#fff'}} title="market preview"/>
                </div>
                <div style={{display:'flex', gap:8, marginTop:12}}>
                  <input value={marketUrl} onChange={e=>setMarketUrl(e.target.value)} placeholder="/motos-el-chele o /categoria" style={{flex:1, background:'#1A1A1A', border:'1px solid #333', borderRadius:12, padding:'10px 14px', color:'#fff', fontSize:12, fontFamily:'monospace'}}/>
                  <button onClick={()=>setMarketKey(k=>k+1)} style={{background:'#FF6A00', color:'#fff', border:'none', padding:'10px 16px', borderRadius:12, fontSize:12, fontWeight:800, cursor:'pointer'}}>Ir →</button>
                </div>
              </div>

              {/* CONTROLES MARKET DIRECTO */}
              <div style={{display:'flex', flexDirection:'column', gap:14, position:'sticky', top:84}} className="preview-col">
                <div style={{background:'#fff', borderRadius:20, padding:18, border:'2px solid #FF6A00', boxShadow:'0 8px 24px rgba(255,106,0,0.15)'}}>
                  <h3 style={{fontWeight:900, fontSize:14}}>🎨 Portada Market • EDICIÓN DIRECTA</h3>
                  <p style={{fontSize:11, color:'#8A7F78', marginTop:6, lineHeight:1.4}}>Ya no copias links. Solo subes y le das guardar. Se guarda directo en tabla <b>market_config</b> y tu MarketClient lo lee automático.</p>
                  
                  <div style={{border:'2px dashed #FF6A00', borderRadius:16, padding:14, background:'#FFF7ED', marginTop:14}}>
                    <p style={{fontSize:11, fontWeight:900}}>📸 SUBIR NUEVA PORTADA - DIRECTO</p>
                    <p style={{fontSize:10, color:'#FF6A00', marginTop:4, fontWeight:700}}>Se guarda automático en market_config.banner_url</p>
                    <input type="file" accept="image/*" onChange={(e)=>{const f=e.target.files[0]; if(f) guardarBannerDirecto(f)}} style={{marginTop:10, fontSize:11, width:'100%'}}/>
                    {marketBannerPreview && (
                      <div style={{marginTop:12}}>
                        <p style={{fontSize:10, fontWeight:800, marginBottom:6}}>Preview actual en market:</p>
                        <img src={marketBannerPreview} style={{width:'100%', height:160, objectFit:'cover', borderRadius:12, border:'1px solid #EDE6E3'}}/>
                        <p style={{fontSize:10, color:'#00C853', marginTop:6, fontWeight:700}}>✅ Esta es la portada que ven los clientes ahora</p>
                      </div>
                    )}
                    {marketSaving && <p style={{fontSize:11, color:'#FF6A00', marginTop:10, fontWeight:800}}>⏳ Subiendo y guardando directo...</p>}
                  </div>

                  <div style={{background:'#F5F1EC', borderRadius:14, padding:14, marginTop:14, border:'1px solid #EDE6E3'}}>
                    <p style={{fontSize:11, fontWeight:800}}>✏️ TÍTULO Y SUBTÍTULO HERO (opcional)</p>
                    <p style={{fontSize:10, color:'#888', marginTop:2}}>Se muestra encima de la portada si lo llenas</p>
                    <input value={marketHeroTitle} onChange={e=>setMarketHeroTitle(e.target.value)} placeholder="Ej: TiendaNica - El marketplace de Nicaragua" style={{width:'100%', border:'1.5px solid #E8E0DC', borderRadius:10, padding:'10px 12px', marginTop:10, fontSize:12}}/>
                    <input value={marketHeroSub} onChange={e=>setMarketHeroSub(e.target.value)} placeholder="Ej: Compra y vende local fácil y seguro" style={{width:'100%', border:'1.5px solid #E8E0DC', borderRadius:10, padding:'10px 12px', marginTop:8, fontSize:12}}/>
                    <button onClick={guardarHeroDirecto} disabled={marketSaving} style={{width:'100%', marginTop:10, background:'#111', color:'#fff', border:'none', padding:'11px', borderRadius:12, fontWeight:800, fontSize:12, cursor:'pointer'}}>{marketSaving ? 'Guardando...' : '💾 Guardar títulos directo'}</button>
                  </div>

                  <div style={{background:'#111', color:'#fff', borderRadius:14, padding:14, marginTop:14}}>
                    <p style={{fontSize:11, fontWeight:800, color:'#FFD60A'}}>✅ CÓMO FUNCIONA AHORA - DIRECTO</p>
                    <p style={{fontSize:11, color:'#AAA', marginTop:6, lineHeight:1.6}}>
                      1. Subes imagen arriba<br/>
                      2. Se sube a Supabase + guarda en <b>market_config</b><br/>
                      3. MarketClient lo lee automático<br/>
                      4. No tocas código, no copias link<br/>
                      5. Refrescas tiendanica.store y ya está<br/><br/>
                      Si te da error de tabla, ejecuta el SQL que te muestra.
                    </p>
                  </div>
                </div>

                <div style={{background:'linear-gradient(135deg, #7000FF, #0066FF)', borderRadius:16, padding:14, color:'#fff'}}>
                  <p style={{fontSize:11, fontWeight:800, opacity:0.8}}>📊 MARKET LIVE STATS</p>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:10}}>
                    <div style={{background:'rgba(255,255,255,0.15)', borderRadius:10, padding:10}}><p style={{fontSize:10, opacity:0.7}}>Tiendas</p><b style={{fontSize:16}}>{stats.total}</b></div>
                    <div style={{background:'rgba(255,255,255,0.15)', borderRadius:10, padding:10}}><p style={{fontSize:10, opacity:0.7}}>Productos</p><b style={{fontSize:16}}>{stats.productos}</b></div>
                    <div style={{background:'rgba(255,255,255,0.15)', borderRadius:10, padding:10}}><p style={{fontSize:10, opacity:0.7}}>Visitas</p><b style={{fontSize:16}}>{visitas.length}</b></div>
                    <div style={{background:'rgba(255,255,255,0.15)', borderRadius:10, padding:10}}><p style={{fontSize:10, opacity:0.7}}>Hoy</p><b style={{fontSize:16}}>{visitas.filter(v=> new Date(v.created_at).toDateString() === new Date().toDateString()).length}</b></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab==='visitas' && (
          <div style={{display:'flex', flexDirection:'column', gap:16}}>
            <div style={{background:'linear-gradient(135deg, #0F0F10 0%, #1A1A1E 50%, #252529 100%)', borderRadius:24, padding:22, color:'#fff', position:'relative', overflow:'hidden', border:'1px solid #2A2A2E'}}>
              <div style={{position:'absolute', top:-40, right:-40, width:200, height:200, background:'radial-gradient(circle, rgba(112,0,255,0.3) 0%, transparent 70%)', borderRadius:'50%'}}/>
              <div style={{position:'absolute', bottom:-30, left:-30, width:180, height:180, background:'radial-gradient(circle, rgba(0,102,255,0.25) 0%, transparent 70%)', borderRadius:'50%'}}/>
              <div style={{position:'relative', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:14}}>
                <div>
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <div style={{width:36, height:36, borderRadius:10, background:'linear-gradient(135deg, #7000FF, #0066FF)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900}}>📊</div>
                    <h2 style={{fontWeight:900, fontSize:20, letterSpacing:-0.5}}>Analytics Premium • TiendaNica</h2>
                  </div>
                  <p style={{fontSize:12, color:'#9A9AA0', marginTop:8, maxWidth:520, lineHeight:1.5}}>Monitoreo en tiempo real de todo Nicaragua. Cada visita cuenta departamento real vía Vercel Geo. Optimizado para 0.2KB por visita.</p>
                  <div style={{display:'flex', gap:8, marginTop:14}}>
                    {[
                      {id:'todo', l:'Todo'},
                      {id:'7d', l:'Últimos 7 días'},
                      {id:'hoy', l:'Hoy'},
                    ].map(f=>(
                      <button key={f.id} onClick={()=>setFiltroVisitas(f.id)} style={{background: filtroVisitas===f.id ? '#fff' : 'rgba(255,255,255,0.08)', color: filtroVisitas===f.id ? '#111' : '#fff', border:'1px solid', borderColor: filtroVisitas===f.id ? '#fff' : 'rgba(255,255,255,0.12)', padding:'7px 14px', borderRadius:999, fontSize:11, fontWeight:800, cursor:'pointer'}}>{f.l}</button>
                    ))}
                  </div>
                </div>
                <div style={{display:'flex', gap:8}}>
                  <button onClick={cargarVisitas} style={{background:'rgba(255,255,255,0.1)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', padding:'10px 16px', borderRadius:12, fontSize:12, fontWeight:700, cursor:'pointer'}}>{visitasLoading?'⏳ Cargando...':'↻ Actualizar en vivo'}</button>
                  <button onClick={()=>{const csv = 'fecha,departamento,municipio,pagina\n' + visitasFiltradas.map(v=>`${v.created_at},${v.departamento||''},${v.municipio||''},${v.pagina}`).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='visitas-tiendanica.csv'; a.click();}} style={{background:'#7000FF', border:'none', color:'#fff', padding:'10px 16px', borderRadius:12, fontSize:12, fontWeight:800, cursor:'pointer'}}>⬇ Export CSV</button>
                </div>
              </div>
              <div style={{position:'relative', marginTop:18, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:10}}>
                {[
                  {k:'Visitas totales', v:visitasFiltradas.length, sub:`${visitas.length} históricas`},
                  {k:'Hoy', v:visitas.filter(v=> new Date(v.created_at).toDateString() === ahora.toDateString()).length, sub:'en las últimas 24h'},
                  {k:'Top Depto', v:visitasPorDeptoOrdenadas[0]?.[0] || '—', sub:`${visitasPorDeptoOrdenadas[0]?.[1]||0} visitas`},
                  {k:'Municipios', v:Object.keys(visitasFiltradas.reduce((a,v)=>{ if(v.municipio) a[v.municipio]=1; return a },{})).length, sub:'únicos detectados'},
                ].map(c=>(
                  <div key={c.k} style={{background:'rgba(255,255,255,0.06)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'12px 14px'}}>
                    <p style={{fontSize:10, color:'#8A8A90', fontWeight:800, textTransform:'uppercase', letterSpacing:0.5}}>{c.k}</p>
                    <p style={{fontSize:18, fontWeight:900, marginTop:4}}>{c.v}</p>
                    <p style={{fontSize:10, color:'#6A6A70', marginTop:2}}>{c.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="visitas-premium-grid" style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:16, alignItems:'start'}}>
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                <div style={{background:'#fff', borderRadius:20, padding:20, border:'1px solid #EDE6E3', boxShadow:'0 8px 32px rgba(0,0,0,0.04)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h3 style={{fontWeight:900, fontSize:14}}>📈 Tendencia • Últimos 7 días</h3>
                    <span style={{fontSize:11, background:'#F0F7FF', color:'#0066FF', padding:'4px 10px', borderRadius:999, fontWeight:800}}>{visitas.length} total histórico</span>
                  </div>
                  <div style={{marginTop:18, display:'flex', alignItems:'end', gap:6, height:110}}>
                    {dias.map((d,i)=>{
                      const h = Math.round((d.count/maxDia)*100)
                      const isToday = d.key === ahora.toISOString().slice(0,10)
                      return (
                        <div key={d.key} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
                          <div style={{width:'100%', background:'#F5F1EC', borderRadius:10, height:90, position:'relative', overflow:'hidden', display:'flex', alignItems:'end'}}>
                            <div style={{width:'100%', height:`${h}%`, background: isToday ? 'linear-gradient(180deg, #7000FF, #0066FF)' : 'linear-gradient(180deg, #E8E0DC, #D9D0C8)', borderRadius:10, transition:'height 0.6s', minHeight: d.count>0 ? 8 : 0}}/>
                            {d.count>0 && <span style={{position:'absolute', top:4, left:'50%', transform:'translateX(-50%)', fontSize:10, fontWeight:900, color: isToday ? '#7000FF' : '#6B5E55'}}>{d.count}</span>}
                          </div>
                          <span style={{fontSize:10, fontWeight:800, color: isToday ? '#7000FF' : '#8A7F78'}}>{d.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={{background:'#fff', borderRadius:20, padding:20, border:'1px solid #EDE6E3', boxShadow:'0 8px 32px rgba(0,0,0,0.04)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h3 style={{fontWeight:900, fontSize:14}}>📍 Visitas por Departamento • Nicaragua</h3>
                    <span style={{fontSize:10, color:'#8A7F78'}}>{filtroVisitas==='todo'?'Histórico':filtroVisitas}</span>
                  </div>
                  <p style={{fontSize:11, color:'#8A7F78', marginTop:4}}>Solo departamentos reales (ignora Desconocido de pruebas antiguas)</p>
                  <div style={{marginTop:16, display:'flex', flexDirection:'column', gap:10}}>
                    {visitasPorDeptoOrdenadas.length===0 && <p style={{fontSize:12, color:'#999'}}>No hay visitas con departamento real aún. Verifica que app/api/geo/route.js esté deployado en Vercel.</p>}
                    {visitasPorDeptoOrdenadas.map(([depto,count],idx)=>{
                      const max = visitasPorDeptoOrdenadas[0]?.[1]||1
                      const pct = Math.round((count/max)*100)
                      const color = colores[idx % colores.length]
                      return (
                        <div key={depto} style={{display:'flex', alignItems:'center', gap:12}}>
                          <span style={{fontSize:12, fontWeight:800, minWidth:100, textAlign:'right'}}>{depto}</span>
                          <div style={{flex:1, height:26, background:'#F5F1EC', borderRadius:999, overflow:'hidden', position:'relative', display:'flex', alignItems:'center'}}>
                            <div style={{width:`${pct}%`, height:'100%', background:`linear-gradient(90deg, ${color}, ${color}CC)`, borderRadius:999, transition:'width 0.8s', display:'flex', alignItems:'center', paddingLeft:12}}>
                              <span style={{fontSize:11, fontWeight:900, color:'#fff', whiteSpace:'nowrap'}}>{count} • {Math.round((count/totalReal)*100)}%</span>
                            </div>
                          </div>
                          <div style={{width:8, height:8, borderRadius:'50%', background:color}}/>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={{background:'#fff', borderRadius:20, padding:20, border:'1px solid #EDE6E3'}}>
                  <h3 style={{fontWeight:900, fontSize:14}}>🔥 Páginas más visitadas</h3>
                  <div style={{marginTop:12, display:'flex', flexDirection:'column', gap:8}}>
                    {visitasPorPaginaOrdenadas.map(([pag,c],i)=>{
                      const max = visitasPorPaginaOrdenadas[0]?.[1]||1
                      return (
                        <div key={pag} style={{display:'flex', alignItems:'center', gap:10, background: i===0 ? 'linear-gradient(90deg, #FFF7ED, #fff)' : '#F9F6F2', padding:'10px 12px', borderRadius:12, border: i===0 ? '1px solid #FFD6B0' : '1px solid #EDE6E3'}}>
                          <span style={{fontSize:11, fontWeight:900, background: i===0 ? '#FF6A00' : '#111', color:'#fff', width:20, height:20, borderRadius:999, display:'flex', alignItems:'center', justifyContent:'center'}}>{i+1}</span>
                          <span style={{flex:1, fontSize:12, fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{pag.slice(0,60)}</span>
                          <div style={{width:60, height:6, background:'#EDE6E3', borderRadius:999, overflow:'hidden'}}>
                            <div style={{width:`${Math.round((c/max)*100)}%`, height:'100%', background:'#111', borderRadius:999}}/>
                          </div>
                          <b style={{fontSize:12, minWidth:24, textAlign:'right'}}>{c}</b>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div style={{display:'flex', flexDirection:'column', gap:16, position:'sticky', top:84}} className="preview-col">
                <div style={{background:'#111', color:'#fff', borderRadius:20, padding:20, border:'1px solid #222', position:'relative', overflow:'hidden'}}>
                  <div style={{position:'absolute', top:-20, right:-20, width:120, height:120, background:'radial-gradient(circle, rgba(112,0,255,0.4), transparent 70%)', borderRadius:'50%'}}/>
                  <h3 style={{fontWeight:900, fontSize:14, position:'relative'}}>🎯 Distribución Top Departamentos</h3>
                  <p style={{fontSize:11, color:'#888', marginTop:4, position:'relative'}}>{totalReal} visitas reales con geo</p>
                  <div style={{position:'relative', marginTop:16, display:'flex', alignItems:'center', gap:16}}>
                    <div style={{
                      width:110, height:110, borderRadius:'50%',
                      background: `conic-gradient(${topDeptos.map(([_,c],i)=>{
                        const start = topDeptos.slice(0,i).reduce((s,[_,cc])=>s+cc,0)/totalReal*360
                        const end = (topDeptos.slice(0,i+1).reduce((s,[_,cc])=>s+cc,0)/totalReal*360)
                        return `${colores[i]} ${start}deg ${end}deg`
                      }).join(', ')})`,
                      position:'relative', display:'flex', alignItems:'center', justifyContent:'center'
                    }}>
                      <div style={{width:64, height:64, borderRadius:'50%', background:'#111', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'}}>
                        <b style={{fontSize:16}}>{totalReal}</b>
                        <span style={{fontSize:9, color:'#888'}}>visitas</span>
                      </div>
                    </div>
                    <div style={{flex:1, display:'flex', flexDirection:'column', gap:6}}>
                      {topDeptos.map(([dep,c],i)=>(
                        <div key={dep} style={{display:'flex', alignItems:'center', gap:8}}>
                          <div style={{width:8, height:8, borderRadius:2, background:colores[i]}}/>
                          <span style={{fontSize:11, flex:1}}>{dep}</span>
                          <b style={{fontSize:11}}>{c}</b>
                          <span style={{fontSize:10, color:'#888'}}>{Math.round((c/totalReal)*100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{background:'#fff', borderRadius:20, padding:18, border:'1px solid #EDE6E3', boxShadow:'0 8px 32px rgba(0,0,0,0.04)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h3 style={{fontWeight:900, fontSize:13}}>⚡ En vivo • Últimas 20</h3>
                    <span style={{display:'flex', alignItems:'center', gap:6, fontSize:10, background:'#E8FFE8', color:'#00C853', padding:'4px 8px', borderRadius:999, fontWeight:800}}>
                      <span style={{width:6, height:6, background:'#00C853', borderRadius:'50%', display:'inline-block'}}/> LIVE
                    </span>
                  </div>
                  <div style={{marginTop:12, display:'flex', flexDirection:'column', gap:8, maxHeight:420, overflowY:'auto'}}>
                    {visitas.slice(0,20).map(v=>(
                      <div key={v.id} style={{display:'flex', gap:10, padding:'10px 12px', background:'#F9F6F2', borderRadius:12, border:'1px solid #F0E9E2'}}>
                        <div style={{width:32, height:32, borderRadius:10, background:`linear-gradient(135deg, ${colores[ (v.departamento?.length||0) % colores.length]}, #111)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:900}}>{(v.departamento||'?')[0]}</div>
                        <div style={{flex:1, minWidth:0}}>
                          <div style={{display:'flex', gap:6, alignItems:'center'}}>
                            <b style={{fontSize:12}}>{v.departamento||'Desconocido'}</b>
                            {v.municipio && <span style={{fontSize:10, background:'#fff', border:'1px solid #EDE6E3', padding:'2px 6px', borderRadius:999}}>{v.municipio}</span>}
                          </div>
                          <p style={{fontSize:10, color:'#8A7F78', marginTop:2, fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{v.pagina} • {new Date(v.created_at).toLocaleTimeString('es-NI',{hour:'2-digit',minute:'2-digit'})}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                    <button onClick={async()=>{
                      if(!confirm('¿Borrar Desconocido de prueba?')) return
                      const supabase=getSupabase()
                      await supabase.from('visitas_market').delete().eq('departamento','Desconocido')
                      cargarVisitas()
                    }} style={{background:'#F5F1EC', border:'1px solid #EDE6E3', padding:10, borderRadius:12, fontSize:11, fontWeight:700, cursor:'pointer'}}>🧹 Limpiar pruebas</button>
                    <button onClick={cargarVisitas} style={{background:'#111', color:'#fff', border:'none', padding:10, borderRadius:12, fontSize:11, fontWeight:800, cursor:'pointer'}}>↻ Actualizar</button>
                  </div>
                </div>

                <div style={{background:'linear-gradient(135deg, #7000FF, #0066FF)', borderRadius:16, padding:14, color:'#fff'}}>
                  <p style={{fontSize:11, fontWeight:800, opacity:0.8}}>💡 INSIGHT</p>
                  <p style={{fontSize:12, fontWeight:700, marginTop:6, lineHeight:1.4}}>
                    {visitasPorDeptoOrdenadas[0] ? `Tu top es ${visitasPorDeptoOrdenadas[0][0]} con ${visitasPorDeptoOrdenadas[0][1]} visitas. Enfócate en tiendas de ${visitasPorDeptoOrdenadas[0][0]} para crecer más rápido.` : 'Aún no hay suficientes datos con geo. Pide a 2 clientes más que entren.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{background:'#fff', borderRadius:20, padding:20, border:'1px dashed #E0D5CC', textAlign:'center'}}>
                  <p style={{fontSize:28}}>👁</p>
                  <p style={{fontSize:13, fontWeight:800, marginTop:8}}>Selecciona una tienda</p>
                  <p style={{fontSize:11, color:'#8A7F78', marginTop:4}}>Haz click en "Vista previa" para verla aquí en vivo sin salir del admin.</p>
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
                    <input required value={formTienda.whatsapp} onChange={e=>setFormTienda({...formTienda, whatsapp:e.target.value})} placeholder="50578402288" style={{width:'100%', border:'1.5px solid #E8E0DC', borderRadius:12, padding:'12px 14px', marginTop:6, background:'#fff'}}/>
                  </div>
                  <div>
                    <label style={{fontSize:11, fontWeight:800, color:'#6B5E55'}}>TIPO TIENDA *</label>
                    <select value={formTienda.tipo_tienda} onChange={e=>setFormTienda({...formTienda, tipo_tienda:e.target.value})} style={{width:'100%', border:'1.5px solid #E8E0DC', borderRadius:12, padding:'12px 14px', marginTop:6, background:'#fff', fontWeight:700}}>
                      <option value="boutique">👗 BOUTIQUE (con tallas, premium)</option>
                      <option value="general">🛍 GENERAL</option>
                      <option value="comida">🍔 COMIDA</option>
                      <option value="vehiculos">🏍 VEHICULOS / MOTOS</option>
                      <option value="ferreteria">🔧 FERRETERIA</option>
                    </select>
                  </div>
                </div>
                <div style={{background:'linear-gradient(135deg, #111, #222)', borderRadius:14, padding:14, border:'1px solid #333'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <label style={{fontSize:11, fontWeight:800, color:'#FFD60A'}}>🔐 PIN DE 6 DÍGITOS DUEÑO *</label>
                    <button type="button" onClick={()=>setFormTienda({...formTienda, admin_password: genPIN()})} style={{background:'#FFD60A', color:'#000', border:'none', padding:'6px 12px', borderRadius:999, fontSize:10, fontWeight:800, cursor:'pointer'}}>🎲 Generar random</button>
                  </div>
                  <input required value={formTienda.admin_password} onChange={e=>setFormTienda({...formTienda, admin_password:e.target.value.replace(/\D/g,'').slice(0,6)})} placeholder="Ej: 123456" maxLength={6} inputMode="numeric" style={{width:'100%', border:'2px solid #FFD60A', borderRadius:12, padding:'12px 14px', marginTop:8, background:'#fff', fontWeight:900, fontSize:16, letterSpacing:4, textAlign:'center'}}/>
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
                  <input ref={fileLogoRef} type="file" accept="image/*" onChange={(e)=>{const f=e.target.files[0]; if(f) setFormTienda({...formTienda, logo_file:f, logo_preview:URL.createObjectURL(f)})}} style={{marginTop:10, fontSize:12, width:'100%'}}/>
                  {formTienda.logo_preview && <img src={formTienda.logo_preview} style={{width:'100%', height:160, objectFit:'cover', borderRadius:12, marginTop:12, border:'1px solid #EDE6E3'}}/>}
                </div>
                <button type="submit" className="btn-action" style={{background:'linear-gradient(135deg, #111, #333)', color:'#fff', border:'none', padding:14, borderRadius:14, fontWeight:900, fontSize:14, cursor:'pointer', boxShadow:'0 8px 20px rgba(0,0,0,0.2)'}}>Crear tienda premium + PIN →</button>
              </form>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              <div style={{background:'#111', color:'#fff', borderRadius:20, padding:18}}>
                <h3 style={{fontWeight:800, fontSize:14}}>👑 Link admin dueño</h3>
                <div style={{background:'#1E1E1E', borderRadius:12, padding:12, marginTop:12, fontSize:12, fontFamily:'monospace', color:'#00FF88', border:'1px solid #2A2A2A'}}>https://tiendanica.store/{formTienda.slug||'tu-slug'}/admin</div>
                <div style={{background:'#FFD60A', color:'#000', borderRadius:12, padding:12, marginTop:10, fontSize:14, fontWeight:900, textAlign:'center', letterSpacing:2}}>🔐 PIN DUEÑO: {formTienda.admin_password}</div>
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
                    <option value="boutique">BOUTIQUE</option><option value="general">GENERAL</option><option value="comida">COMIDA</option><option value="vehiculos">VEHICULOS</option><option value="ferreteria">FERRETERIA</option>
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
                  <textarea value={formProd.descripcion} onChange={e=>setFormProd({...formProd, descripcion:e.target.value})} placeholder="Descripción" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12, minHeight:70, fontSize:12}}/>
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
                <div style={{background:'rgba(255,255,255,0.06)', borderRadius:12, padding:12, display:'flex', justifyContent:'space-between'}}><span style={{fontSize:12, opacity:0.6}}>Visitas registradas</span><b>{visitas.length}</b></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
