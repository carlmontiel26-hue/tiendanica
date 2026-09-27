'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// 👇 AQUÍ AGREGA TODAS LAS TALLAS QUE QUIERAS - ESTO ES LO ÚNICO NUEVO
const TALLAS_COMPLETAS = ["26","28","30","32","34","36","38","40","42","44"]

export default function Tienda({params}){
 const slug=params?.slug
 const [store,setStore]=useState(null); const [prods,setProds]=useState([]); const [cart,setCart]=useState([])
 const [sel,setSel]=useState(null); const [showCart,setShowCart]=useState(false); const [showBebidas,setShowBebidas]=useState(false)
 const [tallaSel,setTallaSel]=useState(null)
 const [currentImg, setCurrentImg] = useState(0)

 useEffect(()=>{(async()=>{
   const {data:s}=await supabase.from('stores').select('*').eq('slug',slug).single()
   if(s){setStore(s); const {data:p}=await supabase.from('products').select('*').eq('store_id',s.id).eq('is_active',true).order('created_at',{ascending:false}); setProds(p||[])}
 })()},[slug])

 useEffect(()=>{if(sel){ setTallaSel(null); setCurrentImg(0) }},[sel])

 // Función para juntar las tallas de la base de datos + las nuevas que agregues arriba
 const getTallas = (pr) => {
   const base = pr?.tallas?.length? pr.tallas : []
   const merged = [...new Set([...base,...TALLAS_COMPLETAS])].sort((a,b)=>parseInt(a)-parseInt(b))
   return merged
 }

 const add=(pr,talla=null)=>{
   if(store?.tipo_tienda==='boutique'&&getTallas(pr).length>0&&!talla) return false
   setCart(v=>{
     const key=talla?pr.id+'-'+talla:pr.id;
     const ex=v.find(i=>i.cartId===key);
     if(ex) return v.map(i=>i.cartId===key?{...i,qty:i.qty+1}:i);
     return [...v,{...pr,cartId:key,qty:1,tallaSel:talla}]
   }); return true
 }

 const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
 const count=cart.reduce((s,i)=>s+i.qty,0)

 const sendWACart=()=>{
   if(cart.length===0) return
   let m=`Hola ${store.name}! 👋\nQuiero hacer este pedido:\n\n`;
   cart.forEach(i=>{ m+=`• ${i.qty}x ${i.name}${i.tallaSel?' (Talla: '+i.tallaSel+')':''} - C$ ${i.price*i.qty}\n` });
   m+=`\n*Total: C$ ${total}*\nhttps://tiendanica.store/${store.slug}`
   window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(m)}`,'_blank')
 }

 const buyNowDirect=()=>{
   if(!sel) return
   if(store.tipo_tienda==='boutique'&&getTallas(sel).length>0&&!tallaSel){ alert('Selecciona una talla'); return }
   let m=`Hola ${store.name}! 👋\nQuiero comprar:\n\n• 1x ${sel.name}${tallaSel?` (Talla: ${tallaSel})`:''} - C$ ${sel.price}\n\nhttps://tiendanica.store/${store.slug}`
   window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(m)}`,'_blank')
 }

 const getImgs=(pr)=>[pr.image_url,...(pr.extra_images||[])].filter(Boolean).slice(0,3)

 if(!store) return <div style={{padding:40, background:'#000', color:'#fff'}}>Cargando...</div>
 const isComida=store.tipo_tienda==='comida'; const isBoutique=store.tipo_tienda==='boutique'
 const platos=isComida?prods.filter(p=>!p.categoria||p.categoria==='plato'):prods
 const bebidas=isComida?prods.filter(p=>p.categoria==='bebida'||p.categoria==='extra'):[]
 const cover=store.cover_image || store.image_url || prods[0]?.image_url || ''

 return(
 <main style={{minHeight:'100vh', background:isBoutique?'#F6F3F0':'#0A0A0A', color:isBoutique?'#000':'#fff'}}>
  <style>{`
