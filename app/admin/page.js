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

  const CATEGORIAS = ['vestidos','blusas','jeans','conjuntos','faldas','shorts','pijamas','zapatos','carteras','accesorios','belleza','salud','general','hogar','comida','vehiculos','motos','autos','repuestos','otros','nuevo',
    // === FERRETERIA - NUEVO ===
    'herramientas','herramientas electricas','tornilleria','pinturas','electricidad','fontaneria','construccion','madera','cerrajeria','jardineria','soldadura','seguridad','ferreteria','materiales','plomeria','iluminacion']

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
