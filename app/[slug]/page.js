'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const CFG = {
  comida: { label:'🍔 Comida', badge:'Entrega 30 min', prefix:'C$', pills:['NUEVO','Envio rapido','Abierto hoy'], btn:'bg-[#00E676] text-black' },
  boutique: { label:'👗 Boutique', badge:'Nueva Coleccion • ES', prefix:'C$', pills:['NUEVA','Envio Gratis ES','Tallas S M L'], btn:'bg-black text-white' },
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

  const addToCart = (pr)=>{
    setCart(prev=>{
      const ex = prev.find(i=>i.id===pr.id)
      if(ex) return prev.map(i=>i.id===pr.id?{...i,qty:i.qty+1}:i)
      return [...prev, {...pr, qty:1}]
    })
    setShowCart(true)
  }
  const removeFromCart = (id)=> setCart(c=>c.filter(i=>i.id!==id))
  const total = cart.reduce((sum,i)=>sum + i.price*i.qty, 0)
  const count = cart.reduce((sum,i)=>sum + i.qty, 0)

  const sendWhatsApp = ()=>{
    if(!store || cart.length===0) return
    let msg = `Hola ${store.name}! Quiero pedir:\n`
    cart.forEach(i=>{ msg+=`• ${i.qty}x ${i.name} - ${CFG[store.tipo_tienda||'comida'].prefix} ${i.price*i.qty}\n` })
    msg+=`\nTotal: ${CFG[store.tipo_tienda||'comida'].prefix} ${total}\n\nVi tu tienda en TiendaNica: https://tiendanica.store/${store.slug}`
    window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(msg)}`,'_blank')
  }

  if(loading) return <div className="min-h-screen bg-black text-white p-10">Cargando...</div>
  if(!store) return <div className="min-h-screen bg-black text-white p-10">No encontrada</div>
  const tipo = store.tipo_tienda || 'comida'
  const cfg = CFG[tipo]
  const isBoutique = tipo==='boutique'

  return (
    <main className={`${isBoutique?'bg-[#FAF7F5] text-black':'bg-[#0A0A0A] text-white'} min-h-screen`}>
      <style>{`.glass{background:rgba(255,255,255,0.08);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.12)}.glass-strong{background:rgba(255,255,255,0.13);backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.16)}.card-white{background:#FFFFFF;border:1px solid rgba(0,0,0,0.06);box-shadow:0 4px 24px rgba(0,0,0,0.06)}`}</style>

      {/* CARRITO COMPLETO CON VISTA PREVIA */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-[100] flex flex-col items-end gap-2">
        {showCart && cart.length>0 && (
          <div className={`${isBoutique?'bg-white border border-black/10':'glass-strong'} rounded- p-4 w- max-w- shadow-2xl`}>
            <div className="flex justify-between items-center mb-3"><h3 className={`font-black text-sm ${isBoutique?'text-black':'text-white'}`}>Tu pedido ({count})</h3><button onClick={()=>setShowCart(false)} className="opacity-50 text-xs">✕</button></div>
            <div className="max-h- overflow-auto space-y-2">
              {cart.map(i=>(
                <div key={i.id} className={`flex gap-2 rounded-xl p-2 ${isBoutique?'bg-black/5':'bg-black/40'}`}>
                  <img src={i.image_url} className="w-12 h-12 rounded-lg object-cover"/>
                  <div className="flex-1"><p className="text-xs font-bold truncate">{i.name}</p><p className="text- opacity-60">{i.qty}x {cfg.prefix} {i.price}</p></div>
                  <button onClick={()=>removeFromCart(i.id)} className="text- bg-black/10 px-2 rounded-full h-6 self-center">✕</button>
                </div>
              ))}
            </div>
            <div className={`border-t ${isBoutique?'border-black/10':'border-white/10'} mt-3 pt-3 flex justify-between font-black text-sm`}><span>Total</span><span>{cfg.prefix} {total}</span></div>
            <button onClick={sendWhatsApp} className={`mt-3 w-full py-3 rounded-full font-black text-sm ${tipo==='boutique'?'bg-black text-white':tipo==='electro'?'bg-[#7C4DFF] text-white':'bg-[#00E676] text-black'}`}>Pedir por WhatsApp</button>
            <button onClick={()=>setCart([])} className="mt-2 w-full text- opacity-40 underline">Vaciar carrito</button>
          </div>
        )}
        <button onClick={()=>setShowCart(!showCart)} className={`relative rounded-full px-5 py-4 font-black text-sm shadow-2xl ${isBoutique?'bg-black text-white':'bg-white text-black'}`}>
          🛒 {count>0?`${count} • ${cfg.prefix} ${total}`:'Carrito'}
          {count>0 && <span className="absolute -top-2 -right-2 bg-[#00E676] text-black text- w-6 h-6 rounded-full flex items-center justify-center font-black">{count}</span>}
        </button>
      </div>

      <div className="relative h- overflow-hidden">
        <img src={store.cover_image} className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        <div className="absolute bottom-4 left-4 glass-strong rounded- px-4 py-3 max-w-[88%]"><h1 className="text-white text- font-black uppercase">{store.name}</h1><p className="text-white/60 text-">{store.description}</p></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 pb-28">
        <div className={`grid gap-4 ${isBoutique?'grid-cols-2 md:grid-cols-3':'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {prods.map(pr=>{
            if(isBoutique){
              return (
                <div key={pr.id} className="card-white rounded- overflow-hidden">
                  <button onClick={()=>setSelected(pr)} className="w-full aspect-[3/4] bg-[#FAF8F6] relative"><img src={pr.image_url} className="w-full h-full object-cover"/><span className="absolute bottom-3 right-3 bg-black/80 text-white text- px-2.5 py-1.5 rounded-full">Ver</span></button>
                  <div className="p-3.5"><div className="flex justify-between"><p className="font-bold text- text-black truncate">{pr.name}</p><span className="font-black text-black">{cfg.prefix} {pr.price}</span></div><button onClick={()=>addToCart(pr)} className="mt-3 w-full bg-black text-white py-2.5 rounded-full font-black text-">Añadir a bolsa • {cfg.prefix} {pr.price}</button></div>
                </div>
              )
            }
            return (
              <div key={pr.id} className="glass rounded- overflow-hidden border border-white/10">
                <button onClick={()=>setSelected(pr)} className="w-full aspect-[4/3] bg-white"><img src={pr.image_url} className="w-full h-full object-contain p-2"/></button>
                <div className="p-3.5"><div className="flex justify-between"><p className="font-bold text- truncate">{pr.name}</p><span className="font-black">{cfg.prefix} {pr.price}</span></div><button onClick={()=>addToCart(pr)} className={`mt-3 w-full py-2.5 rounded-full font-black text- ${cfg.btn}`}>Añadir • {cfg.prefix} {pr.price}</button></div>
              </div>
            )
          })}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={()=>setSelected(null)}>
          <div className="bg-white rounded- max-w- w-full overflow-hidden" onClick={e=>e.stopPropagation()}>
            <img src={selected.image_url} className="w-full max-h- object-contain bg-white"/>
            <div className="p-5">
              <div className="flex justify-between"><h3 className="font-black text-lg text-black">{selected.name}</h3><span className="font-black text-black">{cfg.prefix} {selected.price}</span></div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button onClick={()=>{addToCart(selected); setSelected(null)}} className={`py-3 rounded-full font-black text-sm ${tipo==='boutique'?'bg-black text-white':tipo==='electro'?'bg-[#7C4DFF] text-white':'bg-[#00E676] text-black'}`}>Añadir al carrito</button>
                <button onClick={()=>setSelected(null)} className="bg-black/5 py-3 rounded-full font-bold text-sm">Cerrar</button>
              </div>
              <a href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent('Hola quiero '+selected.name)}`} target="_blank" className="mt-3 block text-center text-xs opacity-40 underline">O pedir directo por WhatsApp</a>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}