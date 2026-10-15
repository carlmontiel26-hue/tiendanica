'use client'
import { useState, useMemo, useEffect } from 'react'

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
  const [selected,setSelected]=useState(null)
  const [showCart,setShowCart]=useState(false)
  const [cart,setCart]=useState([])
  const [qty,setQty]=useState(1)

  useEffect(()=>{
    try{ const c = JSON.parse(localStorage.getItem('tiendanica_market_cart')||'[]'); setCart(c) }catch{}
  },[])
  useEffect(()=>{
    localStorage.setItem('tiendanica_market_cart', JSON.stringify(cart))
  },[cart])

  const addToCart = (pr, q=1)=>{
    setCart(prev=>{
      const idx = prev.findIndex(i=>i.id===pr.id)
      if(idx>=0){ const n=[...prev]; n[idx].qty+=q; return n }
      return [...prev, { id:pr.id, storeId:pr._store.id, storeSlug:pr._store.slug, storeName:pr._store.name, storeWhatsapp:pr._store.whatsapp, name:pr.name, price:pr.price, image:pr.image_url, categoria:pr.categoria, qty:q }]
    })
    setShowCart(true)
  }
  const removeFromCart = (id)=> setCart(c=>c.filter(i=>i.id!==id))
  const updateQty = (id, d)=> setCart(c=>c.map(i=> i.id===id ? {...i, qty: Math.max(1, i.qty+d)} : i))
  const cartCount = cart.reduce((a,b)=>a+b.qty,0)
  const cartTotal = cart.reduce((a,b)=>a+b.price*b.qty,0)

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

  const groupedByStore = useMemo(()=>{
    const g={}
    cart.forEach(i=>{ if(!g[i.storeId]) g[i.storeId]={ storeName:i.storeName, whatsapp:i.storeWhatsapp, items:[] }; g[i.storeId].items.push(i) })
    return Object.values(g)
  },[cart])

  const whatsappForGroup = (group)=>{
    const phone = (group.whatsapp||'').replace(/[^0-9]/g,'')
    let txt = `Hola ${group.storeName} 👋 vi estos productos en TiendaNica Market (tiendanica.store) y quiero comprarlos:%0A%0A`
    group.items.forEach(it=>{ txt+=`• ${it.name} x${it.qty} - C$ ${it.price*it.qty}%0A` })
    txt+=`%0ATotal: C$ ${group.items.reduce((a,b)=>a+b.price*b.qty,0)}%0AEnvío a: [mi dirección]%0A`
    return `https://wa.me/${phone}?text=${txt}`
  }

  const directWhatsapp = (pr, q=1)=>{
    const phone = (pr._store.whatsapp||'').replace(/[^0-9]/g,'')
    const text = encodeURIComponent(`Hola ${pr._store.name} 👋 vi "${pr.name}" x${q} por C$ ${pr.price*q} en TiendaNica Market (tiendanica.store) y lo quiero comprar. Envío a: [mi dirección]`)
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
        .modal-bg{position:fixed; inset:0; background:rgba(0,0,0,0.55); backdrop-filter:blur(8px); z-index:50; display:flex; align-items:center; justify-content:center; padding:12px}
        .modal{max-width:900px; width:100%; background:#fff; border-radius:24px; overflow:hidden; max-height:90vh; overflow-y:auto}
      `}</style>

      {/* PORTADA VERSION A */}
      <div style={{
        background:'linear-gradient(135deg, #0A0A0A 0%, #0A0A0A 42%, #0A5C36 72%, #00C853 88%, #00E676 100%)',
        borderRadius:'0 0 24px 24px',
        position:'relative',
        overflow:'hidden'
      }}>
        <div style={{position:'absolute', top:-40, right:120, width:180, height:180, background:'rgba(0,230,118,0.18)', filter:'blur(30px)', borderRadius:'50%', pointerEvents:'none'}}></div>
        <div className="wrap" style={{padding:'14px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, minHeight:110, position:'relative', zIndex:1}}>
          <div style={{background:'#fff', borderRadius:16, padding:'10px 18px', boxShadow:'0 8px 24px rgba(0,0,0,0.22)', display:'flex', alignItems:'center', flexShrink:0}}>
            <img src="/tienda-nica-logo.png" alt="Tienda Nica" style={{height:40, objectFit:'contain'}}/>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <h1 className="hero-title">El mercado más <i>grande</i> de Nicaragua</h1>
            <div style={{display:'flex', alignItems:'center', gap:8, marginTop:6, flexWrap:'wrap'}}>
              <span style={{background:'#00E676', color:'#000', fontSize:9, fontWeight:900, padding:'4px 8px', borderRadius:999}}>● MERCADO NACIONAL</span>
              <span style={{fontSize:11, color:'#A8A29E', fontWeight:500}}>Boutique • Hogar • {stores.length} tiendas • {products.length} productos</span>
            </div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:8, flexShrink:0}} className="hide-mobile">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{padding:'10px 14px', borderRadius:999, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.12)', color:'#fff', fontSize:12, width:160, outline:'none'}}/>
            <button onClick={()=>setShowCart(true)} style={{background:'#fff', color:'#0A0A0A', padding:'10px 14px', borderRadius:999, fontWeight:900, fontSize:12, border:'none', cursor:'pointer', position:'relative'}}>🛒 {cartCount>0 && <span style={{position:'absolute', top:-6, right:-6, background:'#00E676', color:'#000', fontSize:10, width:18, height:18, borderRadius:999, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900}}>{cartCount}</span>}</button>
            <a href={solicitarTiendaLink} target="_blank" style={{background:'#0A0A0A', color:'#fff', padding:'10px 16px', borderRadius:999, fontWeight:900, fontSize:11, textDecoration:'none', border:'1px solid #333'}}>Vender →</a>
          </div>
        </div>
        <div className="wrap" style={{padding:'0 14px 12px', display:'none'}} id="mobile-search">
          <div style={{display:'flex', gap:8}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar vestido, jeans, licuadora..." className="input-base" style={{background:'rgba(255,255,255,0.92)'}}/>
            <button onClick={()=>setShowCart(true)} style={{background:'#fff', padding:'0 14px', borderRadius:999, border:'none', fontWeight:900, position:'relative'}}>🛒{cartCount>0 && <span style={{position:'absolute', top:-4, right:-4, background:'#00E676', color:'#000', fontSize:9, width:16, height:16, borderRadius:999, display:'flex', alignItems:'center', justifyContent:'center'}}>{cartCount}</span>}</button>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){ .hide-mobile{display:none !important} #mobile-search{display:block !important} .hero-title{font-size:18px} }`}</style>

      <div className="wrap">
        <div style={{display:'flex', gap:8, overflowX:'auto', marginTop:14, paddingBottom:4}}>
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
            <h2 style={{fontWeight:900, fontSize:14}}>{tipo==='boutique'?'Boutique nicaragüense premium': tipo==='general'?'Todo para tu hogar':'Todo el mercado'} <span style={{color:'#00E676'}}>• {filtered.length}</span></h2>
            <p style={{fontSize:11, color:'#9A9A9A', marginTop:4}}>Ahora puedes comprar desde el market sin salir • Carrito agrupado por tienda</p>
          </div>
          <button onClick={()=>setShowCart(true)} style={{background:'#00E676', color:'#000', border:'none', padding:'10px 16px', borderRadius:999, fontWeight:900, fontSize:11, cursor:'pointer'}}>🛒 Ver carrito ({cartCount})</button>
        </div>

        <div className="grid" style={{marginTop:14}}>
          {filtered.map(pr=>(
            <div key={pr.id} className="card-white" style={{padding:10, overflow:'hidden', cursor:'pointer'}} onClick={()=>{setSelected(pr); setQty(1)}}>
              <img src={pr.image_url} alt={pr.name} className="prod-img" loading="lazy"/>
              <div style={{padding:'8px 4px 2px'}}>
                <b style={{fontSize:12, lineHeight:1.2, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', color:'#0A0A0A', minHeight:28}}>{pr.name}</b>
                <div style={{display:'flex', alignItems:'center', gap:6, marginTop:6}}>
                  <img src={pr._store.logo_url||pr._store.cover_image} style={{width:18,height:18,borderRadius:999, objectFit:'cover', border:'1px solid #EAE6E1'}}/>
                  <span style={{fontSize:10, color:'#9A9590', fontWeight:600}}>{pr._store.name} • {pr.categoria}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8}}>
                  <b style={{fontSize:13, color:'#0A0A0A'}}>C$ {pr.price}</b>
                  <span style={{background:'#0A0A0A', color:'#fff', fontSize:10, fontWeight:800, padding:'7px 10px', borderRadius:999}}>Comprar</span>
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
      </div>

      {/* MODAL PRODUCTO */}
      {selected && (
        <div className="modal-bg" onClick={()=>setSelected(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr'}}>
              <div style={{padding:12}}><img src={selected.image_url} style={{width:'100%', borderRadius:16, aspectRatio:'1/1', objectFit:'cover'}}/></div>
              <div style={{padding:'20px 16px'}}>
                <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:10}}>
                  <img src={selected._store.logo_url||selected._store.cover_image} style={{width:28,height:28,borderRadius:999}}/>
                  <b style={{fontSize:12}}>{selected._store.name}</b>
                  <span style={{fontSize:10, background:'#F7F5F3', padding:'3px 8px', borderRadius:999}}>{selected.categoria}</span>
                </div>
                <h2 style={{fontSize:18, fontWeight:900, lineHeight:1.1, color:'#0A0A0A'}}>{selected.name}</h2>
                <p style={{fontSize:11, color:'#9A9590', marginTop:6}}>Compra desde el market • Se envía directo por la tienda</p>
                <b style={{fontSize:22, display:'block', marginTop:12}}>C$ {selected.price}</b>
                <div style={{display:'flex', alignItems:'center', gap:12, marginTop:14}}>
                  <span style={{fontSize:12, fontWeight:700}}>Cantidad:</span>
                  <div style={{display:'flex', gap:8, alignItems:'center', border:'1px solid #EAE6E1', borderRadius:999, padding:'4px 8px'}}>
                    <button onClick={()=>setQty(Math.max(1,qty-1))} style={{width:28,height:28,borderRadius:999,border:'1px solid #EAE6E1',background:'#fff',cursor:'pointer'}}>−</button>
                    <b style={{width:20,textAlign:'center'}}>{qty}</b>
                    <button onClick={()=>setQty(qty+1)} style={{width:28,height:28,borderRadius:999,border:'1px solid #EAE6E1',background:'#fff',cursor:'pointer'}}>+</button>
                  </div>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:8, marginTop:18}}>
                  <button onClick={()=>{addToCart(selected, qty); setSelected(null)}} style={{background:'#0A0A0A', color:'#fff', border:'none', padding:'14px', borderRadius:999, fontWeight:900, cursor:'pointer'}}>🛒 Agregar al carrito del market</button>
                  <a href={directWhatsapp(selected, qty)} target="_blank" style={{background:'#00E676', color:'#000', textAlign:'center', padding:'14px', borderRadius:999, fontWeight:900, textDecoration:'none'}}>Comprar ahora por WhatsApp</a>
                  <a href={`/${selected._store.slug}`} style={{textAlign:'center', fontSize:11, color:'#9A9590', textDecoration:'none', padding:6}}>Ver tienda completa →</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CARRITO */}
      {showCart && (
        <div className="modal-bg" onClick={()=>setShowCart(false)}>
          <div className="modal" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:18, borderBottom:'1px solid #EAE6E1', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h2 style={{fontWeight:900, fontSize:16}}>🛒 Tu carrito del market ({cartCount})</h2>
              <button onClick={()=>setShowCart(false)} style={{width:32,height:32,borderRadius:999,border:'1px solid #EAE6E1',background:'#fff',cursor:'pointer'}}>✕</button>
            </div>
            <div style={{padding:12, maxHeight:'60vh', overflowY:'auto'}}>
              {cart.length===0 ? <p style={{textAlign:'center', color:'#9A9590', padding:40, fontSize:13}}>Tu carrito está vacío. Agrega productos desde el market.</p> :
                groupedByStore.map(group=>(
                  <div key={group.storeName} style={{background:'#FBF9F7', border:'1px solid #EAE6E1', borderRadius:16, padding:12, marginBottom:12}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
                      <b style={{fontSize:13}}>📦 {group.storeName}</b>
                      <span style={{fontSize:10, color:'#9A9590'}}>{group.items.length} productos</span>
                    </div>
                    {group.items.map(it=>(
                      <div key={it.id} style={{display:'flex', gap:10, alignItems:'center', background:'#fff', padding:8, borderRadius:12, marginBottom:8, border:'1px solid #EAE6E1'}}>
                        <img src={it.image} style={{width:48,height:48,borderRadius:10, objectFit:'cover'}}/>
                        <div style={{flex:1}}>
                          <b style={{fontSize:11, display:'block'}}>{it.name}</b>
                          <span style={{fontSize:11}}>C$ {it.price} x {it.qty} = C$ {it.price*it.qty}</span>
                        </div>
                        <div style={{display:'flex', flexDirection:'column', gap:4, alignItems:'center'}}>
                          <div style={{display:'flex', gap:4}}>
                            <button onClick={()=>updateQty(it.id,-1)} style={{width:22,height:22,borderRadius:999,border:'1px solid #EAE6E1',background:'#fff'}}>−</button>
                            <button onClick={()=>updateQty(it.id,1)} style={{width:22,height:22,borderRadius:999,border:'1px solid #EAE6E1',background:'#fff'}}>+</button>
                          </div>
                          <button onClick={()=>removeFromCart(it.id)} style={{fontSize:10, color:'#ff5555', background:'none', border:'none', cursor:'pointer'}}>Quitar</button>
                        </div>
                      </div>
                    ))}
                    <a href={whatsappForGroup(group)} target="_blank" style={{display:'block', background:'#00E676', color:'#000', textAlign:'center', padding:'12px', borderRadius:999, fontWeight:900, fontSize:12, textDecoration:'none', marginTop:8}}>Pedir a {group.storeName} por WhatsApp → C$ {group.items.reduce((a,b)=>a+b.price*b.qty,0)}</a>
                  </div>
                ))
              }
            </div>
            {cart.length>0 && (
              <div style={{padding:14, borderTop:'1px solid #EAE6E1', background:'#fff'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:12}}><b>Total market:</b><b>C$ {cartTotal}</b></div>
                <div style={{display:'flex', gap:8}}>
                  <button onClick={()=>setCart([])} style={{flex:1, background:'#fff', border:'1px solid #EAE6E1', padding:'12px', borderRadius:999, fontWeight:700, cursor:'pointer'}}>Vaciar</button>
                  <button onClick={()=>setShowCart(false)} style={{flex:1, background:'#0A0A0A', color:'#fff', border:'none', padding:'12px', borderRadius:999, fontWeight:900, cursor:'pointer'}}>Seguir comprando</button>
                </div>
                <p style={{fontSize:10, color:'#9A9590', textAlign:'center', marginTop:8}}>Se genera un mensaje de WhatsApp por cada tienda. Cada dueño te responde directo.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTON FLOTANTE CARRITO MOBILE */}
      {cartCount>0 && !showCart && !selected && (
        <button onClick={()=>setShowCart(true)} style={{position:'fixed', bottom:16, right:16, background:'#0A0A0A', color:'#fff', border:'none', padding:'14px 20px', borderRadius:999, fontWeight:900, boxShadow:'0 8px 24px rgba(0,0,0,0.3)', zIndex:40, cursor:'pointer', display:'flex', gap:8, alignItems:'center'}}>
          🛒 {cartCount} • C$ {cartTotal}
        </button>
      )}
    </main>
  )
}
