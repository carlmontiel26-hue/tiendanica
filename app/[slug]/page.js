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

  const addToCart = (pr)=>{
    setCart(prev=>{
      const ex = prev.find(i=>i.id===pr.id)
      if(ex) return prev.map(i=>i.id===pr.id?{...i,qty:i.qty+1}:i)
      return [...prev, {...pr, qty:1}]
    })
    setShowCart(true)
  }
  const removeFromCart = (id)=> setCart(c=>c.filter(i=>i.id!==id))
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
      <style>{`.glass{background:rgba(255,255,255,0.08);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.12)}.glass-strong{background:rgba(255,255,255,0.13);backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.16)}.card-white{background:#FFFFFF;border:1px solid rgba(0,0,0,0.06);box-shadow:0 2px 16px rgba(0,0,0,0.04)}`}</style>

      {/* CARRITO COMPLETO CON VISTA PREVIA + WHATSAPP - REGRESADO */}
      <div className="fixed bottom-6 right-4 z-[100] flex flex-col items-end gap-2">
        {showCart && cart.length>0 && (
          <div className={`${isBoutique?'bg-white border border-black/10':'glass-strong'} rounded-[20px] p-4 w-[92vw] max-w-[360px] shadow-2xl`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className={`font-black text-sm ${isBoutique?'text-black':'text-white'}`}>Tu pedido ({count})</h3>
              <button onClick={()=>setShowCart(false)} className="opacity-50 text-xs">✕</button>
            </div>
            <div className="max-h-[40vh] overflow-auto space-y-2">
              {cart.map(i=>(
                <div key={i.id} className={`flex gap-2 rounded-xl p-2 ${isBoutique?'bg-black/5':'bg-black/40'}`}>
                  <img src={i.image_url} className="w-12 h-12 rounded-lg object-cover"/>
                  <div className="flex-1"><p className="text-xs font-bold truncate">{i.name}</p><p className="text-[11px] opacity-60">{i.qty}x {cfg.prefix} {i.price}</p></div>
                  <button onClick={()=>removeFromCart(i.id)} className="text-[10px] bg-black/10 px-2 rounded-full h-6 self-center">✕</button>
                </div>
              ))}
            </div>
            <div className={`border-t ${isBoutique?'border-black/10':'border-white/10'} mt-3 pt-3 flex justify-between font-black text-sm`}><span>Total</span><span>{cfg.prefix} {total}</span></div>
            <button onClick={sendWA} className={`mt-3 w-full py-3 rounded-full font-black text-sm ${tipo==='boutique'?'bg-black text-white':tipo==='electro'?'bg-[#7C4DFF] text-white':'bg-[#00E676] text-black'}`}>Pedir por WhatsApp</button>
            <button onClick={()=>setCart([])} className="mt-2 w-full text-[11px] opacity-40 underline">Vaciar carrito</button>
          </div>
        )}
        <button onClick={()=>setShowCart(!showCart)} className={`relative rounded-full px-5 py-4 font-black text-sm shadow-2xl ${isBoutique?'bg-black text-white':'bg-white text-black'}`}>
          🛒 {count>0?`${count} • ${cfg.prefix} ${total}`:'Carrito'}
          {count>0 && <span className="absolute -top-2 -right-2 bg-[#00E676] text-black text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-black">{count}</span>}
        </button>
      </div>

      {/* PORTADA RESTAURADA - SIEMPRE VISIBLE */}
      <div className="relative h-[46vh] md:h-[52vh] overflow-hidden">
        <img src={store.cover_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2000'} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10"></div>
        <div className="absolute bottom-4 left-4 right-4 md:left-6 md:max-w-[440px]">
          <div className="glass-strong rounded-[18px] px-4 py-3.5">
            <div className="flex gap-2 mb-1.5">
              <span className={`${tipo==='electro'?'bg-[#7C4DFF]':tipo==='boutique'?'bg-black':'bg-[#00E676]'} text-white text-[9px] font-black px-2.5 py-1 rounded-full tracking-widest`}>{cfg.badge}</span>
              <span className="bg-white/10 border border-white/20 text-white text-[9px] font-bold px-2.5 py-1 rounded-full">{cfg.label}</span>
            </div>
            <h1 className="text-white text-[22px] md:text-[28px] font-black uppercase leading-[0.9]">{store.name}</h1>
            <p className="text-white/60 text-[11px] mt-1 line-clamp-1">{store.description}</p>
          </div>
        </div>
        <a href={`https://wa.me/${store.whatsapp}`} target="_blank" className="absolute top-4 right-4 bg-white text-black text-[11px] font-black px-4 py-2 rounded-full">WhatsApp</a>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 pb-28">
        <div className={`grid gap-3 ${isBoutique?'grid-cols-2 md:grid-cols-3':'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {prods.map(pr=>{
            if(isBoutique){
              // BOUTIQUE BONITA - TEXTO NO ESCONDE + BOTON CHICO
              return (
                <div key={pr.id} className="card-white rounded-[16px] overflow-hidden group">
                  <button onClick={()=>setSelected(pr)} className="w-full aspect-[4/5] bg-[#FBF9F7] overflow-hidden">
                    <img src={pr.image_url} className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500" />
                  </button>
                  <div className="p-3">
                    <p className="font-medium text-[12px] leading-[1.25] text-black min-h-[32px] line-clamp-2">{pr.name}</p>
                    <p className="font-black text-[13px] text-black mt-1">{cfg.prefix} {pr.price}</p>
                    <button onClick={()=>addToCart(pr)} className="mt-2.5 w-full bg-black text-white py-2 rounded-full font-bold text-[11px] tracking-wide">Añadir a bolsa</button>
                  </div>
                </div>
              )
            }
            // ELECTRO Y COMIDA
            return (
              <div key={pr.id} className="glass rounded-[16px] overflow-hidden border border-white/10">
                <button onClick={()=>setSelected(pr)} className="w-full aspect-[4/3] bg-white overflow-hidden"><img src={pr.image_url} className="w-full h-full object-contain p-3" /></button>
                <div className="p-3">
                  <p className="font-medium text-[12px] leading-[1.25] min-h-[32px] line-clamp-2">{pr.name}</p>
                  <p className="font-black text-[13px] mt-1">{cfg.prefix} {pr.price}</p>
                  <button onClick={()=>addToCart(pr)} className={`mt-2.5 w-full py-2.5 rounded-full font-bold text-[11px] ${cfg.btn}`}>Añadir • {cfg.prefix} {pr.price}</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4" onClick={()=>setSelected(null)}>
          <div className="bg-white rounded-[20px] overflow-hidden max-w-[400px] w-full" onClick={e=>e.stopPropagation()}>
            <img src={selected.image_url} className="w-full max-h-[60vh] object-contain"/>
            <div className="p-4"><h3 className="font-black text-black">{selected.name}</h3><p className="font-bold mt-1 text-black">{cfg.prefix} {selected.price}</p><button onClick={()=>{addToCart(selected); setSelected(null)}} className={`mt-3 w-full py-3 rounded-full font-black text-sm ${isBoutique?'bg-black text-white':'bg-[#7C4DFF] text-white'}`}>Añadir al carrito</button><button onClick={()=>setSelected(null)} className="mt-2 w-full text-xs opacity-50">Cerrar</button></div>
          </div>
        </div>
      )}
    </main>
  )
}
