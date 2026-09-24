'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function Tienda({params}){
 const slug=params?.slug
 const [store,setStore]=useState(null); const [prods,setProds]=useState([]); const [cart,setCart]=useState([])
 const [sel,setSel]=useState(null); const [showCart,setShowCart]=useState(false); const [showBebidas,setShowBebidas]=useState(false)
 const [tallaSel,setTallaSel]=useState(null)
 useEffect(()=>{(async()=>{
   const {data:s}=await supabase.from('stores').select('*').eq('slug',slug).single()
   if(s){setStore(s); const {data:p}=await supabase.from('products').select('*').eq('store_id',s.id).eq('is_active',true).order('created_at',{ascending:false}); setProds(p||[])}
 })()},[slug])
 useEffect(()=>{if(sel) setTallaSel(null)},[sel])
 const add=(pr,talla=null)=>{
   if(store.tipo_tienda==='boutique'&&pr.tallas?.length&&!talla){alert('Elige talla');return}
   setCart(v=>{const key=talla?pr.id+'-'+talla:pr.id; const ex=v.find(i=>i.cartId===key); if(ex) return v.map(i=>i.cartId===key?{...i,qty:i.qty+1}:i); return [...v,{...pr,cartId:key,qty:1,tallaSel:talla}] }); setShowCart(true)
 }
 const total=cart.reduce((s,i)=>s+i.price*i.qty,0); const count=cart.reduce((s,i)=>s+i.qty,0)
 const sendWA=()=>{let m=`Hola ${store.name}!\n`; cart.forEach(i=>{m+=`• ${i.qty}x ${i.name}${i.tallaSel?' Talla '+i.tallaSel:''} C$ ${i.price*i.qty}\n`}); m+=`Total C$ ${total}\nhttps://tiendanica.store/${store.slug}`; window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(m)}`,'_blank')}
 const getImgs=(pr)=>[pr.image_url,...(pr.extra_images||[])].filter(Boolean).slice(0,3)
 if(!store) return <div className="p-10 bg-black text-white">Cargando...</div>
 const isComida=store.tipo_tienda==='comida'; const isBoutique=store.tipo_tienda==='boutique'
 const platos=isComida?prods.filter(p=>!p.categoria||p.categoria==='plato'):prods
 const bebidas=isComida?prods.filter(p=>p.categoria==='bebida'||p.categoria==='extra'):[]
 const cover=store.cover_image || store.image_url || prods[0]?.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200'
 return(
 <main className={`${isBoutique?'bg-[#F6F3F0] text-black':'bg-[#0A0A0A] text-white'} min-h-screen`}>
  <div className="fixed bottom-6 right-4 z-[100] flex flex-col items-end gap-2">
   {showCart&&cart.length>0&&<div className="bg-white text-black rounded- p-4 w- max-w- shadow-2xl"><div className="flex justify-between mb-2"><b>Pedido ({count})</b><button onClick={()=>setShowCart(false)}>✕</button></div>{cart.map(i=><div key={i.cartId} className="flex gap-2 bg-black/5 rounded-xl p-2 mb-1"><img src={i.image_url} className="w-10 h-10 rounded object-cover"/><div className="flex-1 text-xs"><b className="truncate">{i.name}</b><br/>{i.qty}x C$ {i.price}{i.tallaSel?' • '+i.tallaSel:''}</div></div>)}<div className="border-t mt-2 pt-2 flex justify-between font-black"><span>Total</span><span>C$ {total}</span></div><button onClick={sendWA} className="mt-3 w-full bg-[#00E676] py-3 rounded-full font-black">WhatsApp</button></div>}
   <button onClick={()=>setShowCart(!showCart)} className={`px-5 py-4 rounded-full font-black shadow-2xl ${isBoutique?'bg-black text-white':'bg-white text-black'}`}>🛒 {count?count+' • C$ '+total:'Carrito'}</button>
  </div>
  <div className="relative h- w-full overflow-hidden bg-black">
    <img src={cover} alt={store.name} className="absolute inset-0 w-full h-full object-cover"/>
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10"></div>
    <div className="absolute bottom-6 left-4 right-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded- p-5 shadow-2xl">
      <h1 className="font-black uppercase text- text-white leading-tight tracking-tight">{store.name}</h1>
      <p className="text- text-white/70 mt-1">{store.description}</p>
      {isComida?(
        <div className="flex gap-2 mt-4"><button className="flex-1 bg-white text-black py-3 rounded-full font-black text-">🍽️ Menú</button><button onClick={()=>setShowBebidas(true)} className="flex-1 bg-[#00E676] text-black py-3 rounded-full font-black text-">🥤 Bebidas y Extras {bebidas.length?`(${bebidas.length})`:''}</button></div>
      ): isBoutique?(
        <span className="mt-3 inline-block bg-black text-white text- font-black px-4 py-2 rounded-full">👗 Nueva Colección • {prods.length} prendas</span>
      ):(
        <span className="mt-3 inline-block bg-white text-black text- font-black px-4 py-2 rounded-full">📱 {prods.length} productos</span>
      )}
    </div>
  </div>
  <div className="max-w-6xl mx-auto p-4 pb-28">
   {isComida&&platos[0]&&<button onClick={()=>setSel(platos[0])} className="w-full mb-6 bg-[#00E676]/15 border border-[#00E676]/30 rounded- p-3 flex gap-3 items-center text-left"><div className="w-20 h-20 rounded- overflow-hidden"><img src={platos[0].image_url} className="w-full h-full object-cover"/></div><div className="flex-1"><span className="bg-[#00E676] text-black text- font-black px-2 py-1 rounded-full">🔥 ESPECIALIDAD • TOCA</span><p className="font-black mt-1 text-white">{platos[0].name}</p></div><div className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center font-black">→</div></button>}
   <div className={`grid gap-5 ${isBoutique?'grid-cols-2 md:grid-cols-3':'grid-cols-1 md:grid-cols-2'}`}>
    {platos.map((pr,i)=>{
      if(isBoutique){
        return <div key={pr.id} className="bg-white rounded- overflow-hidden shadow-lg"><button onClick={()=>setSel(pr)} className="w-full aspect-[4/5] relative overflow-hidden bg-[#FBF9F7]"><img src={pr.image_url} className="w-full h-full object-cover"/>{pr.extra_images?.length>0&&<span className="absolute top-3 left-3 bg-black/80 text-white text- px-2 py-1 rounded-full">{pr.extra_images.length+1} fotos</span>}</button><div className="p-3"><p className="text- font-medium line-clamp-2 min-h- text-black">{pr.name}</p><p className="font-black text- mt-1 text-black">C$ {pr.price}</p><p className="text- text-black/40 mt-1">{pr.tallas?.length?pr.tallas.join(' • '):'Talla única'}</p><button onClick={()=>setSel(pr)} className="mt-2 w-full bg-black text-white py-2 rounded-full text- font-bold">Ver tallas</button></div></div>
      }
      return <div key={pr.id} className={`rounded- overflow-hidden bg-white text-black ${isComida&&i===0?'ring-2 ring-[#00E676]':''}`}><button onClick={()=>setSel(pr)} className="w-full aspect-square relative overflow-hidden"><img src={pr.image_url} className="w-full h-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div><div className="absolute bottom-3 left-3 right-3 flex justify-between"><span className="bg-black/70 text-white text- px-2 py-1 rounded-full">{isComida?'⏱️ 25 min':'📦 Disponible'}</span><span className="bg-white text-black text- font-black px-2 py-1 rounded-full">C$ {pr.price}</span></div>{isComida&&i===0&&<span className="absolute top-3 left-3 bg-[#00E676] text-black text- font-black px-3 py-1 rounded-full">🔥 ESPECIALIDAD</span>}</button><div className="p-4"><h3 className="font-black text-">{pr.name}</h3><div className="flex gap-2 mt-3"><button onClick={()=>setSel(pr)} className="flex-1 border py-2.5 rounded-full font-bold text-">Ver</button><button onClick={()=>add(pr)} className="flex-1 bg-[#00E676] py-2.5 rounded-full font-black text-">Añadir • C$ {pr.price}</button></div></div></div>
    })}
   </div>
  </div>
  {sel&&<div className="fixed inset-0 z-[200] bg-black flex flex-col" onClick={()=>setSel(null)}><div className="flex-1 relative flex items-center justify-center bg-black" onClick={e=>e.stopPropagation()}><div className="w-full h-full overflow-x-auto flex snap-x">{getImgs(sel).map((im,idx)=><div key={idx} className="min-w-full snap-center flex items-center justify-center"><img src={im} className="w-full h-full object-cover md:object-contain"/></div>)}</div><button onClick={()=>setSel(null)} className="absolute top-4 right-4 bg-white text-black w-10 h-10 rounded-full font-black">✕</button>{getImgs(sel).length>1&&<span className="absolute top-4 left-4 bg-black/70 text-white text- px-3 py-1 rounded-full">{getImgs(sel).length} fotos • Desliza →</span>}</div><div className="bg-white rounded-t- p-5 pb-8 -mt-6 relative"><div className="w-10 h-1.5 bg-black/10 rounded-full mx-auto mb-4"></div><div className="flex justify-between"><div><h3 className="font-black text- text-black leading-tight">{sel.name}</h3><p className="font-black text- text-black mt-1">C$ {sel.price}</p></div></div>{isBoutique&&sel.tallas?.length>0&&<div className="mt-4"><p className="font-bold text- text-black">Talla {tallaSel?' - '+tallaSel:''}</p><div className="flex flex-wrap gap-2 mt-2">{sel.tallas.map(t=><button key={t} onClick={()=>setTallaSel(t)} className={`min-w- px-4 py-2 rounded-full text-xs font-bold border ${tallaSel===t?'bg-black text-white':'bg-white text-black'}`}>{t}</button>)}</div></div>}<div className="flex gap-3 mt-5"><button onClick={()=>setSel(null)} className="flex-1 bg-black/5 py-4 rounded-full font-bold text-black">Cerrar</button><button disabled={isBoutique&&sel.tallas?.length>0&&!tallaSel} onClick={()=>{add(sel,tallaSel); setSel(null)}} className="flex-[1.8] bg-black text-white py-4 rounded-full font-black disabled:opacity-40">{isBoutique?tallaSel?'Añadir Talla '+tallaSel:'Elige talla':'Añadir • C$ '+sel.price}</button></div></div></div>}
  {showBebidas&&isComida&&<div className="fixed inset-0 z-[250] bg-[#0A0A0A] flex flex-col"><div className="p-4 flex justify-between items-center border-b border-white/10"><div><h2 className="font-black text-">🥤 Bebidas y Extras</h2><p className="text- opacity-60">Arma tu combo</p></div><button onClick={()=>setShowBebidas(false)} className="bg-white text-black w-10 h-10 rounded-full font-black">✕</button></div><div className="flex-1 overflow-auto p-4 pb-28"><div className="grid gap-4 grid-cols-2 md:grid-cols-3">{bebidas.length===0?<div className="col-span-full text-center py-20 opacity-50"><p>Aún no hay bebidas</p></div>:bebidas.map(pr=><div key={pr.id} className="bg-white rounded- overflow-hidden text-black"><img src={pr.image_url} className="w-full aspect-square object-cover"/><div className="p-3"><p className="font-bold text- line-clamp-2">{pr.name}</p><p className="font-black text- mt-1">C$ {pr.price}</p><button onClick={()=>add(pr)} className="mt-2 w-full bg-black text-white py-2 rounded-full text- font-bold">Añadir</button></div></div>)}</div></div><div className="p-4 border-t border-white/10 bg-black"><button onClick={()=>setShowBebidas(false)} className="w-full bg-[#00E676] text-black py-4 rounded-full font-black">Listo • Ver combo ({cart.length})</button></div></div>}
 </main>
 )
}