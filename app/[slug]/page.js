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
     alert('Por favor elige una talla');
     return
   }
   setCart(v=>{
     const key=talla?pr.id+'-'+talla:pr.id;
     const ex=v.find(i=>i.cartId===key);
     if(ex) return v.map(i=>i.cartId===key?{...i,qty:i.qty+1}:i);
     return [...v,{...pr,cartId:key,qty:1,tallaSel:talla}]
   });
   setShowCart(true)
   setSel(null)
 }

 const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
 const count=cart.reduce((s,i)=>s+i.qty,0)

 const sendWA=()=>{
   if(cart.length===0) return alert('Carrito vacío')
   let m=`Hola ${store.name}! 👋\nQuiero hacer este pedido:\n\n`;
   cart.forEach(i=>{
     m+=`• ${i.qty}x ${i.name}${i.tallaSel?' (Talla: '+i.tallaSel+')':''} - C$ ${i.price*i.qty}\n`
   });
   m+=`\n*Total: C$ ${total}*\n\nMi tienda: https://tiendanica.store/${store.slug}`
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
  {/* CARRITO FLOTANTE CON BOTON WHATSAPP */}
  <div style={{position:'fixed', bottom:24, right:16, zIndex:100, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8}}>
   {showCart&&cart.length>0&&<div style={{background:'#fff', color:'#000', borderRadius:20, padding:16, width:'90vw', maxWidth:360, boxShadow:'0 20px 40px rgba(0,0,0,0.3)'}}>
     <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}><b>Mi Pedido ({count})</b><button onClick={()=>setShowCart(false)}>✕</button></div>
     {cart.map(i=><div key={i.cartId} style={{display:'flex', gap:8, background:'rgba(0,0,0,0.05)', borderRadius:12, padding:8, marginBottom:6, alignItems:'center'}}>
       <img src={i.image_url} style={{width:40, height:40, borderRadius:8, objectFit:'cover'}}/>
       <div style={{fontSize:12, flex:1}}><b>{i.name}</b>{i.tallaSel&&<span style={{background:'#000', color:'#fff', fontSize:9, padding:'2px 6px', borderRadius:99, marginLeft:6}}>Talla {i.tallaSel}</span>}<br/>{i.qty}x C$ {i.price}</div>
       <button onClick={()=>setCart(v=>v.filter(x=>x.cartId!==i.cartId))} style={{fontSize:12}}>🗑️</button>
     </div>)}
     <div style={{borderTop:'1px solid #eee', marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between', fontWeight:900}}><span>Total</span><span>C$ {total}</span></div>
     <button onClick={sendWA} style={{marginTop:12, width:'100%', background:'#00E676', color:'#000', padding:14, borderRadius:999, fontWeight:900, border:'none', cursor:'pointer'}}>📲 Comprar por WhatsApp</button>
   </div>}
   <button onClick={()=>setShowCart(!showCart)} style={{padding:'16px 20px', borderRadius:999, fontWeight:900, background:isBoutique?'#000':'#fff', color:isBoutique?'#fff':'#000', border:'none', cursor:'pointer', boxShadow:'0 10px 20px rgba(0,0,0,0.2)'}}>🛒 {count?count+' • C$ '+total:'Carrito'}</button>
  </div>

  {/* PORTADA */}
  <div style={{position:'relative', height:'520px', width:'100%', overflow:'hidden', background:'#000'}}>
    <img src={cover} alt={store.name} style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover'}}/>
    <div style={{position:'absolute', inset:0, background:'linear-gradient(to top, black, rgba(0,0,0,0.4), transparent)'}}></div>
    <div style={{position:'absolute', bottom:24, left:16, right:16, background:'rgba(255,255,255,0.1)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:24, padding:20}}>
      <h1 style={{fontWeight:900, textTransform:'uppercase', fontSize:24, color:'#fff'}}>{store.name}</h1>
      <p style={{fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:4}}>{store.description}</p>
      {isComida?(
        <div style={{display:'flex', gap:8, marginTop:16}}><div style={{flex:1, background:'#fff', color:'#000', padding:'12px 0', borderRadius:999, textAlign:'center', fontWeight:900, fontSize:12}}>🍽️ Menú</div><button onClick={()=>setShowBebidas(true)} style={{flex:1, background:'#00E676', color:'#000', padding:'12px 0', borderRadius:999, fontWeight:900, fontSize:12, border:'none'}}>🥤 Bebidas ({bebidas.length})</button></div>
      ): isBoutique?(
        <span style={{marginTop:12, display:'inline-block', background:'#000', color:'#fff', fontSize:11, fontWeight:900, padding:'8px 16px', borderRadius:999}}>👗 Nueva Colección • {prods.length} prendas</span>
      ):(
        <span style={{marginTop:12, display:'inline-block', background:'#fff', color:'#000', fontSize:11, fontWeight:900, padding:'8px 16px', borderRadius:999}}>📱 {prods.length} productos</span>
      )}
    </div>
  </div>

  <div style={{maxWidth:1120, margin:'0 auto', padding:16, paddingBottom:112}}>
   <div style={{display:'grid', gap:20, gridTemplateColumns:'repeat(2,1fr)'}}>
    {platos.map((pr,i)=>{
      const imgs = getImgs(pr)
      if(isBoutique){
        return <div key={pr.id} style={{background:'#fff', borderRadius:20, overflow:'hidden'}}><button onClick={()=>setSel(pr)} style={{width:'100%', aspectRatio:'4/5', position:'relative', border:'none', background:'#FBF9F7', cursor:'pointer'}}><img src={pr.image_url} style={{width:'100%', height:'100%', objectFit:'cover'}}/>{imgs.length>1&&<span style={{position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.8)', color:'#fff', fontSize:9, padding:'4px 8px', borderRadius:999}}>{imgs.length} fotos</span>}</button><div style={{padding:12}}><p style={{fontSize:12, color:'#000'}}>{pr.name}</p><p style={{fontWeight:900, fontSize:13, marginTop:4, color:'#000'}}>C$ {pr.price}</p><p style={{fontSize:10, color:'rgba(0,0,0,0.5)', marginTop:2}}>{pr.tallas?.length?pr.tallas.join(' • '):'Talla única'}</p><button onClick={()=>setSel(pr)} style={{marginTop:8, width:'100%', background:'#000', color:'#fff', padding:10, borderRadius:999, fontSize:11, fontWeight:700, border:'none', cursor:'pointer'}}>Seleccionar talla</button></div></div>
      }
      return <div key={pr.id} style={{borderRadius:22, overflow:'hidden', background:'#fff', color:'#000'}}><button onClick={()=>setSel(pr)} style={{width:'100%', aspectRatio:'1/1', position:'relative', border:'none', cursor:'pointer'}}><img src={pr.image_url} style={{width:'100%', height:'100%', objectFit:'cover'}}/></button><div style={{padding:16}}><h3 style={{fontWeight:900, fontSize:16}}>{pr.name}</h3><div style={{display:'flex', gap:8, marginTop:12}}><button onClick={()=>setSel(pr)} style={{flex:1, border:'1px solid #ddd', padding:'10px 0', borderRadius:999, fontWeight:700, fontSize:11, background:'#fff', cursor:'pointer'}}>Ver</button><button onClick={()=>add(pr)} style={{flex:1, background:'#00E676', padding:'10px 0', borderRadius:999, fontWeight:900, fontSize:11, border:'none', cursor:'pointer'}}>Añadir • C$ {pr.price}</button></div></div></div>
    })}
   </div>
  </div>

  {/* MODAL CON SELECCION DE TALLA Y CARRUSEL */}
  {sel&&<div style={{position:'fixed', inset:0, zIndex:200, background:'#000', display:'flex', flexDirection:'column'}} onClick={()=>setSel(null)}>
    <div style={{flex:1, position:'relative', background:'#000', overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      <img src={getImgs(sel)[currentImg]} style={{width:'100%', height:'100%', objectFit:'contain'}}/>
      <button onClick={()=>setSel(null)} style={{position:'absolute', top:16, right:16, background:'#fff', color:'#000', width:40, height:40, borderRadius:999, fontWeight:900, border:'none'}}>✕</button>
      {getImgs(sel).length>1&&<>
        <span style={{position:'absolute', top:16, left:16, background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:10, padding:'6px 12px', borderRadius:999}}>{currentImg+1}/{getImgs(sel).length}</span>
        <button onClick={()=>setCurrentImg(c=> c===0? getImgs(sel).length-1 : c-1)} style={{position:'absolute', left:10, top:'50%', background:'rgba(255,255,255,0.9)', width:40, height:40, borderRadius:999, fontWeight:900, border:'none'}}>‹</button>
        <button onClick={()=>setCurrentImg(c=> c===getImgs(sel).length-1? 0 : c+1)} style={{position:'absolute', right:10, top:'50%', background:'rgba(255,255,255,0.9)', width:40, height:40, borderRadius:999, fontWeight:900, border:'none'}}>›</button>
        <div style={{position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6}}>
          {getImgs(sel).map((_,idx)=><div key={idx} style={{width:8, height:8, borderRadius:999, background: idx===currentImg?'#fff':'rgba(255,255,255,0.4)'}}></div>)}
        </div>
      </>}
    </div>
    <div style={{background:'#fff', borderTopLeftRadius:28, borderTopRightRadius:28, padding:20, marginTop:-24, position:'relative'}}>
      <h3 style={{fontWeight:900, fontSize:20, color:'#000'}}>{sel.name}</h3><p style={{fontWeight:900, fontSize:18, color:'#000', marginTop:4}}>C$ {sel.price}</p>
      {isBoutique&&sel.tallas?.length>0&&<div style={{marginTop:16}}><p style={{fontWeight:700, fontSize:12, color:'#000'}}>Elige tu talla {tallaSel? `- ${tallaSel}`:''}</p><div style={{display:'flex', flexWrap:'wrap', gap:8, marginTop:8}}>{sel.tallas.map(t=><button key={t} onClick={()=>setTallaSel(t)} style={{minWidth:50, padding:'10px 16px', borderRadius:999, fontSize:12, fontWeight:700, border:'1px solid #000', background:tallaSel===t?'#000':'#fff', color:tallaSel===t?'#fff':'#000', cursor:'pointer'}}>{t}</button>)}</div></div>}
      <div style={{display:'flex', gap:12, marginTop:20}}>
        <button onClick={()=>setSel(null)} style={{flex:1, background:'rgba(0,0,0,0.05)', padding:16, borderRadius:999, fontWeight:700, color:'#000', border:'none', cursor:'pointer'}}>Cerrar</button>
        <button disabled={isBoutique&&sel.tallas?.length>0&&!tallaSel} onClick={()=>add(sel,tallaSel)} style={{flex:1.8, background:'#000', color:'#fff', padding:16, borderRadius:999, fontWeight:900, border:'none', cursor:'pointer', opacity:isBoutique&&sel.tallas?.length>0&&!tallaSel?0.4:1}}>{isBoutique? (tallaSel?`Añadir Talla ${tallaSel} • C$ ${sel.price}`:'Elige una talla'):`Añadir • C$ ${sel.price}`}</button>
      </div>
    </div>
  </div>}

  {showBebidas&&isComida&&<div style={{position:'fixed', inset:0, zIndex:250, background:'#0A0A0A', display:'flex', flexDirection:'column'}}><div style={{padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.1)'}}><div><h2 style={{fontWeight:900, fontSize:18}}>🥤 Bebidas y Extras</h2></div><button onClick={()=>setShowBebidas(false)} style={{background:'#fff', color:'#000', width:40, height:40, borderRadius:999, fontWeight:900, border:'none'}}>✕</button></div><div style={{flex:1, overflow:'auto', padding:16}}><div style={{display:'grid', gap:16, gridTemplateColumns:'repeat(2,1fr)'}}>{bebidas.map(pr=><div key={pr.id} style={{background:'#fff', borderRadius:18, overflow:'hidden', color:'#000'}}><img src={pr.image_url} style={{width:'100%', aspectRatio:'1/1', objectFit:'cover'}}/><div style={{padding:12}}><p style={{fontWeight:700, fontSize:12}}>{pr.name}</p><p style={{fontWeight:900, fontSize:12, marginTop:4}}>C$ {pr.price}</p><button onClick={()=>add(pr)} style={{marginTop:8, width:'100%', background:'#000', color:'#fff', padding:8, borderRadius:999, fontSize:11, fontWeight:700, border:'none', cursor:'pointer'}}>Añadir</button></div></div>)}</div></div></div>}
 </main>
 )
}