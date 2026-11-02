'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key||!url.startsWith('http')) return null
  return createClient(url,key)
}

function TemuGallery({ images=[], videoUrl, name }){
  const slides = []
  if(videoUrl) slides.push({type:'video', url:videoUrl})
  if(images && images.length>0) images.forEach(img=>{ if(img) slides.push({type:'image', url:img}) })
  if(slides.length===0) slides.push({type:'image', url:'/tienda-nica-logo.png'})
  const [current, setCurrent] = useState(0)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(true)
  const videoRef = useRef(null)
  useEffect(()=>{ setCurrent(0); setPlaying(true) },[images, videoUrl])
  const pauseVideo = ()=>{ if(videoRef.current){ videoRef.current.pause(); setPlaying(false) } }
  const goNext = (e)=>{ if(e) e.stopPropagation(); if(slides[current]?.type==='video') pauseVideo(); setCurrent((c)=>(c+1)%slides.length) }
  const goPrev = (e)=>{ if(e) e.stopPropagation(); if(slides[current]?.type==='video') pauseVideo(); setCurrent((c)=>(c-1+slides.length)%slides.length) }
  const goTo = (idx)=>{ if(slides[current]?.type==='video' && idx!==current) pauseVideo(); setCurrent(idx) }
  const togglePlay = (e)=>{ if(e) e.stopPropagation(); if(!videoRef.current) return; if(videoRef.current.paused){ videoRef.current.play(); setPlaying(true) } else { videoRef.current.pause(); setPlaying(false) } }
  return (
    <div style={{position:'relative', background:'#fff'}}>
      <div style={{display:'flex', overflow:'hidden', aspectRatio:'1/1', position:'relative', background:'#fff'}}>
        {slides.map((s,i)=>(
          <div key={i} style={{minWidth:'100%', display: i===current ? 'flex' : 'none', position:'relative', background: s.type==='video' ? '#000' : '#fff', alignItems:'center', justifyContent:'center'}}>
            {s.type==='image' ? <img src={s.url} alt={name} style={{width:'100%', height:'100%', objectFit:'contain', background:'#fff'}}/> : (
              <div style={{width:'100%', height:'100%', position:'relative', background:'#000', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <video ref={videoRef} src={s.url} autoPlay loop muted={muted} playsInline preload="metadata" style={{width:'100%', height:'100%', objectFit:'contain', background:'#000'}} onClick={togglePlay}/>
                <div onClick={togglePlay} style={{position:'absolute', inset:'30%', background:'transparent', zIndex:2}}/>
                {!playing && <div onClick={togglePlay} style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.15)', zIndex:3}}><div style={{width:60,height:60, borderRadius:999, background:'rgba(255,255,255,0.9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24}}>▶</div></div>}
                <button onClick={(e)=>{e.stopPropagation(); setMuted(!muted)}} style={{position:'absolute', bottom:16, right:16, background:'rgba(0,0,0,0.6)', color:'#fff', border:'none', width:36, height:36, borderRadius:999, zIndex:4}}> {muted ? '🔇' : '🔊'} </button>
                <span style={{position:'absolute', top:12, left:12, background:'#FF3B30', color:'#fff', fontSize:10, fontWeight:900, padding:'4px 8px', borderRadius:999, zIndex:4}}>VIDEO</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6, background:'rgba(0,0,0,0.45)', padding:'6px 10px', borderRadius:999, zIndex:5}}>
        {slides.map((s,i)=><button key={i} onClick={()=>goTo(i)} style={{width: i===current ? 20 : 6, height:6, borderRadius:999, border:'none', background: i===current ? (s.type==='video' ? '#FF3B30' : '#fff') : 'rgba(255,255,255,0.5)'}}/>)}
      </div>
      <button onClick={goPrev} style={{position:'absolute', left:0, top:0, bottom:40, width:'22%', background:'transparent', border:'none', zIndex:4}}/>
      <button onClick={goNext} style={{position:'absolute', right:0, top:0, bottom:40, width:'22%', background:'transparent', border:'none', zIndex:4}}/>
    </div>
  )
}

const ORDEN_PREMIUM = ['vestidos','blusas','jeans','conjuntos','faldas','shorts','pijamas','zapatos','carteras','accesorios','belleza','salud','general','hogar','otros','nuevo','comida']
const DEPARTAMENTOS_NI = ['Managua','Masaya','Granada','León','Chinandega','Carazo','Rivas','Estelí','Matagalpa','Jinotega','Boaco','Chontales','Madriz','Nueva Segovia','Río San Juan','RAAN','RAAS']

function getBadgeInfo(store){
  const raw = (store?.verification_status || store?.verification_badge || '').toLowerCase()
  if(raw.includes('premium')) return { key:'premium' }
  if(raw.includes('verificada')) return { key:'verificada' }
  return { key:'nueva' }
}

export default function MarketClient({ initialProducts = [], initialStores = [] }){
  const [stores,setStores]=useState(initialStores)
  const [products,setProducts]=useState(initialProducts)
  const [sel,setSel]=useState(null)
  const [q,setQ]=useState('')
  const [cat,setCat]=useState(null)
  const [tipo,setTipo]=useState(null)
  const [loading,setLoading]=useState(initialProducts.length===0)
  const [cart,setCart]=useState([])
  const [showCart,setShowCart]=useState(false)
  const [selectedTalla,setSelectedTalla]=useState(null)

  // --- COMIDA GEOLOCALIZACION ---
  const [showComida,setShowComida]=useState(false)
  const [userLoc,setUserLoc]=useState(null) // {departamento, municipio, cityRaw}
  const [locLoading,setLocLoading]=useState(false)
  const [locError,setLocError]=useState(null)
  const [manualDepto,setManualDepto]=useState('')
  const [manualMuni,setManualMuni]=useState('')

  useEffect(()=>{
    if(initialProducts.length>0){
      setLoading(false)
      return
    }
    const supabase=getSupabase()
    if(!supabase){ setLoading(false); return }
    // AHORA SI traemos comida tambien, no filtramos
    supabase.from('stores').select('*').then(({data})=>{
      setStores(data||[])
    })
    supabase.from('products').select('*, stores!inner(slug,name,logo_url,tipo_tienda,whatsapp,verification_status,verification_badge,departamento,municipio)').order('created_at',{ascending:false}).limit(300).then(({data})=>{
      setProducts(data||[])
      setLoading(false)
    }).catch(()=> setLoading(false))
  },[])

  useEffect(()=>{
    const saved = typeof window!=='undefined' ? localStorage.getItem('tn_market_cart') : null
    if(saved){ try{ setCart(JSON.parse(saved)) }catch{} }
    const savedLoc = typeof window!=='undefined' ? localStorage.getItem('tn_user_loc') : null
    if(savedLoc){ try{ setUserLoc(JSON.parse(savedLoc)) }catch{} }
  },[])
  useEffect(()=>{ localStorage.setItem('tn_market_cart', JSON.stringify(cart)) },[cart])
  useEffect(()=>{ if(userLoc) localStorage.setItem('tn_user_loc', JSON.stringify(userLoc)) },[userLoc])
  useEffect(()=>{
    if(sel){
      history.pushState({modal:true}, '', window.location.href)
      const onPop = ()=> setSel(null)
      window.addEventListener('popstate', onPop)
      setSelectedTalla(null)
      return ()=> window.removeEventListener('popstate', onPop)
    }
  },[sel])

  const closeModal = ()=>{ setSel(null); if(history.state && history.state.modal){ history.back() } }
  const getImages = (p)=> p.images?.length>0 ? p.images.filter(Boolean) : [p.image_url, ...(p.extra_images||[])].filter(Boolean).slice(0,6)
  const getTallas = (p)=>{
    const raw = p.tallas || p.sizes || p.talla || p.size || p.sizes_available || p.tallas_disponibles || []
    if(Array.isArray(raw) && raw.length>0) return raw
    if(typeof raw === 'string' && raw.length>0){ try{ const j=JSON.parse(raw); if(Array.isArray(j)) return j }catch{}; return raw.split(',').map(s=>s.trim()).filter(Boolean) }
    return []
  }

  // ---- COMIDA LOGICA ----
  const isFoodStore = (s)=> (s?.tipo_tienda||'').toLowerCase().includes('comida')
  const isFoodProduct = (p)=> (p.stores?.tipo_tienda||'').toLowerCase().includes('comida') || (p.categoria||'').toLowerCase()==='comida'

  const foodStores = stores.filter(isFoodStore)
  const foodProducts = products.filter(isFoodProduct)
  const foodCiudades = [...new Set(foodStores.map(s=> s.municipio || s.departamento).filter(Boolean))]

  const requestLocation = async ()=>{
    setLocLoading(true); setLocError(null)
    try{
      const pos = await new Promise((res,rej)=> navigator.geolocation.getCurrentPosition(res,rej,{enableHighAccuracy:false, timeout:8000}))
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      // reverse geocode con nominatim
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=es`)
      const j = await r.json()
      const city = j.address?.city || j.address?.town || j.address?.village || j.address?.municipality || j.address?.county || ''
      const state = j.address?.state || j.address?.region || ''
      // intentar mapear a departamento de NI
      let dep = ''
      const stateNorm = state.toLowerCase()
      DEPARTAMENTOS_NI.forEach(d=>{
        if(stateNorm.includes(d.toLowerCase()) || d.toLowerCase().includes(stateNorm)) dep = d
      })
      const loc = { departamento: dep || state, municipio: city, cityRaw: city, lat, lng, stateRaw: state }
      setUserLoc(loc)
      setLocLoading(false)
    }catch(e){
      setLocError('No pudimos obtener tu ubicación. Elige tu departamento manualmente.')
      setLocLoading(false)
    }
  }

  const getNearbyFoodStores = ()=>{
    if(!userLoc && !manualDepto) return []
    const depSearch = (userLoc?.departamento || manualDepto || '').toLowerCase()
    const muniSearch = (userLoc?.municipio || manualMuni || '').toLowerCase()
    return foodStores.filter(s=>{
      const sd = (s.departamento||'').toLowerCase()
      const sm = (s.municipio||'').toLowerCase()
      if(muniSearch && sm && (sm.includes(muniSearch) || muniSearch.includes(sm))) return true
      if(depSearch && sd && (sd.includes(depSearch) || depSearch.includes(sd))) return true
      // si municipio es igual a departamento buscado (Managua)
      if(muniSearch && sd && sd.includes(muniSearch)) return true
      return false
    })
  }

  const nearbyFoodStores = getNearbyFoodStores()
  const nearbyStoreIds = new Set(nearbyFoodStores.map(s=>s.id))
  const nearbyFoodProducts = foodProducts.filter(p=> {
    // si tenemos ids cercanos, filtramos por ellos, si no hay ubicacion aun, no mostramos
    if(nearbyStoreIds.size>0) return nearbyStoreIds.has(p.store_id) || nearbyStoreIds.has(p.stores?.id) || nearbyFoodStores.some(ns=> ns.slug===p.stores?.slug)
    return false
  })

  // ---- FILTRADO NORMAL ----
  let filtered=[...products]
  if(showComida){
    // en modo comida solo mostramos comida cercana
    if(userLoc || manualDepto){
      if(nearbyFoodStores.length>0){
        filtered = nearbyFoodProducts
      }else{
        filtered = [] // para mostrar mensaje de muy pronto
      }
    }else{
      filtered = [] // pide ubicacion
    }
    if(q) filtered=filtered.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()) || p.stores?.name?.toLowerCase().includes(q.toLowerCase()))
  }else{
    // modo normal: ocultar comida
    filtered = filtered.filter(p=> !isFoodProduct(p))
    if(q) filtered=filtered.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()) || p.stores?.name?.toLowerCase().includes(q.toLowerCase()))
    if(cat && cat!=='comida') filtered=filtered.filter(p=>p.categoria===cat)
    if(tipo) filtered=filtered.filter(p=> (p.stores?.tipo_tienda||'').toLowerCase().includes(tipo.toLowerCase()))
  }

  filtered = filtered.sort((a,b)=>{
    const ba = getBadgeInfo(a.stores).key
    const bb = getBadgeInfo(b.stores).key
    const order = { premium:0, verificada:1, nueva:2 }
    return (order[ba] ?? 2) - (order[bb] ?? 2)
  })

  const catsRaw=[...new Set(products.filter(p=> !isFoodProduct(p)).map(p=>p.categoria).filter(Boolean))]
  const catsOrdenadas = catsRaw.sort((a,b)=>{
    const ia = ORDEN_PREMIUM.indexOf(a.toLowerCase()); const ib = ORDEN_PREMIUM.indexOf(b.toLowerCase())
    if(ia===-1 && ib===-1) return a.localeCompare(b); if(ia===-1) return 1; if(ib===-1) return -1; return ia-ib
  })

  const handleCatClick = (c)=>{
    if(c==='comida'){
      setShowComida(true)
      setCat('comida')
      setTipo(null)
      // si no tenemos ubicacion, pedimos
      if(!userLoc && !manualDepto){
        // no auto-pedimos agresivo, dejamos que el usuario pulse boton ubicacion
      }
    }else{
      setShowComida(false)
      setCat(c===cat?null:c)
    }
  }

  const handleTodoClick = ()=>{
    setCat(null); setTipo(null); setShowComida(false)
  }

  const isBoutique = (p)=> (p.stores?.tipo_tienda||'').toLowerCase().includes('boutique')
  const addToCart = (p, talla=null)=>{
    if(isBoutique(p)){ const tallas = getTallas(p); if(tallas.length>0 && !talla){ alert('Selecciona una talla primero'); return } }
    setCart(prev=>{
      const idKey = talla ? `${p.id}-${talla}` : p.id
      const idx = prev.findIndex(i=>i.cartId===idKey)
      if(idx>=0){ const copy=[...prev]; copy[idx]={...copy[idx], qty: copy[idx].qty+1}; return copy }
      return [...prev, {cartId:idKey, id:p.id, name:p.name, price:p.price, image:p.image_url, storeName:p.stores?.name, storeSlug:p.stores?.slug, whatsapp:p.stores?.whatsapp, qty:1, talla: talla || null}]
    }); setShowCart(true)
  }
  const updateQty = (cartId, delta)=>{ setCart(prev=> prev.map(i=>{ if(i.cartId===cartId){ const n=i.qty+delta; return n<=0 ? null : {...i, qty:n} } return i }).filter(Boolean)) }
  const total = cart.reduce((s,i)=>s+(Number(i.price)||0)*i.qty,0)
  const checkoutWhatsApp = ()=>{
    if(cart.length===0) return; let msg = `Hola TiendaNica! Quiero comprar desde el market:\n\n`; cart.forEach((i,idx)=>{ const tallaTxt = i.talla ? ` (Talla: ${i.talla})` : ''; msg += `${idx+1}. ${i.name}${tallaTxt} x${i.qty} - C$ ${i.price} (Tienda: ${i.storeName})\n` }); msg += `\nTotal: C$ ${total}\n\nMi direccion: `; const uniqueWAs = [...new Set(cart.map(c=>c.whatsapp).filter(Boolean))]; if(uniqueWAs.length===1){ window.open(`https://wa.me/${uniqueWAs[0]}?text=${encodeURIComponent(msg)}`,'_blank') } else { window.open(`https://wa.me/50581732620?text=${encodeURIComponent(msg + "\n\n(Son de varias tiendas)")}`,'_blank') } }
  const waProductDirect = (p, talla=null)=>{ const tallaTxt = talla ? ` Talla: ${talla}` : ''; let m=`Hola ${p.stores.name}! Vi en TiendaNica Market: ${p.name}${tallaTxt} - C$ ${p.price} https://tiendanica.store/${p.stores.slug}`; if(p.description) m+=` - ${p.description}`; window.open(`https://wa.me/${p.stores.whatsapp}?text=${encodeURIComponent(m)}`,'_blank') }
  const abrirVender = ()=>{ const mensaje = 'Hola TiendaNica! Quiero vender en el market, me interesa abrir mi tienda.'; window.open(`https://wa.me/50581732620?text=${encodeURIComponent(mensaje)}`,'_blank') }

  if(loading) return (
    <main style={{minHeight:'100vh', background:'#F5F1ED'}}>
      <div style={{maxWidth:1180, margin:'0 auto', padding:40, textAlign:'center'}}>Cargando TiendaNica...</div>
    </main>
  )

  return (
    <main style={{minHeight:'100vh', background:'#F5F1ED', fontFamily:'Inter, system-ui', paddingBottom:40}}>
      <style>{`
        .portada-wrap{ position:relative; width:100%; line-height:0; background:#000; }
        .portada-img{ width:100%; height:auto; display:block; }
        .cinta-degradada{ background: linear-gradient(90deg, #FF8A00 0%, #FF3B30 50%, #2962FF 100%); color:#fff; padding:11px 14px; display:flex; gap:14px; justify-content:center; flex-wrap:wrap; font-size:11px; font-weight:800; letter-spacing:0.3px; text-shadow:0 1px 2px rgba(0,0,0,0.2); }
        .btn-vender-azul{ position:absolute; bottom:14px; left:14px; background:#0066FF; color:#fff; border:2px solid #fff; padding:0; border-radius:14px; font-weight:900; font-size:10px; letter-spacing:0.5px; text-transform:lowercase; box-shadow:0 6px 20px rgba(0,102,255,0.45), 0 2px 8px rgba(0,0,0,0.25); cursor:pointer; z-index:5; width:72px; height:62px; display:flex; flex-direction:column; align-items:center; justifyContent:center; gap:2px; }
        .cat-scroll{ display:flex; gap:7px; overflow-x:auto; scrollbar-width:none; padding:2px 0 6px; -webkit-overflow-scrolling:touch; }
        .cat-scroll::-webkit-scrollbar{ display:none; }
        .chip{ white-space:nowrap; padding:9px 16px; border-radius:999px; border:1.5px solid #E8E0D9; background:#fff; font-size:13px; font-weight:700; cursor:pointer; flex-shrink:0; text-transform:capitalize; }
        .chip.active{ background:#111; color:#fff; border-color:#111; }
        .chip-comida{ background: #FFF4E0; border-color: #FFB84D; color: #9A5A00; font-weight:900; }
        .chip-comida.active{ background:#FF8A00; color:#fff; border-color:#FF8A00; }
        .grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        .card{ background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.06); border:1px solid #F0E9E2; }
        .card-img{ aspect-ratio:3/4; background:#fff; position:relative; overflow:hidden; display:flex; align-items:center; justifyContent:center; }
        .card-img img{ width:100%; height:100%; object-fit:contain; background:#fff; }
        .talla-chip{ padding:8px 14px; border-radius:999px; border:1.5px solid #E0D6CF; background:#fff; font-size:13px; font-weight:800; cursor:pointer; }
        .talla-chip.active{ background:#111; color:#fff; border-color:#111; }
        @media(min-width:1024px){
          .portada-wrap{ width:100%; max-width:100%; margin:0; border-radius:0; overflow:hidden; max-height:220px; background:#000; }
          .portada-img{ width:100%; height:220px; object-fit:cover; object-position:center; display:block; }
          .cinta-degradada{ max-width:100%; margin:0; border-radius:0; }
        }
        @media(min-width:1280px){ .portada-wrap{ max-height:240px; } .portada-img{ height:240px; } }
        @media(max-width:1024px){ .grid{ grid-template-columns:repeat(3,1fr); } }
        @media(max-width:768px){ .grid{ grid-template-columns:repeat(2,1fr); gap:10px; } .card{ border-radius:14px; } .btn-vender-azul{ width:62px; height:54px; bottom:10px; left:10px; border-radius:12px; font-size:9px; } .portada-wrap{ border-radius:0; margin:0; max-height:none; width:100%; } .portada-img{ height:auto; object-fit:cover; } .cinta-degradada{ border-radius:0; max-width:100%; margin:0; } }
      `}</style>

      <div className="portada-wrap">
        <img src="/opengraph-image.png" alt="TiendaNica" className="portada-img"/>
        <button onClick={abrirVender} className="btn-vender-azul">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span>vender</span>
        </button>
      </div>

      <div className="cinta-degradada">
        <span>🛡 Tiendas verificadas con video y cédula</span><span style={{opacity:0.6}}>•</span><span>📦 Envío a toda Nicaragua</span><span style={{opacity:0.6}}>•</span><span>⚖ Reporte antifraude 24h</span>
      </div>

      <div style={{maxWidth:1180, margin:'0 auto', padding:'12px'}}>
        <div style={{background:'#fff', borderRadius:20, padding:'12px', border:'1px solid #EDE6DF', boxShadow:'0 4px 20px rgba(0,0,0,0.04)'}}>
          <div style={{display:'flex', gap:8}}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder={showComida ? "Buscar comida, pollo, pizza..." : "Buscar vestido, jeans, farmacia..."} style={{flex:1, border:'1.5px solid #EEE6DF', borderRadius:999, padding:'12px 18px', fontSize:14, outline:'none'}}/>
            <button onClick={()=>setShowCart(true)} style={{background:'#111', color:'#fff', border:'none', padding:'0 16px', borderRadius:999, fontWeight:800, fontSize:13}}>🛒 {cart.length>0 && <span style={{background:'#0066FF', color:'#fff', borderRadius:999, padding:'2px 6px', fontSize:10, marginLeft:4}}>{cart.reduce((a,b)=>a+b.qty,0)}</span>}</button>
          </div>
          <div className="cat-scroll" style={{marginTop:10}}>
            <button onClick={handleTodoClick} className={`chip ${!cat && !tipo && !showComida ? 'active' : ''}`} style={{textTransform:'none'}}>Todo</button>
            {/* BOTON COMIDA DESTACADO */}
            <button onClick={()=>handleCatClick('comida')} className={`chip chip-comida ${showComida ? 'active' : ''}`}>🍔 Comida</button>
            {catsOrdenadas.map(c=><button key={c} onClick={()=>{setShowComida(false); setCat(c===cat?null:c)}} className={`chip ${cat===c && !showComida ? 'active' : ''}`}>{c}</button>)}
          </div>
          <div className="cat-scroll" style={{marginTop:6, borderTop:'1px solid #F5F0EB', paddingTop:8}}>
            {['boutique','general'].map(t=><button key={t} onClick={()=>{setShowComida(false); setTipo(t===tipo?null:t)}} className="chip" style={{background: tipo===t && !showComida ? '#0066FF' : '#F7F2EE', color: tipo===t && !showComida ? '#fff' : '#000', borderColor: tipo===t && !showComida ? '#0066FF' : '#EDE6DF', fontSize:11, fontWeight:900, textTransform:'uppercase'}}>{t}</button>)}
            <span style={{fontSize:11, color:'#999', alignSelf:'center', marginLeft:6}}>
              {showComida ? `${nearbyFoodStores.length>0 ? filtered.length+' comidas' : 'Comida'} • ${userLoc ? (userLoc.municipio||userLoc.departamento) : manualDepto || 'Sin ubicación'}` : `${filtered.length} productos • Premium primero`}
            </span>
          </div>
        </div>

        {/* ---- MODO COMIDA ---- */}
        {showComida && (
          <div style={{marginTop:14}}>
            {/* Si no hay ubicación */}
            {!userLoc && !manualDepto && (
              <div style={{background:'#fff', borderRadius:18, padding:20, border:'1px solid #FFD9A0', textAlign:'center'}}>
                <p style={{fontSize:22}}>📍🍔</p>
                <p style={{fontWeight:900, fontSize:16, marginTop:6}}>Activa tu ubicación para ver comida cerca</p>
                <p style={{fontSize:13, color:'#666', marginTop:6, lineHeight:1.4}}>Solo mostramos restaurantes y comiderías de tu pueblo o ciudad para entrega rápida.</p>
                <div style={{display:'flex', gap:8, justifyContent:'center', marginTop:14, flexWrap:'wrap'}}>
                  <button onClick={requestLocation} disabled={locLoading} style={{background:'#111', color:'#fff', border:'none', padding:'12px 18px', borderRadius:999, fontWeight:800, fontSize:13}}>
                    {locLoading ? 'Buscando...' : '📍 Usar mi ubicación'}
                  </button>
                </div>
                {locError && <p style={{fontSize:12, color:'#FF3B30', marginTop:10}}>{locError}</p>}
                <div style={{marginTop:16, borderTop:'1px solid #F0E9E2', paddingTop:14}}>
                  <p style={{fontSize:12, fontWeight:700}}>O elige manualmente:</p>
                  <div style={{display:'flex', gap:8, marginTop:8, justifyContent:'center', flexWrap:'wrap'}}>
                    <select value={manualDepto} onChange={e=>{setManualDepto(e.target.value); setManualMuni('')}} style={{border:'1.5px solid #E8E0D9', borderRadius:999, padding:'10px 14px', fontSize:13, fontWeight:700}}>
                      <option value="">Departamento</option>
                      {DEPARTAMENTOS_NI.map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                    <input value={manualMuni} onChange={e=>setManualMuni(e.target.value)} placeholder="Municipio (ej: Masaya)" style={{border:'1.5px solid #E8E0D9', borderRadius:999, padding:'10px 14px', fontSize:13, minWidth:160}}/>
                  </div>
                  {(manualDepto || manualMuni) && (
                    <button onClick={()=>{ if(manualDepto) setUserLoc({departamento: manualDepto, municipio: manualMuni, cityRaw: manualMuni}) }} style={{marginTop:10, background:'#FF8A00', color:'#fff', border:'none', padding:'10px 18px', borderRadius:999, fontWeight:800}}>Ver comida aquí</button>
                  )}
                </div>
                {foodCiudades.length>0 && <p style={{fontSize:11, color:'#888', marginTop:12}}>Disponible ahora en: {foodCiudades.join(', ')}</p>}
              </div>
            )}

            {/* Si hay ubicacion pero no hay tiendas cerca */}
            {(userLoc || manualDepto) && nearbyFoodStores.length===0 && (
              <div style={{background:'#fff', borderRadius:18, padding:22, border:'1px solid #E8E0D9', textAlign:'center'}}>
                <p style={{fontSize:28}}>🍔⏳</p>
                <h3 style={{fontWeight:900, fontSize:18, marginTop:8}}>Muy pronto servicios de alimentación en tu zona</h3>
                <p style={{fontSize:13, color:'#666', marginTop:8, lineHeight:1.5}}>
                  {userLoc?.municipio || manualMuni ? <>Aún no tenemos restaurantes activos en <b>{userLoc?.municipio || manualMuni}, {userLoc?.departamento || manualDepto}</b>.</> : <>Aún no tenemos cobertura de comida en <b>{manualDepto}</b>.</>}
                  <br/>Estamos activando comiderías y restaurantes verificados pueblo por pueblo.
                </p>
                <div style={{marginTop:14, display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap'}}>
                  <button onClick={()=>{ setUserLoc(null); setManualDepto(''); setManualMuni('') }} style={{background:'#F0F0F0', border:'none', padding:'10px 16px', borderRadius:999, fontWeight:700, fontSize:12}}>📍 Cambiar ubicación</button>
                  <button onClick={abrirVender} style={{background:'#111', color:'#fff', border:'none', padding:'10px 16px', borderRadius:999, fontWeight:800, fontSize:12}}>¿Tienes restaurante? Únete</button>
                </div>
                {foodCiudades.length>0 && (
                  <div style={{marginTop:16, background:'#F7F2EE', borderRadius:12, padding:10}}>
                    <p style={{fontSize:11, fontWeight:800}}>Ciudades con servicio activo:</p>
                    <p style={{fontSize:12, marginTop:4}}>{foodCiudades.join(' • ')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Si hay tiendas cerca */}
            {(userLoc || manualDepto) && nearbyFoodStores.length>0 && (
              <div style={{background:'#FFF7E8', border:'1px solid #FFD9A0', borderRadius:14, padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8, marginBottom:12}}>
                <p style={{fontSize:12, fontWeight:800}}>🍔 Mostrando {nearbyFoodStores.length} restaurante(s) en {userLoc?.municipio || manualMuni || userLoc?.departamento || manualDepto} • {filtered.length} platillos</p>
                <button onClick={()=>{ setUserLoc(null); setManualDepto(''); setManualMuni('') }} style={{background:'#fff', border:'1px solid #E8E0D9', padding:'6px 10px', borderRadius:999, fontWeight:700, fontSize:11}}>Cambiar zona</button>
              </div>
            )}
          </div>
        )}

        <div className="grid" style={{marginTop:12}}>
          {filtered.map(p=>{
            const hasVideo=!!p.video_url
            const boutique = isBoutique(p)
            const badge = getBadgeInfo(p.stores)
            return (
              <div key={p.id} className="card">
                <button onClick={()=>setSel(p)} style={{width:'100%', border:'none', padding:0, background:'#fff'}} className="card-img">
                  <img src={p.image_url} alt={p.name}/>
                  {hasVideo && <span style={{position:'absolute', top:8, right:8, background:'#FF2D55', color:'#fff', fontSize:9, fontWeight:900, padding:'5px 9px', borderRadius:999}}>▶ VIDEO</span>}
                  {boutique && <span style={{position:'absolute', top:8, left:8, background:'#0066FF', color:'#fff', fontSize:8, fontWeight:900, padding:'3px 7px', borderRadius:999}}>TALLAS</span>}
                  {showComida && <span style={{position:'absolute', top:8, left:8, background:'#FF8A00', color:'#fff', fontSize:8, fontWeight:900, padding:'4px 8px', borderRadius:999}}>🍔 {p.stores?.municipio || ''}</span>}
                </button>
                <div style={{padding:'10px 12px 12px'}}>
                  <p style={{fontSize:13, fontWeight:800, lineHeight:'1.25', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', minHeight:32}}>{p.name}</p>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6}}><b style={{fontSize:14}}>C$ {p.price}</b><span style={{fontSize:10, color:'#8B7E74', background:'#F7F2EE', padding:'3px 8px', borderRadius:999, fontWeight:700, textTransform:'capitalize'}}>{p.categoria}</span></div>
                  {badge.key==='premium' && <p style={{fontSize:11, color:'#FF6A00', fontWeight:800, marginTop:6}}>⭐ Tienda Premium • {p.stores?.municipio || p.stores?.departamento || 'RAAS'}</p>}
                  {badge.key==='verificada' && <p style={{fontSize:11, color:'#0066FF', fontWeight:700, marginTop:6}}>✓ Verificada</p>}
                  {showComida && <p style={{fontSize:11, color:'#9A5A00', fontWeight:700, marginTop:4}}>📍 {p.stores?.name} • {p.stores?.municipio}</p>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Mensaje si no hay productos en modo normal */}
        {!showComida && filtered.length===0 && !loading && (
          <div style={{textAlign:'center', padding:30, background:'#fff', borderRadius:18, marginTop:12}}>
            <p style={{fontSize:14, color:'#999'}}>No encontramos productos para esa búsqueda.</p>
          </div>
        )}
      </div>

      <div style={{background:'#111', color:'#fff', marginTop:30, padding:'24px 16px 12px'}}>
        <div style={{maxWidth:900, margin:'0 auto'}}>
          <div style={{textAlign:'center', marginBottom:18}}>
            <p style={{fontWeight:900, fontSize:16}}>TiendaNica.store</p>
            <p style={{fontSize:11, opacity:0.6, marginTop:4}}>El marketplace verificado de Nicaragua</p>
            <div style={{marginTop:10, display:'inline-flex', gap:6, flexWrap:'wrap', justifyContent:'center'}}>
              <span style={{fontSize:10, background:'rgba(255,255,255,0.1)', padding:'4px 8px', borderRadius:999}}>🛡 Tiendas verificadas con video y cédula</span>
              <span style={{fontSize:10, background:'rgba(255,255,255,0.1)', padding:'4px 8px', borderRadius:999}}>📦 Envío a toda Nicaragua</span>
              <span style={{fontSize:10, background:'rgba(255,255,255,0.1)', padding:'4px 8px', borderRadius:999}}>⚖ Reporte antifraude 24h</span>
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, textAlign:'left', borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:16}}>
            <div>
              <p style={{fontSize:12, fontWeight:800, marginBottom:8}}>Legal</p>
              <div style={{display:'flex', flexDirection:'column', gap:6}}>
                <a href="/terminos" style={{fontSize:11, color:'rgba(255,255,255,0.7)', textDecoration:'none'}}>Términos y Condiciones</a>
                <a href="/privacidad" style={{fontSize:11, color:'rgba(255,255,255,0.7)', textDecoration:'none'}}>Política de Privacidad</a>
                <a href="/vendedores" style={{fontSize:11, color:'rgba(255,255,255,0.7)', textDecoration:'none'}}>Política de Vendedores</a>
                <a href="/reportar" style={{fontSize:11, color:'#FF6B6B', textDecoration:'none', fontWeight:700}}>🚨 Reportar Fraude</a>
              </div>
            </div>
            <div>
              <p style={{fontSize:12, fontWeight:800, marginBottom:8}}>Soporte</p>
              <div style={{display:'flex', flexDirection:'column', gap:6}}>
                <a href="/privacidad" style={{fontSize:11, color:'rgba(255,255,255,0.7)', textDecoration:'none'}}>¿Cómo compramos?</a>
                <a href="https://wa.me/50581732620" style={{fontSize:11, color:'#25D366', textDecoration:'none', fontWeight:700}}>WhatsApp Soporte: 505 8173 2620</a>
                <span style={{fontSize:10, color:'rgba(255,255,255,0.4)'}}>Lun-Sáb 9AM-6PM</span>
              </div>
            </div>
          </div>

          <details style={{marginTop:18, background:'rgba(255,255,255,0.06)', borderRadius:12, padding:'12px 14px'}}>
            <summary style={{fontSize:12, fontWeight:800, cursor:'pointer', listStyle:'none', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span>📦 Paquete Seguro - Cómo evitamos el fraude</span>
              <span style={{fontSize:10, background:'#0066FF', padding:'2px 8px', borderRadius:999}}>Abrir ▼</span>
            </summary>
            <div style={{marginTop:12, fontSize:11, lineHeight:1.5, color:'rgba(255,255,255,0.75)', textAlign:'left'}}>
              <p style={{fontWeight:700, color:'#fff', marginBottom:6}}>TiendaNica.store NO es el vendedor, somos el intermediario verificado.</p>
              <p style={{marginBottom:8}}><b>1. Verificación real:</b> Toda tienda Premium ⭐ y Verificada ✓ pasó KYC: foto de cédula, selfie con cédula y video de 15s mostrando stock real en su casa/tienda. Sin eso no aparece.</p>
              <p style={{marginBottom:8}}><b>2. WhatsApp Business:</b> Verificamos que el número responde. Llamada de 30s de nuestro equipo. Tiendas fantasma nunca contestan.</p>
              <p style={{marginBottom:8}}><b>3. Antifraude:</b> 2 reportes comprobados de estafa = suspensión inmediata. Guardamos lista de WhatsApps baneados. Si una tienda usa fotos robadas de Shein/AliExpress como propias, se baja.</p>
              <p style={{marginBottom:8}}><b>4. Compra segura:</b> Siempre habla por el WhatsApp que aparece en la tienda. Nunca deposites a nombre diferente al de la tienda. Pide guía de envío de CargoTrans / video de empaque.</p>
              <p><b>¿Fuiste estafado?</b> Usa <a href="/reportar" style={{color:'#FF6B6B', fontWeight:700}}>Reportar Fraude</a> - respondemos en 24h. Intervenimos y suspendemos la tienda si se comprueba.</p>
            </div>
          </details>

          <p style={{fontSize:10, opacity:0.3, marginTop:16, textAlign:'center'}}>© 2025 TiendaNica.store - Socio fundador + Equipo TN Sistemas. Hecho en Nicaragua con 🧡</p>
        </div>
      </div>

      {sel&&<div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={closeModal}>
        <div style={{background:'#fff',width:'100%',maxWidth:500,borderTopLeftRadius:24,borderTopRightRadius:24,overflow:'hidden',maxHeight:'92vh',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
          <TemuGallery images={getImages(sel)} videoUrl={sel.video_url} name={sel.name}/>
          <div style={{padding:16, overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <b style={{fontSize:20}}>C$ {sel.price}</b>
              <span style={{fontSize:11, background:'#F6F3F0', padding:'4px 8px', borderRadius:999}}>{sel.stores?.name}</span>
            </div>
            <h2 style={{fontWeight:900, fontSize:16, marginTop:6}}>{sel.name}</h2>
            <p style={{fontSize:12, color:'#666'}}>{sel.categoria} • {(sel.stores?.tipo_tienda||'').toUpperCase()}</p>
            {sel.description&&<p style={{fontSize:13, background:'#F7F5F3', padding:'8px 10px', borderRadius:10, marginTop:8}}>✓ {sel.description}</p>}
            {isBoutique(sel) && (
              <div style={{marginTop:12}}>
                <p style={{fontSize:12, fontWeight:800, marginBottom:8}}>Selecciona talla:</p>
                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                  {getTallas(sel).length>0 ? getTallas(sel).map(t=><button key={t} onClick={()=>setSelectedTalla(t)} className={`talla-chip ${selectedTalla===t ? 'active' : ''}`}>{t}</button>) : (<>{['XS','S','M','L','XL'].map(t=><button key={t} onClick={()=>setSelectedTalla(t)} className={`talla-chip ${selectedTalla===t ? 'active' : ''}`}>{t}</button>)}</>)}
                </div>
              </div>
            )}
            <div style={{display:'flex', gap:8, marginTop:14}}>
              <button onClick={()=>{addToCart(sel, selectedTalla);}} style={{flex:1, background:'#111', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:800}}>🛒 Agregar</button>
              <button onClick={()=>waProductDirect(sel, selectedTalla)} style={{flex:1, background:'#25D366', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:900}}>WhatsApp</button>
            </div>
            <div style={{display:'flex', gap:8, marginTop:8}}>
              <button onClick={closeModal} style={{flex:1, background:'#F0F0F0', border:'none', padding:11, borderRadius:999, fontWeight:700}}>← Regresar</button>
              <a href={`/${sel.stores?.slug}`} style={{flex:1, textAlign:'center', background:'#FF6A00', color:'#fff', padding:11, borderRadius:999, fontWeight:800, textDecoration:'none', fontSize:13}}>Ver tienda</a>
            </div>
          </div>
        </div>
      </div>}

      {showCart && <div style={{position:'fixed', inset:0, zIndex:120, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'flex-end'}} onClick={()=>setShowCart(false)}>
        <div style={{background:'#fff', width:'100%', maxWidth:380, height:'100%', padding:16, display:'flex', flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee', paddingBottom:12}}>
            <h3 style={{fontWeight:900, fontSize:18}}>🛒 Carrito ({cart.reduce((a,b)=>a+b.qty,0)})</h3>
            <button onClick={()=>setShowCart(false)} style={{background:'#F0F0F0', border:'none', width:32, height:32, borderRadius:999, fontWeight:800}}>X</button>
          </div>
          <div style={{flex:1, overflowY:'auto', marginTop:12, display:'flex', flexDirection:'column', gap:10}}>
            {cart.length===0 && <div style={{textAlign:'center', marginTop:40}}><p style={{fontSize:14, color:'#999'}}>Carrito vacío</p></div>}
            {cart.map(i=>(
              <div key={i.cartId} style={{display:'flex', gap:10, border:'1px solid #f0f0f0', borderRadius:12, padding:8, alignItems:'center'}}>
                <img src={i.image} style={{width:50, height:50, objectFit:'contain', background:'#fff', borderRadius:8}}/>
                <div style={{flex:1}}><p style={{fontSize:12, fontWeight:700}}>{i.name.slice(0,38)}{i.talla ? ` - ${i.talla}` : ''}</p><p style={{fontSize:11, color:'#666'}}>{i.storeName}</p><b style={{fontSize:13}}>C$ {i.price}</b></div>
                <div style={{display:'flex', alignItems:'center', gap:6}}><button onClick={()=>updateQty(i.cartId,-1)} style={{width:26, height:26, borderRadius:999, border:'1px solid #ddd', background:'#fff'}}>−</button><span style={{fontSize:12, fontWeight:800, minWidth:16, textAlign:'center'}}>{i.qty}</span><button onClick={()=>updateQty(i.cartId,1)} style={{width:26, height:26, borderRadius:999, border:'1px solid #111', background:'#111', color:'#fff'}}>+</button></div>
              </div>
            ))}
          </div>
          {cart.length>0 && <div style={{borderTop:'1px solid #eee', paddingTop:12}}><div style={{display:'flex', justifyContent:'space-between', marginBottom:12}}><span style={{fontWeight:700}}>Total:</span><b style={{fontSize:18}}>C$ {total}</b></div><button onClick={checkoutWhatsApp} style={{width:'100%', background:'#25D366', color:'#fff', border:'none', padding:14, borderRadius:999, fontWeight:900}}>Comprar por WhatsApp</button><button onClick={()=>setCart([])} style={{width:'100%', background:'#fff', color:'#999', border:'none', padding:10, marginTop:6, fontSize:12}}>Vaciar carrito</button></div>}
        </div>
      </div>}

      {cart.length>0 && !showCart && !sel && <button onClick={()=>setShowCart(true)} style={{position:'fixed', bottom:20, right:20, zIndex:30, background:'#111', color:'#fff', border:'none', padding:'12px 18px', borderRadius:999, fontWeight:900, boxShadow:'0 8px 24px rgba(0,0,0,0.3)', display:'flex', alignItems:'center', gap:8}}>🛒 C$ {total} <span style={{background:'#0066FF', color:'#fff', padding:'2px 8px', borderRadius:999, fontSize:11}}>{cart.reduce((a,b)=>a+b.qty,0)}</span></button>}
    </main>
  )
}
