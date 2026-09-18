'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function StorePage({ params }){
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const slug = params.slug

  useEffect(()=>{
    async function load(){
      const { data: s } = await supabase.from('stores').select('*').eq('slug', slug).single()
      if(s){ setStore(s)
        const { data: prods } = await supabase.from('products').select('*').eq('store_id', s.id).eq('is_active', true).order('created_at', {ascending:false})
        setProducts(prods||[])
      }
      setLoading(false)
    }
    load()
  },[slug])

  const addToCart = (p)=>{
    const exist = cart.find(c=>c.id===p.id)
    if(exist){ setCart(cart.map(c=>c.id===p.id?{...c, qty:c.qty+1}:c)) }
    else setCart([...cart, {...p, qty:1}])
  }
  const removeFromCart = (id)=> setCart(cart.filter(c=>c.id!==id))
  const total = cart.reduce((sum,c)=>sum + (parseFloat(c.price)*c.qty), 0)

  const checkout = ()=>{
    if(!store) return
    let msg = `Hola ${store.name}! Quiero pedir:%0A`
    cart.forEach(c=>{ msg+=`- ${c.name} x${c.qty} = C$ ${c.price*c.qty}%0A` })
    msg+=`%0ATotal: C$ ${total}%0A%0AEnviado desde ${window.location.origin}/${store.slug}`
    window.open(`https://wa.me/${store.whatsapp}?text=${msg}`, '_blank')
  }

  const pedirSolo = (p)=>{
    const msg = `Hola ${store.name}! Quiero ${p.name} - C$ ${p.price} %0A${window.location.origin}/${store.slug}`
    window.open(`https://wa.me/${store.whatsapp}?text=${msg}`, '_blank')
  }

  if(loading) return <div className='p-10 text-center'>Cargando {slug}...</div>
  if(!store) return <div className='p-10 text-center'>Tienda no encontrada</div>

  return (
    <main className='min-h-screen bg-[#fafaf9]'>
      <div className='w-full h-[220px] md:h-[320px] bg-black relative overflow-hidden'>
        {store.cover_image ? <img src={store.cover_image} className='w-full h-full object-cover opacity-80'/> : <div className='w-full h-full bg-gradient-to-br from-green-500 to-black'/>}
        <div className='absolute inset-0 bg-black/40 flex items-end p-6'>
          <div className='max-w-5xl mx-auto w-full'>
            <h1 className='text-white font-black text-3xl md:text-5xl uppercase'>{store.name}</h1>
            <p className='text-white/80 text-sm mt-2 max-w-xl'>{store.description}</p>
            <a href={`https://wa.me/${store.whatsapp}`} target='_blank' className='inline-block mt-3 bg-green-500 text-black font-bold px-5 py-2 rounded-full text-sm'>WhatsApp Tienda</a>
          </div>
        </div>
      </div>

      <div className='max-w-5xl mx-auto p-6'>
        <h2 className='font-black text-xl mt-2'>Productos disponibles</h2>
        <p className='text-xs text-gray-500'>Toca para agregar al carrito</p>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-5'>
          {products.map(p=>(
            <div key={p.id} className='bg-white border rounded-2xl overflow-hidden p-3 flex flex-col'>
              <div className='h-40 bg-gray-100 rounded-xl overflow-hidden'>
                {p.image_url ? <img src={p.image_url} className='w-full h-full object-cover'/> : <div className='w-full h-full flex items-center justify-center text-gray-400 text-xs'>Sin foto</div>}
              </div>
              <h3 className='font-bold mt-3'>{p.name}</h3>
              <p className='text-gray-600 text-sm'>C$ {p.price}</p>
              <div className='mt-auto flex gap-2 pt-3'>
                <button onClick={()=>addToCart(p)} className='flex-1 border border-black rounded-full py-2 text-sm font-bold'>+ Carrito</button>
                <button onClick={()=>pedirSolo(p)} className='flex-1 bg-black text-white rounded-full py-2 text-sm font-bold'>Pedir</button>
              </div>
            </div>
          ))}
        </div>

        <div className='mt-16 bg-black text-white rounded-[24px] p-6 flex justify-between items-center'>
          <div><p className='text-[10px] opacity-60'>¿TE GUSTO ESTA TIENDA?</p><p className='font-black'>Nosotros creamos la tuya por ti, en 24 horas</p></div>
          <a href='https://wa.me/50581732620' target='_blank' className='bg-green-400 text-black font-bold px-5 py-3 rounded-full text-sm'>Solicitar →</a>
        </div>
      </div>

      {cart.length>0 && (
        <div className='fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]'>
          <div className='max-w-5xl mx-auto flex justify-between items-center'>
            <div><p className='font-bold text-sm'>{cart.length} productos - C$ {total}</p></div>
            <button onClick={checkout} className='bg-green-500 text-black font-black px-6 py-3 rounded-full'>Enviar pedido WhatsApp</button>
          </div>
        </div>
      )}
    </main>
  )
}
