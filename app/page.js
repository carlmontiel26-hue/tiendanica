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
    const text = encodeURIComponent(`Hola ${st.name} 👋 vi "${pr.name}" por C$ ${pr.price} en tiendanica.store y lo quiero. ¿Disponible?`)
    return `https://wa.me/${phone}?text=${text}`
  }

  const solicitarTiendaLink = `https://wa.me/50581732620?text=${encodeURIComponent('Hola TiendaNica, quiero mi tienda online en 5 min. Mi nombre es: ')}`

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
        .skeleton{ background:linear-gradient(90deg, #EEE 25%, #F5F5F5 50%, #EEE 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
        @keyframes shimmer{ 0%{background-position:200% 0} 100%{background-position:-200% 0} }
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
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Busca por tienda o producto" className="input-base"/>
            <a href={solicitarTiendaLink} target="_blank" style={{background:'#0A0A0A', color:'#fff', padding:'0 18px', borderRadius:999, fontWeight:800, fontSize:12, display:'flex', alignItems:'center', textDecoration:'none', whiteSpace:'nowrap'}}>Vender</a>
          </div>
        </header>

        {/* NUEVO - BARRA COMPACTA ARRIBA con colores de tu logo (blanco + verde) */}
        <div style={{background:'#fff', border:'1px solid #E6F4EA', borderLeft:'4px solid #00D084', borderRadius:14, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:14}}>
          <div style={{display:'flex', alignItems:'center', gap:10, flex:1}}>
            <div style={{background:'#E6F4EA', color:'#00A86B', width:32, height:32, borderRadius:999, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900}}>0%</div>
            <div style={{lineHeight:1.2}}>
              <b style={{fontSize:12, color:'#0A0A0A'}}>Tu tienda online en 5 min • Sin comisiones</b>
              <p style={{fontSize:10, color:'#6B6B6B', marginTop:1}}>Tu cliente en tu WhatsApp • Link: tiendanica.store/tu-tienda</p>
            </div>
          </div>
          <a href={solicitarTiendaLink} target="_blank" style={{background:'#0A0A0A', color:'#fff', padding:'8px 14px', borderRadius:999, fontWeight:800, fontSize:11, textDecoration:'none', whiteSpace:'nowrap'}}>Crear gratis →</a>
        </div>

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

        {/* PRODUCTOS - AHORA ARRIBA, PRIORIDAD */}
        {loading? (
          <div className="grid" style={{marginTop:14}}>
            {Array.from({length:8}).map((_,i)=>(
              <div key={i} className="card-white" style={{padding:10}}>
                <div className="skeleton" style={{aspectRatio:'1/1', borderRadius:14}}/>
                <div className="skeleton" style={{height:12, borderRadius:6, marginTop:10, width:'80%'}}/>
                <div className="skeleton" style={{height:10, borderRadius:6, marginTop:8, width:'60%'}}/>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid" style={{marginTop:14}}>
            {filtered.map(pr=>(
              <div key={pr.id} className="card-white" style={{padding:10, overflow:'hidden'}}>
                <a href={`/${pr._store.slug}`} style={{textDecoration:'none', color:'inherit'}}>
                  <img src={pr.image_url} className="prod-img" loading="lazy"/>
                </a>
                <div style={{padding:'8px 4px 2px'}}>
                  <b style={{fontSize:12, lineHeight:1.2, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', color:'#0A0A0A', minHeight:28}}>{pr.name}</b>
                  <div style={{display:'flex', alignItems:'center', gap:6, marginTop:6}}>
                    <img src={pr._store.logo_url||pr._store.cover_image} style={{width:18,height:18,borderRadius:999, objectFit:'cover', border:'1px solid #EAE6E1'}}/>
                    <span style={{fontSize:10, color:'#9A9590', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{pr._store.name}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8}}>
                    <b style={{fontSize:13, color:'#0A0A0A'}}>C$ {pr.price}</b>
                    <a href={whatsappLink(pr)} target="_blank" style={{background:'#00D084', color:'#fff', fontSize:10, fontWeight:800, padding:'7px 10px', borderRadius:999, textDecoration:'none'}}>Hablar con la dueña</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HERO GRANDE AHORA ABAJO - con colores logo (blanco + verde) */}
        <div className="card-white" style={{marginTop:28, padding:20, background:'#fff', border:'1px solid #E6F4EA', position:'relative', overflow:'hidden'}}>
          <div style={{position:'absolute', top:-30, right:-30, width:120, height:120, background:'#E6F4EA', borderRadius:'50%'}}/>
          <div style={{position:'absolute', bottom:-20, left:-20, width:80, height:80, background:'#F0F9F2', borderRadius:'50%'}}/>
          <div style={{position:'relative', maxWidth:600}}>
            <div style={{display:'inline-flex', background:'#E6F4EA', border:'1px solid #C8EACF', padding:'4px 10px', borderRadius:999, fontSize:10, fontWeight:800, color:'#00A86B', marginBottom:10}}>0% COMISIÓN • 100% TUYO • SIN INTERMEDIARIOS</div>
            <h2 style={{fontWeight:900, fontSize:22, lineHeight:1.1, letterSpacing:'-0.8px', color:'#0A0A0A'}}>¿Tienes una tienda<br/>en Nicaragua?<br/><span style={{color:'#00D084'}}>Vende hoy mismo.</span></h2>
            <p style={{fontSize:12, color:'#6B6B6B', marginTop:8, lineHeight:1.5}}>Te creamos tu boutique online en 5 minutos. Sin comisiones. Tus clientes te escriben directo a tu WhatsApp. Tu link propio: <b style={{color:'#0A0A0A'}}>tiendanica.store/tu-tienda</b></p>
            <div style={{display:'flex', gap:8, marginTop:14, flexWrap:'wrap'}}>
              <a href={solicitarTiendaLink} target="_blank" style={{background:'#0A0A0A', color:'#fff', padding:'12px 20px', borderRadius:999, fontWeight:900, fontSize:13, textDecoration:'none'}}>Crea tu tienda gratis →</a>
              <span style={{display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#9A9590'}}><span style={{width:6,height:6,background:'#00D084',borderRadius:999,display:'inline-block'}}></span> Activa hoy • Sin costo inicial</span>
            </div>
            <div style={{display:'flex', gap:8, marginTop:16, flexWrap:'wrap'}}>
              <span style={{background:'#F7F5F3', border:'1px solid #EAE6E1', padding:'7px 11px', borderRadius:999, fontSize:11, fontWeight:600}}>🚫 Sin comisiones por venta</span>
              <span style={{background:'#F7F5F3', border:'1px solid #EAE6E1', padding:'7px 11px', borderRadius:999, fontSize:11, fontWeight:600}}>💬 Vendes por tu WhatsApp</span>
              <span style={{background:'#F7F5F3', border:'1px solid #EAE6E1', padding:'7px 11px', borderRadius:999, fontSize:11, fontWeight:600}}>🔗 Link propio premium</span>
            </div>
          </div>
        </div>

        {/* TIENDAS */}
        <div style={{marginTop:20, marginBottom:24}}>
          <h3 style={{fontWeight:900, fontSize:13, color:'#0A0A0A'}}>🛍️ Tiendas del mercado</h3>
          <div style={{display:'flex', gap:10, overflowX:'auto', marginTop:10, paddingBottom:10}}>
            {stores.map(s=>(
              <a key={s.id} href={`/${s.slug}`} style={{background:'#fff', border:'1px solid #EAE6E1', borderRadius:16, padding:10, minWidth:140, textDecoration:'none', color:'#0A0A0A', display:'flex', gap:8, alignItems:'center'}}>
                <img src={s.logo_url||s.cover_image} style={{width:36,height:36,borderRadius:10, objectFit:'cover'}}/>
                <div><b style={{fontSize:11, display:'block'}}>{s.name}</b><span style={{fontSize:9, color:'#9A9590'}}>{products.filter(p=>p._store?.id===s.id).length} prod</span></div>
              </a>
            ))}
          </div>
          <p style={{fontSize:9, color:'#B0ABA5', textAlign:'center', marginTop:12}}>Mercado 100% nicaragüense • Compras directas por WhatsApp al dueño • Sin comisiones</p>
        </div>
      </div>
    </main>
  )
}
