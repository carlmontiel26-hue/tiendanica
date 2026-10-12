'use client'
import { useState, useMemo } from 'react'

const CATS = {
  boutique: ['all','vestidos','blusas','jeans','faldas','conjuntos','shorts','accesorios','zapatos','carteras','nuevo','oferta'],
  comida: ['all','entradas','platos fuertes','pizzas','hamburguesas','pollo','mariscos','bebidas','postres','combos','ofertas'],
  general: ['all','hogar','tecnologia','belleza','juguetes','ferreteria','salud','deportes','libros','otros','oferta','nuevo']
}

export default function MarketClient({ initialStores, initialProducts }){
  const [stores] = useState(initialStores)
  const [products] = useState(initialProducts)
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
        *{box-sizing:border-box}
        .wrap{max-width:1120px; margin:0 auto; padding:0 14px; width:100%}
        .card-white{background:#fff; border:1px solid #EAE6E1; border-radius:20px; box-shadow:0 8px 28px rgba(0,0,0,0.05)}
        .pill{padding:9px 16px; border-radius:999px; border:1px solid #EAE6E1; background:#fff; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; transition:all 0.2s}
        .pill.active{background:#0A0A0A; color:#fff; border-color:#0A0A0A; box-shadow:0 4px 12px rgba(0,0,0,0.12)}
        .pill-sub{padding:7px 12px; font-size:11px; border-radius:999px; border:1px solid #EAE6E1; background:#FBF9F7; cursor:pointer; font-weight:600}
        .pill-sub.active{background:#0A0A0A; color:#fff}
        .input-base{padding:12px 14px; border-radius:999px; border:1px solid #EAE6E1; background:#fff; font-size:13px; width:100%; outline:none}
        .grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px }
        @media(min-width:640px){ .grid{ grid-template-columns:repeat(3,1fr)} }
        @media(min-width:1024px){ .grid{ grid-template-columns:repeat(4,1fr)} }
        .prod-img{aspect-ratio:1/1; object-fit:cover; border-radius:14px; width:100%; background:#F7F5F3}
      `}</style>

      <div className="wrap">
        <header style={{padding:'16px 0 12px', display:'flex', flexDirection:'column', gap:12}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
            <img src="/tienda-nica-logo.png" alt="Tienda Nica" style={{height:42, objectFit:'contain'}}/>
            <div style={{fontSize:11, color:'#9A9590', fontWeight:600, background:'#fff', border:'1px solid #EAE6E1', padding:'6px 10px', borderRadius:999}}>{stores.length} tiendas • {products.length} productos</div>
          </div>

          {/* BUSQUEDA + BOTON VENDER (que pediste) */}
          <div style={{display:'flex', gap:8}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar vestido, pizza, licuadora..." className="input-base"/>
            <a href={solicitarTiendaLink} target="_blank" style={{background:'#0A0A0A', color:'#fff', padding:'0 18px', borderRadius:999, fontWeight:800, fontSize:12, display:'flex', alignItems:'center', textDecoration:'none', whiteSpace:'nowrap'}}>Vender</a>
          </div>
        </header>

        <div style={{display:'flex', gap:8, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none'}}>
          <button onClick={()=>{setTipo('boutique'); setCat('all')}} className={`pill ${tipo==='boutique'?'active':''}`}>👗 Boutique</button>
          <button onClick={()=>{setTipo('comida'); setCat('all')}} className={`pill ${tipo==='comida'?'active':''}`}>🍔 Comida</button>
          <button onClick={()=>{setTipo('general'); setCat('all')}} className={`pill ${tipo==='general'?'active':''}`}>🛍️ General / Todo</button>
          <button onClick={()=>{setTipo('all'); setCat('all')}} className={`pill ${tipo==='all'?'active':''}`}>✨ Todo</button>
        </div>

        <div style={{display:'flex', gap:6, overflowX:'auto', marginTop:10, paddingBottom:6}}>
          {(CATS[tipo]||CATS.boutique).map(c=>(
            <button key={c} onClick={()=>setCat(c)} className={`pill-sub ${cat===c?'active':''}`}>{c}</button>
          ))}
        </div>

        {/* BANNER QUE TENIAS - REGRESADO */}
        <div className="card-white" style={{marginTop:14, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', background:'#0A0A0A', color:'#fff', borderColor:'#0A0A0A'}}>
          <div>
            <h2 style={{fontWeight:900, fontSize:18, letterSpacing:'-0.5px', lineHeight:1.1}}>{tipo==='boutique'?'Boutique nicaragüense premium': tipo==='comida'?'Restaurantes y comidas a domicilio':'Todo para tu hogar'} <span style={{color:'#00E676'}}>•</span></h2>
            <p style={{fontSize:11, color:'#9A9A9A', marginTop:4, fontWeight:500}}>{tipo==='boutique'?'Lo más vendido de tus tiendas favoritas. Compra directo por WhatsApp al dueño.': tipo==='comida'?'Pide directo a la cocina de cada restaurante sin intermediarios.':'Electrodomésticos, belleza, juguetes y más. Todo en un solo lugar.'}</p>
          </div>
          <div style={{fontSize:24, background:'#1A1A1A', width:48, height:48, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #2A2A2A'}}>{tipo==='boutique'?'👗':tipo==='comida'?'🍔':'🛍️'}</div>
        </div>

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
          <h3 style={{fontWeight:900, fontSize:14, color:'#0A0A0A'}}>🛍️ Tiendas del mercado</h3>
          <div style={{display:'flex', gap:10, overflowX:'auto', marginTop:10, paddingBottom:10}}>
            {stores.map(s=>(
              <a key={s.id} href={`/${s.slug}`} style={{background:'#fff', border:'1px solid #EAE6E1', borderRadius:16, padding:10, minWidth:140, textDecoration:'none', color:'#0A0A0A', display:'flex', gap:8, alignItems:'center'}}>
                <img src={s.logo_url||s.cover_image} style={{width:36,height:36,borderRadius:10, objectFit:'cover'}}/>
                <div><b style={{fontSize:11, display:'block'}}>{s.name}</b><span style={{fontSize:9, color:'#9A9590'}}>{products.filter(p=>p._store?.id===s.id).length} prod</span></div>
              </a>
            ))}
          </div>
        </div>

        <div style={{marginTop:28, marginBottom:24}}>
          <div style={{background:'#FFFFFF', border:'1px dashed #0A0A0A', borderRadius:20, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
            <div style={{flex:1}}>
              <b style={{fontSize:12, color:'#0A0A0A'}}>¿Tienes una tienda en Nicaragua?</b>
              <p style={{fontSize:11, color:'#9A9590', marginTop:2, lineHeight:1.3}}>Únete a TiendaNica Market. Te creamos tu tienda premium con tu propio WhatsApp.</p>
            </div>
            <a href={solicitarTiendaLink} target="_blank" style={{background:'#0A0A0A', color:'#fff', padding:'10px 16px', borderRadius:999, fontWeight:800, fontSize:11, textDecoration:'none', whiteSpace:'nowrap'}}>Solicitar tienda →</a>
          </div>
        </div>
      </div>
    </main>
  )
}
