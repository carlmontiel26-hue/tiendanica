'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

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

 const add=(pr,talla=null)=>{
   if(store.tipo_tienda==='boutique'&&pr.tallas?.length>0&&!talla){
     alert('Elige una talla primero');
     return false
   }
   setCart(v=>{
     const key=talla?pr.id+'-'+talla:pr.id;
     const ex=v.find(i=>i.cartId===key);
     if(ex) return v.map(i=>i.cartId===key?{...i,qty:i.qty+1}:i);
     return [...v,{...pr,cartId:key,qty:1,tallaSel:talla}]
   });
   return true
 }

 const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
 const count=cart.reduce((s,i)=>s+i.qty,0)

 const sendWACart=()=>{
   if(cart.length===0) return alert('Tu carrito está vacío')
   let m=`Hola ${store.name}! 👋\nQuiero hacer este pedido:\n\n`;
   cart.forEach(i=>{
     m+=`• ${i.qty}x ${i.name}${i.tallaSel?' (Talla: '+i.tallaSel+')':''} - C$ ${i.price*i.qty}\n`
   });
   m+=`\n*Total: C$ ${total}*\nhttps://tiendanica.store/${store.slug}`
   window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(m)}`,'_blank')
 }

 const buyNowDirect=(pr)=>{
   if(store.tipo_tienda==='boutique'&&pr.tallas?.length>0&&!tallaSel){
     alert('Selecciona una talla para comprar');
     return
   }
   let m=`Hola ${store.name}! 👋\nQuiero comprar:\n\n• 1x ${pr.name}${tallaSel?` (Talla: ${tallaSel})`:''} - C$ ${pr.price}\n\nhttps://tiendanica.store/${store.slug}`
   window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(m)}`,'_blank')
 }

 const getImgs=(pr)=>[pr.image_url,...(pr.extra_images||[])].filter(Boolean).slice(0,3)

 if(!store) return <div style={{padding:40, background:'#000', color:'#fff'}}>Cargando...</div>
 const isComida=store.tipo_tienda==='comida'; const isBoutique=store.tipo_tienda==='boutique'
 const platos=isComida?prods.filter(p=>!p.categoria||p.categoria==='plato'):prods
 const bebidas=isComida?prods.filter(p=>p.categoria==='bebida'||p.categoria==='extra'):[]
 const cover=store.cover_image || store.image_url || prods[0]?.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200'

 return(
 <main style={{minHeight:'100vh', background:isBoutique?'#F6F3F0':'#0A0A0A', color:isBoutique?'#000':'#fff'}}>
  <style>{`
   .portada{ height: 520px; }
    @media (max-width: 768px){
     .portada{ height: 420px!important; }
    }
  `}</style>

  <div style={{position:'fixed', bottom:24, right:16, zIndex:100, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8}}>
   {showCart&&cart.length>0&&<div style={{background:'#fff', color:'#000', borderRadius:20, padding:16, width:'90vw', maxWidth:360, boxShadow:'0 20px 40px rgba(0,0,0,0.3)'}}>
     <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}><b>Mi Pedido ({count})</b><button onClick={()=>setShowCart(false)}>✕</button></div>
     {cart.map(i=><div key={i.cartId} style={{display:'flex', gap:8, background:'rgba(0,0,0,0.05)', borderRadius:12, padding:8, marginBottom:6, alignItems:'center'}}>
       <img src={i.image_url} style={{width:40, height:40, borderRadius:8, objectFit:'cover'}}/>
       <div style={{fontSize:12, flex:1}}><b>{i.name}</b>{i.tallaSel&&<span style={{background:'#000', color:'#fff', fontSize:9, padding:'2px 6px', borderRadius:99, marginLeft:6}}>Talla {i.tallaSel}</span>}<br/>{i.qty}x C$ {i.price}</div>
       <button onClick={()=>setCart(v=>v.filter(x=>x.cartId!==i.cartId))}>🗑️</button>
     </div>)}
     <div style={{borderTop:'1px solid #eee', marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between', fontWeight:900}}><span>Total</span><span>C$ {total}</span></div>
     <button onClick={sendWACart} style={{marginTop:12, width:'100%', background:'#00E676', color:'#000', padding:14, borderRadius:999, fontWeight:900, border:'none'}}>📲 Comprar por WhatsApp</button>
   </div>}
   <button onClick={()=>setShowCart(!showCart)} style={{padding:'16px 20px', borderRadius:999, fontWeight:900, background:isBoutique?'#000':'#fff', color:isBoutique?'#fff':'#000', border:'none', boxShadow:'0 10px 20px rgba(0,0,0,0.2)'}}>🛒 {count?count+' • C$ '+total:'Carrito'}</button>
  </div>

  {/* PORTADA RESPONSIVE - ARREGLADA PARA MOVIL */}
  <div className="portada" style={{position:'relative', width:'100%', overflow:'hidden', background:'#000'}}>
    <img src={cover} alt={store.name} style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top'}}/>
    <div style={{position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)'}}></div>
    <div style={{position:'absolute', bottom:20, left:16, right:16, background:'rgba(255,255,255,0.1)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:24, padding:16}}>
      <h1 style={{fontWeight:900, textTransform:'uppercase', fontSize:22, color:'#fff', lineHeight:1.1}}>{store.name}</h1>
      <p style={{fontSize:12, color:'rgba(255,255,255,0.8)', marginTop:6, lineHeight:1.3}}>{store.description}</p>
      {isComida?(
        <div style={{display:'flex', gap:8, marginTop:12}}><div style={{flex:1, background:'#fff', color:'#000', padding:'10px 0', borderRadius:999, textAlign:'center', fontWeight:900, fontSize:11}}>🍽️ Menú</div><button onClick={()=>setShowBebidas(true)} style={{flex:1, background:'#00E676', color:'#000', padding:'10px 0', borderRadius:999, fontWeight:900, fontSize:11, border:'none'}}>🥤 Bebidas ({bebidas.length})</button></div>
      ): isBoutique?(
        <span style={{marginTop:10, display:'inline-block', background:'#000', color:'#fff', fontSize:10, fontWeight:900, padding:'6px 14px', borderRadius:999}}>👗 Nueva Colección • {prods.length} prendas</span>
      ):(
        <span style={{marginTop:10, display:'inline-block', background:'#fff', color:'#000', fontSize:10, fontWeight:900, padding:'6px 14px', borderRadius:999}}>📱 {prods.length} productos</span>
      )}
    </div>
  </div>

  <div style={{maxWidth:1120, margin:'0 auto', padding:16, paddingBottom:112}}>
   <div style={{display:'grid', gap:16, gridTemplateColumns:'repeat(2,1fr)'}}>
    {platos.map((pr)=>{
      const imgs = getImgs(pr)
      if(isBoutique){
        return <div key={pr.id} style={{background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}><button onClick={()=>setSel(pr)} style={{width:'100%', aspectRatio:'4/5', position:'relative', border:'none', background:'#FBF9F7', cursor:'pointer'}}><img src={pr.image_url} style={{width:'100%', height:'100%', objectFit:'cover'}}/>{imgs.length>1&&<span style={{position:'absolute', top:10, left:10, background:'rgba(0,0,0,0.8)', color:'#fff', fontSize:9, padding:'4px 8px', borderRadius:999}}>{imgs.length} fotos</span>}{pr.tallas?.length>0&&<span style={{position:'absolute', top:10, right:10, background:'#fff', color:'#000', fontSize:8, fontWeight:900, padding:'4px 6px', borderRadius:999}}>{pr.tallas.join('-')}</span>}</button><div style={{padding:10}}><p style={{fontSize:11, color:'#000', lineHeight:1.2}}>{pr.name}</p><p style={{fontWeight:900, fontSize:13, marginTop:4, color:'#000'}}>C$ {pr.price}</p><button onClick={()=>setSel(pr)} style={{marginTop:8, width:'100%', background:'#000', color:'#fff', padding:9, borderRadius:999, fontSize:11, fontWeight:700, border:'none', cursor:'pointer'}}>Seleccionar talla</button></div></div>
      }
      return <div key={pr.id} style={{borderRadius:22, overflow:'hidden', background:'#fff', color:'#000'}}><button onClick={()=>setSel(pr)} style={{width:'100%', aspectRatio:'1/1', position:'relative', border:'none', cursor:'pointer'}}><img src={pr.image_url} style={{width:'100%', height:'100%', objectFit:'cover'}}/></button><div style={{padding:16}}><h3 style={{fontWeight:900, fontSize:16}}>{pr.name}</h3><div style={{display:'flex', gap:8, marginTop:12}}><button onClick={()=>setSel(pr)} style={{flex:1, border:'1px solid #ddd', padding:'10px 0', borderRadius:999, fontWeight:700, fontSize:11, background:'#fff'}}>Ver</button><button onClick={()=>{add(pr); setShowCart(true)}} style={{flex:1, background:'#00E676', padding:'10px 0', borderRadius:999, fontWeight:900, fontSize:11, border:'none'}}>Añadir • C$ {pr.price}</button></div></div></div>
    })}
   </div>
  </div>

  {sel&&<div style={{position:'fixed', inset:0, zIndex:200, background:'#000', display:'flex', flexDirection:'column'}} onClick={()=>setSel(null)}>
    <div style={{flex:1, position:'relative', background:'#000', overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      <img src={getImgs(sel)[currentImg]} style={{width:'100%', height:'100%', objectFit:'contain'}}/>
      <button onClick={()=>setSel(null)} style={{position:'absolute', top:14, right:14, background:'#fff', color:'#000', width:38, height:38, borderRadius:999, fontWeight:900, border:'none'}}>✕</button>
      {getImgs(sel).length>1&&<>
        <span style={{position:'absolute', top:14, left:14, background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:10, padding:'5px 10px', borderRadius:999}}>{currentImg+1}/{getImgs(sel).length}</span>
        <button onClick={()=>setCurrentImg(c=> c===0? getImgs(sel).length-1 : c-1)} style={{position:'absolute', left:10, top:'50%', background:'rgba(255,255,255,0.9)', width:36, height:36, borderRadius:999, fontWeight:900, border:'none'}}>‹</button>
        <button onClick={()=>setCurrentImg(c=> c===getImgs(sel).length-1? 0 : c+1)} style={{position:'absolute', right:10, top:'50%', background:'rgba(255,255,255,0.9)', width:36, height:36, borderRadius:999, fontWeight:900, border:'none'}}>›</button>
      </>}
    </div>
    <div style={{background:'#fff', borderTopLeftRadius:28, borderTopRightRadius:28, padding:18, marginTop:-20, position:'relative'}}>
      <h3 style={{fontWeight:900, fontSize:18, color:'#000', lineHeight:1.2}}>{sel.name}</h3><p style={{fontWeight:900, fontSize:17, color:'#000', marginTop:4}}>C$ {sel.price}</p>
      {isBoutique&&sel.tallas?.length>0&&<div style={{marginTop:14}}><p style={{fontWeight:700, fontSize:12, color:'#000'}}>Elige tu talla {tallaSel&&<span style={{color:'#00A651'}}>• {tallaSel} seleccionada</span>}</p><div style={{display:'flex', flexWrap:'wrap', gap:8, marginTop:8}}>{sel.tallas.map(t=><button key={t} onClick={()=>setTallaSel(t)} style={{minWidth:48, padding:'10px 14px', borderRadius:999, fontSize:13, fontWeight:700, border:tallaSel===t?'2px solid #000':'1px solid #000', background:tallaSel===t?'#000':'#fff', color:tallaSel===t?'#fff':'#000'}}>{t}</button>)}</div></div>}

      {/* BOTONES DE COMPRA - REGRESADOS */}
      <div style={{display:'flex', gap:10, marginTop:18}}>
        <button onClick={()=>setSel(null)} style={{flex:0.7, background:'#F0F0F0', padding:14, borderRadius:999, fontWeight:700, color:'#000', border:'none', fontSize:13}}>Cerrar</button>
        <button disabled={isBoutique&&sel.tallas?.length>0&&!tallaSel} onClick={()=>{ if(add(sel,tallaSel)){ buyNowDirect(sel) } }} style={{flex:1.3, background:tallaSel||!isBoutique||!sel.tallas?.length?'#00E676':'#ccc', color:'#000', padding:14, borderRadius:999, fontWeight:900, border:'none', fontSize:13, opacity:isBoutique&&sel.tallas?.length>0&&!tallaSel?0.5:1}}>
          {isBoutique&&!tallaSel?'Elige una talla':'📲 Comprar por WhatsApp'}
        </button>
      </div>
      {isBoutique&&<button onClick={()=>{ if(add(sel,tallaSel)){ setShowCart(true) } }} disabled={sel.tallas?.length>0&&!tallaSel} style={{marginTop:8, width:'100%', background:'#000', color:'#fff', padding:12, borderRadius:999, fontWeight:700, border:'none', fontSize:12, opacity:sel.tallas?.length>0&&!tallaSel?0.4:1}}>🛒 Añadir al carrito {tallaSel?`(Talla ${tallaSel})`:''}</button>}
    </div>
  </div>}

  {showBebidas&&isComida&&<div style={{position:'fixed', inset:0, zIndex:250, background:'#0A0A0A', display:'flex', flexDirection:'column'}}><div style={{padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.1)'}}><h2 style={{fontWeight:900, fontSize:16}}>🥤 Bebidas</h2><button onClick={()=>setShowBebidas(false)} style={{background:'#fff', color:'#000', width:36, height:36, borderRadius:999, fontWeight:900, border:'none'}}>✕</button></div><div style={{flex:1, overflow:'auto', padding:16}}><div style={{display:'grid', gap:12, gridTemplateColumns:'repeat(2,1fr)'}}>{bebidas.map(pr=><div key={pr.id} style={{background:'#fff', borderRadius:18, overflow:'hidden', color:'#000'}}><img src={pr.image_url} style={{width:'100%', aspectRatio:'1/1', objectFit:'cover'}}/><div style={{padding:10}}><p style={{fontWeight:700, fontSize:11}}>{pr.name}</p><p style={{fontWeight:900, fontSize:11, marginTop:4}}>C$ {pr.price}</p><button onClick={()=>{add(pr); setShowCart(true)}} style={{marginTop:8, width:'100%', background:'#000', color:'#fff', padding:7, borderRadius:999, fontSize:10, fontWeight:700, border:'none'}}>Añadir</button></div></div>)}</div></div></div>}
 </main>
 )
}