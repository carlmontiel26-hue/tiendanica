'use client'
import { useState, useMemo } from 'react'

const CATS = {
  boutique: ['all','vestidos','blusas','jeans','faldas','conjuntos','shorts','accesorios','zapatos','carteras','nuevo','oferta'],
  general: ['all','hogar','tecnologia','belleza','juguetes','ferreteria','salud','deportes','libros','otros','oferta','nuevo']
}

export default function MarketClient({ initialStores, initialProducts }){
  const boutiqueStores = initialStores.filter(s => (s.tipo_tienda||'boutique') !== 'comida')
  const boutiqueProducts = initialProducts.filter(p => (p._store?.tipo_tienda||'boutique') !== 'comida')

  const [stores] = useState(boutiqueStores)
  const [products] = useState(boutiqueProducts)
  const [tipo,setTipo]=useState('boutique')
  const [cat,setCat]=useState('all')
  const [search,setSearch]=useState('')

  const filtered = useMemo(()=> products.filter(pr=>{
    const st = pr._store
    if(!st) return false
    if(tipo!=='all' && (st.tipo_tienda||'boutique')!==tipo) return false
    if(cat!=='all' && pr.categoria!==cat) return false
    if(search){
      const q=search.toLowerCase()
      if(!pr.name.toLowerCase().includes(q) && !st.name.toLowerCase().includes(q)) return false
    }
    return true
  }),[products,tipo,cat,search])

  const whatsappLink=(pr)=>{
    const phone = (pr._store.whatsapp||'').replace(/[^0-9]/g,'')
    const text = encodeURIComponent(`Hola ${pr._store.name} 👋 vi "${pr.name}" por C$ ${pr.price} en TiendaNica Market (tiendanica.store) y lo quiero comprar`)
    return `https://wa.me/${phone}?text=${text}`
  }

  const solicitarTiendaLink = `https://wa.me/50581732620?text=${encodeURIComponent('Hola TiendaNica, quiero solicitar mi tienda premium en el mercado. Mi nombre es: ')}`

  // Productos reales destacados para la portada
  const featured = filtered.slice(0,6)
  const topStores = stores.slice(0,5)

  return (
    <main style={{background:'#F7F5F3', minHeight:'100vh', fontFamily:'Inter, system-ui', overflowX:'hidden'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box}
        .wrap{max-width:1200px; margin:0 auto; padding:0 14px; width:100%}
        .card-white{background:#fff; border:1px solid #EAE6E1; border-radius:20px; box-shadow:0 8px 28px rgba(0,0,0,0.05)}
        .pill{padding:9px 16px; border-radius:999px; border:1px solid #EAE6E1; background:#fff; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; transition:all 0.2s}
        .pill.active{background:#0A0A0A; color:#fff; border-color:#0A0A0A; box-shadow:0 4px 12px rgba(0,0,0,0.12)}
        .pill-sub{padding:7px 12px; font-size:11px; border-radius:999px; border:1px solid #EAE6E1; background:#FBF9F7; cursor:pointer; font-weight:600}
        .pill-sub.active{background:#0A0A0A; color:#fff}
        .input-base{padding:13px 16px; border-radius:999px; border:1px solid #EAE6E1; background:#fff; font-size:13px; width:100%; outline:none}
        .grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px }
        @media(min-width:640px){ .grid{ grid-template-columns:repeat(3,1fr)} }
        @media(min-width:1024px){ .grid{ grid-template-columns:repeat(4,1fr)} }
        .prod-img{aspect-ratio:1/1; object-fit:cover; border-radius:14px; width:100%; background:#F7F5F3}
        .hero-title{font-family:'Instrument Serif', serif; font-size: clamp(32px, 6vw, 64px); line-height:0.95; letter-spacing:-1.5px; font-weight:400}
        .hero-title i{font-style:italic}
        @media(max-width:768px){ .hero-grid{grid-template-columns:1fr !important} .hero-right{order:-1} }
      `}</style>

      {/* HEADER PREMIUM */}
      <div className="wrap">
        <header style={{padding:'14px 0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <img src="/tienda-nica-logo.png" alt="Tienda Nica" style={{height:40, objectFit:'contain'}}/>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <div style={{fontSize:11, color:'#9A9590', fontWeight:700, background:'#fff', border:'1px solid #EAE6E1', padding:'7px 12px', borderRadius:999}}>{stores.length} tiendas • {products.length} productos</div>
            <a href={solicitarTiendaLink} target="_blank" style={{background:'#0A0A0A', color:'#fff', padding:'8px 16px', borderRadius:999, fontWeight:800, fontSize:12, textDecoration:'none'}}>Vender</a>
          </div>
        </header>
      </div>

      {/* PORTADA PREMIUM - HERO CON PRODUCTOS REALES */}
      <div style={{background:'#0A0A0A', color:'#fff', borderRadius:'0 0 32px 32px', overflow:'hidden', position:'relative'}}>
        <div className="wrap" style={{padding:'28px 14px 22px'}}>
          <div className="hero-grid" style={{display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:24, alignItems:'center'}}>
            <div>
              <div style={{display:'inline-flex', gap:8, alignItems:'center', background:'#1A1A1A', border:'1px solid #2A2A2A', borderRadius:999, padding:'6px 12px', fontSize:10, fontWeight:800, letterSpacing:'0.5px', marginBottom:14}}>
                <span style={{width:6,height:6,background:'#00E676',borderRadius:999, display:'inline-block'}}></span> MERCADO NACIONAL • ENVÍO A TODO NICARAGUA
              </div>
              <h1 className="hero-title">
                El mercado <br/>más <i>grande</i> <br/>de Nicaragua
              </h1>
              <p style={{fontSize:14, color:'#A8A29E', marginTop:14, lineHeight:1.5, maxWidth:440, fontWeight:500}}>
                Boutique, hogar y todo lo que necesitas. Compra directo al dueño por WhatsApp, sin comisiones. Desde Paiwas hasta Managua.
              </p>
              <div style={{display:'flex', gap:8, marginTop:18, flexWrap:'wrap'}}>
                <div style={{background:'#fff', color:'#000', borderRadius:14, padding:'10px 14px', display:'flex', gap:10, alignItems:'center'}}>
                  <div style={{fontSize:20}}>🛒</div>
                  <div><div style={{fontWeight:900, fontSize:13, lineHeight:1}}>{products.length}+ productos</div><div style={{fontSize:10, color:'#666'}}>Verificados</div></div>
                </div>
                <div style={{background:'#1A1A1A', border:'1px solid #2A2A2A', color:'#fff', borderRadius:14, padding:'10px 14px', display:'flex', gap:10, alignItems:'center'}}>
                  <div style={{fontSize:20}}>🏪</div>
                  <div><div style={{fontWeight:900, fontSize:13, lineHeight:1}}>{stores.length} tiendas</div><div style={{fontSize:10, color:'#999'}}>Activas hoy</div></div>
                </div>
              </div>

              <div style={{display:'flex', gap:8, marginTop:18}}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar vestido, jeans, licuadora..." className="input-base" style={{maxWidth:340}}/>
              </div>

              <div style={{display:'flex', gap:8, marginTop:12, overflowX:'auto', scrollbarWidth:'none'}}>
                <button onClick={()=>{setTipo('boutique'); setCat('all')}} className={`pill ${tipo==='boutique'?'active':''}`} style={{background:tipo==='boutique'?'#fff':'#1A1A1A', color:tipo==='boutique'?'#000':'#fff', borderColor:'#2A2A2A'}}>👗 Boutique</button>
                <button onClick={()=>{setTipo('general'); setCat('all')}} className={`pill ${tipo==='general'?'active':''}`} style={{background:tipo==='general'?'#fff':'#1A1A1A', color:tipo==='general'?'#000':'#fff', borderColor:'#2A2A2A'}}>🛍 Hogar / General</button>
                <button onClick={()=>{setTipo('all'); setCat('all')}} className={`pill ${tipo==='all'?'active':''}`} style={{background:tipo==='all'?'#fff':'#1A1A1A', color:tipo==='all'?'#000':'#fff', borderColor:'#2A2A2A'}}>✨ Todo</button>
              </div>
            </div>

            {/* DERECHA - MOSAICO CON PRODUCTOS REALES */}
            <div className="hero-right">
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                {featured.map((pr,i)=>(
                  <a key={pr.id} href={`/${pr._store.slug}`} style={{textDecoration:'none', transform: i%2===1 ? 'translateY(18px)' : 'none'}}>
                    <div style={{background:'#141414', border:'1px solid #232323', borderRadius:18, overflow:'hidden', padding:6}}>
                      <img src={pr.image_url} alt={pr.name} style={{width:'100%', aspectRatio:'1/1', objectFit:'cover', borderRadius:12}}/>
                      <div style={{padding:'8px 4px 4px'}}>
                        <div style={{fontSize:11, fontWeight:700, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{pr.name}</div>
                        <div style={{fontSize:10, color:'#9A9590', marginTop:2}}>{pr._store.name} • C$ {pr.price}</div>
                      </div>
                    </div>
                  </a>
                ))}
                {featured.length===0 && <div style={{gridColumn:'1/-1', background:'#141414', borderRadius:18, padding:24, textAlign:'center', color:'#666', fontSize:12}}>Cargando productos reales...</div>}
              </div>
              <div style={{marginTop:18, display:'flex', gap:8, overflowX:'auto'}}>
                {topStores.map(s=>(
                  <a key={s.id} href={`/${s.slug}`} style={{display:'flex', alignItems:'center', gap:6, background:'#1A1A1A', border:'1px solid #2A2A2A', borderRadius:999, padding:'6px 10px', textDecoration:'none', whiteSpace:'nowrap'}}>
                    <img src={s.logo_url||s.cover_image} style={{width:22,height:22,borderRadius:999, objectFit:'cover'}}/>
                    <span style={{fontSize:10, fontWeight:700, color:'#fff'}}>{s.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap">
        {/* FILTROS SECUNDARIOS */}
        <div style={{display:'flex', gap:6, overflowX:'auto', marginTop:16, paddingBottom:6}}>
          {(CATS[tipo]||CATS.boutique).map(c=>(
            <button key={c} onClick={()=>setCat(c)} className={`pill-sub ${cat===c?'active':''}`}>{c}</button>
          ))}
        </div>

        <div className="card-white" style={{marginTop:14, padding:14, display:'flex', justifyContent:'space-between', alignItems:'center', background:'#0A0A0A', color:'#fff', borderColor:'#0A0A0A'}}>
          <div>
            <h2 style={{fontWeight:900, fontSize:16, letterSpacing:'-0.5px', lineHeight:1.1}}>{tipo==='boutique'?'Boutique nicaragüense premium': tipo==='general'?'Todo para tu hogar':'Todo el mercado'} <span style={{color:'#00E676'}}>• {filtered.length} productos</span></h2>
            <p style={{fontSize:11, color:'#9A9A9A', marginTop:4, fontWeight:500}}>Compra directo por WhatsApp al dueño, sin comisiones. Envío a toda Nicaragua.</p>
          </div>
          <div style={{fontSize:22, background:'#1A1A1A', width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #2A2A2A'}}>{tipo==='boutique'?'👗':'🛍'}</div>
        </div>

        {/* GRID PRODUCTOS REALES - TU LOGICA ORIGINAL INTACTA */}
        <div className="grid" style={{marginTop:14}}>
          {filtered.map(pr=>(
            <div key={pr.id} className="card-white" style={{padding:10, overflow:'hidden'}}>
              <a href={`/${pr._store.slug}`} style={{textDecoration:'none', color:'inherit'}}>
                <img src={pr.image_url} alt={`${pr.name} - ${pr._store.name}`} className="prod-img" loading="lazy"/>
              </a>
              <div style={{padding:'8px 4px 2px'}}>
                <b style={{fontSize:12, lineHeight:1.2, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', color:'#0A0A0A', minHeight:28}}>{pr.name}</b>
                <div style={{display:'flex', alignItems:'center', gap:6, marginTop:6}}>
                  <img src={pr._store.logo_url||pr._store.cover_image} style={{width:18,height:18,borderRadius:999, objectFit:'cover', border:'1px solid #EAE6E1'}}/>
                  <span style={{fontSize:10, color:'#9A9590', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{pr._store.name} • {pr.categoria}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8}}>
                  <b style={{fontSize:13, color:'#0A0A0A'}}>C$ {pr.price}</b>
                  <a href={whatsappLink(pr)} target="_blank" style={{background:'#00E676', color:'#000', fontSize:10, fontWeight:800, padding:'7px 10px', borderRadius:999, textDecoration:'none'}}>WhatsApp</a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{marginTop:24}}>
          <h3 style={{fontWeight:900, fontSize:14, color:'#0A0A0A'}}>🛍 Tiendas con envío nacional</h3>
          <div style={{display:'flex', gap:10, overflowX:'auto', marginTop:10, paddingBottom:10}}>
            {stores.map(s=>(
              <a key={s.id} href={`/${s.slug}`} style={{background:'#fff', border:'1px solid #EAE6E1', borderRadius:16, padding:10, minWidth:140, textDecoration:'none', color:'#0A0A0A', display:'flex', gap:8, alignItems:'center'}}>
                <img src={s.logo_url||s.cover_image} style={{width:36,height:36,borderRadius:10, objectFit:'cover'}}/>
                <div><b style={{fontSize:11, display:'block'}}>{s.name}</b><span style={{fontSize:9, color:'#9A9590'}}>{products.filter(p=>p._store?.id===s.id).length} productos</span></div>
              </a>
            ))}
          </div>
        </div>

        <div style={{marginTop:28, marginBottom:24}}>
          <div style={{background:'#FFFFFF', border:'1px dashed #0A0A0A', borderRadius:20, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
            <div style={{flex:1}}>
              <b style={{fontSize:12, color:'#0A0A0A'}}>¿Tienes una tienda en Nicaragua?</b>
              <p style={{fontSize:11, color:'#9A9590', marginTop:2, lineHeight:1.3}}>Únete a TiendaNica Market. Te creamos tu tienda premium con tu propio WhatsApp y vendes en todo el país.</p>
            </div>
            <a href={solicitarTiendaLink} target="_blank" style={{background:'#0A0A0A', color:'#fff', padding:'10px 16px', borderRadius:999, fontWeight:800, fontSize:11, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0}}>Solicitar tienda →</a>
          </div>
        </div>
      </div>
    </main>
  )
}
