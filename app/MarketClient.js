'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key||!url.startsWith('http')) return null
  return createClient(url,key)
}

function trackPixel(eventName, data = {}){
  try{
    if(typeof window !== 'undefined' && window.fbq){
      window.fbq('track', eventName, data);
    }
  }catch(e){}
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

const ORDEN_PREMIUM = ['vestidos','blusas','jeans','conjuntos','faldas','shorts','pijamas','zapatos','carteras','accesorios','belleza','salud','general','hogar','otros','nuevo','comida','motos','autos','camionetas','moto usada','auto usado','repuestos','accesorios moto','cascos','llantas','vehiculos']
const DEPARTAMENTOS_NI = ['Managua','Masaya','Granada','León','Chinandega','Carazo','Rivas','Estelí','Matagalpa','Jinotega','Boaco','Chontales','Madriz','Nueva Segovia','Río San Juan','RAAN','RAAS']

function getBadgeInfo(store){
  const raw = (store?.verification_status || store?.verification_badge || '').toLowerCase()
  if(raw.includes('premium')) return { key:'premium' }
  if(raw.includes('verificada')) return { key:'verificada' }
  return { key:'nueva' }
}

function getOptimizedImage(url, width=400){
  if(!url) return '/tienda-nica-logo.png'
  if(url.includes('/tienda-nica-logo.png') || url.includes('opengraph-image.png')) return url
  try{
    if(url.includes('supabase.co')){
      const sep = url.includes('?') ? '&' : '?'
      return `${url}${sep}width=${width}&quality=75`
    }
  }catch{}
  return url
}
function getOriginalImage(url){ return url }

function getDireccion(store){
  return store.direccion || store.dirección || store.address || store.barrio || store.comunidad || store.zona || store.referencia || store.direccion_exacta || ''
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
  const [showComida,setShowComida]=useState(false)
  const [userLoc,setUserLoc]=useState(null)
  const [locLoading,setLocLoading]=useState(false)
  const [locError,setLocError]=useState(null)
  const [manualDepto,setManualDepto]=useState('')
  const [manualMuni,setManualMuni]=useState('')
  const [manualDir,setManualDir]=useState('')
  const [comidaProducts,setComidaProducts]=useState([])
  const [comidaLoading,setComidaLoading]=useState(false)
  const [filtroMuniActivo,setFiltroMuniActivo]=useState(false)
  const [filtroDirActivo,setFiltroDirActivo]=useState(false)
  const [showAllCats,setShowAllCats]=useState(false)
  const [visibleCount,setVisibleCount]=useState(60)
  useEffect(()=>{ if(q){ setVisibleCount(60) } },[q])
  const [showSuperPrompt,setShowSuperPrompt]=useState(false)
  const [superPinInput,setSuperPinInput]=useState('')
  const longPressRef = useRef(null)
  const MASTER_PIN = '6052611890000'
  const handleConfigPressStart = ()=>{ longPressRef.current = setTimeout(()=>{ setShowSuperPrompt(true); }, 3000) }
  const handleConfigPressEnd = ()=>{ if(longPressRef.current){ clearTimeout(longPressRef.current); longPressRef.current=null } }
  const handleSuperAccess = ()=>{ if(superPinInput === MASTER_PIN){ window.location.href = '/admin' } else { alert('PIN incorrecto'); setSuperPinInput('') } }

  // ===== MARKET DIRECTO - PORTADA SIN CODIGO - SOLO ESTO AGREGADO =====
  const [marketConfig,setMarketConfig]=useState(null)
  useEffect(()=>{
    const supabase=getSupabase()
    if(!supabase) return
    supabase.from('market_config').select('*').eq('id',1).single().then(({data})=>{
      if(data) setMarketConfig(data)
    })
  },[])

  useEffect(()=>{
    const supabase=getSupabase()
    if(!supabase){ setLoading(false); return }
    supabase.from('stores').select('*').then(({data})=>{
      if(data) setStores(data)
    })
    if(initialProducts.length===0){
      supabase.from('products').select('*, stores!inner(slug,name,logo_url,tipo_tienda,whatsapp,verification_status,verification_badge,departamento,municipio,direccion,address,barrio,comunidad)').order('created_at',{ascending:false}).limit(60).then(({data})=>{
        if(data) setProducts(data)
        setLoading(false)
      }).catch(()=> setLoading(false))
    }else{
      const supabase2=getSupabase()
      supabase2.from('stores').select('*').ilike('tipo_tienda','%comida%').then(({data:foodStores})=>{
        if(foodStores && foodStores.length>0){
          setStores(prev=> {
            const existing = new Set(prev.map(s=>s.id))
            const newOnes = foodStores.filter(s=>!existing.has(s.id))
            return [...prev, ...newOnes]
          })
        }
      })
      setLoading(false)
    }
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
    const keys = ['tallas','sizes','tallas_disponibles','sizes_available','tallasDisponibles','sizesAvailable','talla','size']
    for(const k of keys){
      const v = p?.[k]
      if(Array.isArray(v) && v.length>0) return v
      if(typeof v === 'string' && v.trim().length>0){
        try{ const j=JSON.parse(v); if(Array.isArray(j) && j.length>0) return j }catch{}
        const arr = v.split(',').map(s=>s.trim()).filter(Boolean)
        if(arr.length>0) return arr
      }
    }
    return []
  }

  const isFoodStore = (s)=> (s?.tipo_tienda||'').toLowerCase().includes('comida')
  const isFoodProduct = (p)=> (p.stores?.tipo_tienda||'').toLowerCase().includes('comida') || (p.categoria||'').toLowerCase()==='comida'
  const foodStores = stores.filter(isFoodStore)
  const foodCiudades = [...new Set(foodStores.map(s=> s.municipio || s.departamento).filter(Boolean))]

  const requestLocation = async ()=>{
    setLocLoading(true); setLocError(null)
    try{
      const pos = await new Promise((res,rej)=> navigator.geolocation.getCurrentPosition(res,rej,{enableHighAccuracy:false, timeout:8000}))
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=es`)
      const j = await r.json()
      const city = j.address?.city || j.address?.town || j.address?.village || j.address?.municipality || j.address?.county || ''
      const state = j.address?.state || j.address?.region || ''
      let dep = ''
      const stateNorm = state.toLowerCase()
      DEPARTAMENTOS_NI.forEach(d=>{
        if(stateNorm.includes(d.toLowerCase()) || d.toLowerCase().includes(stateNorm)) dep = d
      })
      const loc = { departamento: dep || state, municipio: city, cityRaw: city, lat, lng, stateRaw: state }
      setUserLoc(loc)
      setManualDepto(dep || state)
      setManualMuni(city)
      setFiltroMuniActivo(false)
      setFiltroDirActivo(false)
      setLocLoading(false)
    }catch(e){
      setLocError('No pudimos obtener tu ubicación. Elige tu departamento manualmente.')
      setLocLoading(false)
    }
  }

  const getNearbyFoodStores = ()=>{
    const depSearch = (userLoc?.departamento || manualDepto || '').toLowerCase().trim()
    const muniSearch = (userLoc?.municipio || manualMuni || '').toLowerCase().trim()
    const dirSearch = (userLoc?.direccion || manualDir || '').toLowerCase().trim()
    if(!depSearch && !muniSearch && !dirSearch) return []
    if(dirSearch && filtroDirActivo){
      return foodStores.filter(s=>{
        const d = getDireccion(s).toLowerCase()
        if(d && (d.includes(dirSearch) || dirSearch.includes(d))) return true
        return false
      })
    }
    if(muniSearch && filtroMuniActivo && !filtroDirActivo){
      return foodStores.filter(s=>{
        const sm = (s.municipio||'').toLowerCase()
        if(sm && (sm===muniSearch || sm.includes(muniSearch) || muniSearch.includes(sm))) return true
        return false
      })
    }
    if(depSearch && !filtroMuniActivo && !filtroDirActivo){
      return foodStores.filter(s=>{
        const sd = (s.departamento||'').toLowerCase()
        const sm = (s.municipio||'').toLowerCase()
        const depMatch = sd && (sd.includes(depSearch) || depSearch.includes(sd))
        if(muniSearch && !filtroMuniActivo){
          if(depMatch) return true
          if(sm && (sm.includes(muniSearch) || muniSearch.includes(sm))) return true
          const d = getDireccion(s).toLowerCase()
          if(d && d.includes(muniSearch)) return true
          return false
        }
        return depMatch
      })
    }
    if(muniSearch && !depSearch){
      return foodStores.filter(s=>{
        const sm = (s.municipio||'').toLowerCase()
        const d = getDireccion(s).toLowerCase()
        if(sm && (sm.includes(muniSearch) || muniSearch.includes(sm))) return true
        if(d && d.includes(muniSearch)) return true
        return false
      })
    }
    if(dirSearch && !filtroDirActivo && !filtroMuniActivo){
      return foodStores.filter(s=>{
        const sd = (s.departamento||'').toLowerCase()
        const sm = (s.municipio||'').toLowerCase()
        const d = getDireccion(s).toLowerCase()
        if(d && d.includes(dirSearch)) return true
        if(sm.includes(dirSearch) || sd.includes(dirSearch)) return true
        return false
      })
    }
    return []
  }

  const nearbyFoodStores = getNearbyFoodStores()

  useEffect(()=>{
    if(!showComida) return
    if(nearbyFoodStores.length===0){ setComidaProducts([]); return }
    const supabase = getSupabase()
    if(!supabase) return
    setComidaLoading(true)
    const ids = nearbyFoodStores.map(s=>s.id)
    supabase.from('products').select('*, stores!inner(slug,name,logo_url,tipo_tienda,whatsapp,verification_status,verification_badge,departamento,municipio,direccion,address,barrio)').in('store_id', ids).eq('is_active', true).order('created_at',{ascending:false}).limit(200).then(({data, error})=>{
      if(error){ console.log('error comida', error); setComidaProducts([]) }
      else setComidaProducts(data||[])
      setComidaLoading(false)
    }).catch(()=> setComidaLoading(false))
  },[showComida, nearbyFoodStores.map(s=>s.id).join(','), filtroMuniActivo, filtroDirActivo])

  const municipiosDelDepto = [...new Set(foodStores.filter(s=> (s.departamento||'').toLowerCase().includes(manualDepto.toLowerCase())).map(s=>s.municipio).filter(Boolean))]
  const direccionesDelMuni = [...new Set(foodStores.filter(s=> {
    const m = (s.municipio||'').toLowerCase()
    const dpto = (s.departamento||'').toLowerCase()
    const muniSearch = manualMuni.toLowerCase()
    const deptoSearch = manualDepto.toLowerCase()
    if(muniSearch && m.toLowerCase().includes(muniSearch)) return true
    if(!muniSearch && deptoSearch && dpto.includes(deptoSearch)) return true
    return false
  }).map(s=> getDireccion(s)).filter(Boolean))]

  let filtered=[...products]
  if(showComida){
    filtered = comidaProducts
    if(q){ const qq=q.toLowerCase(); filtered=filtered.filter(p=> p.name.toLowerCase().includes(qq) || p.stores?.name?.toLowerCase().includes(qq) || (p.categoria||'').toLowerCase().includes(qq) || (p.stores?.tipo_tienda||'').toLowerCase().includes(qq)) }
  }else{
    filtered = filtered.filter(p=> !isFoodProduct(p))
    if(q){ const qq=q.toLowerCase(); filtered=filtered.filter(p=> p.name.toLowerCase().includes(qq) || p.stores?.name?.toLowerCase().includes(qq) || (p.categoria||'').toLowerCase().includes(qq) || (p.stores?.tipo_tienda||'').toLowerCase().includes(qq)) }
    if(cat && cat!=='comida') filtered=filtered.filter(p=>p.categoria===cat)
    if(tipo) filtered=filtered.filter(p=> (p.stores?.tipo_tienda||'').toLowerCase().includes(tipo.toLowerCase()))
  }

  filtered = filtered.sort((a,b)=>{
    const ba = getBadgeInfo(a.stores).key
    const bb = getBadgeInfo(b.stores).key
    const order = { premium:0, verificada:1, nueva:2 }
    return (order[ba] ?? 2) - (order[bb] ?? 2)
  })

  const aplicarLimitadorTienda = (lista, maxSeguidos=2) => {
    if(!lista || lista.length<=3) return lista
    const res = []
    const pendientes = [...lista]
    let lastStoreId = null
    let countSeguidos = 0
    while(pendientes.length>0){
      let idx = -1
      for(let i=0;i<pendientes.length;i++){
        const sid = pendientes[i].stores?.id || pendientes[i].store_id || pendientes[i].stores?.slug
        if(sid !== lastStoreId || countSeguidos < maxSeguidos){
          idx = i
          break
        }
      }
      if(idx===-1) idx = 0
      const prod = pendientes.splice(idx,1)[0]
      const sid = prod.stores?.id || prod.store_id || prod.stores?.slug
      if(sid === lastStoreId){ countSeguidos++ }else{ lastStoreId = sid; countSeguidos = 1 }
      res.push(prod)
    }
    return res
  }
  if(!showComida){ filtered = aplicarLimitadorTienda(filtered, 2) }

  const catsRaw=[...new Set(products.filter(p=> !isFoodProduct(p)).map(p=>p.categoria).filter(Boolean))]
  const catsOrdenadas = catsRaw.sort((a,b)=>{
    const ia = ORDEN_PREMIUM.indexOf(a.toLowerCase()); const ib = ORDEN_PREMIUM.indexOf(b.toLowerCase())
    if(ia===-1 && ib===-1) return a.localeCompare(b); if(ia===-1) return 1; if(ib===-1) return -1; return ia-ib
  })

  const handleCatClick = (c)=>{
    setVisibleCount(60);
    if(c==='comida'){ setShowComida(true); setCat('comida'); setTipo(null) }else{ setShowComida(false); setCat(c===cat?null:c) }
  }
  const handleTodoClick = ()=>{ setCat(null); setTipo(null); setShowComida(false); setVisibleCount(60) }
  const isBoutique = (p)=> (p.stores?.tipo_tienda||'').toLowerCase().includes('boutique')
  const addToCart = (p, talla=null)=>{
    if(isBoutique(p)){ const tallas = getTallas(p); if(tallas.length>0 && !talla){ alert('Selecciona una talla primero'); return } }
    trackPixel('AddToCart', { content_name: p.name, content_ids: [p.id], value: Number(p.price)||0, currency: 'NIO' });
    setCart(prev=>{
      const idKey = talla ? `${p.id}-${talla}` : p.id
      const idx = prev.findIndex(i=>i.cartId===idKey)
      if(idx>=0){ const copy=[...prev]; copy[idx]={...copy[idx], qty: copy[idx].qty+1}; return copy }
      return [...prev, {cartId:idKey, id:p.id, name:p.name, price:p.price, image:p.image_url, storeName:p.stores?.name, storeSlug:p.stores?.slug, whatsapp:p.stores?.whatsapp, qty:1, talla: talla || null}]
    }); setShowCart(true)
  }
  const updateQty = (cartId, delta)=>{ setCart(prev=> prev.map(i=>{ if(i.cartId===cartId){ const n=i.qty+delta; return n<=0 ? null : {...i, qty:n} } return i }).filter(Boolean)) }
  const total = cart.reduce((s,i)=>s+(Number(i.price)||0)*i.qty,0)
  const generarMensajeWhatsApp = (producto, tienda, talla=null) => {
    const urlProducto = `https://tiendanica.store/${tienda.slug}#${producto.id}`;
    const precio = producto.price ? `C$${producto.price}` : 'precio a consultar';
    const esVehiculo = (tienda.tipo_tienda||'').toLowerCase().includes('vehiculos') || ['motos','autos','camionetas','repuestos','moto usada','auto usado'].includes((producto.categoria||'').toLowerCase());
    const esComida = (tienda.tipo_tienda||'').toLowerCase().includes('comida') || (producto.categoria||'').toLowerCase()==='comida';
    if(esVehiculo){ return `🏍 ${tienda.name?.toUpperCase()}%0A📦 *${producto.name}*%0A🏷 ${producto.marca||''} ${producto.modelo||''} ${producto.anio||producto.año||''} - ${producto.kilometraje||'0km'}%0A💰 *${precio}* | 📍${producto.ubicacion||tienda.municipio||''}%0A🔗 ${urlProducto}%0A¿Disponible? ¿Financiamiento?`; }
    if(esComida){ return `🍔 ${tienda.name?.toUpperCase()}%0A📦 *${producto.name}* - ${precio}%0A🔗 ${urlProducto}%0A📍 Mi dir: [ESCRIBE]%0A¿Delivery y tiempo?`; }
    const tallaTxt = talla ? `%0A📏 Talla: *${talla}*` : '';
    const tallasDisp = (producto.tallas||producto.sizes||[]).length>0 ? `%0A📏 Tallas disponibles: ${(producto.tallas||producto.sizes||[]).join(', ')}` : '';
    return `👋 ${tienda.name?.toUpperCase()}%0A👗 *${producto.name}*${tallaTxt} - *${precio}*%0A${tallasDisp}%0A🔗 ${urlProducto}%0A¿Disponible? ¿Envío a [MUNICIPIO]?`;
  }
  const checkoutWhatsApp = ()=>{
    if(cart.length===0) return;
    trackPixel('InitiateCheckout', { num_items: cart.length, value: total, currency: 'NIO' });
    trackPixel('Contact', { content_name: 'Carrito multiple' });
    let msg = `🛍 HOLA! QUIERO COMPRAR%0A`;
    cart.forEach((i,idx)=>{ const tallaTxt = i.talla ? ` (Talla: ${i.talla})` : ''; msg += `${idx+1}. *${i.name}${tallaTxt}* x${i.qty} - C$${i.price} (${i.storeName})%0A`; });
    msg += `%0A💰 Total: *C$${total}*%0A📍 Mi dir: [ESCRIBE]%0A¿Confirma?`;
    const uniqueWAs = [...new Set(cart.map(c=>c.whatsapp).filter(Boolean))];
    if(uniqueWAs.length===1){ window.open(`https://wa.me/${uniqueWAs[0]}?text=${msg}`,'_blank') } else { window.open(`https://wa.me/50581732620?text=${msg}%0A%0A(Son de varias tiendas)`,'_blank') }
  }
  const waProductDirect = (p, talla=null)=>{
    trackPixel('Contact', { content_name: p.name, content_ids: [p.id], value: Number(p.price)||0, currency: 'NIO' });
    trackPixel('Lead', { content_name: p.name });
    const mensaje = generarMensajeWhatsApp(p, p.stores, talla);
    window.open(`https://wa.me/${p.stores.whatsapp}?text=${mensaje}`,'_blank')
  }
  const abrirAccesoDueno = ()=>{ window.location.href = '/acceso' }
  const abrirVender = ()=>{ const mensaje = 'Hola TiendaNica! Quiero vender en el market, me interesa abrir mi tienda.'; window.open(`https://wa.me/50581732620?text=${encodeURIComponent(mensaje)}`,'_blank') }
  const openProductWithPixel = (p)=>{
    trackPixel('ViewContent', { content_name: p.name, content_category: p.categoria, content_ids: [p.id], content_type: 'product', value: Number(p.price)||0, currency: 'NIO' });
    setSel(p);
  }

  if(loading) return (
    <main style={{minHeight:'100vh', background:'#F5F1ED'}}>
      <div style={{maxWidth:1180, margin:'0 auto', padding:40, textAlign:'center'}}>Cargando TiendaNica...</div>
    </main>
  )

  return (
    <main style={{minHeight:'100vh', background:'#F5F1ED', fontFamily:'Inter, system-ui', paddingBottom:40}}>
      <style>{`
        .portada-wrap{ position:relative; width:100%; line-height:0; background:#000; overflow:hidden; }
        .portada-img{ width:100%; height:auto; display:block; }
        .portada-overlay{ position:absolute; bottom:0; left:0; right:0; background:linear-gradient(to top, rgba(0,0,0,0.7), transparent); padding:20px 14px 56px; color:#fff; z-index:2; }
        .cinta-degradada{ background: linear-gradient(90deg, #FF8A00 0%, #FF3B30 50%, #2962FF 100%); color:#fff; padding:11px 14px; display:flex; gap:14px; justify-content:center; flex-wrap:wrap; font-size:11px; font-weight:800; letter-spacing:0.3px; text-shadow:0 1px 2px rgba(0,0,0,0.2); }
        .btn-config-dueno{ position:absolute; bottom:14px; right:14px; background:rgba(0,0,0,0.55); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border:1.5px solid rgba(255,255,255,0.6); width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:5; box-shadow:0 4px 12px rgba(0,0,0,0.25); }
        .btn-vender-azul{ position:absolute; bottom:14px; left:14px; background:#0066FF; color:#fff; border:2px solid #fff; padding:0; border-radius:14px; font-weight:900; font-size:10px; letter-spacing:0.5px; text-transform:lowercase; box-shadow:0 6px 20px rgba(0,102,255,0.45), 0 2px 8px rgba(0,0,0,0.25); cursor:pointer; z-index:5; width:72px; height:62px; display:flex; flex-direction:column; alignItems:center; justifyContent:center; gap:2px; }
        .cat-scroll{ display:flex; gap:7px; overflow-x:auto; scrollbar-width:none; padding:2px 0 6px; -webkit-overflow-scrolling:touch; }
        .cat-scroll::-webkit-scrollbar{ display:none; }
        .chip{ white-space:nowrap; padding:9px 16px; border-radius:999px; border:1.5px solid #E8E0D9; background:#fff; font-size:13px; font-weight:700; cursor:pointer; flex-shrink:0; text-transform:capitalize; }
        .chip.active{ background:#111; color:#fff; border-color:#111; }
        .chip-comida{ background: #FFF4E0; border-color: #FFB84D; color: #9A5A00; font-weight:900; }
        .chip-comida.active{ background:#FF8A00; color:#fff; border-color:#FF8A00; }
        .chip-vehiculos{ background:#111; border-color:#111; color:#FF6A00; font-weight:900; }
        .chip-vehiculos.active{ background:#FF6A00; color:#fff; border-color:#FF6A00; }
        .grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        .card{ background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.06); border:1px solid #F0E9E2; }
        .card-img{ aspect-ratio:3/4; background:#fff; position:relative; overflow:hidden; display:flex; alignItems:center; justifyContent:center; }
        .card-img img{ width:100%; height:100%; object-fit:contain; background:#fff; }
        .talla-chip{ padding:8px 14px; border-radius:999px; border:1.5px solid #E0D6CF; background:#fff; font-size:13px; font-weight:800; cursor:pointer; }
        .talla-chip.active{ background:#111; color:#fff; border-color:#111; }
        @media(min-width:1024px){
          .portada-wrap{ width:100%; max-width:100%; margin:0; border-radius:0; overflow:hidden; max-height:320px; background:#000; }
          .portada-img{ width:100%; height:320px; object-fit:cover; object-position:center; display:block; }
          .cinta-degradada{ max-width:100%; margin:0; border-radius:0; }
          .cat-scroll{ overflow-x:visible; flex-wrap:wrap; gap:8px; }
          .cat-scroll::-webkit-scrollbar{ display:block; }
          .chip{ font-size:12px; padding:8px 14px; }
        }
        @media(min-width:1280px){ .portada-wrap{ max-height:360px; } .portada-img{ height:360px; } }
        @media(max-width:1024px){ .grid{ grid-template-columns:repeat(3,1fr); } }
        @media(max-width:768px){ .grid{ grid-template-columns:repeat(2,1fr); gap:10px; } .card{ border-radius:14px; } .btn-config-dueno{ position:absolute; bottom:14px; right:14px; background:rgba(0,0,0,0.55); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border:1.5px solid rgba(255,255,255,0.6); width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:5; box-shadow:0 4px 12px rgba(0,0,0,0.25); }
        .btn-vender-azul{ width:62px; height:54px; bottom:10px; left:10px; border-radius:12px; font-size:9px; } .btn-config-dueno{ width:38px; height:38px; bottom:10px; right:10px; border-radius:10px; } .portada-wrap{ border-radius:0; margin:0; max-height:none; width:100%; } .portada-img{ height:auto; object-fit:cover; } .cinta-degradada{ border-radius:0; max-width:100%; margin:0; } .cat-scroll{ flex-wrap:nowrap; overflow-x:auto; } }
      `}</style>

      {/* ===== PORTADA MARKET DIRECTO - AHORA EDITABLE DESDE ADMIN ===== */}
      <div className="portada-wrap">
        <img 
          src={marketConfig?.banner_url ? getOptimizedImage(marketConfig.banner_url, 1200) : "/opengraph-image.png"} 
          alt={marketConfig?.hero_title || "TiendaNica"} 
          className="portada-img"
        />
        {marketConfig?.hero_title && (
          <div className="portada-overlay">
            <h1 style={{fontWeight:900, fontSize:20, letterSpacing:-0.5, textShadow:'0 2px 10px rgba(0,0,0,0.5)'}}>{marketConfig.hero_title}</h1>
            {marketConfig?.hero_subtitle && <p style={{fontSize:12, marginTop:4, opacity:0.9}}>{marketConfig.hero_subtitle}</p>}
          </div>
        )}
        <button onClick={abrirVender} className="btn-vender-azul">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span>vender</span>
        </button>
        <button onClick={abrirAccesoDueno} onMouseDown={handleConfigPressStart} onMouseUp={handleConfigPressEnd} onMouseLeave={handleConfigPressEnd} onTouchStart={handleConfigPressStart} onTouchEnd={handleConfigPressEnd} className="btn-config-dueno" aria-label="Acceso dueno" title="Acceso dueno">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 9 15a1.65 1.65 0 0 0-1-1.51V13a2 2 0 0 1 0-4v-.49c.294-.2.636-.34 1-.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 13 11.5a1.65 1.65 0 0 0 1 1.51V13a2 2 0 0 1 0 4v.49c-.294.2-.636.34-1 .51Z"/></svg>
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
            <button onClick={()=>handleCatClick('comida')} className={`chip chip-comida ${showComida ? 'active' : ''}`}>🍔 Comida</button>
            {(showAllCats ? catsOrdenadas : catsOrdenadas.slice(0, 14)).map(c=>{
              const isVeh = ['motos','autos','camionetas','repuestos','vehiculos','accesorios moto','cascos','llantas'].includes(c.toLowerCase())
              return <button key={c} onClick={()=>{setShowComida(false); setCat(c===cat?null:c)}} className={`chip ${cat===c && !showComida ? 'active' : ''} ${isVeh ? 'chip-vehiculos' : ''}`}>{c}</button>
            })}
            {catsOrdenadas.length > 14 && (
              <button onClick={()=>setShowAllCats(!showAllCats)} className="chip" style={{background:'#F5F1EC', fontWeight:900, fontSize:11}}>
                {showAllCats ? '▲ Ver menos' : `+${catsOrdenadas.length-14} más`}
              </button>
            )}
          </div>
          <div style={{marginTop:6, borderTop:'1px solid #F5F0EB', paddingTop:8, display:'flex', alignItems:'center'}}>
            <span style={{fontSize:11, color:'#999'}}>
              {showComida ? `${nearbyFoodStores.length>0 ? filtered.length+' comidas' : 'Comida'} • ${userLoc ? (userLoc.municipio||userLoc.departamento) : manualDepto || 'Sin ubicación'} ${filtroMuniActivo ? '('+manualMuni+')' : ''} ${filtroDirActivo ? '('+manualDir+')' : ''}` : `${filtered.length} productos • Premium primero`}
            </span>
          </div>
        </div>

        {showComida && (
          <div style={{marginTop:14}}>
            {!userLoc && !manualDepto && (
              <div style={{background:'#fff', borderRadius:18, padding:20, border:'1px solid #FFD9A0', textAlign:'center'}}>
                <p style={{fontSize:22}}>📍🍔</p>
                <p style={{fontWeight:900, fontSize:16, marginTop:6}}>Activa tu ubicación para ver comida cerca</p>
                <p style={{fontSize:13, color:'#666', marginTop:6, lineHeight:1.4}}>Departamento → Municipio → Pueblito/Barrio como Ubu Norte.</p>
                <div style={{display:'flex', gap:8, justifyContent:'center', marginTop:14, flexWrap:'wrap'}}>
                  <button onClick={requestLocation} disabled={locLoading} style={{background:'#111', color:'#fff', border:'none', padding:'12px 18px', borderRadius:999, fontWeight:800, fontSize:13}}>
                    {locLoading ? 'Buscando...' : '📍 Usar mi ubicación'}
                  </button>
                </div>
                {locError && <p style={{fontSize:12, color:'#FF3B30', marginTop:10}}>{locError}</p>}
                <div style={{marginTop:16, borderTop:'1px solid #F0E9E2', paddingTop:14}}>
                  <p style={{fontSize:12, fontWeight:700}}>O elige manualmente (3 filtros):</p>
                  <div style={{display:'flex', gap:8, marginTop:8, justifyContent:'center', flexWrap:'wrap'}}>
                    <select value={manualDepto} onChange={e=>{setManualDepto(e.target.value); setManualMuni(''); setManualDir(''); setFiltroMuniActivo(false); setFiltroDirActivo(false)}} style={{border:'1.5px solid #E8E0D9', borderRadius:999, padding:'10px 14px', fontSize:13, fontWeight:700}}>
                      <option value="">Departamento</option>
                      {DEPARTAMENTOS_NI.map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                    <input value={manualMuni} onChange={e=>setManualMuni(e.target.value)} placeholder="Municipio (ej: Paiwas)" style={{border:'1.5px solid #E8E0D9', borderRadius:999, padding:'10px 14px', fontSize:13, minWidth:140}}/>
                    <input value={manualDir} onChange={e=>setManualDir(e.target.value)} placeholder="Pueblito (ej: Ubu Norte)" style={{border:'1.5px solid #FFB84D', borderRadius:999, padding:'10px 14px', fontSize:13, minWidth:160, background:'#FFF8E8'}}/>
                  </div>
                  {(manualDepto || manualMuni || manualDir) && (
                    <div style={{display:'flex', gap:8, justifyContent:'center', marginTop:10, flexWrap:'wrap'}}>
                      {manualDepto && <button onClick={()=>{ setUserLoc({departamento: manualDepto, municipio: manualMuni, direccion: manualDir}); setFiltroMuniActivo(false); setFiltroDirActivo(false) }} style={{background:'#FF8A00', color:'#fff', border:'none', padding:'10px 14px', borderRadius:999, fontWeight:800, fontSize:12}}>Ver {manualDepto}</button>}
                      {manualMuni && <button onClick={()=>{ setUserLoc({departamento: manualDepto, municipio: manualMuni, direccion: manualDir}); setFiltroMuniActivo(true); setFiltroDirActivo(false) }} style={{background:'#111', color:'#fff', border:'none', padding:'10px 14px', borderRadius:999, fontWeight:800, fontSize:12}}>Solo {manualMuni}</button>}
                      {manualDir && <button onClick={()=>{ setUserLoc({departamento: manualDepto, municipio: manualMuni, direccion: manualDir}); setFiltroMuniActivo(false); setFiltroDirActivo(true) }} style={{background:'#0066FF', color:'#fff', border:'none', padding:'10px 14px', borderRadius:999, fontWeight:800, fontSize:12}}>📍 {manualDir}</button>}
                    </div>
                  )}
                  {municipiosDelDepto.length>0 && <p style={{fontSize:11, color:'#888', marginTop:8}}>Municipios en {manualDepto}: {municipiosDelDepto.join(', ')}</p>}
                  {direccionesDelMuni.length>0 && <p style={{fontSize:11, color:'#0066FF', marginTop:4, fontWeight:700}}>Pueblitos: {direccionesDelMuni.slice(0,8).join(', ')}</p>}
                </div>
                {foodCiudades.length>0 && <p style={{fontSize:11, color:'#888', marginTop:12}}>Disponible ahora en: {foodCiudades.join(', ')}</p>}
              </div>
            )}

            {(userLoc || manualDepto) && nearbyFoodStores.length===0 && (
              <div style={{background:'#fff', borderRadius:18, padding:22, border:'1px solid #E8E0D9', textAlign:'center'}}>
                <p style={{fontSize:28}}>🍔⏳</p>
                <h3 style={{fontWeight:900, fontSize:18, marginTop:8}}>Muy pronto servicios de alimentación en tu zona</h3>
                <p style={{fontSize:13, color:'#666', marginTop:8, lineHeight:1.5}}>
                  {filtroDirActivo ? <>Aún no tenemos en <b>{manualDir}, {manualMuni}, {manualDepto}</b>.</> : filtroMuniActivo ? <>Aún no tenemos en <b>{manualMuni}, {manualDepto}</b>.</> : <>Aún no tenemos en <b>{manualDepto} - {manualMuni} {manualDir ? `- ${manualDir}` : ''}</b>.</>}
                  <br/>Estamos activando comiderías pueblo por pueblo.
                </p>
                <div style={{marginTop:14, display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap'}}>
                  <button onClick={()=>{ setUserLoc(null); setManualDepto(''); setManualMuni(''); setManualDir(''); setFiltroMuniActivo(false); setFiltroDirActivo(false) }} style={{background:'#F0F0F0', border:'none', padding:'10px 16px', borderRadius:999, fontWeight:700, fontSize:12}}>📍 Cambiar ubicación</button>
                  <button onClick={abrirVender} style={{background:'#111', color:'#fff', border:'none', padding:'10px 16px', borderRadius:999, fontWeight:800, fontSize:12}}>¿Tienes restaurante? Únete</button>
                </div>
              </div>
            )}

            {(userLoc || manualDepto) && nearbyFoodStores.length>0 && (
              <>
                <div style={{background:'#FFF7E8', border:'1px solid #FFD9A0', borderRadius:14, padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8, marginBottom:12}}>
                  <p style={{fontSize:12, fontWeight:800}}>🍔 {nearbyFoodStores.length} restaurante(s) en {filtroDirActivo ? `${manualDir}, ${manualMuni}` : filtroMuniActivo ? `${manualMuni}, ${manualDepto}` : (manualDepto || manualMuni)} • {comidaLoading ? 'Cargando...' : filtered.length+' platillos'} {filtroDirActivo ? `(solo ${manualDir})` : filtroMuniActivo ? `(solo ${manualMuni})` : ''}</p>
                  <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                    {filtroDirActivo && <button onClick={()=>{ setFiltroDirActivo(false); setFiltroMuniActivo(true) }} style={{background:'#111', border:'none', padding:'6px 10px', borderRadius:999, fontWeight:700, fontSize:11, color:'#fff'}}>← {manualMuni}</button>}
                    {filtroMuniActivo && !filtroDirActivo && <button onClick={()=>setFiltroMuniActivo(false)} style={{background:'#FF8A00', border:'none', padding:'6px 10px', borderRadius:999, fontWeight:700, fontSize:11, color:'#fff'}}>Ver todo {manualDepto}</button>}
                    {!filtroMuniActivo && !filtroDirActivo && manualMuni && <button onClick={()=>setFiltroMuniActivo(true)} style={{background:'#111', border:'none', padding:'6px 10px', borderRadius:999, fontWeight:700, fontSize:11, color:'#fff'}}>Solo {manualMuni}</button>}
                    {manualDir && !filtroDirActivo && <button onClick={()=>setFiltroDirActivo(true)} style={{background:'#0066FF', border:'none', padding:'6px 10px', borderRadius:999, fontWeight:700, fontSize:11, color:'#fff'}}>📍 {manualDir}</button>}
                    <button onClick={()=>{ setUserLoc(null); setManualDepto(''); setManualMuni(''); setManualDir(''); setFiltroMuniActivo(false); setFiltroDirActivo(false) }} style={{background:'#fff', border:'1px solid #E8E0D9', padding:'6px 10px', borderRadius:999, fontWeight:700, fontSize:11}}>Cambiar</button>
                  </div>
                </div>
                <div style={{display:'flex', gap:8, overflowX:'auto', paddingBottom:8, marginBottom:8}}>
                  {nearbyFoodStores.map(s=>(
                    <a key={s.id} href={`/${s.slug}`} style={{background:'#fff', border:'1px solid #F0E9E2', borderRadius:14, padding:'8px 10px', display:'flex', gap:8, alignItems:'center', textDecoration:'none', minWidth:180}}>
                      <img src={s.logo_url || s.image_url} style={{width:36, height:36, borderRadius:10, objectFit:'cover'}}/>
                      <div><p style={{fontSize:11, fontWeight:900, color:'#000'}}>{s.name}</p><p style={{fontSize:10, color:'#666'}}>{s.municipio} • {getDireccion(s)}</p></div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="grid" style={{marginTop:12}}>
          {filtered.slice(0, visibleCount).map(p=>{
            const hasVideo=!!p.video_url
            const boutique = isBoutique(p)
            const isVehiculo = (p.stores?.tipo_tienda||'').toLowerCase().includes('vehiculos') || ['motos','autos','repuestos'].includes((p.categoria||'').toLowerCase())
            const badge = getBadgeInfo(p.stores)
            const tallas = getTallas(p)
            return (
              <div key={p.id} className="card" style={{border: isVehiculo ? '1.5px solid #FF6A00' : '1px solid #F0E9E2'}}>
                <button onClick={()=>openProductWithPixel(p)} style={{width:'100%', border:'none', padding:0, background:'#fff'}} className="card-img">
                  <img src={getOptimizedImage(p.image_url, 400)} alt={p.name} loading="lazy" decoding="async" />
                  {hasVideo && <span style={{position:'absolute', top:8, right:8, background:'#FF2D55', color:'#fff', fontSize:9, fontWeight:900, padding:'5px 9px', borderRadius:999}}>▶ VIDEO</span>}
                  {boutique && tallas.length>0 && <span style={{position:'absolute', top:8, left:8, background:'#0066FF', color:'#fff', fontSize:8, fontWeight:900, padding:'3px 7px', borderRadius:999}}>TALLAS • {tallas.slice(0,3).join(' ')}</span>}
                  {isVehiculo && <span style={{position:'absolute', top:8, left:8, background:'#111', color:'#FF6A00', fontSize:8, fontWeight:900, padding:'4px 8px', borderRadius:999}}>🏍 {p.marca||''} {p.modelo||''} {p.anio||''}</span>}
                  {!boutique && showComida && <span style={{position:'absolute', top:8, left:8, background:'#FF8A00', color:'#fff', fontSize:8, fontWeight:900, padding:'4px 8px', borderRadius:999}}>🍔 {p.stores?.municipio || ''}</span>}
                </button>
                <div style={{padding:'10px 12px 12px'}}>
                  <p style={{fontSize:13, fontWeight:800, lineHeight:'1.25', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', minHeight:32}}>{p.name}</p>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6}}><b style={{fontSize:14}}>C$ {p.price}</b><span style={{fontSize:10, color:'#8B7E74', background:'#F7F2EE', padding:'3px 8px', borderRadius:999, fontWeight:700, textTransform:'capitalize'}}>{p.categoria}</span></div>
                  {boutique && tallas.length>0 && <p style={{fontSize:10, color:'#0066FF', fontWeight:700, marginTop:4}}>Tallas: {tallas.join(' • ')}</p>}
                  {isVehiculo && <p style={{fontSize:10, color:'#FF6A00', fontWeight:800, marginTop:4}}>{p.marca||''} {p.modelo||''} • {p.kilometraje||''} • {p.combustible||''}</p>}
                  {badge.key==='premium' && <p style={{fontSize:11, color:'#FF6A00', fontWeight:800, marginTop:6}}>⭐ Tienda Premium • {p.stores?.municipio || p.stores?.departamento || ''}</p>}
                  {badge.key==='verificada' && <p style={{fontSize:11, color:'#0066FF', fontWeight:700, marginTop:6}}>✓ Verificada</p>}
                  {showComida && <p style={{fontSize:11, color:'#9A5A00', fontWeight:700, marginTop:4}}>📍 {p.stores?.name} • {p.stores?.municipio} • {getDireccion(p.stores)}</p>}
                </div>
              </div>
            )
          })}
        </div>
        {filtered.length > visibleCount && (
          <div style={{textAlign:'center', marginTop:18}}>
            <button onClick={()=>setVisibleCount(v=>v+60)} style={{background:'#111', color:'#fff', border:'none', padding:'12px 22px', borderRadius:999, fontWeight:900, fontSize:13}}>
              Ver más productos ({filtered.length - visibleCount} restantes)
            </button>
            <p style={{fontSize:11, color:'#888', marginTop:8}}>Mostrando {Math.min(visibleCount, filtered.length)} de {filtered.length} • Optimizado para ahorrar datos</p>
          </div>
        )}

        {comidaLoading && showComida && <p style={{textAlign:'center', marginTop:20, fontSize:13, color:'#999'}}>Cargando platillos de {nearbyFoodStores.map(s=>s.name).join(', ')}...</p>}
      </div>

      <div style={{background:'#111', color:'#fff', marginTop:30, padding:'22px 16px 14px'}}>
        <div style={{maxWidth:900, margin:'0 auto'}}>
          <div style={{textAlign:'center'}}>
            <p style={{fontWeight:900, fontSize:15, letterSpacing:0.2}}>TiendaNica.store</p>
            <p style={{fontSize:11, opacity:0.55, marginTop:4}}>El marketplace verificado de Nicaragua • Tiendas con video y cédula</p>
            <div style={{display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginTop:14}}>
              <a href="/terminos" style={{fontSize:11, color:'rgba(255,255,255,0.65)', textDecoration:'none'}}>Términos</a>
              <span style={{opacity:0.2, fontSize:11}}>•</span>
              <a href="/privacidad" style={{fontSize:11, color:'rgba(255,255,255,0.65)', textDecoration:'none'}}>Privacidad</a>
              <span style={{opacity:0.2, fontSize:11}}>•</span>
              <a href="/vendedores" style={{fontSize:11, color:'rgba(255,255,255,0.65)', textDecoration:'none'}}>Vendedores</a>
              <span style={{opacity:0.2, fontSize:11}}>•</span>
              <a href="/reportar" style={{fontSize:11, color:'#FF8A8A', textDecoration:'none', fontWeight:800}}>Reportar / Reclamo</a>
            </div>
          </div>
          <p style={{fontSize:10, opacity:0.25, marginTop:14, textAlign:'center'}}>© 2025 TiendaNica.store • Reporte antifraude 24h • soporte@tiendanica.store</p>
        </div>
      </div>

      {showSuperPrompt && (
        <div style={{position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20}} onClick={()=>{setShowSuperPrompt(false); setSuperPinInput('')}}>
          <div style={{background:'#111', borderRadius:20, padding:20, maxWidth:340, width:'100%', border:'1px solid #333'}} onClick={e=>e.stopPropagation()}>
            <h3 style={{color:'#FFD60A', fontWeight:900, fontSize:14}}>Super Admin - PIN Maestro</h3>
            <p style={{color:'#888', fontSize:11, marginTop:6}}>Acceso exclusivo fundador TiendaNica</p>
            <input type="password" value={superPinInput} onChange={e=>setSuperPinInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') handleSuperAccess()}} placeholder="PIN maestro" autoFocus style={{width:'100%', marginTop:14, border:'2px solid #FFD60A', borderRadius:12, padding:'12px 14px', background:'#fff', fontWeight:900, fontSize:16, letterSpacing:2, textAlign:'center', outline:'none'}}/>
            <div style={{display:'flex', gap:8, marginTop:12}}>
              <button onClick={()=>{setShowSuperPrompt(false); setSuperPinInput('')}} style={{flex:1, background:'#222', color:'#fff', border:'none', padding:12, borderRadius:12, fontWeight:700, fontSize:12}}>Cancelar</button>
              <button onClick={handleSuperAccess} style={{flex:1, background:'#FFD60A', color:'#000', border:'none', padding:12, borderRadius:12, fontWeight:900, fontSize:12}}>Entrar</button>
            </div>
          </div>
        </div>
      )}

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
            {sel.marca && <p style={{fontSize:12, background:'#FFF7ED', border:'1px solid #FFE0C0', padding:'8px 10px', borderRadius:10, marginTop:8, fontWeight:700}}>🏍 {sel.marca} {sel.modelo} • {sel.anio} • {sel.kilometraje} • {sel.combustible} • {sel.transmision} • {sel.papeles}</p>}
            {sel.description&&<p style={{fontSize:13, background:'#F7F5F3', padding:'8px 10px', borderRadius:10, marginTop:8}}>✓ {sel.description}</p>}
            {isBoutique(sel) && (
              <div style={{marginTop:12}}>
                <p style={{fontSize:12, fontWeight:800, marginBottom:8}}>Selecciona talla: {selectedTalla && <span style={{color:'#0066FF'}}>• {selectedTalla}</span>}</p>
                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                  {getTallas(sel).length>0 ? getTallas(sel).map(t=><button key={t} onClick={()=>setSelectedTalla(t)} className={`talla-chip ${selectedTalla===t ? 'active' : ''}`}>{t}</button>) : (<>{['XS','S','M','L','XL','XXL'].map(t=><button key={t} onClick={()=>setSelectedTalla(t)} className={`talla-chip ${selectedTalla===t ? 'active' : ''}`}>{t}</button>)}</>)}
                </div>
              </div>
            )}
            <div style={{display:'flex', gap:8, marginTop:14}}>
              <button onClick={()=>{addToCart(sel, selectedTalla);}} style={{flex:1, background:'#111', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:800}}>🛒 Agregar {selectedTalla ? `(${selectedTalla})` : ''}</button>
              <button onClick={()=>waProductDirect(sel, selectedTalla)} style={{flex:1, background:'#25D366', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:900}}>WhatsApp {selectedTalla ? selectedTalla : ''}</button>
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
                <img src={getOptimizedImage(i.image, 100)} style={{width:50, height:50, objectFit:'contain', background:'#fff', borderRadius:8}}/>
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
