'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
export default function Tienda({ params }){
  const slug = params?.slug
  const [store, setStore] = useState(null)
  const [prods, setProds] = useState([])
  const [cart, setCart] = useState([])
  const [selected, setSelected] = useState(null)
  const [showCart, setShowCart] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedTalla, setSelectedTalla] = useState(null)
  useEffect(()=>{ (async()=>{
    const { data: s } = await supabase.from('stores').select('*').eq('slug', slug).single()
    if(s){ setStore(s); const { data: p } = await supabase.from('products').select('*').eq('store_id', s.id).eq('is_active', true).order('created_at',{ascending:false}); setProds(p||[]) }
    setLoading(false)
  })()},[slug])
  const getImages=(pr)=>[pr.image_url, ...(pr.extra_images||[])].filter(Boolean).slice(0,3)
  const addToCart=(pr,talla=null)=>{
    if(store.tipo_tienda==='boutique'&&pr.tallas?.length&&!talla){alert('Elige talla');return}
    setCart(prev=>{
      const key=talla?`${pr.id}-${talla}`:`${pr.id}`
      const ex=prev.find(i=>i.cartId===key)
      if(ex) return prev.map(i=>i.cartId===key?{...i,qty:i.qty+1}:i)
      return [...prev,{...pr,cartId:key,qty:1,tallaSeleccionada:talla}]
    }); setShowCart(true)
  }
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0); const count=cart.reduce((s,i)=>s+i.qty,0)
  const sendWA=()=>{
    let msg=`Hola ${store.name}! Pedido:\n`; cart.forEach(i=>{msg+=`• ${i.qty}x ${i.name}${i.tallaSeleccionada?` Talla ${i.tallaSeleccionada}`:''} C$ ${i.price*i.qty}\n`}); msg+=`Total C$ ${total}\nhttps://tiendanica.store/${store.slug}`
    window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(msg)}`,'_blank')
  }
  if(loading) return <div className="min-h-screen bg-black text-white p-10">Cargando...</div>
  if(!store) return <div className="min-h-screen bg-black text-white p-10">No encontrada</div>
  const isBoutique=store.tipo_tienda==='boutique'; const isComida=store.tipo_tienda==='comida'
  return(
    <main className={`${isBoutique?'bg-[#F6F3F0] text-black':'bg-[#0A0A0A] text-white'} min-h-screen`}>
      <style>{`.glass{background:rgba(255,255,255,0.08);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.12)}.premium-shadow{box-shadow:0 12px 32px rgba(0,0,0,0.2)}`}</style>
      <div className="fixed bottom-6 right-4 z-[100] flex flex-col items-end gap-2">
        {showCart&&cart.length>0&&<div className="bg-white text-black rounded-[20px] p-4 w-[92vw] max-w-[360px] shadow-2xl"><div className="flex justify-between mb-2"><b>Pedido ({count})</b><button onClick={()=>setShowCart(false)}>✕</button></div>{cart.map(i=><div key={i.cartId} className="flex gap-2 bg-black/5 rounded-xl p-2 mb-1"><img src={i.image_url} className="w-10 h-10 rounded object-cover"/><div className="flex-1 text-xs"><b>{i.name}</b><br/>{i.qty}x C$ {i.price}</div></div>)}<div className="border-t mt-2 pt-2 flex justify-between font-black"><span>Total</span><span>C$ {total}</span></div><button onClick={sendWA} className="mt-3 w-full bg-[#00E676] py-3 rounded-full font-black">WhatsApp</button></div>}
        <button onClick={()=>setShowCart(!showCart)} className="bg-white text-black px-5 py-4 rounded-full font-black shadow-2xl">🛒 {count>0?`${count} • C$ ${total}`:'Carrito'}</button>
      </div>
      <div className="relative h-[42vh] overflow-hidden"><img src={store.cover_image} className="absolute inset-0 w-full h-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div><div className="absolute bottom-4 left-4 right-4"><div className="glass rounded-[16px] px-4 py-3"><h1 className="text-white text-[20px] font-black uppercase">{store.name}</h1><p className="text-white/60 text-[11px]">{store.description}</p>{isComida&&<span className="mt-2 inline-block bg-[#00E676] text-black text-[10px] font-black px-3 py-1 rounded-full">🔥 Especialidad de la Casa</span>}</div></div></div>
      <div className="max-w-6xl mx-auto px-4 py-6 pb-28">
        {isComida&&prods[0]&&<div className="mb-6 bg-[#00E676]/15 border border-[#00E676]/30 rounded-[20px] p-4 flex gap-3 items-center"><div className="w-20 h-20 rounded-[14px] overflow-hidden premium-shadow flex-shrink-0"><img src={prods[0].image_url} className="w-full h-full object-cover"/></div><div className="flex-1"><p className="bg-[#00E676] text-black text-[10px] font-black px-2 py-1 rounded-full w-fit">🔥 ESPECIALIDAD DE LA CASA</p><p className="font-black text-white mt-1">{prods[0].name}</p><p className="text-[11px] text-white/60">La más pedida</p></div><button onClick={()=>addToCart(prods[0])} className="bg-white text-black px-4 py-2 rounded-full font-black text-xs">Añadir</button></div>}
        <div className={`grid gap-5 ${isBoutique?'grid-cols-2 md:grid-cols-3':'grid-cols-1 md:grid-cols-2'}`}>
          {prods.map((pr,i)=>{
            const esEspecialidad=isComida&&i===0
            if(isBoutique){
              return <div key={pr.id} className="bg-white rounded-[20px] overflow-hidden premium-shadow"><button onClick={()=>setSelected(pr)} className="w-full aspect-[4/5] relative overflow-hidden"><img src={pr.image_url} className="w-full h-full object-cover"/><span className="absolute top-3 left-3 bg-black/80 text-white text-[9px] px-2 py-1 rounded-full">{pr.extra_images?.length?pr.extra_images.length+1+' fotos':''}</span></button><div className="p-3"><p className="text-[12px] font-medium min-h-[32px] line-clamp-2">{pr.name}</p><p className="font-black text-[13px] mt-1">C$ {pr.price}</p><button onClick={()=>setSelected(pr)} className="mt-2 w-full bg-black text-white py-2 rounded-full text-[11px] font-bold">Ver tallas</button></div></div>
            }
            return(
              <div key={pr.id} className={`rounded-[22px] overflow-hidden premium-shadow bg-white text-black ${esEspecialidad?'ring-2 ring-[#00E676]':''}`}>
                {esEspecialidad&&<div className="absolute top-3 left-3 z-10 bg-[#00E676] text-black text-[10px] font-black px-3 py-1.5 rounded-full">🔥 ESPECIALIDAD</div>}
                <button onClick={()=>setSelected(pr)} className="w-full aspect-square relative overflow-hidden bg-white">
                  <img src={pr.image_url} className="w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between"><span className="bg-black/70 text-white text-[10px] px-2 py-1 rounded-full">⏱️ 25-30 min</span><span className="bg-white text-black text-[10px] font-black px-2 py-1 rounded-full">C$ {pr.price}</span></div>
                </button>
                <div className="p-4"><h3 className="font-black text-[16px]">{pr.name}</h3><p className="text-[11px] text-black/50 mt-1">Ingredientes frescos, hecho al momento</p><div className="flex gap-2 mt-3"><button onClick={()=>setSelected(pr)} className="flex-1 border py-2.5 rounded-full font-bold text-[11px]">Ver detalles</button><button onClick={()=>addToCart(pr)} className="flex-1 bg-[#00E676] py-2.5 rounded-full font-black text-[11px]">Añadir • C$ {pr.price}</button></div></div>
              </div>
            )
          })}
        </div>
      </div>
      {selected&&<div className="fixed inset-0 z-[200] bg-black/80 flex items-end md:items-center justify-center p-0 md:p-4" onClick={()=>setSelected(null)}><div className="bg-white w-full md:max-w-[800px] rounded-t-[24px] md:rounded-[24px] overflow-hidden max-h-[90vh] flex flex-col md:flex-row" onClick={e=>e.stopPropagation()}><div className="md:w-[55%] bg-[#FBF9F7]"><img src={selected.image_url} className="w-full h-[45vh] md:h-[65vh] object-cover"/></div><div className="p-5 md:w-[45%]"><h3 className="font-black text-[18px] text-black">{selected.name}</h3><p className="font-black text-[18px] text-black mt-1">C$ {selected.price}</p><button onClick={()=>{addToCart(selected,selectedTalla); setSelected(null)}} className="mt-6 w-full bg-black text-white py-3 rounded-full font-black">Añadir</button><button onClick={()=>setSelected(null)} className="mt-2 w-full bg-black/5 py-3 rounded-full font-bold">Cerrar</button></div></div></div>}
    </main>
  )
}
