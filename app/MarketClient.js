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

  useEffect(()=>{
    const supabase=getSupabase()
    if(!supabase) return
    supabase.from('stores').select('*').eq('is_active',true).then(({data})=>{
      // SOLO BOUTIQUE Y GENERAL EN MARKET, COMIDA FUERA
      const filtradas = (data||[]).filter(s=>{
        const t=(s.tipo_tienda||'').toLowerCase()
        return !t.includes('comida') && !t.includes('restaurante') && !t.includes('food')
      })
      setStores(filtradas)
    })
    supabase.from('products').select('*, stores!inner(slug,name,logo_url,tipo_tienda,whatsapp,cover_image)').eq('is_active',true).order('created_at',{ascending:false}).limit(250).then(({data})=>{
      // FILTRO: quitar comida del market
      const sinComida = (data||[]).filter(p=>{
        const t=(p.stores?.tipo_tienda||'').toLowerCase()
        return !t.includes('comida') && !t.includes('restaurante') && !t.includes('food')
      })
      setProducts(sinComida)
      setLoading(false)
    })
  },[])

  const getImages = (p)=>{
    if(p.images && p.images.length>0) return p.images.filter(Boolean)
    return [p.image_url, ...(p.extra_images||[])].filter(Boolean).slice(0,6)
  }

  let filtered=[...products]
  if(q) filtered=filtered.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()) || p.stores?.name?.toLowerCase().includes(q.toLowerCase()))
  if(cat) filtered=filtered.filter(p=>p.categoria===cat)
  if(tipo) filtered=filtered.filter(p=> (p.stores?.tipo_tienda||'').toLowerCase().includes(tipo.toLowerCase()))

  const cats=[...new Set(products.map(p=>p.categoria).filter(Boolean))].slice(0,14)
  const wa=(msg,store)=> window.open(`https://api.whatsapp.com/send?phone=${store.whatsapp}&text=${encodeURIComponent(msg)}`,'_blank')
  const waProduct=()=>{
    let m=`Hola ${sel.stores.name}! Vi en TiendaNica: ${sel.name} - C$ ${sel.price} https://tiendanica.store/${sel.stores.slug}`
    if(sel.description) m+=` - ${sel.description}`
    wa(m, sel.stores)
  }

  if(loading) return <div style={{padding:40, textAlign:'center'}}>Cargando TiendaNica...</div>

  return (
    <main style={{minHeight:'100vh', background:'#F6F3F0', fontFamily:'Inter, system-ui', paddingBottom:40}}>
      <style>{`
        .market-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .product-card-img { width: 100%; height: 100%; object-fit: contain; background: #fff; }
        .product-card-wrap { aspect-ratio: 1/1; background: #fff; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; border-radius: 16px 16px 0 0; }
        .market-banner { position: relative; height: 460px; background: #0A0A0A; overflow: hidden; }
        .market-banner-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; }
        @media (max-width: 1024px) { .market-grid { grid-template-columns: repeat(3, 1fr); } .market-banner { height: 400px; } }
        @media (max-width: 768px) {
          .market-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .product-card-wrap { aspect-ratio: 1/1; border-radius: 14px 14px 0 0; }
          .market-banner { height: auto !important; }
          .market-banner-img { position: relative !important; height: auto !important; max-height: 62vh; object-fit: contain !important; background: #0A0A0A; }
          .market-banner-content { padding: 14px !important; }
          .market-banner-content h1 { font-size: 22px !important; }
        }
      `}</style>

      {/* ===== PORTADA MARKET RESTAURADA - SIN CORTARSE ===== */}
      <div className="market-banner">
        <div style={{position:'absolute', inset:0, background:'linear-gradient(180deg, #0A0A0A 0%, #1A1A1A 50%, #0A0A0A 100%)', zIndex:0}}/>
        <img src="/opengraph-image.png" alt="TiendaNica" className="market-banner-img" style={{zIndex:1, opacity:0.9}}/>
        <div style={{position:'absolute', inset:0, zIndex:2, background:'linear-gradient(to top, #0A0A0A 85%, transparent 100%)'}}/>
        <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, #00E676, #00C853)', zIndex:3}}/>
        <div className="market-banner-content" style={{position:'absolute', bottom:0, left:0, right:0, zIndex:4, padding:'28px 24px', color:'#fff'}}>
          <div style={{maxWidth:1200, margin:'0 auto'}}>
            <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:10}}>
              <img src="/tienda-nica-logo.png" style={{width:48,height:48, borderRadius:12, border:'2px solid rgba(255,255,255,0.8)'}}/>
              <div><h1 style={{fontSize:32, fontWeight:900, margin:0, lineHeight:1}}>TIENDANICA.STORE</h1><p style={{fontSize:12, opacity:0.8, margin:'4px 0 0 0'}}>Market de Boutique y Tiendas Generales • {stores.length} tiendas • Envíos a toda Nicaragua</p></div>
            </div>
            <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:12}}>
              <span style={{background:'#00E676', color:'#000', padding:'6px 12px', borderRadius:999, fontSize:11, fontWeight:900}}>BOUTIQUE</span>
              <span style={{background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', padding:'6px 12px', borderRadius:999, fontSize:11, fontWeight:700}}>GENERAL</span>
              <span style={{background:'rgba(255,255,255,0.9)', color:'#000', padding:'6px 12px', borderRadius:999, fontSize:11, fontWeight:800}}>{filtered.length} productos con video</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{background:'#0A0A0A', color:'#fff', padding:'10px 16px', position:'sticky', top:0, zIndex:20, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', gap:10, alignItems:'center'}}><b style={{fontSize:13}}>MARKET</b><span style={{fontSize:10, opacity:0.6}}>Sin comida • Solo boutique y general</span></div>
        <div style={{fontSize:11, opacity:0.7}}>{filtered.length} productos</div>
      </div>

      <div style={{maxWidth:1200, margin:'0 auto', padding:14}}>
        <div style={{background:'#fff', borderRadius:16, padding:12, border:'1px solid #EAE6E1', display:'flex', flexDirection:'column', gap:10}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar producto o tienda (boutique y general)..." style={{border:'1px solid #e8e8e8', borderRadius:999, padding:'12px 16px', fontSize:14}}/>
          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            <button onClick={()=>{setCat(null); setTipo(null)}} style={{padding:'6px 12px', borderRadius:999, border:'1px solid #000', background: !cat && !tipo ? '#000' : '#fff', color: !cat && !tipo ? '#fff' : '#000', fontSize:12, fontWeight:700}}>Todo</button>
            {cats.map(c=><button key={c} onClick={()=>setCat(c===cat?null:c)} style={{padding:'6px 12px', borderRadius:999, border:'1px solid #eee', background: cat===c ? '#000' : '#fff', color: cat===c ? '#fff' : '#000', fontSize:12, fontWeight:700, textTransform:'capitalize'}}>{c}</button>)}
          </div>
          <div style={{display:'flex', gap:6, flexWrap:'wrap', borderTop:'1px solid #f0f0f0', paddingTop:10}}>
            {['boutique','general'].map(t=><button key={t} onClick={()=>setTipo(t===tipo?null:t)} style={{padding:'6px 12px', borderRadius:999, border:'1px solid #EAE6E1', background: tipo===t ? '#00E676' : '#fff', color: tipo===t ? '#000' : '#000', fontSize:11, fontWeight:800, textTransform:'uppercase'}}>{t}</button>)}
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
                <div style={{padding:12}}>
                  <p style={{fontSize:13, fontWeight:700, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', minHeight:36}}>{p.name}</p>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6}}><b style={{fontSize:14}}>C$ {p.price}</b><span style={{fontSize:10, background:'#F6F3F0', padding:'3px 7px', borderRadius:999, textTransform:'capitalize'}}>{p.categoria}</span></div>
                  <button onClick={()=>setSel(p)} style={{marginTop:8, width:'100%', background: hasVideo ? '#FF3B30' : '#111', color:'#fff', padding:'9px', borderRadius:999, fontSize:11, fontWeight:800, border:'none'}}>{hasVideo ? '▶ Ver video' : 'Ver en tienda'}</button>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length===0 && <div style={{background:'#fff', borderRadius:16, padding:30, textAlign:'center', marginTop:16}}><p style={{fontWeight:700}}>No hay productos de boutique/general con ese filtro</p><p style={{fontSize:12, color:'#999', marginTop:6}}>Comida está en otro sitio aparte</p></div>}
      </div>

      {sel&&<div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setSel(null)}>
        <div style={{background:'#fff',width:'100%',maxWidth:500,borderTopLeftRadius:24,borderTopRightRadius:24,overflow:'hidden',maxHeight:'92vh',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
          <TemuGalleryMarket images={getImages(sel)} videoUrl={sel.video_url} name={sel.name}/>
          <div style={{padding:16, overflowY:'auto'}}>
            <b style={{fontSize:20}}>C$ {sel.price}</b>
            <h2 style={{fontWeight:900, fontSize:16, marginTop:6}}>{sel.name}</h2>
            <p style={{fontSize:12, color:'#666', marginTop:2}}>Tienda: {sel.stores?.name} • {sel.categoria} • {(sel.stores?.tipo_tienda||'').toUpperCase()}</p>
            {sel.description&&<p style={{fontSize:13, background:'#F7F5F3', padding:'8px 10px', borderRadius:10, marginTop:8}}>✓ {sel.description}</p>}
            <div style={{display:'flex', gap:8, marginTop:12}}>
              <button onClick={()=>setSel(null)} style={{flex:1, background:'#F0F0F0', border:'none', padding:12, borderRadius:999, fontWeight:700}}>Cerrar</button>
              <button onClick={waProduct} style={{flex:1.5, background:'#25D366', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:900}}>WhatsApp Tienda</button>
            </div>
            <a href={`/${sel.stores?.slug}`} style={{display:'block', marginTop:8, textAlign:'center', background:'#000', color:'#fff', padding:12, borderRadius:999, fontWeight:800, textDecoration:'none'}}>Ir a la tienda →</a>
          </div>
        </div>
      </div>}
    </main>
  )
}
