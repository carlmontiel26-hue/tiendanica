'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const T = {
  comida: { label: '🍔 Comida', badge: 'Entrega 30 min', cta: 'Pedir por WhatsApp', color: '#00E676', prefix: 'C$', pills: ['NUEVO','Envio rapido','Abierto hoy 8am-9pm','Entrega 30 min'] },
  boutique: { label: '👗 Boutique', badge: 'Nueva Coleccion • Envio 24h España', cta: 'Añadir a bolsa', color: '#FF2D78', prefix: '€', pills: ['NUEVA','Envio Gratis ES','Tallas S M L','Devolucion 30 dias'] },
  electro: { label: '📱 Electro', badge: '12 Cuotas • Garantia 1 año', cta: 'Comprar ahora', color: '#7C4DFF', prefix: 'C$', pills: ['NUEVO','12 Cuotas','Garantia 1 año','Envio Gratis'] }
}

export default function Tienda({ params }){
  const slug = params?.slug
  const [store, setStore] = useState(null)
  const [prods, setProds] = useState([])
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
  if(loading) return <div className="min-h-screen bg-black text-white p-10">Cargando {slug}...</div>
  if(!store) return <div className="min-h-screen bg-black text-white p-10">Tienda no encontrada: {slug}</div>
  const tipo = store.tipo_tienda || 'comida'
  const cfg = T[tipo] || T.comida
  const wa = (name='')=>`https://wa.me/${store.whatsapp}?text=${encodeURIComponent('Hola! Quiero '+name+' de '+store.name)}`

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <style>{`.glass{background:rgba(255,255,255,0.07);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.1)} .glass-strong{background:rgba(255,255,255,0.12);backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.15)}`}</style>
      
      <div className="relative h-[58vh] md:h-[64vh] overflow-hidden">
        <img src={store.cover_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2000'} className="absolute inset-0 w-full h-full object-cover" alt={store.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="glass-strong rounded-[28px] md:rounded-[36px] p-6 md:p-8 max-w-[92%] md:max-w-[68%]">
              <div className="flex gap-2 mb-3">
                <span className="bg-[#00E676] text-black text-[10px] font-black px-3 py-1 rounded-full tracking-widest">{cfg.badge}</span>
                <span className="bg-white/10 border border-white/20 text-[10px] font-bold px-3 py-1 rounded-full">{cfg.label}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black uppercase leading-[0.9] tracking-tight">{store.name}</h1>
              <p className="text-white/60 text-sm mt-3">{store.description || 'Tienda creada con TiendaNica Universal'}</p>
              <a href={wa()} target="_blank" className="mt-5 inline-block bg-white text-black px-6 py-3 rounded-full font-black text-sm">WhatsApp</a>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-20 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto">
          {cfg.pills.map((p,i)=><span key={i} className={`whitespace-nowrap text-[11px] font-bold px-4 py-2 rounded-full ${i===0?'bg-[#00E676] text-black':'glass text-white/70'}`}>{p}</span>)}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-end mb-6">
          <div><h2 className="text-xl md:text-2xl font-black">{tipo==='boutique'?'Coleccion':'Productos disponibles'}</h2><p className="text-white/40 text-xs mt-1">Toca la imagen para ver completa • Modo {tipo}</p></div>
          <span className="text-[11px] text-white/30">{prods.length} productos</span>
        </div>

        <div className={`grid gap-4 ${tipo==='boutique'?'grid-cols-2 md:grid-cols-3':'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {prods.map(pr=>{
            const isBoutique = tipo==='boutique'
            return (
              <div key={pr.id} className="glass rounded-[22px] overflow-hidden group hover:bg-white/[0.09] transition">
                <div className={`relative bg-white overflow-hidden ${isBoutique?'aspect-[3/4]':'aspect-[4/3]'}`}>
                  <img src={pr.image_url} className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500" />
                  {isBoutique && <span className="absolute top-3 left-3 bg-black text-white text-[9px] font-black px-2 py-1 rounded-full">NUEVO • S M L</span>}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start"><p className="font-bold text-sm leading-tight truncate pr-2">{pr.name}</p><span className="font-black text-sm">{cfg.prefix} {pr.price}</span></div>
                  <p className="text-white/40 text-[11px] mt-1">{isBoutique?'Lino premium • Envio 24h':tipo==='electro'?'Garantia 1 año':'Hecho en casa'}</p>
                  <a href={wa(pr.name)} target="_blank" className={`mt-4 w-full block text-center py-3 rounded-full font-black text-xs ${tipo==='boutique'?'bg-white text-black':tipo==='electro'?'bg-[#7C4DFF] text-white':'bg-[#00E676] text-black'}`}>{cfg.cta}</a>
                </div>
              </div>
            )
          })}
        </div>
        {prods.length===0 && <div className="glass rounded-[24px] p-12 text-center text-white/30 text-sm mt-8">Esta tienda aun no tiene productos</div>}
      </div>
      <div className="text-center py-10 text-[11px] text-white/20 border-t border-white/10 mt-10">Potenciado por TiendaNica • Modo {tipo} • {store.slug}</div>
    </main>
  )
}
