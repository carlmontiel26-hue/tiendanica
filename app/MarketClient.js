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

const ORDEN_PREMIUM = ['vestidos','blusas','jeans','conjuntos','faldas','shorts','pijamas','zapatos','carteras','accesorios','belleza','salud','general','hogar','otros','nuevo']

function getBadgeInfo(store){
  const raw = (store?.verification_status || store?.verification_badge || '').toLowerCase()
  if(raw.includes('premium')) return { key:'premium' }
  if(raw.includes('verificada')) return { key:'verificada' }
  return { key:'nueva' }
}

export default function MarketClient(){
  const [stores,setStores]=useState([])
  const [products,setProducts]=useState([])
  const [sel,setSel]=useState(null)
  const [q,setQ]=useState('')
  const [cat,setCat]=useState(null)
  const [tipo,setTipo]=useState(null)
  const [loading,setLoading]=useState(true)
  const [cart,setCart]=useState([])
  const [showCart,setShowCart]=useState(false)
  const [selectedTalla,setSelectedTalla]=useState(null)

  useEffect(()=>{
    const supabase=getSupabase()
    if(!supabase) return
    supabase.from('stores').select('*').then(({data})=>{
      const all=data||[]
      setStores(all.filter(s=>{ const t=(s.tipo_tienda||'').toLowerCase(); return !t.includes('comida') }))
    })
    supabase.from('products').select('*, stores!inner(slug,name,logo_url,tipo_tienda,whatsapp,verification_status,verification_badge,departamento,municipio)').order('created_at',{ascending:false}).limit(400).then(({data})=>{
      const all=data||[]
      setProducts(all.filter(p=>{ const t=(p.stores?.tipo_tienda||'').toLowerCase(); return !t.includes('comida') }))
      setLoading(false)
    })
    const saved = typeof window!=='undefined' ? localStorage.getItem('tn_market_cart') : null
    if(saved){ try{ setCart(JSON.parse(saved)) }catch{} }
  },[])

  useEffect(()=>{ localStorage.setItem('tn_market_cart', JSON.stringify(cart)) },[cart])
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

  let filtered=[...products]
  if(q) filtered=filtered.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()) || p.stores?.name?.toLowerCase().includes(q.toLowerCase()))
  if(cat) filtered=filtered.filter(p=>p.categoria===cat)
  if(tipo) filtered=filtered.filter(p=> (p.stores?.tipo_tienda||'').toLowerCase().includes(tipo.toLowerCase()))
  filtered = filtered.sort((a,b)=>{
    const ba = getBadgeInfo(a.stores).key
    const bb = getBadgeInfo(b.stores).key
    const order = { premium:0, verificada:1, nueva:2 }
    return (order[ba] ?? 2) - (order[bb] ?? 2)
  })

  const catsRaw=[...new Set(products.map(p=>p.categoria).filter(Boolean))]
  const catsOrdenadas = catsRaw.sort((a,b)=>{
    const ia = ORDEN_PREMIUM.indexOf(a.toLowerCase()); const ib = ORDEN_PREMIUM.indexOf(b.toLowerCase())
    if(ia===-1 && ib===-1) return a.localeCompare(b); if(ia===-1) return 1; if(ib===-1) return -1; return ia-ib
  })

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

  if(loading) return <div style={{padding:40, textAlign:'center'}}>Cargando TiendaNica...</div>

  return (
    <main style={{minHeight:'100vh', background:'#F5F1ED', fontFamily:'Inter, system-ui', paddingBottom:40}}>
      <style>{`
        .portada-wrap{ position:relative; width:100%; line-height:0; background:#000; }
        .portada-img{ width:100%; height:auto; display:block; }
        .cinta-degradada{ background: linear-gradient(90deg, #FF8A00 0%, #FF3B30 50%, #2962FF 100%); color:#fff; padding:11px 14px; display:flex; gap:14px; justify-content:center; flex-wrap:wrap; font-size:11px; font-weight:800; letter-spacing:0.3px; text-shadow:0 1px 2px rgba(0,0,0,0.2); }
        .btn-vender-azul{ position:absolute; bottom:14px; left:14px; background:#0066FF; color:#fff; border:2px solid #fff; padding:0; border-radius:14px; font-weight:900; font-size:10px; letter-spacing:0.5px; text-transform:lowercase; box-shadow:0 6px 20px rgba(0,102,255,0.45), 0 2px 8px rgba(0,0,0,0.25); cursor:pointer; z-index:5; width:72px; height:62px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; }
        .btn-vender-azul:hover{ transform:scale(1.05); background:#0052CC; }
        .cat-scroll{ display:flex; gap:7px; overflow-x:auto; scrollbar-width:none; padding:2px 0 6px; -webkit-overflow-scrolling:touch; }
        .cat-scroll::-webkit-scrollbar{ display:none; }
        .chip{ white-space:nowrap; padding:9px 16px; border-radius:999px; border:1.5px solid #E8E0D9; background:#fff; font-size:13px; font-weight:700; cursor:pointer; flex-shrink:0; text-transform:capitalize; }
        .chip.active{ background:#111; color:#fff; border-color:#111; box-shadow:0 2px 8px rgba(0,0,0,0.15); }
        .grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        .card{ background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.06); border:1px solid #F0E9E2; }
        .card-img{ aspect-ratio:3/4; background:#fff; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; }
        .card-img img{ width:100%; height:100%; object-fit:contain; background:#fff; }
        .talla-chip{ padding:8px 14px; border-radius:999px; border:1.5px solid #E0D6CF; background:#fff; font-size:13px; font-weight:800; cursor:pointer; }
        .talla-chip.active{ background:#111; color:#fff; border-color:#111; }
        @media(max-width:1024px){ .grid{ grid-template-columns:repeat(3,1fr); } }
        @media(max-width:768px){ .grid{ grid-template-columns:repeat(2,1fr); gap:10px; } .card{ border-radius:14px; } .btn-vender-azul{ width:62px; height:54px; bottom:10px; left:10px; border-radius:12px; font-size:9px; } }
      `}</style>

      <div className="portada-wrap">
        <img src="/opengraph-image.png" alt="TiendaNica" className="portada-img"/>
        <button onClick={abrirVender} className="btn-vender-azul">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span>vender</span>
        </button>
      </div>

      <div className="cinta-degradada">
        <span>🛡️ Tiendas verificadas con video y cédula</span><span style={{opacity:0.6}}>•</span><span>📦 Envío a toda Nicaragua</span><span style={{opacity:0.6}}>•</span><span>⚖️ Reporte antifraude 24h</span>
      </div>

      <div style={{maxWidth:1180, margin:'0 auto', padding:'12px'}}>
        <div style={{background:'#fff', borderRadius:20, padding:'12px', border:'1px solid #EDE6DF', boxShadow:'0 4px 20px rgba(0,0,0,0.04)'}}>
          <div style={{display:'flex', gap:8}}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar vestido, jeans, farmacia..." style={{flex:1, border:'1.5px solid #EEE6DF', borderRadius:999, padding:'12px 18px', fontSize:14, outline:'none'}}/>
            <button onClick={()=>setShowCart(true)} style={{background:'#111', color:'#fff', border:'none', padding:'0 16px', borderRadius:999, fontWeight:800, fontSize:13, position:'relative'}}>🛒 {cart.length>0 && <span style={{background:'#0066FF', color:'#fff', borderRadius:999, padding:'2px 6px', fontSize:10, marginLeft:4}}>{cart.reduce((a,b)=>a+b.qty,0)}</span>}</button>
          </div>
          <div className="cat-scroll" style={{marginTop:10}}>
            <button onClick={()=>{setCat(null); setTipo(null)}} className={`chip ${!cat && !tipo ? 'active' : ''}`} style={{textTransform:'none'}}>Todo</button>
            {catsOrdenadas.map(c=><button key={c} onClick={()=>setCat(c===cat?null:c)} className={`chip ${cat===c ? 'active' : ''}`}>{c}</button>)}
          </div>
          <div className="cat-scroll" style={{marginTop:6, borderTop:'1px solid #F5F0EB', paddingTop:8}}>
            {['boutique','general'].map(t=><button key={t} onClick={()=>setTipo(t===tipo?null:t)} className="chip" style={{background: tipo===t ? '#0066FF' : '#F7F2EE', color: tipo===t ? '#fff' : '#000', borderColor: tipo===t ? '#0066FF' : '#EDE6DF', fontSize:11, fontWeight:900, textTransform:'uppercase'}}>{t}</button>)}
            <span style={{fontSize:11, color:'#999', alignSelf:'center', marginLeft:6}}>{filtered.length} productos • Premium primero</span>
          </div>
        </div>

        <div className="grid" style={{marginTop:12}}>
          {filtered.map(p=>{
            const hasVideo=!!p.video_url
            const boutique = isBoutique(p)
            const badge = getBadgeInfo(p.stores)
            return (
              <div key={p.id} className="card">
                <button onClick={()=>setSel(p)} style={{width:'100%', border:'none', padding:0, background:'#fff'}} className="card-img">
                  <img src={p.image_url} alt={p.name}/>
                  {hasVideo && <span style={{position:'absolute', top:8, right:8, background:'#FF2D55', color:'#fff', fontSize:9, fontWeight:900, padding:'5px 9px', borderRadius:999, zIndex:3}}>▶ VIDEO</span>}
                  {boutique && <span style={{position:'absolute', top:8, left:8, background:'#0066FF', color:'#fff', fontSize:8, fontWeight:900, padding:'3px 7px', borderRadius:999, zIndex:3}}>TALLAS</span>}
                </button>
                <div style={{padding:'10px 12px 12px'}}>
                  <p style={{fontSize:13, fontWeight:800, lineHeight:'1.25', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', minHeight:32}}>{p.name}</p>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6}}><b style={{fontSize:14}}>C$ {p.price}</b><span style={{fontSize:10, color:'#8B7E74', background:'#F7F2EE', padding:'3px 8px', borderRadius:999, fontWeight:700, textTransform:'capitalize'}}>{p.categoria}</span></div>
                  {badge.key==='premium' && <p style={{fontSize:11, color:'#FF6A00', fontWeight:800, marginTop:6}}>⭐ Tienda Premium • {p.stores?.municipio || p.stores?.departamento || 'RAAS'}</p>}
                  {badge.key==='verificada' && <p style={{fontSize:11, color:'#0066FF', fontWeight:700, marginTop:6}}>✓ Verificada • {p.stores?.municipio || p.stores?.departamento || ''}</p>}
                  {badge.key==='nueva' && <p style={{fontSize:10, color:'#999', marginTop:4}}>{p.stores?.name?.slice(0,22)}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{background:'#111', color:'#fff', marginTop:30, padding:'24px 16px 30px', textAlign:'center'}}>
        <div style={{maxWidth:800, margin:'0 auto'}}>
          <p style={{fontWeight:900, fontSize:16, letterSpacing:0.5}}>TiendaNica.store</p>
          <p style={{fontSize:11, opacity:0.6, marginTop:4}}>El marketplace verificado de Nicaragua • Proyecto personal de Carlos Montiel y socio • Desde 2024 hacia ser el #1</p>
          <div style={{display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginTop:16, fontSize:12, fontWeight:700}}>
            <a href="/terminos" style={{color:'#fff', textDecoration:'none', opacity:0.8}}>Términos</a>
            <a href="/privacidad" style={{color:'#fff', textDecoration:'none', opacity:0.8}}>Privacidad</a>
            <a href="/vendedores" style={{color:'#FF8A00', textDecoration:'none'}}>Vendedores ✓</a>
            <a href="/reportar" style={{color:'#FF3B30', textDecoration:'none', background:'#fff', padding:'4px 10px', borderRadius:999}}>🚨 Reportar fraude</a>
          </div>
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
            <p style={{fontSize:12, color:'#666', marginTop:2}}>{sel.categoria} • {(sel.stores?.tipo_tienda||'').toUpperCase()} {sel.stores?.departamento ? `• ${sel.stores.departamento} ${sel.stores?.municipio ? '- '+sel.stores.municipio : ''}` : ''}</p>
            {sel.description&&<p style={{fontSize:13, background:'#F7F5F3', padding:'8px 10px', borderRadius:10, marginTop:8}}>✓ {sel.description}</p>}
            {isBoutique(sel) && (
              <div style={{marginTop:12}}>
                <p style={{fontSize:12, fontWeight:800, marginBottom:8}}>Selecciona talla:</p>
                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                  {getTallas(sel).length>0 ? getTallas(sel).map(t=><button key={t} onClick={()=>setSelectedTalla(t)} className={`talla-chip ${selectedTalla===t ? 'active' : ''}`}>{t}</button>) : (<>{['XS','S','M','L','XL'].map(t=><button key={t} onClick={()=>setSelectedTalla(t)} className={`talla-chip ${selectedTalla===t ? 'active' : ''}`}>{t}</button>)}<span style={{fontSize:11, color:'#999', alignSelf:'center'}}>• Preguntar disponibilidad</span></>)}
                </div>
              </div>
            )}
            <div style={{display:'flex', gap:8, marginTop:14}}>
              <button onClick={()=>{addToCart(sel, selectedTalla);}} style={{flex:1, background:'#111', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:800}}>🛒 Agregar al carrito</button>
              <button onClick={()=>waProductDirect(sel, selectedTalla)} style={{flex:1, background:'#25D366', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:900}}>WhatsApp</button>
            </div>
            <div style={{display:'flex', gap:8, marginTop:8}}>
              <button onClick={closeModal} style={{flex:1, background:'#F0F0F0', border:'none', padding:11, borderRadius:999, fontWeight:700}}>← Regresar al market</button>
              <a href={`/${sel.stores?.slug}`} style={{flex:1, textAlign:'center', background:'#FF6A00', color:'#fff', padding:11, borderRadius:999, fontWeight:800, textDecoration:'none', fontSize:13}}>Ver tienda 🛍️</a>
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
                <div style={{flex:1}}><p style={{fontSize:12, fontWeight:700, lineHeight:1.2}}>{i.name.slice(0,38)}{i.talla ? ` - ${i.talla}` : ''}</p><p style={{fontSize:11, color:'#666'}}>{i.storeName}</p><b style={{fontSize:13}}>C$ {i.price}</b></div>
                <div style={{display:'flex', alignItems:'center', gap:6}}><button onClick={()=>updateQty(i.cartId,-1)} style={{width:26, height:26, borderRadius:999, border:'1px solid #ddd', background:'#fff'}}>−</button><span style={{fontSize:12, fontWeight:800, minWidth:16, textAlign:'center'}}>{i.qty}</span><button onClick={()=>updateQty(i.cartId,1)} style={{width:26, height:26, borderRadius:999, border:'1px solid #111', background:'#111', color:'#fff'}}>+</button></div>
              </div>
            ))}
          </div>
          {cart.length>0 && <div style={{borderTop:'1px solid #eee', paddingTop:12}}><div style={{display:'flex', justifyContent:'space-between', marginBottom:12}}><span style={{fontWeight:700}}>Total:</span><b style={{fontSize:18}}>C$ {total}</b></div><button onClick={checkoutWhatsApp} style={{width:'100%', background:'#25D366', color:'#fff', border:'none', padding:14, borderRadius:999, fontWeight:900, fontSize:14}}>Comprar por WhatsApp</button><button onClick={()=>setCart([])} style={{width:'100%', background:'#fff', color:'#999', border:'none', padding:10, marginTop:6, fontSize:12}}>Vaciar carrito</button></div>}
        </div>
      </div>}

      {cart.length>0 && !showCart && !sel && <button onClick={()=>setShowCart(true)} style={{position:'fixed', bottom:20, right:20, zIndex:30, background:'#111', color:'#fff', border:'none', padding:'12px 18px', borderRadius:999, fontWeight:900, boxShadow:'0 8px 24px rgba(0,0,0,0.3)', display:'flex', alignItems:'center', gap:8}}>🛒 C$ {total} <span style={{background:'#0066FF', color:'#fff', padding:'2px 8px', borderRadius:999, fontSize:11}}>{cart.reduce((a,b)=>a+b.qty,0)}</span></button>}
    </main>
  )
}
