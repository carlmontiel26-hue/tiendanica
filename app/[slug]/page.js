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
  const [selectedTalla, setSelectedTalla] = useState(null)

  useEffect(()=>{ (async()=>{
    if(!slug) return
    const { data: s } = await supabase.from('stores').select('*').eq('slug', slug).single()
    if(!s){ setLoading(false); return }
    setStore(s)
    const { data: p } = await supabase.from('products').select('*').eq('store_id', s.id).eq('is_active', true).order('created_at',{ascending:false})
    setProds(p||[]); setLoading(false)
  })()},[slug])

  useEffect(()=>{ if(selected){ setSelectedTalla(null) } },[selected])

  const getImages = (pr)=>{
    if(!pr) return []
    const extras = pr.extra_images || []
    const all = [pr.image_url, ...extras].filter(Boolean)
    return all.slice(0,3)
  }

  const addToCart = (pr, talla=null)=>{
    if(tipo==='boutique' && pr.tallas && pr.tallas.length>0 && !talla){
      alert('Selecciona una talla')
      return
    }
    setCart(prev=>{
      const idKey = talla ? `${pr.id}-${talla}` : `${pr.id}`
      const ex = prev.find(i=>i.cartId===idKey)
      if(ex) return prev.map(i=>i.cartId===idKey?{...i,qty:i.qty+1}:i)
      return [...prev, {...pr, cartId:idKey, qty:1, tallaSeleccionada: talla}]
    })
    setShowCart(true)
  }
  const removeFromCart = (cartId)=> setCart(c=>c.filter(i=>i.cartId!==cartId))
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0)
  const count = cart.reduce((s,i)=>s+i.qty,0)
  const sendWA = ()=>{
    if(!store || cart.length===0) return
    let msg=`Hola ${store.name}! Quiero pedir:\n`
    cart.forEach(i=>{
      const t = i.tallaSeleccionada ? ` - Talla ${i.tallaSeleccionada}` : ''
      msg+=`• ${i.qty}x ${i.name}${t} - C$ ${i.price*i.qty}\n`
    })
    msg+=`\nTotal: C$ ${total}\nhttps://tiendanica.store/${store.slug}`
    window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(msg)}`,'_blank')
  }

  if(loading) return <div className="min-h-screen bg-black text-white p-10">Cargando...</div>
  if(!store) return <div className="min-h-screen bg-black text-white p-10">No encontrada</div>
  const tipo = store.tipo_tienda || 'comida'
  const cfg = CFG[tipo]
  const isBoutique = tipo==='boutique'

  return (
    <main className={`${isBoutique?'bg-[#F6F3F0] text-black':'bg-[#0A0A0A] text-white'} min-h-screen`}>
      <style>{`.glass{background:rgba(255,255,255,0.08);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.12)}.glass-strong{background:rgba(255,255,255,0.13);backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.16)}.card-white{background:#FFFFFF;border:1px solid rgba(0,0,0,0.06)}.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}.snap-x{scroll-snap-type:x mandatory}.snap-center{scroll-snap-align:center}`}</style>

      <div className="fixed bottom-6 right-4 z-[100] flex flex-col items-end gap-2">
        {showCart && cart.length>0 && (
          <div className={`${isBoutique?'bg-white border border-black/10':'glass-strong'} rounded-[20px] p-4 w-[92vw] max-w-[360px] shadow-2xl`}>
            <div className="flex justify-between items-center mb-3"><h3 className={`font-black text-sm ${isBoutique?'text-black':'text-white'}`}>Tu pedido ({count})</h3><button onClick={()=>setShowCart(false)} className="opacity-50 text-xs">✕</button></div>
            <div className="max-h-[40vh] overflow-auto space-y-2">
              {cart.map(i=>(
                <div key={i.cartId} className={`flex gap-2 rounded-xl p-2 ${isBoutique?'bg-black/5':'bg-black/40'}`}>
                  <img src={i.image_url} className="w-12 h-12 rounded-lg object-cover"/>
                  <div className="flex-1"><p className="text-xs font-bold truncate">{i.name}</p><p className="text-[11px] opacity-60">{i.qty}x {cfg.prefix} {i.price} {i.tallaSeleccionada?`• Talla ${i.tallaSeleccionada}`:''}</p></div>
                  <button onClick={()=>removeFromCart(i.cartId)} className="text-[10px] bg-black/10 px-2 rounded-full h-6 self-center">✕</button>
                </div>
              ))}
            </div>
            <div className={`border-t ${isBoutique?'border-black/10':'border-white/10'} mt-3 pt-3 flex justify-between font-black text-sm`}><span>Total</span><span>{cfg.prefix} {total}</span></div>
            <button onClick={sendWA} className={`mt-3 w-full py-3 rounded-full font-black text-sm ${tipo==='boutique'?'bg-black text-white':tipo==='electro'?'bg-[#7C4DFF] text-white':'bg-[#00E676] text-black'}`}>Pedir por WhatsApp</button>
          </div>
        )}
        <button onClick={()=>setShowCart(!showCart)} className={`relative rounded-full px-5 py-4 font-black text-sm shadow-2xl ${isBoutique?'bg-black text-white':'bg-white text-black'}`}>🛒 {count>0?`${count} • ${cfg.prefix} ${total}`:'Carrito'}</button>
      </div>

      <div className="relative h-[46vh] md:h-[52vh] overflow-hidden">
        <img src={store.cover_image} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10"></div>
        <div className="absolute bottom-4 left-4 right-4 md:left-6 md:max-w-[440px]"><div className="glass-strong rounded-[18px] px-4 py-3.5"><h1 className="text-white text-[22px] font-black uppercase">{store.name}</h1><p className="text-white/60 text-[11px] mt-1">{store.description}</p></div></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 pb-28">
        <div className={`grid gap-3 ${isBoutique?'grid-cols-2 md:grid-cols-3':'grid-cols-1 md:grid-cols-2'}`}>
          {prods.map(pr=>{
            if(isBoutique){
              return (
                <div key={pr.id} className="card-white rounded-[16px] overflow-hidden">
                  <button onClick={()=>setSelected(pr)} className="w-full aspect-[4/5] bg-[#FBF9F7] relative"><img src={pr.image_url} className="w-full h-full object-cover"/>{pr.extra_images?.length>0 && <span className="absolute top-3 left-3 bg-black/80 text-white text-[9px] px-2 py-1 rounded-full">{1+pr.extra_images.length} fotos</span>}</button>
                  <div className="p-3"><p className="font-medium text-[12px] min-h-[32px] line-clamp-2 text-black">{pr.name}</p><p className="font-black text-[13px] text-black mt-1">C$ {pr.price}</p><p className="text-[10px] text-black/40 mt-1">{pr.tallas?pr.tallas.join(' • '):'Talla unica'}</p><button onClick={()=>setSelected(pr)} className="mt-2.5 w-full bg-black text-white py-2 rounded-full font-bold text-[11px]">Ver tallas</button></div>
                </div>
              )
            }
            return (
              <div key={pr.id} className="glass rounded-[16px] overflow-hidden"><button onClick={()=>setSelected(pr)} className="w-full aspect-[4/3] bg-white"><img src={pr.image_url} className="w-full h-full object-contain p-3"/></button><div className="p-3"><p className="font-medium text-[12px] min-h-[32px] line-clamp-2">{pr.name}</p><p className="font-black text-[13px] mt-1">C$ {pr.price}</p><button onClick={()=>addToCart(pr)} className={`mt-2.5 w-full py-2.5 rounded-full font-bold text-[11px] ${cfg.btn}`}>Añadir • C$ {pr.price}</button></div></div>
            )
          })}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-end md:items-center justify-center p-0 md:p-4" onClick={()=>setSelected(null)}>
          <div className="bg-white w-full md:max-w-[920px] md:rounded-[24px] rounded-t-[24px] overflow-hidden max-h-[92vh] md:max-h-[85vh] flex flex-col md:flex-row" onClick={e=>e.stopPropagation()}>
            <div className="relative w-full md:w-[55%] bg-[#FBF9F7]">
              <div className="overflow-x-auto scrollbar-hide snap-x flex">
                {getImages(selected).map((img, idx)=>(
                  <div key={idx} className="min-w-full snap-center"><img src={img} className="w-full h-[52vh] md:h-[70vh] object-contain bg-[#FBF9F7]" /></div>
                ))}
              </div>
              <div className="absolute top-4 left-4 right-4 flex justify-between"><span className="bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-full">{getImages(selected).length} fotos • Desliza →</span><button onClick={()=>setSelected(null)} className="bg-white text-black w-8 h-8 rounded-full font-black">✕</button></div>
            </div>
            <div className="w-full md:w-[45%] p-5 md:p-6 overflow-auto">
              <h3 className="font-black text-[18px] text-black">{selected.name}</h3>
              <p className="font-black text-[18px] text-black mt-1">C$ {selected.price}</p>
              <p className="text-[11px] text-black/50 mt-2">Desliza las fotos para ver frente, atras y modelo.</p>
              {isBoutique && (
                <div className="mt-5">
                  <p className="font-bold text-[12px] text-black mb-2">Talla {selectedTalla?`- ${selectedTalla}`:''}</p>
                  <div className="flex flex-wrap gap-2">
                    {(selected.tallas && selected.tallas.length>0 ? selected.tallas : ['S','M','L','XL']).map(t=>(
                      <button key={t} onClick={()=>setSelectedTalla(t)} className={`min-w-[48px] px-4 py-2.5 rounded-full text-[12px] font-bold border ${selectedTalla===t?'bg-black text-white border-black':'bg-white text-black border-black/15'}`}>{t}</button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={()=>{ addToCart(selected, selectedTalla); setSelected(null) }} disabled={isBoutique && selected.tallas?.length>0 && !selectedTalla} className={`mt-6 w-full py-3.5 rounded-full font-black text-[13px] ${isBoutique?'bg-black text-white':'bg-[#7C4DFF] text-white'} disabled:opacity-40`}>
                {isBoutique ? (selectedTalla?`Añadir - Talla ${selectedTalla} • C$ ${selected.price}`:'Selecciona una talla') : `Añadir • C$ ${selected.price}`}
              </button>
              <button onClick={()=>setSelected(null)} className="mt-2 w-full py-3 rounded-full font-bold text-[13px] bg-black/5 text-black">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
