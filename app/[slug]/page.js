'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const CFG = {
  comida: { label:'🍔 Comida', badge:'Entrega 30 min', cta:'Añadir', prefix:'C$', pills:['NUEVO','Envio rapido','Abierto hoy 8am-9pm'] },
  boutique: { label:'👗 Boutique', badge:'Nueva Coleccion • ES', cta:'Añadir a bolsa', prefix:'C$', pills:['NUEVA','Envio Gratis ES','Tallas S M L'] },
  electro: { label:'📱 Electro', badge:'12 Cuotas • Garantia', cta:'Añadir', prefix:'C$', pills:['NUEVO','12 Cuotas','Garantia 1 año'] }
}

export default function Tienda({ params }){
  const slug = params?.slug
  const [store, setStore] = useState(null)
  const [prods, setProds] = useState([])
  const [cart, setCart] = useState([])
  const [selected, setSelected] = useState(null)
  const [showCart, setShowCart] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    (async()=>{
      if(!slug) return
      const { data: s } = await supabase.from('stores').select('*').eq('slug', slug).single()
      if(!s){ setLoading(false); return }
      setStore(s)
      const { data: p } = await supabase.from('products').select('*').eq('store_id', s.id).eq('is_active', true).order('created_at',{ascending:false})
      setProds(p||[])
      setLoading(false)
    })()
  },[slug])

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

  if(loading) return <div className="min-h-screen bg-black text-white p-10">Cargando {slug}...</div>
  if(!store) return <div className="min-h-screen bg-black text-white p-10">Tienda no encontrada</div>

  const tipo = store.tipo_tienda || 'comida'
  const cfg = CFG[tipo] || CFG.comida

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <style>{`.glass{background:rgba(255,255,255,0.08);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.12)} .glass-strong{background:rgba(255,255,255,0.13);backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.16)}`}</style>

      {/* CARRITO FLOTANTE */}
      <div className="fixed bottom-6 right-4 z-[100] flex flex-col items-end gap-2">
        {showCart && cart.length>0 && (
          <div className="glass-strong rounded-[20px] p-4 w-[92vw] max-w-[360px] shadow-2xl">
            <div className="flex justify-between items-center mb-3"><h3 className="font-black text-sm">Tu pedido ({count})</h3><button onClick={()=>setShowCart(false)} className="text-white/50 text-xs">✕</button></div>
            <div className="max-h-[40vh] overflow-auto space-y-2">
              {cart.map(i=>(
                <div key={i.id} className="flex gap-2 bg-black/40 rounded-xl p-2">
                  <img src={i.image_url} className="w-12 h-12 rounded-lg object-cover"/>
                  <div className="flex-1"><p className="text-xs font-bold truncate">{i.name}</p><p className="text-[11px] text-white/50">{i.qty}x {cfg.prefix} {i.price}</p></div>
                  <button onClick={()=>removeFromCart(i.id)} className="text-[10px] bg-white/10 px-2 rounded-full h-6 self-center">✕</button>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 mt-3 pt-3 flex justify-between font-black text-sm"><span>Total</span><span>{cfg.prefix} {total}</span></div>
            <button onClick={sendWhatsApp} className="mt-3 w-full bg-[#00E676] text-black py-3 rounded-full font-black text-sm">Pedir por WhatsApp</button>
            <button onClick={()=>setCart([])} className="mt-2 w-full text-[11px] text-white/40 underline">Vaciar carrito</button>
          </div>
        )}
        <button onClick={()=>setShowCart(!showCart)} className="relative bg-white text-black rounded-full px-5 py-4 font-black text-sm shadow-2xl flex items-center gap-2">
          🛒 {count>0?`${count} • ${cfg.prefix} ${total}`:'Carrito'}
          {count>0 && <span className="absolute -top-2 -right-2 bg-[#00E676] text-black text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-black">{count}</span>}
        </button>
      </div>

      {/* HERO MAS CHICO - NO TAPA */}
      <div className="relative h-[48vh] md:h-[52vh] overflow-hidden">
        <img src={store.cover_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2000'} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/5"></div>
        {/* Glass chico abajo izquierda */}
        <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-auto">
          <div className="glass-strong rounded-[18px] md:rounded-[20px] px-4 py-3 md:px-5 md:py-4 max-w-[88%] md:max-w-[420px]">
            <div className="flex items-center gap-2">
              <span className="bg-[#00E676] text-black text-[9px] font-black px-2.5 py-1 rounded-full tracking-widest">{cfg.badge}</span>
              <span className="bg-white/10 border border-white/20 text-[9px] font-bold px-2.5 py-1 rounded-full">{cfg.label}</span>
            </div>
            <h1 className="text-[22px] md:text-[28px] font-black uppercase leading-[0.9] tracking-tight mt-2">{store.name}</h1>
            <p className="text-white/60 text-[11px] md:text-xs mt-1.5 line-clamp-1">{store.description || 'Ubu Norte - Paiwas'}</p>
          </div>
        </div>
        {/* Boton WhatsApp chico esquina */}
        <a href={`https://wa.me/${store.whatsapp}`} target="_blank" className="absolute top-4 right-4 bg-white text-black text-[11px] font-black px-4 py-2 rounded-full shadow">WhatsApp</a>
      </div>

      <div className="sticky top-0 z-20 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex gap-2 overflow-x-auto">
          {cfg.pills.map((p,i)=><span key={i} className={`whitespace-nowrap text-[11px] font-bold px-4 py-2 rounded-full ${i===0?'bg-[#00E676] text-black':'glass text-white/70'}`}>{p}</span>)}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex justify-between items-end mb-5">
          <div><h2 className="text-lg md:text-xl font-black">Productos disponibles</h2><p className="text-white/40 text-[11px] mt-1">Toca la imagen para ver completa • Modo {tipo} • Toca 🛒 para ver carrito</p></div>
          <span className="text-[11px] text-white/30">{prods.length} productos</span>
        </div>

        <div className={`grid gap-3 ${tipo==='boutique'?'grid-cols-2 md:grid-cols-3':'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {prods.map(pr=>{
            const isBoutique = tipo==='boutique'
            return (
              <div key={pr.id} className="glass rounded-[18px] overflow-hidden group">
                <button onClick={()=>setSelected(pr)} className={`relative w-full bg-white overflow-hidden text-left ${isBoutique?'aspect-[3/4]':'aspect-[16/10]'}`}>
                  <img src={pr.image_url} className="w-full h-full object-cover group-hover:scale-[1.02] transition" />
                  <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur text-white text-[9px] px-2 py-1 rounded-full">Ver</span>
                </button>
                <div className="p-3">
                  <div className="flex justify-between gap-2"><p className="font-bold text-[13px] leading-tight truncate pr-2">{pr.name}</p><span className="font-black text-[13px]">{cfg.prefix} {pr.price}</span></div>
                  <button onClick={()=>addToCart(pr)} className={`mt-3 w-full py-2.5 rounded-full font-black text-[12px] ${tipo==='boutique'?'bg-white text-black':tipo==='electro'?'bg-[#7C4DFF] text-white':'bg-[#00E676] text-black'}`}>{cfg.cta} • {cfg.prefix} {pr.price}</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL VISTA PREVIA */}
      {selected && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur flex items-center justify-center p-4" onClick={()=>setSelected(null)}>
          <div className="bg-[#1A1A1A] border border-white/10 rounded-[24px] overflow-hidden max-w-[480px] w-full" onClick={e=>e.stopPropagation()}>
            <img src={selected.image_url} className="w-full max-h-[60vh] object-contain bg-white" />
            <div className="p-5">
              <div className="flex justify-between items-start"><div><h3 className="font-black text-lg">{selected.name}</h3><p className="text-white/50 text-xs mt-1">Disponible • Entrega inmediata</p></div><span className="font-black text-lg">{cfg.prefix} {selected.price}</span></div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button onClick={()=>{ addToCart(selected); setSelected(null) }} className="bg-[#00E676] text-black py-3 rounded-full font-black text-sm">Añadir al carrito</button>
                <button onClick={()=>setSelected(null)} className="glass py-3 rounded-full font-bold text-sm">Cerrar</button>
              </div>
              <a href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent('Hola quiero '+selected.name)}`} target="_blank" className="mt-2 block text-center text-xs text-white/40 underline">O pedir directo por WhatsApp</a>
            </div>
          </div>
        </div>
      )}

      <div className="text-center py-8 text-[10px] text-white/20 border-t border-white/10 mt-6">Potenciado por TiendaNica • {store.name} • {tipo}</div>
    </main>
  )
}
