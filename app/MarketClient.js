'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key||!url.startsWith('http')) return null
  return createClient(url,key)
}

function TemuGalleryMarket({ images=[], videoUrl, name }){
  const slides = []
  if(videoUrl) slides.push({type:'video', url:videoUrl})
  if(images && images.length>0) images.forEach(img=>{ if(img) slides.push({type:'image', url:img}) })
  if(slides.length===0) slides.push({type:'image', url:'/tienda-nica-logo.png'})
  const [current, setCurrent] = useState(0)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(true)
  const videoRef = useRef(null)
  useEffect(()=>{ setCurrent(0); setPlaying(true) },[images, videoUrl])
  const togglePlay = ()=>{
    if(!videoRef.current) return
    if(videoRef.current.paused){ videoRef.current.play(); setPlaying(true) } else { videoRef.current.pause(); setPlaying(false) }
  }
  return (
    <div style={{position:'relative', background:'#fff'}}>
      <div style={{display:'flex', overflow:'hidden', aspectRatio:'1/1', position:'relative', background:'#fff'}}>
        {slides.map((s,i)=>(
          <div key={i} style={{minWidth:'100%', display: i===current ? 'flex' : 'none', position:'relative', background: s.type==='video' ? '#000' : '#fff', alignItems:'center', justifyContent:'center'}}>
            {s.type==='image' ? <img src={s.url} alt={name} style={{width:'100%', height:'100%', objectFit:'contain', background:'#fff'}}/> : (
              <div style={{width:'100%', height:'100%', position:'relative', background:'#000', display:'flex', alignItems:'center', justifyContent:'center'}} onClick={togglePlay}>
                <video ref={i===current ? videoRef : null} src={s.url} autoPlay loop muted={muted} playsInline preload="metadata" style={{width:'100%', height:'100%', objectFit:'contain', background:'#000'}}/>
                {!playing && <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.2)'}}><div style={{width:60,height:60, borderRadius:999, background:'rgba(255,255,255,0.9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24}}>▶</div></div>}
                <button onClick={(e)=>{e.stopPropagation(); setMuted(!muted)}} style={{position:'absolute', bottom:16, right:16, background:'rgba(0,0,0,0.6)', color:'#fff', border:'none', width:36, height:36, borderRadius:999}}> {muted ? '🔇' : '🔊'} </button>
                <span style={{position:'absolute', top:12, left:12, background:'#FF3B30', color:'#fff', fontSize:10, fontWeight:900, padding:'4px 8px', borderRadius:999}}>VIDEO</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6, background:'rgba(0,0,0,0.45)', padding:'6px 10px', borderRadius:999}}>
        {slides.map((s,i)=><button key={i} onClick={()=>setCurrent(i)} style={{width: i===current ? 20 : 6, height:6, borderRadius:999, border:'none', background: i===current ? (s.type==='video' ? '#FF3B30' : '#fff') : 'rgba(255,255,255,0.5)'}}/>)}
      </div>
      <button onClick={()=>setCurrent((current-1+slides.length)%slides.length)} style={{position:'absolute', left:0, top:0, bottom:40, width:'22%', background:'transparent', border:'none'}}/>
      <button onClick={()=>setCurrent((current+1)%slides.length)} style={{position:'absolute', right:0, top:0, bottom:40, width:'22%', background:'transparent', border:'none'}}/>
    </div>
  )
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

  useEffect(()=>{
    const supabase=getSupabase()
    if(!supabase) return
    supabase.from('stores').select('*').then(({data})=>{
      const all=data||[]
      const filtradas = all.filter(s=>{
        const t=(s.tipo_tienda||'').toLowerCase()
        return !t.includes('comida') && !t.includes('restaurante') && !t.includes('food')
      })
      setStores(filtradas.length>0 ? filtradas : all)
    })
    supabase.from('products').select('*, stores!inner(slug,name,logo_url,tipo_tienda,whatsapp)').order('created_at',{ascending:false}).limit(300).then(({data})=>{
      const all=data||[]
      const sinComida = all.filter(p=>{
        const t=(p.stores?.tipo_tienda||'').toLowerCase()
        return !t.includes('comida') && !t.includes('restaurante') && !t.includes('food')
      })
      setProducts(sinComida.length>0 ? sinComida : all)
      setLoading(false)
    })
    // Cargar carrito guardado
    const saved = typeof window!=='undefined' ? localStorage.getItem('tn_market_cart') : null
    if(saved){ try{ setCart(JSON.parse(saved)) }catch{} }
  },[])

  useEffect(()=>{
    localStorage.setItem('tn_market_cart', JSON.stringify(cart))
  },[cart])

  // FIX FLECHA ATRAS MOVIL: si hay vista previa, el back cierra la vista, no sale de la pagina
  useEffect(()=>{
    if(sel){
      history.pushState({modal:true}, '', window.location.href)
      const onPop = (e)=>{
        setSel(null)
      }
      window.addEventListener('popstate', onPop)
      return ()=> window.removeEventListener('popstate', onPop)
    }
  },[sel])

  const closeModal = ()=>{
    setSel(null)
    if(history.state && history.state.modal){
      history.back()
    }
  }

  const getImages = (p)=>{
    if(p.images && p.images.length>0) return p.images.filter(Boolean)
    return [p.image_url, ...(p.extra_images||[])].filter(Boolean).slice(0,6)
  }

  let filtered=[...products]
  if(q) filtered=filtered.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()) || p.stores?.name?.toLowerCase().includes(q.toLowerCase()))
  if(cat) filtered=filtered.filter(p=>p.categoria===cat)
  if(tipo) filtered=filtered.filter(p=> (p.stores?.tipo_tienda||'').toLowerCase().includes(tipo.toLowerCase()))

  const cats=[...new Set(products.map(p=>p.categoria).filter(Boolean))].slice(0,14)

  const addToCart = (p)=>{
    setCart(prev=>{
      const idx = prev.findIndex(i=>i.id===p.id)
      if(idx>=0){
        const copy=[...prev]
        copy[idx]={...copy[idx], qty: copy[idx].qty+1}
        return copy
      }
      return [...prev, {id:p.id, name:p.name, price:p.price, image:p.image_url, storeName:p.stores?.name, storeSlug:p.stores?.slug, whatsapp:p.stores?.whatsapp, qty:1}]
    })
    setShowCart(true)
  }

  const updateQty = (id, delta)=>{
    setCart(prev=>{
      return prev.map(i=>{
        if(i.id===id){
          const n = i.qty+delta
          return n<=0 ? null : {...i, qty:n}
        }
        return i
      }).filter(Boolean)
    })
  }

  const total = cart.reduce((s,i)=>s+(Number(i.price)||0)*i.qty,0)

  const checkoutWhatsApp = ()=>{
    if(cart.length===0) return
    let msg = `Hola TiendaNica! Quiero comprar desde el market:\n\n`
    cart.forEach((i,idx)=>{
      msg += `${idx+1}. ${i.name} x${i.qty} - C$ ${i.price} (Tienda: ${i.storeName})\n`
    })
    msg += `\nTotal: C$ ${total}\n\nMi direccion: `
    // Si es una sola tienda, manda a esa tienda, si son varias, manda al numero principal
    const uniqueWAs = [...new Set(cart.map(c=>c.whatsapp).filter(Boolean))]
    if(uniqueWAs.length===1){
      window.open(`https://wa.me/${uniqueWAs[0]}?text=${encodeURIComponent(msg)}`,'_blank')
    } else {
      // Si hay varias tiendas, manda al tuyo para que coordines
      window.open(`https://wa.me/50581732620?text=${encodeURIComponent(msg + "\n\n(Son de varias tiendas)")}`,'_blank')
    }
  }

  const waProductDirect = (p)=>{
    let m=`Hola ${p.stores.name}! Vi en TiendaNica Market: ${p.name} - C$ ${p.price} https://tiendanica.store/${p.stores.slug}`
    if(p.description) m+=` - ${p.description}`
    window.open(`https://wa.me/${p.stores.whatsapp}?text=${encodeURIComponent(m)}`,'_blank')
  }

  const abrirVender = ()=>{
    const mensaje = 'Hola TiendaNica! Quiero vender en el market, me interesa abrir mi tienda.'
    window.open(`https://wa.me/50581732620?text=${encodeURIComponent(mensaje)}`,'_blank')
  }

  if(loading) return <div style={{padding:40, textAlign:'center'}}>Cargando TiendaNica...</div>

  return (
    <main style={{minHeight:'100vh', background:'#F6F3F0', fontFamily:'Inter, system-ui', paddingBottom:90}}>
      <style>{`
        .market-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .product-card-img { width: 100%; height: 100%; object-fit: contain; background: #fff; }
        .product-card-wrap { aspect-ratio: 1/1; background: #fff; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; border-radius: 16px 16px 0 0; }
        .portada-real { width: 100%; height: auto; display: block; }
        .portada-wrap { width: 100%; background: linear-gradient(135deg, #FF8A00 0%, #FF5A00 25%, #FF2D55 55%, #2962FF 100%); line-height: 0; position: relative; padding: 3px; }
        .portada-inner { background: #000; border-radius: 0; overflow: hidden; position: relative; line-height: 0; }
        .btn-vender { position: absolute; bottom: 14px; left: 14px; background: #00E676; color: #000; border: none; padding: 0; border-radius: 14px; font-weight: 900; font-size: 11px; letter-spacing: 0.5px; text-transform: lowercase; box-shadow: 0 4px 18px rgba(0,230,118,0.45); cursor: pointer; z-index: 5; width: 68px; height: 62px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
        .btn-vender:hover { transform: scale(1.05); }
        .btn-vender svg { filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2)); }
        @media (max-width: 1024px) { .market-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 768px) {
          .market-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .product-card-wrap { aspect-ratio: 1/1; border-radius: 14px 14px 0 0; }
          .btn-vender { width: 56px; height: 52px; bottom: 10px; left: 10px; border-radius: 12px; font-size: 10px; }
        }
      `}</style>

      {/* ===== PORTADA CON DEGRADADO NARANJA ROJO AZUL ===== */}
      <div className="portada-wrap">
        <div className="portada-inner">
          <img src="/opengraph-image.png" alt="TiendaNica" className="portada-real"/>
          {/* BOTON VENDER BONITO CON BOLSITA ENCIMA - PEQUEÑO */}
          <button onClick={abrirVender} className="btn-vender">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span>vender</span>
          </button>
        </div>
      </div>

      {/* HEADER CARRITO */}
      <div style={{background:'#fff', borderBottom:'1px solid #EAE6E1', padding:'10px 14px', position:'sticky', top:0, zIndex:20, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', gap:8}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar producto..." style={{border:'1px solid #EAE6E1', borderRadius:999, padding:'8px 14px', fontSize:13, width:160}}/>
        </div>
        <button onClick={()=>setShowCart(true)} style={{background:'#111', color:'#fff', border:'none', padding:'8px 14px', borderRadius:999, fontWeight:800, fontSize:13, position:'relative'}}>
          🛒 {cart.length>0 && <span style={{background:'#00E676', color:'#000', borderRadius:999, padding:'2px 6px', fontSize:10, marginLeft:4}}>{cart.reduce((a,b)=>a+b.qty,0)}</span>}
        </button>
      </div>

      <div style={{maxWidth:1200, margin:'0 auto', padding:14}}>
        <div style={{background:'#fff', borderRadius:16, padding:12, border:'1px solid #EAE6E1', display:'flex', flexDirection:'column', gap:10}}>
          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            <button onClick={()=>{setCat(null); setTipo(null)}} style={{padding:'6px 12px', borderRadius:999, border:'1px solid #000', background: !cat && !tipo ? '#000' : '#fff', color: !cat && !tipo ? '#fff' : '#000', fontSize:12, fontWeight:700}}>Todo</button>
            {cats.map(c=><button key={c} onClick={()=>setCat(c===cat?null:c)} style={{padding:'6px 12px', borderRadius:999, border:'1px solid #eee', background: cat===c ? '#000' : '#fff', color: cat===c ? '#fff' : '#000', fontSize:12, fontWeight:700, textTransform:'capitalize'}}>{c}</button>)}
          </div>
          <div style={{display:'flex', gap:6, flexWrap:'wrap', borderTop:'1px solid #f0f0f0', paddingTop:10}}>
            {['boutique','general'].map(t=><button key={t} onClick={()=>setTipo(t===tipo?null:t)} style={{padding:'6px 12px', borderRadius:999, border:'1px solid #EAE6E1', background: tipo===t ? '#00E676' : '#fff', color: '#000', fontSize:11, fontWeight:800, textTransform:'uppercase'}}>{t}</button>)}
          </div>
        </div>

        <div className="market-grid" style={{marginTop:16}}>
          {filtered.map(p=>{
            const hasVideo = !!p.video_url
            return (
              <div key={p.id} style={{background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', border:'1px solid #f0f0f0'}}>
                <button onClick={()=>setSel(p)} style={{width:'100%', border:'none', padding:0, background:'#fff'}} className="product-card-wrap">
                  <img src={p.image_url} alt={p.name} className="product-card-img"/>
                  {hasVideo && <span style={{position:'absolute', top:8, right:8, background:'#FF3B30', color:'#fff', fontSize:9, padding:'4px 8px', borderRadius:999, fontWeight:900, zIndex:2}}>▶ VIDEO</span>}
                  <span style={{position:'absolute', bottom:8, left:8, background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:9, padding:'3px 7px', borderRadius:999}}>{p.stores?.name?.slice(0,14)}</span>
                </button>
                <div style={{padding:10}}>
                  <p style={{fontSize:13, fontWeight:700, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', minHeight:34}}>{p.name}</p>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6}}><b style={{fontSize:14}}>C$ {p.price}</b><span style={{fontSize:10, background:'#F6F3F0', padding:'3px 7px', borderRadius:999, textTransform:'capitalize'}}>{p.categoria}</span></div>
                  <div style={{display:'flex', gap:6, marginTop:8}}>
                    <button onClick={()=>setSel(p)} style={{flex:1, background:'#F0F0F0', color:'#000', padding:'8px', borderRadius:999, fontSize:11, fontWeight:800, border:'none'}}>Ver</button>
                    <button onClick={()=>addToCart(p)} style={{flex:1.2, background:'#111', color:'#fff', padding:'8px', borderRadius:999, fontSize:11, fontWeight:800, border:'none'}}>🛒 Agregar</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* VISTA PREVIA CON CARRITO - NO MANDA A TIENDA */}
      {sel&&<div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={closeModal}>
        <div style={{background:'#fff',width:'100%',maxWidth:500,borderTopLeftRadius:24,borderTopRightRadius:24,overflow:'hidden',maxHeight:'92vh',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
          <TemuGalleryMarket images={getImages(sel)} videoUrl={sel.video_url} name={sel.name}/>
          <div style={{padding:16, overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <b style={{fontSize:20}}>C$ {sel.price}</b>
              <span style={{fontSize:11, background:'#F6F3F0', padding:'4px 8px', borderRadius:999}}>{sel.stores?.name}</span>
            </div>
            <h2 style={{fontWeight:900, fontSize:16, marginTop:6}}>{sel.name}</h2>
            <p style={{fontSize:12, color:'#666', marginTop:2}}>{sel.categoria} • {(sel.stores?.tipo_tienda||'').toUpperCase()}</p>
            {sel.description&&<p style={{fontSize:13, background:'#F7F5F3', padding:'8px 10px', borderRadius:10, marginTop:8}}>✓ {sel.description}</p>}
            
            {/* BOTONES CARRITO + WHATSAPP */}
            <div style={{display:'flex', gap:8, marginTop:14}}>
              <button onClick={()=>{addToCart(sel)}} style={{flex:1, background:'#111', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:800}}>🛒 Agregar al carrito</button>
              <button onClick={()=>waProductDirect(sel)} style={{flex:1, background:'#25D366', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:900}}>WhatsApp</button>
            </div>
            
            <div style={{display:'flex', gap:8, marginTop:8}}>
              <button onClick={closeModal} style={{flex:1, background:'#F0F0F0', border:'none', padding:11, borderRadius:999, fontWeight:700}}>← Regresar al market</button>
              <a href={`/${sel.stores?.slug}`} style={{flex:1, textAlign:'center', background:'#fff', color:'#111', border:'1px solid #111', padding:11, borderRadius:999, fontWeight:700, textDecoration:'none', fontSize:13}}>Ver tienda</a>
            </div>
            <p style={{fontSize:10, color:'#999', textAlign:'center', marginTop:8}}>Flecha atrás del celular también regresa al market</p>
          </div>
        </div>
      </div>}

      {/* CARRITO DRAWER */}
      {showCart && <div style={{position:'fixed', inset:0, zIndex:120, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'flex-end'}} onClick={()=>setShowCart(false)}>
        <div style={{background:'#fff', width:'100%', maxWidth:380, height:'100%', padding:16, display:'flex', flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee', paddingBottom:12}}>
            <h3 style={{fontWeight:900, fontSize:18}}>🛒 Carrito ({cart.reduce((a,b)=>a+b.qty,0)})</h3>
            <button onClick={()=>setShowCart(false)} style={{background:'#F0F0F0', border:'none', width:32, height:32, borderRadius:999, fontWeight:800}}>X</button>
          </div>
          <div style={{flex:1, overflowY:'auto', marginTop:12, display:'flex', flexDirection:'column', gap:10}}>
            {cart.length===0 && <div style={{textAlign:'center', marginTop:40}}><p style={{fontSize:14, color:'#999'}}>Carrito vacío</p><p style={{fontSize:12, color:'#bbb', marginTop:4}}>Agrega productos desde el market</p></div>}
            {cart.map(i=>(
              <div key={i.id} style={{display:'flex', gap:10, border:'1px solid #f0f0f0', borderRadius:12, padding:8, alignItems:'center'}}>
                <img src={i.image} style={{width:50, height:50, objectFit:'contain', background:'#fff', borderRadius:8}}/>
                <div style={{flex:1}}>
                  <p style={{fontSize:12, fontWeight:700, lineHeight:1.2}}>{i.name.slice(0,40)}</p>
                  <p style={{fontSize:11, color:'#666'}}>{i.storeName}</p>
                  <b style={{fontSize:13}}>C$ {i.price}</b>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:6}}>
                  <button onClick={()=>updateQty(i.id,-1)} style={{width:26, height:26, borderRadius:999, border:'1px solid #ddd', background:'#fff'}}>−</button>
                  <span style={{fontSize:12, fontWeight:800, minWidth:16, textAlign:'center'}}>{i.qty}</span>
                  <button onClick={()=>updateQty(i.id,1)} style={{width:26, height:26, borderRadius:999, border:'1px solid #111', background:'#111', color:'#fff'}}>+</button>
                </div>
              </div>
            ))}
          </div>
          {cart.length>0 && <div style={{borderTop:'1px solid #eee', paddingTop:12}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:12}}><span style={{fontWeight:700}}>Total:</span><b style={{fontSize:18}}>C$ {total}</b></div>
            <button onClick={checkoutWhatsApp} style={{width:'100%', background:'#25D366', color:'#fff', border:'none', padding:14, borderRadius:999, fontWeight:900, fontSize:14}}>Comprar por WhatsApp</button>
            <button onClick={()=>setCart([])} style={{width:'100%', background:'#fff', color:'#999', border:'none', padding:10, marginTop:6, fontSize:12}}>Vaciar carrito</button>
          </div>}
        </div>
      </div>}

      {/* BOTON FLOTANTE CARRITO ABAJO */}
      {cart.length>0 && !showCart && !sel && <button onClick={()=>setShowCart(true)} style={{position:'fixed', bottom:20, right:20, zIndex:30, background:'#111', color:'#fff', border:'none', padding:'12px 18px', borderRadius:999, fontWeight:900, boxShadow:'0 8px 24px rgba(0,0,0,0.3)', display:'flex', alignItems:'center', gap:8}}>
        🛒 C$ {total} <span style={{background:'#00E676', color:'#000', padding:'2px 8px', borderRadius:999, fontSize:11}}>{cart.reduce((a,b)=>a+b.qty,0)}</span>
      </button>}
    </main>
  )
}
