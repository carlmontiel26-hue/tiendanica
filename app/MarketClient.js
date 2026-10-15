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
        .hero-title{font-family:'Instrument Serif', serif; font-size: clamp(20px, 2.2vw, 28px); line-height:1; letter-spacing:-0.5px; font-weight:400; color:#fff}
        .hero-title i{font-style:italic; color:#00E676}
      `}</style>

      {/* PORTADA FINAL VERSION A - NEGRO A VERDE - PEQUEÑA Y DISCRETA */}
      <div style={{
        background:'linear-gradient(135deg, #0A0A0A 0%, #0A0A0A 42%, #0A5C36 72%, #00C853 88%, #00E676 100%)',
        borderRadius:'0 0 24px 24px',
        position:'relative',
        overflow:'hidden'
      }}>
        {/* glow sutil */}
        <div style={{position:'absolute', top:-40, right:120, width:180, height:180, background:'rgba(0,230,118,0.18)', filter:'blur(30px)', borderRadius:'50%', pointerEvents:'none'}}></div>
        
        <div className="wrap" style={{padding:'14px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, minHeight:110, position:'relative', zIndex:1}}>
          
          {/* LOGO QUE SOBRESALE */}
          <div style={{background:'#fff', borderRadius:16, padding:'10px 18px', boxShadow:'0 8px 24px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)', display:'flex', alignItems:'center', flexShrink:0}}>
            <img src="/tienda-nica-logo.png" alt="Tienda Nica" style={{height:40, objectFit:'contain', display:'block'}}/>
          </div>

          {/* TEXTO CENTRAL */}
          <div style={{flex:1, minWidth:0}}>
            <h1 className="hero-title">El mercado más <i>grande</i> de Nicaragua</h1>
            <div style={{display:'flex', alignItems:'center', gap:8, marginTop:6, flexWrap:'wrap'}}>
              <span style={{background:'#00E676', color:'#000', fontSize:9, fontWeight:900, padding:'4px 8px', borderRadius:999, letterSpacing:'0.5px'}}>● MERCADO NACIONAL</span>
              <span style={{fontSize:11, color:'#A8A29E', fontWeight:500}}>Boutique • Hogar • {stores.length} tiendas • {products.length} productos</span>
            </div>
          </div>

          {/* DERECHA - BUSCADOR Y VENDER - DESKTOP */}
          <div style={{display:'flex', alignItems:'center', gap:8, flexShrink:0}} className="hide-mobile">
            <div style={{position:'relative'}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{padding:'10px 14px', borderRadius:999, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.12)', color:'#fff', fontSize:12, width:160, outline:'none', backdropFilter:'blur(6px)'}}/>
            </div>
            <a href={solicitarTiendaLink} target="_blank" style={{background:'#fff', color:'#0A0A0A', padding:'10px 16px', borderRadius:999, fontWeight:900, fontSize:11, textDecoration:'none', whiteSpace:'nowrap'}}>Vender →</a>
          </div>
        </div>

        {/* BUSCADOR MOBILE DEBAJO */}
        <div className="wrap" style={{padding:'0 14px 12px', display:'none'}} id="mobile-search">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar vestido, jeans, licuadora..." className="input-base" style={{background:'rgba(255,255,255,0.92)'}}/>
        </div>
      </div>

      <style>{`@media(max-width:768px){ .hide-mobile{display:none !important} #mobile-search{display:block !important} .hero-title{font-size:18px} }`}</style>

      <div className="wrap">
        {/* FILTROS TIPO */}
        <div style={{display:'flex', gap:8, overflowX:'auto', marginTop:14, paddingBottom:4, scrollbarWidth:'none'}}>
          <button onClick={()=>{setTipo('boutique'); setCat('all')}} className={`pill ${tipo==='boutique'?'active':''}`}>👗 Boutique</button>
          <button onClick={()=>{setTipo('general'); setCat('all')}} className={`pill ${tipo==='general'?'active':''}`}>🛍 Hogar / General</button>
          <button onClick={()=>{setTipo('all'); setCat('all')}} className={`pill ${tipo==='all'?'active':''}`}>✨ Todo</button>
        </div>

        <div style={{display:'flex', gap:6, overflowX:'auto', marginTop:10, paddingBottom:6}}>
          {(CATS[tipo]||CATS.boutique).map(c=>(
            <button key={c} onClick={()=>setCat(c)} className={`pill-sub ${cat===c?'active':''}`}>{c}</button>
          ))}
        </div>

        <div className="card-white" style={{marginTop:14, padding:14, display:'flex', justifyContent:'space-between', alignItems:'center', background:'#0A0A0A', color:'#fff', borderColor:'#0A0A0A'}}>
          <div>
            <h2 style={{fontWeight:900, fontSize:14, letterSpacing:'-0.5px', lineHeight:1.1}}>{tipo==='boutique'?'Boutique nicaragüense premium': tipo==='general'?'Todo para tu hogar':'Todo el mercado'} <span style={{color:'#00E676'}}>• {filtered.length}</span></h2>
            <p style={{fontSize:11, color:'#9A9A9A', marginTop:4, fontWeight:500}}>Compra directo por WhatsApp al dueño, sin comisiones. Envío a toda Nicaragua.</p>
          </div>
          <div style={{fontSize:20, background:'#1A1A1A', width:42, height:42, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #2A2A2A'}}>{tipo==='boutique'?'👗':'🛍'}</div>
        </div>

        {/* GRID - TU LOGICA INTACTA */}
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
