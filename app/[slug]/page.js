'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
export default function Tienda({params}){
 const slug=params?.slug
 const [store,setStore]=useState(null)
 const [prods,setProds]=useState([])
 const [cart,setCart]=useState([])
 const [sel,setSel]=useState(null)
 const [showCart,setShowCart]=useState(false)
 const [showBebidas,setShowBebidas]=useState(false)
 useEffect(()=>{(async()=>{
   const {data:s}=await supabase.from('stores').select('*').eq('slug',slug).single()
   if(s){setStore(s); const {data:p}=await supabase.from('products').select('*').eq('store_id',s.id).eq('is_active',true).order('created_at',{ascending:false}); setProds(p||[])}
 })()},[slug])
 const add=(pr)=>{
   setCart(v=>{const ex=v.find(i=>i.id===pr.id); if(ex) return v.map(i=>i.id===pr.id?{...i,qty:i.qty+1}:i); return [...v,{...pr,qty:1}] }); setShowCart(true)
 }
 const total=cart.reduce((s,i)=>s+i.price*i.qty,0); const count=cart.reduce((s,i)=>s+i.qty,0)
 const platos=prods.filter(p=>!p.categoria || p.categoria==='plato')
 const bebidas=prods.filter(p=>p.categoria==='bebida' || p.categoria==='extra')
 if(!store) return <div className="p-10 bg-black text-white">Cargando...</div>
 return(
 <main className="min-h-screen bg-[#0A0A0A] text-white">
  <div className="fixed bottom-6 right-4 z-[100] flex flex-col items-end gap-2">
   {showCart&&cart.length>0&&<div className="bg-white text-black rounded-[20px] p-4 w-[90vw] max-w-[350px]"><b>Pedido ({count})</b>{cart.map(i=><div key={i.id} className="text-xs">{i.qty}x {i.name}</div>)}<div className="font-black mt-2">Total C$ {total}</div><button onClick={()=>{let m=`Hola ${store.name}!\n`; cart.forEach(i=>m+=`• ${i.qty}x ${i.name} C$ ${i.price*i.qty}\n`); m+=`Total C$ ${total}\nhttps://tiendanica.store/${store.slug}`; window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(m)}`,'_blank')}} className="w-full bg-[#00E676] py-3 rounded-full font-black mt-3">WhatsApp</button></div>}
   <button onClick={()=>setShowCart(!showCart)} className="bg-white text-black px-5 py-4 rounded-full font-black">🛒 {count?count+' • C$ '+total:'Carrito'}</button>
  </div>
  <div className="relative h-[48vh] overflow-hidden">
    <img src={store.cover_image} className="absolute inset-0 w-full h-full object-cover"/>
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20"></div>
    <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur border border-white/20 rounded-[20px] p-4">
      <h1 className="font-black uppercase text-[20px]">{store.name}</h1>
      <p className="text-[11px] opacity-70">{store.description}</p>
      <div className="flex gap-2 mt-3">
        <button className="flex-1 bg-white text-black py-2.5 rounded-full font-black text-[12px]">🍽️ Menú</button>
        <button onClick={()=>setShowBebidas(true)} className="flex-1 bg-[#00E676] text-black py-2.5 rounded-full font-black text-[12px]">🥤 Bebidas y Extras {bebidas.length>0?`(${bebidas.length})`:''}</button>
      </div>
    </div>
  </div>
  <div className="max-w-6xl mx-auto p-4 pb-28">
   {platos[0]&&<button onClick={()=>setSel(platos[0])} className="w-full mb-6 bg-[#00E676]/15 border border-[#00E676]/30 rounded-[20px] p-3 flex gap-3 items-center text-left"><div className="w-20 h-20 rounded-[12px] overflow-hidden"><img src={platos[0].image_url} className="w-full h-full object-cover"/></div><div className="flex-1"><span className="bg-[#00E676] text-black text-[10px] font-black px-2 py-1 rounded-full">🔥 ESPECIALIDAD • TOCA</span><p className="font-black mt-1">{platos[0].name}</p></div><div className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center font-black">→</div></button>}
   <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
    {platos.map((pr,i)=><div key={pr.id} className={`rounded-[22px] overflow-hidden bg-white text-black ${i===0?'ring-2 ring-[#00E676]':''}`}><button onClick={()=>setSel(pr)} className="w-full aspect-square relative overflow-hidden"><img src={pr.image_url} className="w-full h-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div><div className="absolute bottom-3 left-3 right-3 flex justify-between"><span className="bg-black/70 text-white text-[10px] px-2 py-1 rounded-full">⏱️ 25 min</span><span className="bg-white text-black text-[10px] font-black px-2 py-1 rounded-full">C$ {pr.price}</span></div>{i===0&&<span className="absolute top-3 left-3 bg-[#00E676] text-black text-[10px] font-black px-3 py-1 rounded-full">🔥 ESPECIALIDAD</span>}</button><div className="p-4"><h3 className="font-black text-[16px]">{pr.name}</h3><div className="flex gap-2 mt-3"><button onClick={()=>setSel(pr)} className="flex-1 border py-2.5 rounded-full font-bold text-[11px]">Ver</button><button onClick={()=>add(pr)} className="flex-1 bg-[#00E676] py-2.5 rounded-full font-black text-[11px]">Añadir • C$ {pr.price}</button></div></div></div>)}
   </div>
  </div>
  {sel&&<div className="fixed inset-0 z-[200] bg-black flex flex-col" onClick={()=>setSel(null)}><div className="flex-1 relative flex items-center justify-center bg-black" onClick={e=>e.stopPropagation()}><img src={sel.image_url} className="w-full h-full object-cover"/><button onClick={()=>setSel(null)} className="absolute top-4 right-4 bg-white text-black w-10 h-10 rounded-full font-black">✕</button></div><div className="bg-white rounded-t-[28px] p-5 pb-8 -mt-6 relative"><div className="w-10 h-1.5 bg-black/10 rounded-full mx-auto mb-4"></div><div className="flex justify-between"><div><h3 className="font-black text-[20px] text-black leading-tight">{sel.name}</h3><p className="font-black text-[18px] text-black mt-1">C$ {sel.price}</p></div></div><div className="flex gap-3 mt-5"><button onClick={()=>setSel(null)} className="flex-1 bg-black/5 py-4 rounded-full font-bold text-black">Cerrar</button><button onClick={()=>{add(sel); setSel(null)}} className="flex-[1.8] bg-black text-white py-4 rounded-full font-black">Añadir • C$ {sel.price}</button></div></div></div>}
  {showBebidas&&<div className="fixed inset-0 z-[250] bg-[#0A0A0A] flex flex-col"><div className="p-4 flex justify-between items-center border-b border-white/10"><div><h2 className="font-black text-[18px]">🥤 Bebidas y Extras</h2><p className="text-[11px] opacity-60">Arma tu combo</p></div><button onClick={()=>setShowBebidas(false)} className="bg-white text-black w-10 h-10 rounded-full font-black">✕</button></div><div className="flex-1 overflow-auto p-4 pb-28"><div className="grid gap-4 grid-cols-2 md:grid-cols-3">{bebidas.length===0?<div className="col-span-full text-center py-20 opacity-50"><p className="text-[14px]">Aún no hay bebidas</p><p className="text-[11px] mt-2">En superadmin marca productos como bebida/extra</p></div>:bebidas.map(pr=><div key={pr.id} className="bg-white rounded-[18px] overflow-hidden text-black"><img src={pr.image_url} className="w-full aspect-square object-cover"/><div className="p-3"><p className="font-bold text-[12px] line-clamp-2">{pr.name}</p><p className="font-black text-[12px] mt-1">C$ {pr.price}</p><span className="text-[9px] bg-black/10 px-2 py-0.5 rounded-full">{pr.categoria}</span><button onClick={()=>add(pr)} className="mt-2 w-full bg-black text-white py-2 rounded-full text-[11px] font-bold">Añadir</button></div></div>)}</div></div><div className="p-4 border-t border-white/10 bg-black"><button onClick={()=>setShowBebidas(false)} className="w-full bg-[#00E676] text-black py-4 rounded-full font-black">Listo • Ver mi combo ({count})</button></div></div>}
 </main>
 )
}
