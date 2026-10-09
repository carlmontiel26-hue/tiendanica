'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key) return null
  return createClient(url,key)
}

const CATS = {
  boutique: ['all','vestidos','blusas','jeans','faldas','conjuntos','shorts','accesorios','zapatos','carteras','nuevo','oferta'],
  comida: ['all','entradas','platos fuertes','pizzas','hamburguesas','pollo','mariscos','bebidas','postres','combos','ofertas'],
  general: ['all','hogar','tecnologia','belleza','juguetes','ferreteria','salud','deportes','libros','otros','oferta','nuevo']
}

export default function TiendaNicaMarket(){
  const [stores,setStores]=useState([])
  const [products,setProducts]=useState([])
  const [tipo,setTipo]=useState('boutique')
  const [cat,setCat]=useState('all')
  const [search,setSearch]=useState('')
  const [loading,setLoading]=useState(true)

  useEffect(()=>{ load() },[])

  const load=async()=>{
    const supabase=getSupabase()
    if(!supabase) { setLoading(false); return }
    const {data: s}=await supabase.from('stores').select('*').order('created_at',{ascending:false})
    const {data: p}=await supabase.from('products').select('*').eq('is_active',true).order('created_at',{ascending:false})
    // join store info
    const storeMap={}
    s?.forEach(st=>storeMap[st.id]=st)
    const enriched = (p||[]).map(prod=>({ ...prod, _store: storeMap[prod.store_id] })).filter(x=>x._store)
    setStores(s||[])
    setProducts(enriched)
    setLoading(false)
  }

  const filtered = products.filter(pr=>{
    const st = pr._store
    if(!st) return false
    if(tipo!=='all' && (st.tipo_tienda||'boutique')!==tipo) return false
    if(cat!=='all' && pr.categoria!==cat) return false
    if(search && !pr.name.toLowerCase().includes(search.toLowerCase()) && !st.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const whatsappLink=(pr)=>{
    const st = pr._store
    const phone = (st.whatsapp||'').replace(/[^0-9]/g,'')
    const text = encodeURIComponent(`Hola ${st.name} 👋 vi tu producto "${pr.name}" por C$ ${pr.price} en TiendaNica Market (tiendanica.store) y quiero comprarlo. ¿Está disponible?`)
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
        {/* HEADER */}
        <header style={{padding:'16px 0 12px', display:'flex', flexDirection:'column', gap:12}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
            <img src="/tienda-nica-logo.png" alt="Tienda Nica" style={{height:42, objectFit:'contain'}} onError={(e)=>{e.target.style.display='none'; e.target.nextElementSibling.style.display='flex'}}/>
            <div style={{display:'none', alignItems:'center', gap:8, fontWeight:900, fontSize:22, letterSpacing:'-0.8px'}}><span style={{fontSize:28}}>👜</span>Tienda<span style={{color:'#00D084'}}>Nica</span></div>
            <div style={{fontSize:11, color:'#9A9590', fontWeight:600, background:'#fff', border:'1px solid #EAE6E1', padding:'6px 10px', borderRadius:999}}>{stores.length} tiendas • {products.length} productos</div>
          </div>

          <div style={{display:'flex', gap:8}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar vestido, pizza, licuadora..." className="input-base"/>
            <a href={solicitarTiendaLink} target="_blank" style={{background:'#0A0A0A', color:'#fff', padding:'0 18px', borderRadius:999, fontWeight:800, fontSize:12, display:'flex', alignItems:'center', textDecoration:'none', whiteSpace:'nowrap'}}>Vender</a>
          </div>
        </header>

        {/* CATEGORIAS PRINCIPALES */}
        <div style={{display:'flex', gap:8, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none'}}>
          <button onClick={()=>{setTipo('boutique'); setCat('all')}} className={`pill ${tipo==='boutique'?'active':''}`}>👗 Boutique</button>
          <button onClick={()=>{setTipo('comida'); setCat('all')}} className={`pill ${tipo==='comida'?'active':''}`}>🍔 Comida</button>
          <button onClick={()=>{setTipo('general'); setCat('all')}} className={`pill ${tipo==='general'?'active':''}`}>🛍️ General / Todo</button>
          <button onClick={()=>{setTipo('all'); setCat('all')}} className={`pill ${tipo==='all'?'active':''}`}>✨ Todo</button>
        </div>

        {/* SUBCATEGORIAS */}
        <div style={{display:'flex', gap:6, overflowX:'auto', marginTop:10, paddingBottom:6}}>
          {(CATS[tipo]||CATS.boutique).map(c=>(
            <button key={c} onClick={()=>setCat(c)} className={`pill-sub ${cat===c?'active':''}`}>{c}</button>
          ))}
        </div>

        {/* HERO */}
        <div className="card-white" style={{marginTop:14, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', background:'#0A0A0A', color:'#fff', borderColor:'#0A0A0A'}}>
          <div>
            <h2 style={{fontWeight:900, fontSize:18, letterSpacing:'-0.5px', lineHeight:1.1}}>{tipo==='boutique'?'Boutique nicaragüense premium': tipo==='comida'?'Restaurantes y comidas a domicilio':'Todo para tu hogar'} <span style={{color:'#00E676'}}>•</span></h2>
            <p style={{fontSize:11, color:'#9A9A9A', marginTop:4, fontWeight:500}}>{tipo==='boutique'?'Lo más vendido de tus tiendas favoritas. Compra directo por WhatsApp al dueño.': tipo==='comida'?'Pide directo a la cocina de cada restaurante sin intermediarios.':'Electrodomésticos, belleza, juguetes y más. Todo en un solo lugar.'}</p>
          </div>
          <div style={{fontSize:24, background:'#1A1A1A', width:48, height:48, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #2A2A2A'}}>{tipo==='boutique'?'👗':tipo==='comida'?'🍔':'🛍️'}</div>
        </div>

        {/* PRODUCTOS */}
        {loading? <div style={{padding:40, textAlign:'center', color:'#9A9590'}}>Cargando mercado...</div> : (
          <div className="grid" style={{marginTop:14}}>
            {filtered.map(pr=>(
              <div key={pr.id} className="card-white" style={{padding:10, overflow:'hidden'}}>
                <a href={`/${pr._store.slug}`} style={{textDecoration:'none', color:'inherit'}}>
                  <img src={pr.image_url} className="prod-img"/>
                </a>
                <div style={{padding:'8px 4px 2px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', gap:6}}>
                    <b style={{fontSize:12, lineHeight:1.2, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', color:'#0A0A0A', minHeight:28}}>{pr.name}</b>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:6, marginTop:6}}>
                    <img src={pr._store.logo_url||pr._store.cover_image} style={{width:18,height:18,borderRadius:999, objectFit:'cover', border:'1px solid #EAE6E1'}}/>
                    <span style={{fontSize:10, color:'#9A9590', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{pr._store.name} • {pr.categoria}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8}}>
                    <b style={{fontSize:13, color:'#0A0A0A'}}>C$ {pr.price}</b>
                    <a href={whatsappLink(pr)} target="_blank" style={{background:'#00E676', color:'#000', fontSize:10, fontWeight:800, padding:'7px 10px', borderRadius:999, textDecoration:'none', display:'flex', alignItems:'center', gap:4}}>WhatsApp</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length===0 && !loading && (
          <div className="card-white" style={{marginTop:14, padding:24, textAlign:'center'}}>
            <p style={{fontSize:13, fontWeight:700}}>Aún no hay productos en {tipo}</p>
            <p style={{fontSize:11, color:'#9A9590', marginTop:4}}>Cuando tus tiendas añadan productos aparecerán aquí automáticamente</p>
          </div>
        )}

        {/* TIENDAS */}
        <div style={{marginTop:24}}>
          <h3 style={{fontWeight:900, fontSize:14, color:'#0A0A0A'}}>🛍️ Tiendas del mercado</h3>
          <div style={{display:'flex', gap:10, overflowX:'auto', marginTop:10, paddingBottom:10}}>
            {stores.map(s=>(
              <a key={s.id} href={`/${s.slug}`} style={{background:'#fff', border:'1px solid #EAE6E1', borderRadius:16, padding:10, minWidth:140, textDecoration:'none', color:'#0A0A0A', display:'flex', gap:8, alignItems:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.04)'}}>
                <img src={s.logo_url||s.cover_image} style={{width:36,height:36,borderRadius:10, objectFit:'cover'}}/>
                <div><b style={{fontSize:11, display:'block'}}>{s.name}</b><span style={{fontSize:9, color:'#9A9590'}}>{s.tipo_tienda||'boutique'} • {products.filter(p=>p._store?.id===s.id).length} prod</span></div>
              </a>
            ))}
          </div>
        </div>

        {/* ANUNCIO DISCRETO SOLICITAR TIENDA - TU NUMERO */}
        <div style={{marginTop:28, marginBottom:24}}>
          <div style={{background:'#FFFFFF', border:'1px dashed #0A0A0A', borderRadius:20, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
            <div style={{flex:1}}>
              <b style={{fontSize:12, color:'#0A0A0A'}}>¿Tienes una tienda en Nicaragua?</b>
              <p style={{fontSize:11, color:'#9A9590', marginTop:2, lineHeight:1.3}}>Únete a TiendaNica Market. Te creamos tu tienda premium con tu propio WhatsApp y vendes en el mercado y por tu link.</p>
            </div>
            <a href={solicitarTiendaLink} target="_blank" style={{background:'#0A0A0A', color:'#fff', padding:'10px 16px', borderRadius:999, fontWeight:800, fontSize:11, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0}}>Solicitar tienda →</a>
          </div>
          <p style={{fontSize:9, color:'#B0ABA5', textAlign:'center', marginTop:8}}>Mercado 100% nicaragüense • Compras directas por WhatsApp al dueño • Sin comisiones</p>
        </div>
      </div>
    </main>
  )
}