.portada{ height: 520px; position: relative; }
.portada img{ object-fit: cover; object-position: center top; }
.info-card{ position: absolute; bottom: 20px; left: 16px; right: 16px; }
 @media (max-width: 768px){
.portada{ height: auto!important; aspect-ratio: 16/9!important; min-height: 320px!important; background: #000; }
.portada img{ object-fit: contain!important; object-position: center top!important; background: #000; height: auto!important; position: relative!important; min-height: 320px; }
.info-card{ bottom: 6px!important; left: 6px!important; right: 6px!important; padding: 10px 12px!important; border-radius: 12px!important; }
.info-card h1{ font-size: 14px!important; line-height: 1.1!important; }
.info-card p{ font-size: 9.5px!important; line-height: 1.2!important; margin-top: 2px!important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.info-card.badge{ font-size: 8.5px!important; padding: 3px 8px!important; margin-top: 4px!important; }
.product-card{ border-radius: 14px!important; }
.product-info{ padding: 8px 8px 9px 8px!important; }
.product-info.name{ font-size: 10px!important; line-height: 1.15!important; }
.product-info.price{ font-size: 12px!important; margin-top: 2px!important; }
.product-info button{ margin-top: 6px!important; padding: 8px 0!important; font-size: 10px!important; }
 }
`}</style>

  <div style={{position:'fixed', bottom:24, right:16, zIndex:100, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8}}>
   {showCart&&<div style={{background:'#fff', color:'#000', borderRadius:20, padding:16, width:'90vw', maxWidth:360, boxShadow:'0 20px 40px rgba(0,0,0,0.3)'}}>
     <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}><b>{cart.length>0?`Mi Pedido (${count})`:'Carrito vacío'}</b><button onClick={()=>setShowCart(false)}>✕</button></div>
     {cart.map(i=><div key={i.cartId} style={{display:'flex', gap:8, background:'rgba(0,0,0,0.05)', borderRadius:12, padding:8, marginBottom:6, alignItems:'center'}}>
       <img src={i.image_url} style={{width:40, height:40, borderRadius:8, objectFit:'cover'}}/>
       <div style={{fontSize:12, flex:1}}><b>{i.name}</b>{i.tallaSel&&<span style={{background:'#000', color:'#fff', fontSize:9, padding:'2px 6px', borderRadius:99, marginLeft:6}}>Talla {i.tallaSel}</span>}<br/>{i.qty}x C$ {i.price}</div>
       <button onClick={()=>setCart(v=>v.filter(x=>x.cartId!==i.cartId))}>🗑</button>
     </div>)}
     {cart.length>0&&<><div style={{borderTop:'1px solid #eee', marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between', fontWeight:900}}><span>Total</span><span>C$ {total}</span></div><button onClick={sendWACart} style={{marginTop:12, width:'100%', background:'#00E676', color:'#000', padding:14, borderRadius:999, fontWeight:900, border:'none'}}>📲 Comprar por WhatsApp</button></>}
   </div>}
   <button onClick={()=>setShowCart(!showCart)} style={{padding:'16px 20px', borderRadius:999, fontWeight:900, background:isBoutique?'#000':'#fff', color:isBoutique?'#fff':'#000', border:'none'}}>🛒 {count?count+' • C$ '+total:'Carrito'}</button>
  </div>

  <div className="portada" style={{width:'100%', overflow:'hidden', background:'#000'}}>
    <img src={cover} alt={store.name} style={{position:'absolute', inset:0, width:'100%', height:'100%'}}/>
    <div style={{position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)'}}></div>
    <div className="info-card" style={{background:'rgba(255,255,255,0.1)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:24, padding:16}}>
      <h1 style={{fontWeight:900, textTransform:'uppercase', fontSize:22, color:'#fff'}}>{store.name}</h1>
      <p style={{fontSize:12, color:'rgba(255,255,255,0.8)', marginTop:6}}>{store.description}</p>
      {isBoutique&&<span className="badge" style={{marginTop:10, display:'inline-block', background:'#000', color:'#fff', fontSize:10, fontWeight:900, padding:'6px 14px', borderRadius:999}}>👗 Nueva Colección • {prods.length} prendas</span>}
    </div>
  </div>

  <div style={{maxWidth:1120, margin:'0 auto', padding:16, paddingBottom:112}}>
   <div style={{display:'grid', gap:16, gridTemplateColumns:'repeat(2,1fr)'}}>
    {platos.map((pr)=>{
      const imgs = getImgs(pr)
      return <div key={pr.id} className="product-card" style={{background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
        <button onClick={()=>setSel(pr)} style={{width:'100%', aspectRatio:'4/5', position:'relative', border:'none', background:'#FBF9F7', cursor:'pointer'}}>
          <img src={pr.image_url} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
          {imgs.length>1&&<span style={{position:'absolute', top:10, left:10, background:'rgba(0,0,0,0.8)', color:'#fff', fontSize:9, padding:'4px 8px', borderRadius:999}}>{imgs.length} fotos</span>}
          {getTallas(pr).length>0&&<span style={{position:'absolute', top:10, right:10, background:'#fff', color:'#000', fontSize:8, fontWeight:900, padding:'4px 6px', borderRadius:999}}>{getTallas(pr).join('-')}</span>}
        </button>
        <div className="product-info" style={{padding:10}}>
          <p className="name" style={{fontSize:11, color:'#000', lineHeight:1.2}}>{pr.name}</p>
          <p className="price" style={{fontWeight:900, fontSize:13, marginTop:4, color:'#000'}}>C$ {pr.price}</p>
          <button onClick={()=>setSel(pr)} style={{marginTop:8, width:'100%', background:'#00E676', color:'#000', padding:10, borderRadius:999, fontSize:11, fontWeight:900, border:'none', cursor:'pointer'}}>📲 Comprar por WhatsApp</button>
        </div>
      </div>
    })}
   </div>
  </div>

  {sel&&<div style={{position:'fixed', inset:0, zIndex:200, background:'#000', display:'flex', flexDirection:'column'}} onClick={()=>setSel(null)}>
    <div style={{flex:1, position:'relative', background:'#000', overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      <img src={getImgs(sel)[currentImg]} style={{width:'100%', height:'100%', objectFit:'contain'}}/>
      <button onClick={()=>setSel(null)} style={{position:'absolute', top:14, right:14, background:'#fff', color:'#000', width:38, height:38, borderRadius:999, fontWeight:900, border:'none'}}>✕</button>
      {getImgs(sel).length>1&&<><span style={{position:'absolute', top:14, left:14, background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:10, padding:'5px 10px', borderRadius:999}}>{currentImg+1}/{getImgs(sel).length}</span><button onClick={()=>setCurrentImg(c=> c===0? getImgs(sel).length-1 : c-1)} style={{position:'absolute', left:10, top:'50%', background:'rgba(255,255,255,0.9)', width:36, height:36, borderRadius:999, border:'none'}}>‹</button><button onClick={()=>setCurrentImg(c=> c===getImgs(sel).length-1? 0 : c+1)} style={{position:'absolute', right:10, top:'50%', background:'rgba(255,255,255,0.9)', width:36, height:36, borderRadius:999, border:'none'}}>›</button></>}
    </div>
    <div style={{background:'#fff', borderTopLeftRadius:28, borderTopRightRadius:28, padding:18, marginTop:-20, position:'relative'}} onClick={e=>e.stopPropagation()}>
      <h3 style={{fontWeight:900, fontSize:18, color:'#000'}}>{sel.name}</h3><p style={{fontWeight:900, fontSize:17, color:'#000', marginTop:4}}>C$ {sel.price}</p>
      {isBoutique&&<div style={{marginTop:10}}><p style={{fontWeight:700, fontSize:12, color:'#000'}}>Elige tu talla {tallaSel&&<span style={{color:'#00C853'}}>• {tallaSel}</span>}</p><div style={{display:'flex', flexWrap:'wrap', gap:6, marginTop:8}}>{getTallas(sel).map(t=><button key={t} onClick={()=>setTallaSel(t)} style={{minWidth:40, width:40, height:40, padding:'0', borderRadius:999, fontSize:12, fontWeight:800, border:tallaSel===t?'2px solid #000':'1.2px solid #000', background:tallaSel===t?'#000':'#fff', color:tallaSel===t?'#fff':'#000'}}>{t}</button>)}</div></div>}
      <div style={{display:'flex', gap:10, marginTop:16}}>
        <button onClick={()=>setSel(null)} style={{flex:0.7, background:'#F0F0F0', padding:12, borderRadius:999, fontWeight:700, color:'#000', border:'none'}}>Cerrar</button>
        <button onClick={buyNowDirect} disabled={isBoutique&&!tallaSel} style={{flex:1.3, background:isBoutique&&!tallaSel?'#ccc':'#00E676', color:'#000', padding:12, borderRadius:999, fontWeight:900, border:'none', opacity:isBoutique&&!tallaSel?0.6:1}}>{isBoutique&&!tallaSel?'Elige una talla':'📲 Comprar por WhatsApp'}</button>
      </div>
      <button onClick={()=>{ if(add(sel,tallaSel)){ setShowCart(true); setSel(null) } }} disabled={isBoutique&&!tallaSel} style={{marginTop:8, width:'100%', background:'#000', color:'#fff', padding:10, borderRadius:999, fontWeight:700, border:'none', fontSize:12, opacity:isBoutique&&!tallaSel?0.4:1}}>🛒 Añadir al carrito {tallaSel?`(Talla ${tallaSel})`:''}</button>
    </div>
  </div>}

  {showBebidas&&isComida&&<div style={{position:'fixed', inset:0, zIndex:250, background:'#0A0A0A', display:'flex', flexDirection:'column'}}><div style={{padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.1)'}}><h2 style={{fontWeight:900, fontSize:16}}>🥤 Bebidas</h2><button onClick={()=>setShowBebidas(false)} style={{background:'#fff', color:'#000', width:36, height:36, borderRadius:999, fontWeight:900, border:'none'}}>✕</button></div><div style={{flex:1, overflow:'auto', padding:16}}><div style={{display:'grid', gap:12, gridTemplateColumns:'repeat(2,1fr)'}}>{bebidas.map(pr=><div key={pr.id} style={{background:'#fff', borderRadius:18, overflow:'hidden', color:'#000'}}><img src={pr.image_url} style={{width:'100%', aspectRatio:'1/1', objectFit:'cover'}}/><div style={{padding:10}}><p style={{fontWeight:700, fontSize:11}}>{pr.name}</p><p style={{fontWeight:900, fontSize:11, marginTop:4}}>C$ {pr.price}</p><button onClick={()=>{add(pr); setShowCart(true)}} style={{marginTop:8, width:'100%', background:'#000', color:'#fff', padding:7, borderRadius:999, fontSize:10, fontWeight:700, border:'none'}}>Añadir</button></div></div>)}</div></div></div>}
 </main>
 )
}