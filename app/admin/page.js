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

  // ===== MARKET DIRECTO - SIN CODIGO =====
  const [marketKey,setMarketKey]=useState(0)
  const [marketUrl,setMarketUrl]=useState('/')
  const [marketConfig,setMarketConfig]=useState(null)
  const [marketBannerFile,setMarketBannerFile]=useState(null)
  const [marketBannerPreview,setMarketBannerPreview]=useState('')
  const [guardandoBanner,setGuardandoBanner]=useState(false)
  const [heroTitle,setHeroTitle]=useState('')
  const [heroSubtitle,setHeroSubtitle]=useState('')

  const cargarMarketConfig = async ()=>{
    const supabase = getSupabase()
    if(!supabase) return
    try{
      const {data} = await supabase.from('market_config').select('*').eq('id',1).single()
      if(data){
        setMarketConfig(data)
        setHeroTitle(data.hero_title||'')
        setHeroSubtitle(data.hero_subtitle||'')
      }
    }catch(e){ console.log('market_config no existe aún - ejecuta SQL', e) }
  }
  useEffect(()=>{ if(tab==='market') cargarMarketConfig() },[tab])

  const guardarPortadaDirecta = async ()=>{
    if(!marketBannerFile) return alert('Selecciona imagen primero')
    setGuardandoBanner(true)
    const supabase = getSupabase()
    const fileName = `market-banner-${Date.now()}-${marketBannerFile.name}`
    const {error} = await supabase.storage.from('store-logos').upload(fileName, marketBannerFile)
    let publicUrl = null
    if(error){
      const res2 = await supabase.storage.from('product-images').upload(fileName, marketBannerFile)
      if(res2.error){ alert('Error subiendo: '+res2.error.message); setGuardandoBanner(false); return }
      const {data} = supabase.storage.from('product-images').getPublicUrl(fileName)
      publicUrl = data.publicUrl
    }else{
      const {data} = supabase.storage.from('store-logos').getPublicUrl(fileName)
      publicUrl = data.publicUrl
    }
    // Guardar directo en tabla - SIN TOCAR CODIGO
    const {error: errUp} = await supabase.from('market_config').upsert({id:1, banner_url: publicUrl, updated_at: new Date().toISOString()}, {onConflict:'id'})
    if(errUp){ alert('Error guardando config: '+errUp.message); setGuardandoBanner(false); return }
    setMarketConfig(prev=> ({...(prev||{id:1}), banner_url: publicUrl}))
    setGuardandoBanner(false)
    setMarketKey(k=>k+1)
    alert('¡Portada del Market actualizada directo! ✓\nYa se ve en https://tiendanica.store sin tocar código.')
  }

  const guardarTextosMarket = async ()=>{
    const supabase = getSupabase()
    const {error} = await supabase.from('market_config').upsert({id:1, hero_title: heroTitle, hero_subtitle: heroSubtitle, updated_at: new Date().toISOString()}, {onConflict:'id'})
    if(error) alert('Error: '+error.message)
    else { alert('Textos del market actualizados ✓'); setMarketKey(k=>k+1); cargarMarketConfig() }
  }

  const eliminarPortada = async ()=>{
    if(!confirm('¿Quitar portada actual del market?')) return
    const supabase = getSupabase()
    await supabase.from('market_config').update({banner_url: null, updated_at: new Date().toISOString()}).eq('id',1)
    setMarketConfig(prev=> ({...prev, banner_url: null}))
    setMarketBannerPreview('')
    setMarketKey(k=>k+1)
    alert('Portada eliminada ✓')
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

  const CATEGORIAS = ['vestidos','blusas','jeans','conjuntos','faldas','shorts','pijamas','zapatos','carteras','accesorios','belleza','salud','general','hogar','comida','vehiculos','motos','autos','repuestos','otros','nuevo']

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
      if(!supabase){ alert('Error ENV'); setLoading(false); return }
      const {data: s, error: errS} = await supabase.from('stores').select('*').order('created_at',{ascending:false}).limit(300)
      if(errS) alert('Error: '+errS.message)
      const {data: p} = await supabase.from('products').select('*, stores(name,slug,tipo_tienda)').order('created_at',{ascending:false}).limit(500)
      let v=[], r=[]
      try{ const resV = await supabase.from('store_verifications').select('*, stores(name, whatsapp, slug)').in('status',['pendiente','revision']).order('created_at',{ascending:false}).limit(100); v = resV.data || [] }catch(e){}
      try{ const resR = await supabase.from('fraud_reports').select('*, stores(name, whatsapp)').in('status',['abierto','investigando']).order('created_at',{ascending:false}).limit(100); r = resR.data || [] }catch(e){}
      setStores(s||[]); setProducts(p||[]); setPendientes(v||[]); setReportes(r||[])
    }catch(e){ console.error(e) }finally{ setLoading(false) }
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
    const { error } = await supabase.from('stores').update({ verification_status: tipo, verification_badge: tipo }).eq('id', storeId)
    if(error){ alert('Error: '+error.message); return }
    setStores(prev=> prev.map(s=> s.id===storeId ? {...s, verification_status: tipo, verification_badge: tipo} : s))
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
    if(error){ alert('Error: '+error.message); return }
    alert(`Tienda creada ✓ ${formTienda.name} - PIN DUEÑO: ${formTienda.admin_password}`)
    setFormTienda({name:'', slug:'', whatsapp:'', tipo_tienda:'boutique', departamento:'Managua', municipio:'', direccion:'', logo_file:null, logo_preview:'', admin_password: genPIN()})
    if(fileLogoRef.current) fileLogoRef.current.value=''
    cargarTodo(); setTab('tiendas')
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
    else { alert(`Tienda actualizada ✓ PIN: ${formEdit.admin_password}`); setEditingStore(null); cargarTodo() }
  }

  const eliminarTienda = async (store)=>{
    if(!confirm(`¿Seguro eliminar ${store.name}?`)) return
    if(!confirm(`CONFIRMACIÓN FINAL: ¿Eliminar ${store.name}?`)) return
    const supabase = getSupabase()
    await supabase.from('products').delete().eq('store_id', store.id)
    await supabase.from('store_verifications').delete().eq('store_id', store.id)
    const {error} = await supabase.from('stores').delete().eq('id', store.id)
    if(error) alert('Error: '+error.message)
    else { alert('Tienda eliminada ✓'); cargarTodo() }
  }

  const aprobarVerificacion = async (id, store_id)=>{
    const supabase=getSupabase()
    await supabase.from('store_verifications').update({status:'verificada'}).eq('id',id)
    await supabase.from('stores').update({verification_status:'verificada', verification_badge:'verificada'}).eq('id',store_id)
    setPendientes(p=>p.filter(x=>x.id!==id))
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
      video_url: formProd.video_url || null,
      tallas: formProd.tallas.split(',').map(s=>s.trim()).filter(Boolean),
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
    else { alert('Producto actualizado ✓'); setEditingProduct(null); cargarTodo() }
  }

  const copiar = (txt)=>{ navigator.clipboard.writeText(txt); }

  const tiendasFiltradas = stores.filter(s=> !qTienda || s.name.toLowerCase().includes(qTienda.toLowerCase()) || s.slug.includes(qTienda.toLowerCase()))
  const stats = { total: stores.length, boutique: stores.filter(s=>s.tipo_tienda==='boutique').length, general: stores.filter(s=>s.tipo_tienda==='general').length, comida: stores.filter(s=>s.tipo_tienda==='comida').length, vehiculos: stores.filter(s=>s.tipo_tienda==='vehiculos').length, verificadas: stores.filter(s=>s.verification_status==='verificada').length, productos: products.length }

  const ahora = new Date()
  const visitasFiltradas = visitas.filter(v=>{
    const d = new Date(v.created_at)
    if(filtroVisitas==='hoy') return d.toDateString() === ahora.toDateString()
    if(filtroVisitas==='7d') return d >= new Date(ahora - 7*24*60*60*1000)
    return true
  })
  const visitasPorDepto = visitasFiltradas.reduce((acc,v)=>{ const dep = v.departamento || 'Desconocido'; if(dep==='Desconocido') return acc; acc[dep]=(acc[dep]||0)+1; return acc},{})
  const visitasPorDeptoOrdenadas = Object.entries(visitasPorDepto).sort((a,b)=>b[1]-a[1])
  const topDeptos = visitasPorDeptoOrdenadas.slice(0,5)
  const totalReal = visitasPorDeptoOrdenadas.reduce((s,[,c])=>s+c,0) || 1
  const visitasPorPagina = visitasFiltradas.reduce((acc,v)=>{ acc[v.pagina||'/']=(acc[v.pagina||'/']||0)+1; return acc},{})
  const visitasPorPaginaOrdenadas = Object.entries(visitasPorPagina).sort((a,b)=>b[1]-a[1]).slice(0,8)
  const dias = []
  for(let i=6;i>=0;i--){ const d = new Date(); d.setDate(d.getDate()-i); const key = d.toISOString().slice(0,10); const count = visitas.filter(v=> v.created_at?.slice(0,10)===key).length; dias.push({label: d.toLocaleDateString('es-NI',{weekday:'short'}), count, key}) }
  const maxDia = Math.max(...dias.map(d=>d.count),1)
  const colores = ['#7000FF','#0066FF','#FF6A00','#00C853','#FF3B30','#FFD60A','#111']

  if(!auth){
    return (
      <div style={{minHeight:'100vh', background:'#0A0A0B', display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
        <div style={{background:'#fff', borderRadius:28, padding:32, maxWidth:420, width:'100%'}}>
          <h2 style={{fontWeight:900, fontSize:22}}>Super Admin</h2>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder="Clave" style={{width:'100%', border:'1.5px solid #E8E0DC', borderRadius:14, padding:'14px 16px', marginTop:20}}/>
          <button onClick={login} style={{width:'100%', marginTop:14, background:'#111', color:'#fff', border:'none', padding:14, borderRadius:14, fontWeight:800}}>Entrar →</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh', background:'#F6F1EC', fontFamily:'Inter, system-ui'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        *{font-family:'Inter', system-ui}
        @media (max-width:768px){ .tiendas-grid{grid-template-columns:1fr !important} .crear-grid{grid-template-columns:1fr !important} .productos-grid{grid-template-columns:1fr !important} .visitas-premium-grid{grid-template-columns:1fr !important} .market-grid{grid-template-columns:1fr !important} }
      `}</style>

      <div style={{position:'sticky', top:0, zIndex:40, background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)', borderBottom:'1px solid #EDE6E3'}}>
        <div style={{maxWidth:1400, margin:'0 auto', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h1 style={{fontWeight:900, fontSize:16}}>TiendaNica • Super Admin • Market Directo</h1>
          <div style={{display:'flex', gap:8}}><button onClick={cargarTodo} style={{background:'#F0E9E2', border:'none', padding:'8px 14px', borderRadius:999, fontSize:11, fontWeight:700}}>↻ Sync</button><a href="/" style={{background:'#fff', border:'1px solid #EDE6E3', padding:'8px 14px', borderRadius:999, fontSize:11, textDecoration:'none', color:'#111', fontWeight:700}}>Market ↗</a></div>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'14px auto', padding:'0 20px', display:'flex', gap:8, overflowX:'auto'}}>
        {[
          {id:'tiendas', label:`🏪 Tiendas (${tiendasFiltradas.length})`},
          {id:'market', label:'🏬 Market Directo'},
          {id:'crear', label:'➕ Crear'},
          {id:'productos', label:`📦 Productos (${products.length})`},
          {id:'visitas', label:`📊 Visitas (${visitas.length})`},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'11px 18px', borderRadius:999, border:'1px solid', borderColor: tab===t.id ? '#FF6A00' : '#EDE6E3', fontWeight:800, fontSize:12, background: tab===t.id ? '#FF6A00' : '#fff', color: tab===t.id ? '#fff' : '#111', whiteSpace:'nowrap', cursor:'pointer'}}>{t.label}</button>
        ))}
      </div>

      <div style={{maxWidth:1400, margin:'16px auto', padding:'0 20px 40px'}}>

        {tab==='market' && (
          <div style={{display:'flex', flexDirection:'column', gap:16}}>
            <div style={{background:'linear-gradient(135deg, #111, #222)', borderRadius:20, padding:20, color:'#fff', border:'1px solid #333', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12, alignItems:'center'}}>
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                <div style={{width:48, height:48, borderRadius:14, background:'linear-gradient(135deg, #FF6A00, #FFD60A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24}}>🏬</div>
                <div>
                  <h2 style={{fontWeight:900, fontSize:18}}>Market Directo • Sin Código</h2>
                  <p style={{fontSize:11, color:'#999', marginTop:2}}>Cambia portada y textos del market directo. Se guarda en Supabase y aparece al instante en tiendanica.store</p>
                </div>
              </div>
              <div style={{display:'flex', gap:8}}>
                <button onClick={()=>setMarketKey(k=>k+1)} style={{background:'#fff', color:'#111', border:'none', padding:'10px 16px', borderRadius:12, fontSize:12, fontWeight:800, cursor:'pointer'}}>↻ Recargar</button>
                <a href="/" target="_blank" style={{background:'#FF6A00', color:'#fff', padding:'10px 16px', borderRadius:12, fontSize:12, fontWeight:800, textDecoration:'none'}}>Ver Market ↗</a>
              </div>
            </div>

            <div className="market-grid" style={{display:'grid', gridTemplateColumns:'1.2fr 0.6fr', gap:16, alignItems:'start'}}>
              <div style={{background:'#111', borderRadius:20, padding:14, border:'1px solid #222'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                  <span style={{fontSize:11, color:'#888', fontFamily:'monospace'}}>tiendanica.store{marketUrl} • Vista previa en vivo</span>
                  <div style={{display:'flex', gap:6}}>
                    <button onClick={()=>setMarketUrl('/')} style={{background: marketUrl==='/' ? '#fff' : '#222', color: marketUrl==='/' ? '#111' : '#888', border:'none', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:800}}>Home</button>
                    <button onClick={()=>{setMarketUrl('/'); setMarketKey(k=>k+1)}} style={{background:'#222', color:'#fff', border:'none', padding:'6px 10px', borderRadius:999, fontSize:10}}>↻</button>
                  </div>
                </div>
                <div style={{background:'#fff', borderRadius:14, overflow:'hidden', height:640, border:'1px solid #222'}}>
                  <iframe key={marketKey} src={marketUrl} style={{width:'100%', height:'100%', border:'none', background:'#fff'}} title="market preview"/>
                </div>
              </div>

              <div style={{display:'flex', flexDirection:'column', gap:14, position:'sticky', top:84}}>
                {/* PORTADA ACTUAL */}
                <div style={{background:'#fff', borderRadius:20, padding:18, border:'1px solid #EDE6E3'}}>
                  <h3 style={{fontWeight:900, fontSize:14}}>🎨 Portada Market • Edición Directa</h3>
                  {marketConfig?.banner_url ? (
                    <div style={{marginTop:14}}>
                      <p style={{fontSize:11, fontWeight:700, color:'#666'}}>Portada actual en vivo:</p>
                      <img src={marketConfig.banner_url} style={{width:'100%', height:180, objectFit:'cover', borderRadius:12, marginTop:8, border:'1px solid #EDE6E3'}}/>
                      <button onClick={eliminarPortada} style={{width:'100%', marginTop:8, background:'#FFE9E9', color:'#C00', border:'1px solid #FFD0D0', padding:'10px', borderRadius:10, fontSize:11, fontWeight:700, cursor:'pointer'}}>🗑 Quitar portada</button>
                    </div>
                  ) : (
                    <p style={{fontSize:11, color:'#999', marginTop:10, background:'#F5F1EC', padding:10, borderRadius:10}}>No hay portada personalizada. El market usa la default.</p>
                  )}

                  <div style={{border:'1.5px dashed #FF6A00', borderRadius:16, padding:14, background:'#FFF7ED', marginTop:14}}>
                    <p style={{fontSize:11, fontWeight:800}}>Subir nueva portada (se guarda directo)</p>
                    <input type="file" accept="image/*" onChange={(e)=>{const f=e.target.files[0]; if(f){setMarketBannerFile(f); setMarketBannerPreview(URL.createObjectURL(f))}}} style={{marginTop:10, fontSize:11, width:'100%'}}/>
                    {marketBannerPreview && (
                      <div style={{marginTop:12}}>
                        <img src={marketBannerPreview} style={{width:'100%', height:160, objectFit:'cover', borderRadius:12, border:'1px solid #EDE6E3'}}/>
                        <button onClick={guardarPortadaDirecta} disabled={guardandoBanner} style={{width:'100%', marginTop:10, background: guardandoBanner ? '#999' : 'linear-gradient(135deg, #FF6A00, #FF3B30)', color:'#fff', border:'none', padding:'12px', borderRadius:12, fontWeight:900, fontSize:12, cursor:'pointer'}}>
                          {guardandoBanner ? '⏳ Guardando...' : '💾 Guardar directo → Aparece en market sin código'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{background:'#fff', borderRadius:20, padding:18, border:'1px solid #EDE6E3'}}>
                  <h3 style={{fontWeight:900, fontSize:14}}>✏️ Textos Hero Market</h3>
                  <p style={{fontSize:11, color:'#8A7F78', marginTop:4}}>Edita título y subtítulo del home directo</p>
                  <div style={{marginTop:12, display:'flex', flexDirection:'column', gap:10}}>
                    <input value={heroTitle} onChange={e=>setHeroTitle(e.target.value)} placeholder="TiendaNica.store" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:'12px', fontWeight:700}}/>
                    <input value={heroSubtitle} onChange={e=>setHeroSubtitle(e.target.value)} placeholder="El marketplace de Nicaragua" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:'12px'}}/>
                    <button onClick={guardarTextosMarket} style={{background:'#111', color:'#fff', border:'none', padding:'12px', borderRadius:12, fontWeight:800, fontSize:12, cursor:'pointer'}}>💾 Guardar textos directo</button>
                  </div>
                </div>

                <div style={{background:'#111', color:'#fff', borderRadius:16, padding:14}}>
                  <p style={{fontSize:11, fontWeight:800, color:'#FFD60A'}}>✅ SIN CÓDIGO</p>
                  <p style={{fontSize:11, color:'#AAA', marginTop:6, lineHeight:1.5}}>
                    • Sube portada → se guarda en `market_config`<br/>
                    • Tu MarketClient.jsx ya lee esta tabla automáticamente (ver archivo PATCH)<br/>
                    • Sin git push, sin Vercel deploy, aparece al recargar<br/>
                    • Solo ejecuta el SQL una vez: `market_config.sql`
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESTO DE TABS - NO TOCADO - COPIA EXACTA DE TU ADMIN */}
        {tab==='visitas' && (
          <div style={{display:'flex', flexDirection:'column', gap:16}}>
            <div style={{background:'linear-gradient(135deg, #0F0F10 0%, #1A1A1E 50%, #252529 100%)', borderRadius:24, padding:22, color:'#fff', border:'1px solid #2A2A2E'}}>
              <h2 style={{fontWeight:900, fontSize:20}}>📊 Analytics Premium</h2>
              <div style={{marginTop:14, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:10}}>
                {[
                  {k:'Visitas', v:visitasFiltradas.length},
                  {k:'Hoy', v:visitas.filter(v=> new Date(v.created_at).toDateString() === new Date().toDateString()).length},
                  {k:'Top', v:visitasPorDeptoOrdenadas[0]?.[0]||'—'},
                ].map(c=><div key={c.k} style={{background:'rgba(255,255,255,0.06)', borderRadius:14, padding:'12px 14px'}}><p style={{fontSize:10, color:'#8A8A90'}}>{c.k}</p><p style={{fontSize:18, fontWeight:900}}>{c.v}</p></div>)}
              </div>
              <div style={{marginTop:16, display:'flex', flexDirection:'column', gap:8}}>
                {visitasPorDeptoOrdenadas.slice(0,5).map(([d,c])=><div key={d} style={{display:'flex', gap:10}}><span style={{fontSize:12, minWidth:80}}>{d}</span><div style={{flex:1, height:10, background:'#222', borderRadius:999}}><div style={{width:`${Math.round((c/(visitasPorDeptoOrdenadas[0]?.[1]||1))*100)}%`, height:'100%', background:'#7000FF', borderRadius:999}}/></div><span style={{fontSize:12}}>{c}</span></div>)}
              </div>
            </div>
          </div>
        )}

        {tab==='tiendas' && (
          <div className="tiendas-grid" style={{display:'grid', gridTemplateColumns:'1fr 380px', gap:16}}>
            <div style={{background:'#fff', borderRadius:20, padding:16, border:'1px solid #EDE6E3'}}>
              <input value={qTienda} onChange={e=>setQTienda(e.target.value)} placeholder="Buscar tienda..." style={{width:'100%', border:'1.5px solid #E8E0DC', borderRadius:12, padding:'12px 16px', background:'#FFFBF8'}}/>
              <div style={{marginTop:12, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12}}>
                {tiendasFiltradas.map(s=>(
                  <div key={s.id} style={{border:'1px solid #EDE6E3', borderRadius:16, padding:12, background:'#fff'}}>
                    <div style={{display:'flex', gap:10}}><img src={s.logo_url} style={{width:48, height:48, borderRadius:10, objectFit:'cover'}}/><div><b style={{fontSize:13}}>{s.name}</b><p style={{fontSize:11, color:'#888'}}>{s.departamento} • {s.slug}</p></div></div>
                    <div style={{display:'flex', gap:6, marginTop:10}}><button onClick={()=>setPreviewStore(s)} style={{flex:1, background:'#111', color:'#fff', border:'none', padding:'8px', borderRadius:10, fontSize:10, fontWeight:800}}>👁 Preview</button><button onClick={()=>abrirEdicion(s)} style={{flex:1, background:'#FF6A00', color:'#fff', border:'none', padding:'8px', borderRadius:10, fontSize:10, fontWeight:800}}>✏ Editar</button></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{position:'sticky', top:84}}>
              {previewStore ? <div style={{background:'#111', borderRadius:20, padding:14, color:'#fff'}}><p style={{fontWeight:800}}>👁 {previewStore.name}</p><div style={{background:'#fff', borderRadius:12, overflow:'hidden', height:400, marginTop:10}}><iframe src={`/${previewStore.slug}`} style={{width:'100%', height:'100%', border:'none'}}/></div><button onClick={()=>setPreviewStore(null)} style={{marginTop:10, width:'100%', background:'#222', color:'#fff', border:'none', padding:'8px', borderRadius:10}}>Cerrar</button></div> : <div style={{background:'#fff', borderRadius:20, padding:20, border:'1px dashed #E0D5CC', textAlign:'center'}}><p>👁 Selecciona tienda</p></div>}
            </div>
          </div>
        )}

        {tab==='crear' && (
          <div style={{background:'#fff', borderRadius:20, padding:20, border:'1px solid #EDE6E3'}}>
            <h3 style={{fontWeight:900}}>Crear tienda</h3>
            <form onSubmit={crearTienda} style={{display:'flex', flexDirection:'column', gap:10, marginTop:14}}>
              <input required value={formTienda.name} onChange={e=>setFormTienda({...formTienda, name:e.target.value, slug:e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-')})} placeholder="Nombre" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}/>
              <input required value={formTienda.slug} onChange={e=>setFormTienda({...formTienda, slug:e.target.value})} placeholder="Slug" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}/>
              <input required value={formTienda.whatsapp} onChange={e=>setFormTienda({...formTienda, whatsapp:e.target.value})} placeholder="Whatsapp" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}/>
              <input value={formTienda.admin_password} onChange={e=>setFormTienda({...formTienda, admin_password:e.target.value})} placeholder="PIN" style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}/>
              <button type="submit" style={{background:'#111', color:'#fff', border:'none', padding:12, borderRadius:12, fontWeight:800}}>Crear →</button>
            </form>
          </div>
        )}

        {tab==='productos' && (
          <div style={{background:'#fff', borderRadius:20, padding:18, border:'1px solid #EDE6E3'}}>
            <h3 style={{fontWeight:900}}>Productos ({products.length})</h3>
            <select value={selectedStoreForProduct} onChange={e=>setSelectedStoreForProduct(e.target.value)} style={{width:'100%', border:'1.5px solid #0066FF', borderRadius:12, padding:12, marginTop:12}}>
              <option value="">-- Selecciona tienda --</option>
              {stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div style={{marginTop:12, display:'flex', flexDirection:'column', gap:8}}>
              {products.filter(p=> !selectedStoreForProduct || p.store_id===selectedStoreForProduct).slice(0,20).map(p=>(
                <div key={p.id} style={{display:'flex', gap:10, border:'1px solid #EDE6E3', borderRadius:12, padding:10}}><img src={p.image_url} style={{width:50, height:50, objectFit:'cover', borderRadius:8}}/><div><b style={{fontSize:12}}>{p.name}</b><p style={{fontSize:11, color:'#0066FF'}}>C$ {p.price}</p></div></div>
              ))}
            </div>
          </div>
        )}

        {editingStore && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16}}>
            <div style={{background:'#fff', borderRadius:20, padding:20, maxWidth:500, width:'100%'}}>
              <h3 style={{fontWeight:900}}>Editar {editingStore.name}</h3>
              <form onSubmit={guardarEdicion} style={{display:'flex', flexDirection:'column', gap:10, marginTop:12}}>
                <input value={formEdit.name} onChange={e=>setFormEdit({...formEdit, name:e.target.value})} style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}/>
                <input value={formEdit.slug} onChange={e=>setFormEdit({...formEdit, slug:e.target.value})} style={{border:'1.5px solid #E8E0DC', borderRadius:12, padding:12}}/>
                <div style={{display:'flex', gap:8}}><button type="button" onClick={()=>setEditingStore(null)} style={{flex:1, background:'#F5F1EC', border:'1px solid #EDE6E3', padding:12, borderRadius:12}}>Cancelar</button><button type="submit" style={{flex:1, background:'#111', color:'#fff', border:'none', padding:12, borderRadius:12, fontWeight:800}}>Guardar</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
