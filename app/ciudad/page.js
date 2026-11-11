'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key||!url.startsWith('http')) return null
  return createClient(url,key)
}
function getOptimizedImage(url, width=300){
  if(!url) return '/tienda-nica-logo.png'
  if(url.includes('supabase.co')){
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}width=${width}&quality=75`
  }
  return url
}

export default function CiudadPage(){
  const [stores,setStores]=useState([])
  const [productsByStore,setProductsByStore]=useState({})
  const [loading,setLoading]=useState(true)
  const [selectedStore,setSelectedStore]=useState(null)
  const [storeProducts,setStoreProducts]=useState([])
  const [productsLoading,setProductsLoading]=useState(false)

  useEffect(()=>{
    const supabase=getSupabase()
    if(!supabase){ setLoading(false); return }
    supabase.from('stores').select('*').order('created_at',{ascending:true}).then(async ({data:storesData})=>{
      if(!storesData){ setLoading(false); return }
      setStores(storesData)
      // Traer productos reales de todas las tiendas para escaparates
      const ids = storesData.map(s=>s.id)
      const {data:prods} = await supabase.from('products').select('id,store_id,name,image_url,price,categoria').in('store_id', ids).eq('is_active', true).order('created_at',{ascending:false}).limit(200)
      const grouped = {}
      prods?.forEach(p=>{
        if(!grouped[p.store_id]) grouped[p.store_id]=[]
        if(grouped[p.store_id].length<6) grouped[p.store_id].push(p)
      })
      setProductsByStore(grouped)
      setLoading(false)
    })
  },[])

  const openStore = async (store)=>{
    setSelectedStore(store)
    setProductsLoading(true)
    const supabase=getSupabase()
    if(!supabase){ setProductsLoading(false); return }
    const {data} = await supabase.from('products').select('*').eq('store_id', store.id).eq('is_active', true).order('created_at',{ascending:false}).limit(20)
    setStoreProducts(data||[])
    setProductsLoading(false)
  }

  if(loading) return <div style={{minHeight:'100vh', background:'#E6F2FF', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800}}>Construyendo escaparates reales...</div>

  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(180deg, #87B9E8 0%, #C5E1F7 20%, #E8F0F5 50%, #E5DDD3 100%)', fontFamily:'Inter, system-ui'}}>
      <style>{`
        .street-container{ display:flex; gap:0; overflow-x:auto; padding:30px 20px 0; align-items:flex-end; min-height:78vh; scroll-snap-type:x mandatory; scrollbar-width:thin; }
        .real-building{ min-width:380px; max-width:400px; scroll-snap-align:start; flex-shrink:0; position:relative; transition:transform 0.25s ease; cursor:pointer; margin-right:4px; }
        .real-building:hover{ transform:translateY(-10px) scale(1.02); z-index:5; }
        .building-top{ height:28px; background:linear-gradient(180deg, #8B7355, #6B5A43); border-radius:4px 4px 0 0; border-bottom:3px solid #4A3D2F; display:flex; align-items:center; justify-content:center; gap:6px; }
        .building-top-dot{ width:6px; height:6px; border-radius:999px; background:rgba(255,255,255,0.3); }
        .facade-real{ background:#F9F6F0; box-shadow:0 0 0 4px #2C2418, 0 18px 40px rgba(0,0,0,0.25); position:relative; }
        .awning{ height:36px; background:repeating-linear-gradient(90deg, #FF3B30 0px, #FF3B30 18px, #FFF 18px, #FFF 36px); border-bottom:3px solid #2C2418; display:flex; align-items:center; justifyContent:center; position:relative; }
        .awning::after{ content:''; position:absolute; bottom:-12px; left:0; right:0; height:12px; background:repeating-linear-gradient(90deg, #FF3B30 0px, #FF3B30 18px, #FFF 18px, #FFF 36px); clip-path:polygon(0 0, 10% 100%, 20% 0, 30% 100%, 40% 0, 50% 100%, 60% 0, 70% 100%, 80% 0, 90% 100%, 100% 0); }
        .shop-sign-real{ background:#111; color:#F5F1E8; padding:10px 14px; display:flex; justifyContent:space-between; alignItems:center; border-bottom:3px solid #FF8A00; }
        .storefront{ display:flex; height:340px; background:#1A1A1A; position:relative; overflow:hidden; }
        .window-glass{ flex:2.2; background:#fff; position:relative; display:flex; flexDirection:column; border-right:4px solid #2C2418; }
        .window-top-light{ height:22px; background:linear-gradient(90deg, #FFFDE7, #FFF9C4); display:flex; alignItems:center; justifyContent:space-around; borderBottom:2px solid #E8E0B0; }
        .bulb{ width:8px; height:8px; border-radius:999px; background:#FFD600; box-shadow:0 0 6px #FFD600; }
        .products-inside{ flex:1; background:linear-gradient(180deg, #FFFEFA 0%, #F7F2E8 100%); display:grid; gridTemplateColumns:repeat(3,1fr); gap:6px; padding:8px; position:relative; }
        .products-inside::before{ content:''; position:absolute; inset:0; background:linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 45%, transparent 55%); pointer-events:none; z-index:2; }
        .product-in-window{ background:#fff; border:1px solid #EEE8E0; borderRadius:8px; overflow:hidden; display:flex; flexDirection:column; boxShadow:0 2px 6px rgba(0,0,0,0.08); }
        .product-in-window img{ width:100%; height:70px; objectFit:contain; background:#fff; }
        .product-in-window p{ fontSize:7px; fontWeight:800; padding:2px 4px; whiteSpace:nowrap; overflow:hidden; textOverflow:ellipsis; }
        .product-in-window b{ fontSize:8px; padding:0 4px 3px; color:#111; }
        .door-glass{ flex:0.9; background:linear-gradient(180deg, #2A2A2A 0%, #111 100%); display:flex; flexDirection:column; alignItems:center; justifyContent:flex-end; padding:8px 6px; position:relative; borderLeft:2px solid #3A3A3A; }
        .door-handle{ width:14px; height:14px; borderRadius:999px; background:linear-gradient(180deg, #FFD700, #B8860B); border:2px solid #8B6914; position:absolute; right:8px; top:50%; boxShadow:0 2px 4px rgba(0,0,0,0.5); }
        .door-sign{ background:#FF3B30; color:#fff; fontSize:7px; fontWeight:900; padding:3px 6px; borderRadius:4px; marginBottom:6px; }
        .mannequin-area{ width:100%; flex:1; display:flex; alignItems:flex-end; justifyContent:center; paddingBottom:20px; }
        .sidewalk-real{ height:72px; background:linear-gradient(180deg, #D4C4A8 0%, #B8A68A 100%); border-top:4px solid #2C2418; display:flex; alignItems:center; justifyContent:space-between; padding:0 12px; boxShadow:inset 0 4px 10px rgba(0,0,0,0.15); }
        .street-light{ position:absolute; top:-40px; right:10px; width:4px; height:40px; background:#2C2418; }
        .street-light::before{ content:''; position:absolute; top:-10px; left:-8px; width:20px; height:14px; background:#FFD600; borderRadius:6px; boxShadow:0 0 12px #FFD600; }
        @media(max-width:768px){ .real-building{minWidth:320px} .storefront{height:300px} }
      `}</style>

      <div style={{background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', padding:'12px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'3px solid #FF6A00', position:'sticky', top:0, zIndex:20}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <button onClick={()=>window.location.href='/'} style={{background:'#111', color:'#fff', border:'none', padding:'8px 16px', borderRadius:999, fontWeight:900, fontSize:13}}>← Market</button>
          <h1 style={{fontWeight:900, fontSize:15, letterSpacing:-0.3}}>🏙️ Ciudad de Tiendas • {stores.length} locales reales</h1>
        </div>
        <span style={{fontSize:11, fontWeight:700, color:'#666', background:'#FFF3E0', padding:'6px 12px', borderRadius:999, border:'1px solid #FFB84D'}}>🪟 Escaparates con productos reales</span>
      </div>

      <div style={{textAlign:'center', padding:'12px 16px 0'}}>
        <p style={{fontSize:12, fontWeight:800, color:'#5A4A3A', background:'rgba(255,255,255,0.9)', display:'inline-block', padding:'8px 16px', borderRadius:999, boxShadow:'0 2px 10px rgba(0,0,0,0.08)'}}>👀 Mira dentro de cada tienda • Productos reales detrás del cristal • Toca la puerta para entrar</p>
      </div>

      <div className="street-container">
        {stores.map((store, idx)=>{
          const prods = productsByStore[store.id] || []
          const isBoutique = (store.tipo_tienda||'').toLowerCase().includes('boutique')
          const isComida = (store.tipo_tienda||'').toLowerCase().includes('comida')
          const isGeneral = (store.tipo_tienda||'').toLowerCase().includes('general') || (store.tipo_tienda||'').toLowerCase().includes('farmacia') || (store.tipo_tienda||'').toLowerCase().includes('ferreteria')
          const awningColor = isBoutique ? 'repeating-linear-gradient(90deg, #111 0px, #111 18px, #FFD600 18px, #FFD600 36px)' : isComida ? 'repeating-linear-gradient(90deg, #FF3B30 0px, #FF3B30 18px, #FFF 18px, #FFF 36px)' : 'repeating-linear-gradient(90deg, #0066FF 0px, #0066FF 18px, #FFF 18px, #FFF 36px)'
          return (
            <div key={store.id} className="real-building" onClick={()=>openStore(store)}>
              <div className="street-light"/>
              <div className="building-top">
                <div className="building-top-dot"/><div className="building-top-dot"/><div className="building-top-dot"/>
                <span style={{fontSize:8, color:'rgba(255,255,255,0.5)', marginLeft:8, fontWeight:800}}>{store.municipio || 'NICARAGUA'} • #{idx+1}</span>
              </div>
              <div className="facade-real">
                <div className="awning" style={{background: awningColor}}><span style={{background:'#111', color:'#fff', fontSize:9, fontWeight:900, padding:'2px 8px', borderRadius:4, letterSpacing:1}}>{isBoutique ? 'MODA' : isComida ? 'COMIDA' : 'TIENDA'} • ABIERTO</span></div>
                <div className="shop-sign-real">
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <img src={getOptimizedImage(store.logo_url, 80)} style={{width:28, height:28, borderRadius:6, objectFit:'cover', background:'#fff'}}/>
                    <div>
                      <p style={{fontSize:13, fontWeight:900, lineHeight:1}}>{store.name}</p>
                      <p style={{fontSize:8, opacity:0.6, fontWeight:700}}>{store.tipo_tienda?.toUpperCase()} • {store.municipio}</p>
                    </div>
                  </div>
                  <span style={{background: store.verification_status?.includes('premium') ? '#FFD600' : '#25D366', color: store.verification_status?.includes('premium') ? '#111' : '#fff', fontSize:8, fontWeight:900, padding:'4px 8px', borderRadius:999}}>{store.verification_status?.includes('premium') ? '★ PREMIUM' : '✓ VERIFICADA'}</span>
                </div>

                <div className="storefront">
                  <div className="window-glass">
                    <div className="window-top-light"><div className="bulb"/><div className="bulb"/><div className="bulb"/><div className="bulb"/><span style={{fontSize:7, fontWeight:900, color:'#8B7355'}}>ESCAPARATE</span><div className="bulb"/><div className="bulb"/><div className="bulb"/><div className="bulb"/></div>
                    <div className="products-inside">
                      {prods.length>0 ? prods.slice(0,6).map(p=>(
                        <div key={p.id} className="product-in-window">
                          <img src={getOptimizedImage(p.image_url, 200)} alt={p.name}/>
                          <p>{p.name.slice(0,18)}</p>
                          <b>C$ {p.price}</b>
                        </div>
                      )) : (
                        <>
                          <div className="product-in-window" style={{background:'#FFF8E8', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:2}}><span style={{fontSize:18}}>{isBoutique ? '👗' : isComida ? '🍔' : '📦'}</span><p style={{fontSize:6}}>Pronto</p></div>
                          <div className="product-in-window" style={{background:'#FFF8E8'}}><img src={getOptimizedImage(store.logo_url, 200)}/><p>{store.name}</p><b>Nuevo</b></div>
                          <div className="product-in-window" style={{background:'#FFF8E8'}}><img src={getOptimizedImage(store.logo_url, 200)}/><p>Abierto</p><b>Hoy</b></div>
                        </>
                      )}
                    </div>
                    <div style={{height:24, background:'#2C2418', color:'#F5F1E8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:900, letterSpacing:0.5}}>👉 TOCA EL CRISTAL • {prods.length} PRODUCTOS REALES DENTRO</div>
                  </div>
                  <div className="door-glass">
                    <div className="mannequin-area">
                      {isBoutique ? <span style={{fontSize:42, filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'}}>👗</span> : isComida ? <span style={{fontSize:42}}>👨‍🍳</span> : <span style={{fontSize:36}}>🏪</span>}
                    </div>
                    <div className="door-handle"/>
                    <div className="door-sign">PUERTA ABIERTA</div>
                    <div style={{width:'90%', height:36, background:'#111', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #333'}}>
                      <span style={{color:'#FF6A00', fontSize:9, fontWeight:900}}>ENTRAR →</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sidewalk-real">
                <div style={{display:'flex', alignItems:'center', gap:6}}>
                  <span style={{fontSize:10, background:'#2C2418', color:'#D4C4A8', padding:'3px 8px', borderRadius:4, fontWeight:800}}>{store.slug}</span>
                  <span style={{fontSize:9, fontWeight:700, color:'#5A4A3A'}}>{prods.length} productos</span>
                </div>
                <div style={{display:'flex', gap:4}}>
                  <div style={{width:12, height:4, background:'#8B7355', borderRadius:2}}/><div style={{width:12, height:4, background:'#8B7355', borderRadius:2}}/>
                </div>
              </div>
            </div>
          )
        })}
        <div className="real-building" style={{opacity:0.7, minWidth:280}}>
          <div className="building-top" style={{background:'#8B8B8B'}}><span style={{fontSize:9, color:'#fff', fontWeight:900}}>EN CONSTRUCCIÓN</span></div>
          <div className="facade-real" style={{height:380, background:'#E8E0D0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, border:'3px dashed #FF6A00'}}>
            <span style={{fontSize:48}}>🏗️</span>
            <p style={{fontWeight:900, fontSize:14}}>¿Tu tienda aquí?</p>
            <p style={{fontSize:11, color:'#666', textAlign:'center', padding:'0 20px'}}>Tu edificio con escaparate real en la calle más visitada de Nicaragua</p>
            <button onClick={()=>window.open('https://wa.me/50581732620?text=Quiero%20mi%20edificio%20en%20Ciudad%20de%20Tiendas','_blank')} style={{background:'#111', color:'#fff', border:'none', padding:'10px 18px', borderRadius:999, fontWeight:900, fontSize:11}}>Quiero mi local →</button>
          </div>
          <div className="sidewalk-real"><span style={{fontSize:10, fontWeight:800}}>LOTE DISPONIBLE</span></div>
        </div>
      </div>

      <div style={{textAlign:'center', padding:'18px 16px 40px'}}>
        <p style={{fontSize:11, color:'#6B5A43', background:'#fff', display:'inline-block', padding:'8px 16px', borderRadius:999, boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>← Desliza la calle europea → • Toca escaparate para ver productos • Toca puerta para entrar • 100% tiendas reales de Nicaragua</p>
      </div>

      {selectedStore && (
        <div style={{position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(10px)', display:'flex', alignItems:'flex-end', justifyContent:'center'}} onClick={()=>setSelectedStore(null)}>
          <div style={{background:'#fff', width:'100%', maxWidth:620, borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'88vh', display:'flex', flexDirection:'column', boxShadow:'0 -10px 40px rgba(0,0,0,0.4)'}} onClick={e=>e.stopPropagation()}>
            <div style={{height:6, background:'linear-gradient(90deg, #FF8A00, #FF3B30, #8B5CF6)', borderTopLeftRadius:24, borderTopRightRadius:24}}/>
            <div style={{padding:14, borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                <img src={getOptimizedImage(selectedStore.logo_url, 100)} style={{width:52, height:52, borderRadius:12, objectFit:'cover', border:'2px solid #111'}}/>
                <div><h2 style={{fontWeight:900, fontSize:16}}>{selectedStore.name}</h2><p style={{fontSize:11, color:'#666', fontWeight:700}}>{selectedStore.tipo_tienda?.toUpperCase()} • {selectedStore.municipio} • /{selectedStore.slug} • Escaparate real</p></div>
              </div>
              <button onClick={()=>setSelectedStore(null)} style={{background:'#F0F0F0', border:'none', width:36, height:36, borderRadius:999, fontWeight:900}}>X</button>
            </div>
            <div style={{padding:14, overflowY:'auto', flex:1, background:'#F9F6F0'}}>
              {productsLoading ? <p style={{textAlign:'center', padding:30, fontWeight:800}}>Abriendo puerta de {selectedStore.name}...</p> : storeProducts.length===0 ? <div style={{textAlign:'center', padding:30}}><p style={{fontSize:40}}>🏪</p><p style={{fontWeight:800}}>Local nuevo</p><p style={{fontSize:12, color:'#666'}}>Aún acomodando productos en escaparate</p></div> : (
                <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
                  {storeProducts.map(p=>(
                    <div key={p.id} style={{background:'#fff', borderRadius:16, overflow:'hidden', border:'2px solid #111', boxShadow:'0 4px 12px rgba(0,0,0,0.08)'}}>
                      <div style={{aspectRatio:'1', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', position:'relative'}}>
                        <img src={getOptimizedImage(p.image_url, 300)} style={{width:'100%', height:'100%', objectFit:'contain'}}/>
                        <span style={{position:'absolute', top:6, left:6, background:'#111', color:'#FFD600', fontSize:8, fontWeight:900, padding:'3px 6px', borderRadius:4}}>{p.categoria?.toUpperCase()}</span>
                      </div>
                      <div style={{padding:'10px 12px', background:'#111', color:'#fff'}}><p style={{fontSize:12, fontWeight:800, lineHeight:1.2, minHeight:28}}>{p.name}</p><b style={{fontSize:14, color:'#FFD600'}}>C$ {p.price}</b></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{padding:12, borderTop:'3px solid #111', display:'flex', gap:8, background:'#fff', borderBottomLeftRadius:24, borderBottomRightRadius:24}}>
              <button onClick={()=>setSelectedStore(null)} style={{flex:1, background:'#F0F0F0', border:'none', padding:13, borderRadius:999, fontWeight:800}}>← Seguir paseando</button>
              <a href={`/${selectedStore.slug}`} style={{flex:1.2, background:'linear-gradient(90deg, #FF8A00, #FF3B30)', color:'#fff', textAlign:'center', padding:13, borderRadius:999, fontWeight:900, textDecoration:'none', fontSize:13, boxShadow:'0 4px 12px rgba(255,106,0,0.3)'}}>Entrar a tienda →</a>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
