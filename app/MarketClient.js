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
                <button onClick={(e)=>{e.stopPropagation(); setMuted(!muted)}} style={{position:'absolute', bottom:16, right:16, background:'rgba(0,0,0,0.6)', color:'#fff', border:'none', width:36, height:36, borderRadius:999}}>{muted ? '🔇' : '🔊'}</button>
                <span style={{position:'absolute', top:12, left:12, background:'#FF3B30', color:'#fff', fontSize:10, fontWeight:900, padding:'4px 8px', borderRadius:999}}>VIDEO</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6, background:'rgba(0,0,0,0.45)', padding:'6px 10px', borderRadius:999}}>
        {slides.map((s,i)=><button key={i} onClick={()=>setCurrent(i)} style={{width: i===current ? 20 : 6, height:6, borderRadius:999, border:'none', background: i===current ? (s.type==='video' ? '#FF3B30' : '#fff') : 'rgba(255,255,255,0.5)'}}/>)}
      </div>
    </div>
  )
}

const ORDEN = ['vestidos','blusas','jeans','conjuntos','faldas','shorts','pijamas','zapatos','carteras','accesorios','belleza','salud','otros','nuevo','general']

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
    supabase.from('stores').select('*').then(({data})=>{
      const all=data||[]
      setStores(all.filter(s=>{ const t=(s.tipo_tienda||'').toLowerCase(); return !t.includes('comida') }))
    })
    supabase.from('products').select('*, stores!inner(slug,name,logo_url,tipo_tienda,whatsapp)').order('created_at',{ascending:false}).limit(400).then(({data})=>{
      const all=data||[]
      setProducts(all.filter(p=>{ const t=(p.stores?.tipo_tienda||'').toLowerCase(); return !t.includes('comida') }))
      setLoading(false)
    })
  },[])

  const getImages = (p)=> p.images?.length>0 ? p.images.filter(Boolean) : [p.image_url, ...(p.extra_images||[])].filter(Boolean).slice(0,6)

  let filtered=[...products]
  if(q) filtered=filtered.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()) || p.stores?.name?.toLowerCase().includes(q.toLowerCase()))
  if(cat) filtered=filtered.filter(p=>p.categoria===cat)
  if(tipo) filtered=filtered.filter(p=> (p.stores?.tipo_tienda||'').toLowerCase().includes(tipo.toLowerCase()))

  const catsRaw=[...new Set(products.map(p=>p.categoria).filter(Boolean))]
  const cats = catsRaw.sort((a,b)=>{
    const ia=ORDEN.indexOf(a.toLowerCase()); const ib=ORDEN.indexOf(b.toLowerCase())
    if(ia===-1 && ib===-1) return a.localeCompare(b)
    if(ia===-1) return 1
    if(ib===-1) return -1
    return ia-ib
  })

  const abrirVender = ()=>{
    const msg='Hola TiendaNica! Quiero vender en el market, me interesa abrir mi tienda en tiendanica.store'
    window.open(`https://wa.me/50581732620?text=${encodeURIComponent(msg)}`,'_blank')
  }
  const waProduct = ()=>{
    let m=`Hola ${sel.stores.name}! Vi en TiendaNica: ${sel.name} - C$ ${sel.price} https://tiendanica.store/${sel.stores.slug}`
    if(sel.description) m+=` - ${sel.description}`
    window.open(`https://api.whatsapp.com/send?phone=${sel.stores.whatsapp}&text=${encodeURIComponent(m)}`,'_blank')
  }

  if(loading) return <div style={{padding:40, textAlign:'center'}}>Cargando TiendaNica...</div>

  return (
    <main style={{minHeight:'100vh', background:'#F5F1ED', fontFamily:'Inter, system-ui', paddingBottom:80}}>
      <style>{`
        .portada-wrap{ position:relative; width:100%; line-height:0; background:#fff; }
        .portada-img{ width:100%; height:auto; display:block; }
        .vender-hit{ position:absolute; bottom:8%; left:5%; width:28%; height:14%; background:transparent; border:none; cursor:pointer; z-index:5; border-radius:999px; }
        .cat-bar{ display:flex; gap:7px; overflow-x:auto; scrollbar-width:none; padding:2px 0 6px; -webkit-overflow-scrolling:touch; }
        .cat-bar::-webkit-scrollbar{ display:none; }
        .chip{ white-space:nowrap; padding:9px 16px; border-radius:999px; border:1.5px solid #E8E0D9; background:#fff; font-size:13px; font-weight:700; letter-spacing:0.2px; cursor:pointer; flex-shrink:0; }
        .chip.active{ background:#111; color:#fff; border-color:#111; box-shadow:0 2px 8px rgba(0,0,0,0.15); }
        .chip-tipo{ text-transform:uppercase; font-size:11px; font-weight:900; letter-spacing:0.5px; }
        .grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        .card{ background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.06); border:1px solid #F0E9E2; transition:transform .15s; }
        .card:active{ transform:scale(0.98); }
        .card-img{ aspect-ratio:3/4; background:#fff; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; }
        .card-img img{ width:100%; height:100%; object-fit:contain; background:#fff; }
        @media(max-width:1024px){ .grid{ grid-template-columns:repeat(3,1fr); } }
        @media(max-width:768px){ .grid{ grid-template-columns:repeat(2,1fr); gap:10px; } .card{ border-radius:14px; } }
      `}</style>

      {/* PORTADA NUEVA - TU IMAGEN EXACTA + VENDER CLICKEABLE */}
      <div className="portada-wrap">
        <img src="/opengraph-image.png" alt="TiendaNica" className="portada-img"/>
        <button onClick={abrirVender} className="vender-hit" aria-label="Vender"></button>
      </div>

      {/* BARRA PREMIUM MENSAJE ATRACTIVO */}
      <div style={{background:'#111', color:'#fff', padding:'10px 14px', display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', fontSize:11, fontWeight:700}}>
        <span>✨ Más de {products.length} productos reales</span>
        <span style={{opacity:0.4}}>•</span>
        <span>📦 Envío a toda Nicaragua</span>
        <span style={{opacity:0.4}}>•</span>
        <span>💬 WhatsApp directo sin comisiones</span>
      </div>

      <div style={{maxWidth:1180, margin:'0 auto', padding:'12px'}}>
        <div style={{background:'#fff', borderRadius:20, padding:'12px', border:'1px solid #EDE6DF', boxShadow:'0 4px 20px rgba(0,0,0,0.04)'}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar vestido, jeans, farmacia..." style={{width:'100%', border:'1.5px solid #EEE6DF', borderRadius:999, padding:'13px 18px', fontSize:14, outline:'none'}}/>
          <div className="cat-bar" style={{marginTop:10}}>
            <button onClick={()=>{setCat(null); setTipo(null)}} className={`chip ${!cat && !tipo ? 'active' : ''}`}>Todo</button>
            {cats.map(c=><button key={c} onClick={()=>setCat(c===cat?null:c)} className={`chip ${cat===c ? 'active' : ''}`} style={{textTransform:'capitalize'}}>{c}</button>)}
          </div>
          <div className="cat-bar" style={{marginTop:6, borderTop:'1px solid #F5F0EB', paddingTop:8}}>
            {['boutique','general'].map(t=><button key={t} onClick={()=>setTipo(t===tipo?null:t)} className="chip chip-tipo" style={{background: tipo===t ? '#00E676' : '#F7F2EE', borderColor: tipo===t ? '#00E676' : '#EDE6DF'}}>{t}</button>)}
            <span style={{fontSize:11, color:'#999', alignSelf:'center', marginLeft:6}}>{filtered.length} productos</span>
          </div>
        </div>

        <div className="grid" style={{marginTop:12}}>
          {filtered.map(p=>{
            const hasVideo=!!p.video_url
            return (
              <div key={p.id} className="card">
                <button onClick={()=>setSel(p)} style={{width:'100%', border:'none', padding:0, background:'#fff'}} className="card-img">
                  <img src={p.image_url} alt={p.name}/>
                  {hasVideo && <span style={{position:'absolute', top:8, right:8, background:'#FF2D55', color:'#fff', fontSize:9, fontWeight:900, padding:'5px 9px', borderRadius:999}}>▶ VIDEO</span>}
                  <span style={{position:'absolute', bottom:8, left:8, background:'rgba(0,0,0,0.72)', color:'#fff', fontSize:10, fontWeight:700, padding:'4px 8px', borderRadius:999, backdropFilter:'blur(4px)'}}>{p.stores?.name?.slice(0,16)}</span>
                </button>
                <div style={{padding:'10px 12px 12px'}}>
                  <p style={{fontSize:13, fontWeight:800, lineHeight:'1.25', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', minHeight:32}}>{p.name}</p>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6}}><b style={{fontSize:14}}>C$ {p.price}</b><span style={{fontSize:10, color:'#8B7E74', background:'#F7F2EE', padding:'3px 8px', borderRadius:999, fontWeight:700}}>{p.categoria}</span></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* BOTON VENDER FLOTANTE PREMIUM SIEMPRE VISIBLE */}
      <button onClick={abrirVender} style={{position:'fixed', bottom:18, right:14, zIndex:60, background:'#00E676', color:'#000', border:'2px solid #fff', padding:'14px 22px', borderRadius:999, fontWeight:900, fontSize:14, boxShadow:'0 10px 30px rgba(0,230,118,0.5), 0 4px 10px rgba(0,0,0,0.2)', cursor:'pointer'}}>🚀 VENDER</button>

      {sel&&<div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setSel(null)}>
        <div style={{background:'#fff',width:'100%',maxWidth:500,borderTopLeftRadius:24,borderTopRightRadius:24,overflow:'hidden',maxHeight:'92vh',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
          <TemuGallery images={getImages(sel)} videoUrl={sel.video_url} name={sel.name}/>
          <div style={{padding:16, overflowY:'auto'}}>
            <b style={{fontSize:20}}>C$ {sel.price}</b>
            <h2 style={{fontWeight:900, fontSize:16, marginTop:6}}>{sel.name}</h2>
            <p style={{fontSize:12, color:'#666', marginTop:2}}>Tienda: {sel.stores?.name} • {sel.categoria}</p>
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
