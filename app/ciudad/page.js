'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key||!url.startsWith('http')) return null
  return createClient(url,key)
}

function getOptimizedImage(url, width=400){
  if(!url) return '/tienda-nica-logo.png'
  if(url.includes('supabase.co')){
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}width=${width}&quality=75`
  }
  return url
}

const BUILDING_COLORS = [
  { bg: '#1A1A1A', accent: '#D4AF37', text: '#F5F1E8' }, // Ileana Closed - negro elegante
  { bg: '#E8D5B7', accent: '#8B4513', text: '#3D2817' }, // Oliva - beige artesanal
  { bg: '#2C3E50', accent: '#E67E22', text: '#ECF0F1' }, // Motos - oscuro industrial
  { bg: '#F5E6D3', accent: '#C0392B', text: '#2C3E50' }, // General
  { bg: '#34495E', accent: '#3498DB', text: '#ECF0F1' }, // Boutique
  { bg: '#F39C12', accent: '#2C3E50', text: '#fff' }, // Comida
]

export default function CiudadPage(){
  const [stores,setStores]=useState([])
  const [loading,setLoading]=useState(true)
  const [selectedStore,setSelectedStore]=useState(null)
  const [storeProducts,setStoreProducts]=useState([])
  const [productsLoading,setProductsLoading]=useState(false)

  useEffect(()=>{
    const supabase=getSupabase()
    if(!supabase){ setLoading(false); return }
    supabase.from('stores').select('*').order('created_at',{ascending:true}).then(({data})=>{
      if(data) setStores(data)
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

  if(loading) return <div style={{minHeight:'100vh', background:'#F5F1ED', display:'flex', alignItems:'center', justifyContent:'center'}}>Construyendo Ciudad de Tiendas...</div>

  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(180deg, #87CEEB 0%, #E8F5F9 30%, #F5F1ED 100%)', fontFamily:'Inter, system-ui'}}>
      <style>{`
        .street { display:flex; gap:0; overflow-x:auto; padding:40px 20px 0; min-height:70vh; align-items:flex-end; scroll-snap-type:x mandatory; }
        .building { min-width:300px; max-width:320px; scroll-snap-align:start; cursor:pointer; transition:transform 0.3s; }
        .building:hover { transform:translateY(-12px); }
        .facade { background:#fff; border-radius:8px 8px 0 0; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.15); border:2px solid rgba(0,0,0,0.05); }
        .shop-sign { padding:12px 16px; text-align:center; font-weight:900; letter-spacing:0.5px; }
        .shop-window { height:220px; background:#fff; position:relative; display:flex; align-items:center; justifyContent:center; border-top:1px solid rgba(0,0,0,0.08); }
        .cobblestone { height:80px; background:repeating-linear-gradient(90deg, #D4C4A8 0px, #D4C4A8 40px, #C4B498 40px, #C4B498 80px); border-top:4px solid #8B7355; }
        @media(max-width:768px){ .building{min-width:260px} .street{padding:20px 10px 0} }
      `}</style>

      {/* HEADER CIUDAD */}
      <div style={{background:'rgba(255,255,255,0.9)', backdropFilter:'blur(10px)', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'2px solid #FF6A00', position:'sticky', top:0, zIndex:10}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <button onClick={()=>window.location.href='/'} style={{background:'#111', color:'#fff', border:'none', padding:'8px 14px', borderRadius:999, fontWeight:800, fontSize:12}}>← Market</button>
          <h1 style={{fontWeight:900, fontSize:16}}>🏙️ Ciudad de Tiendas • {stores.length} edificios</h1>
        </div>
        <p style={{fontSize:11, color:'#666', fontWeight:700}}>Click en edificio → productos reales</p>
      </div>

      <div style={{textAlign:'center', padding:'20px 20px 0'}}>
        <p style={{fontSize:13, color:'#5A4A3A', background:'rgba(255,255,255,0.8)', display:'inline-block', padding:'8px 16px', borderRadius:999, fontWeight:700}}>🏗️ Ciudad crece sola • Cada tienda nueva = un edificio nuevo • Europea estilo España</p>
      </div>

      {/* CALLE */}
      <div className="street">
        {stores.map((store, idx)=>{
          const style = BUILDING_COLORS[idx % BUILDING_COLORS.length]
          const isBoutique = (store.tipo_tienda||'').toLowerCase().includes('boutique')
          const isMotos = (store.tipo_tienda||'').toLowerCase().includes('vehiculos') || (store.tipo_tienda||'').toLowerCase().includes('moto')
          return (
            <div key={store.id} className="building" onClick={()=>openStore(store)}>
              <div className="facade">
                <div className="shop-sign" style={{background: style.bg, color: style.text, borderBottom:`4px solid ${style.accent}`}}>
                  <p style={{fontSize:14, lineHeight:1.2}}>{store.name}</p>
                  <p style={{fontSize:9, opacity:0.7, marginTop:2, fontWeight:700}}>{store.tipo_tienda?.toUpperCase()} • {store.municipio || store.departamento || ''}</p>
                </div>
                <div className="shop-window">
                  <img src={getOptimizedImage(store.logo_url || store.image_url, 300)} alt={store.name} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                  <div style={{position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent, rgba(0,0,0,0.7))', padding:'40px 12px 10px', color:'#fff'}}>
                    <p style={{fontSize:11, fontWeight:800}}>👉 Entrar a {store.name}</p>
                    <p style={{fontSize:9, opacity:0.8}}>{isBoutique ? 'Boutique • Tallas' : isMotos ? 'Motos • Repuestos' : store.tipo_tienda}</p>
                  </div>
                  <div style={{position:'absolute', top:10, right:10, background: isBoutique ? '#0066FF' : isMotos ? '#FF6A00' : '#111', color:'#fff', fontSize:8, fontWeight:900, padding:'4px 8px', borderRadius:999}}>
                    {store.verification_status?.includes('premium') ? '⭐ PREMIUM' : store.verification_status?.includes('verificada') ? '✓ VERIFICADA' : 'NUEVA'}
                  </div>
                </div>
              </div>
              <div className="cobblestone" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
                <p style={{fontSize:10, fontWeight:800, color:'#5A4A3A'}}>{store.slug} • #{idx+1}</p>
              </div>
            </div>
          )
        })}
        {/* EDIFICIO FUTURO - CONSTRUCCIÓN */}
        <div className="building" style={{opacity:0.6}}>
          <div className="facade" style={{border:'2px dashed #FF6A00'}}>
            <div className="shop-sign" style={{background:'#FFF3E0', color:'#FF6A00'}}>
              <p style={{fontSize:14}}>🏗️ Próxima tienda</p>
              <p style={{fontSize:9}}>Tu tienda aquí</p>
            </div>
            <div className="shop-window" style={{background:'#FFF8E8', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8}}>
              <p style={{fontSize:30}}>🏗️</p>
              <p style={{fontSize:12, fontWeight:800, color:'#FF6A00'}}>¿Tu tienda aquí?</p>
              <button onClick={()=>window.open('https://wa.me/50581732620?text=Quiero%20mi%20edificio%20en%20Ciudad%20de%20Tiendas','_blank')} style={{background:'#111', color:'#fff', border:'none', padding:'8px 14px', borderRadius:999, fontSize:10, fontWeight:800}}>Quiero mi edificio</button>
            </div>
          </div>
          <div className="cobblestone" />
        </div>
      </div>

      <div style={{textAlign:'center', padding:'20px'}}>
        <p style={{fontSize:11, color:'#8B7355'}}>← Desliza la calle → • {stores.length} edificios hoy • Mañana más • Estilo europeo como en España</p>
      </div>

      {/* MODAL PRODUCTOS REALES */}
      {selectedStore && (
        <div style={{position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', display:'flex', alignItems:'flex-end', justifyContent:'center'}} onClick={()=>setSelectedStore(null)}>
          <div style={{background:'#fff', width:'100%', maxWidth:600, borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'85vh', display:'flex', flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:16, borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                <img src={getOptimizedImage(selectedStore.logo_url, 80)} style={{width:48, height:48, borderRadius:12, objectFit:'cover'}}/>
                <div>
                  <h2 style={{fontWeight:900, fontSize:16}}>{selectedStore.name}</h2>
                  <p style={{fontSize:11, color:'#666'}}>{selectedStore.tipo_tienda} • {selectedStore.municipio} • /{selectedStore.slug}</p>
                </div>
              </div>
              <button onClick={()=>setSelectedStore(null)} style={{background:'#F0F0F0', border:'none', width:32, height:32, borderRadius:999, fontWeight:800}}>X</button>
            </div>
            <div style={{padding:16, overflowY:'auto', flex:1}}>
              {productsLoading ? <p style={{textAlign:'center', padding:20}}>Cargando productos reales...</p> : storeProducts.length===0 ? (
                <div style={{textAlign:'center', padding:30}}>
                  <p style={{fontSize:40}}>🏪</p>
                  <p style={{fontWeight:800, marginTop:8}}>Tienda nueva, aún sin productos</p>
                  <p style={{fontSize:12, color:'#666', marginTop:4}}>Este edificio se llenará cuando {selectedStore.name} suba productos</p>
                </div>
              ) : (
                <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
                  {storeProducts.map(p=>(
                    <div key={p.id} style={{border:'1px solid #F0E9E2', borderRadius:14, overflow:'hidden', background:'#fff'}}>
                      <div style={{aspectRatio:'1', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        <img src={getOptimizedImage(p.image_url, 300)} style={{width:'100%', height:'100%', objectFit:'contain'}}/>
                      </div>
                      <div style={{padding:'8px 10px'}}>
                        <p style={{fontSize:12, fontWeight:800, lineHeight:1.2, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', minHeight:28}}>{p.name}</p>
                        <b style={{fontSize:13}}>C$ {p.price}</b>
                        <p style={{fontSize:9, color:'#666'}}>{p.categoria}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{padding:12, borderTop:'1px solid #eee', display:'flex', gap:8}}>
              <button onClick={()=>setSelectedStore(null)} style={{flex:1, background:'#F0F0F0', border:'none', padding:12, borderRadius:999, fontWeight:700}}>← Seguir en Ciudad</button>
              <a href={`/${selectedStore.slug}`} style={{flex:1, background:'#FF6A00', color:'#fff', textAlign:'center', padding:12, borderRadius:999, fontWeight:900, textDecoration:'none', fontSize:13}}>Ver tienda completa →</a>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
