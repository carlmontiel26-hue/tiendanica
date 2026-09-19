'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const CFG = {
  comida: { label:'🍔 Comida', badge:'Entrega 30 min', prefix:'C$', pills:['NUEVO','Envio rapido','Abierto'], btn:'bg-[#00E676] text-black' },
  boutique: { label:'👗 Boutique', badge:'Nueva Coleccion', prefix:'C$', pills:['NUEVA','Envio Gratis','Tallas S M L'], btn:'bg-black text-white' },
  electro: { label:'📱 Electro', badge:'12 Cuotas • Garantia', prefix:'C$', pills:['NUEVO','12 Cuotas','Garantia 1 año'], btn:'bg-[#7C4DFF] text-white' }
}
export default function Tienda({ params }){
  const slug = params?.slug
  const [store, setStore] = useState(null)
  const [prods, setProds] = useState([])
  const [cart, setCart] = useState([])
  const [selected, setSelected] = useState(null)
  const [showCart, setShowCart] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(()=>{ (async()=>{
    if(!slug) return
    const { data: s } = await supabase.from('stores').select('*').eq('slug', slug).single()
    if(!s){ setLoading(false); return }
    setStore(s)
    const { data: p } = await supabase.from('products').select('*').eq('store_id', s.id).eq('is_active', true).order('created_at',{ascending:false})
    setProds(p||[]); setLoading(false)
  })()},[slug])
  const addToCart = (pr)=>{ setCart(prev=>{ const ex=prev.find(i=>i.id===pr.id); if(ex) return prev.map(i=>i.id===pr.id?{...i,qty:i.qty+1}:i); return [...prev,{...pr,qty:1}] }); setShowCart(true) }
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0)
  const count = cart.reduce((s,i)=>s+i.qty,0)
  const sendWA = ()=>{
    if(!store || cart.length===0) return
    let msg=`Hola ${store.name}! Quiero pedir:\n`
    cart.forEach(i=>{ msg+=`• ${i.qty}x ${i.name} - C$ ${i.price*i.qty}\n` })
    msg+=`\nTotal: C$ ${total}\nhttps://tiendanica.store/${store.slug}`
    window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(msg)}`,'_blank')
  }
  if(loading) return <div className="min-h-screen bg-black text-white p-10">Cargando {slug}...</div>
  if(!store) return <div className="min-h-screen bg-black text-white p-10">No encontrada</div>
  const tipo = store.tipo_tienda || 'comida'
  const cfg = CFG[tipo]
  const isBoutique = tipo==='boutique'
  return (
    <main className={`${isBoutique?'bg-[#F6F3F0] text-black':'bg-[#0A0A0A] text-white'} min-h-screen`}>
      <style>{`.glass{background:rgba(255,255,255,0.08);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.12)}.glass-strong{background:rgba(255,255,255,0.13);backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.16)}.card-white{background:#FFF;border:1px solid rgba(0,0,0,0.05)}`}</style>
      <div className="fixed bottom-6 right-4 z-[100]"><button onClick={()=>setShowCart(!showCart)} className={`rounded-full px-5 py-3 font-black text-sm shadow-xl ${isBoutique?'bg-black text-white':'bg-white text-black'}`}>🛒 {count>0?`${count} • C$${total}`:'Carrito'}</button></div>
      <div className="relative h-[46vh] md:h-[52vh] overflow-hidden">
        <img src={store.cover_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2000'} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10"></div>
        <div className="absolute bottom-4 left-4 right-4 md:left-6 md:max-w-[440px]"><div className="glass-strong rounded-[18px] px-4 py-3.5"><h1 className="text-white text-[22px] font-black uppercase">{store.name}</h1><p className="text-white/60 text-[11px] mt-1">{store.description}</p></div></div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6 pb-28">
        <h2 className={`text-[18px] font-black ${isBoutique?'text-black':'text-white'}`}>Productos disponibles</h2>
        <div className={`grid gap-3 mt-4 ${isBoutique?'grid-cols-2 md:grid-cols-3':'grid-cols-1 md:grid-cols-2'}`}>
          {prods.map(pr=>{
            if(isBoutique){
              return (<div key={pr.id} className="card-white rounded-[16px] overflow-hidden"><button onClick={()=>setSelected(pr)} className="w-full aspect-[4/5] bg-[#FBF9F7]"><img src={pr.image_url} className="w-full h-full object-cover"/></button><div className="p-3"><p className="font-medium text-[12px] leading-[1.2] h-[30px] line-clamp-2 text-black">{pr.name}</p><p className="font-black text-[13px] text-black mt-1">C$ {pr.price}</p><button onClick={()=>addToCart(pr)} className="mt-2.5 w-full bg-black text-white py-2 rounded-full font-bold text-[11px]">Añadir a bolsa</button></div></div>)
            } else {
              return (<div key={pr.id} className="glass rounded-[16px] overflow-hidden"><button onClick={()=>setSelected(pr)} className="w-full aspect-[4/3] bg-white"><img src={pr.image_url} className="w-full h-full object-contain p-3"/></button><div className="p-3"><p className="font-medium text-[12px] h-[30px] line-clamp-2">{pr.name}</p><p className="font-black text-[13px] mt-1">C$ {pr.price}</p><button onClick={()=>addToCart(pr)} className={`mt-2.5 w-full py-2.5 rounded-full font-bold text-[11px] ${cfg.btn}`}>Añadir • C$ {pr.price}</button></div></div>)
            }
          })}
        </div>
      </div>
      {selected && (<div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4" onClick={()=>setSelected(null)}><div className="bg-white rounded-[20px] max-w-[400px] w-full overflow-hidden" onClick={e=>e.stopPropagation()}><img src={selected.image_url} className="w-full max-h-[60vh] object-contain"/><div className="p-4"><h3 className="font-black text-black">{selected.name}</h3><button onClick={()=>{addToCart(selected); setSelected(null)}} className="mt-3 w-full py-3 rounded-full font-black text-sm bg-black text-white">Añadir al carrito</button></div></div></div>)}
    </main>
  )
}
