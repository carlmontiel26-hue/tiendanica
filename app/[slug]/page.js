
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const ADMIN_WA = "50581732620"

export default async function StorePage({ params }){
  const { data: store } = await supabase.from('stores').select('*').eq('slug', params.slug).single()
  if(!store) return notFound()
  const { data: products } = await supabase.from('products').select('*').eq('store_id', store.id).eq('is_active', true).order('created_at', {ascending:false})
  const waSolicitar = `https://wa.me/${ADMIN_WA}?text=Hola! Vi la tienda ${store.name} en Tienda Nica y quiero solicitar mi propia tienda. Mi negocio es: `

  return (
    <main className="min-h-screen bg-[#fafaf9]">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <img src="/logo.png" className="h-8 object-contain"/>
        <a href={'https://wa.me/'+store.whatsapp+'?text=Hola! Vi tu tienda '+store.name+' y quiero hacer un pedido'} target="_blank" className="bg-[#25D366] text-white px-5 py-2 rounded-full text-sm font-bold">WhatsApp Tienda</a>
      </header>

      {store.cover_image ? (
        <div className="relative h-[380px] w-full overflow-hidden">
          <img src={store.cover_image} className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg">{store.name}</h1>
              <p className="text-white/80 mt-3 text-lg max-w-2xl">{store.description || 'Bienvenido a mi tienda'}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-6 pt-10">
          <h1 className="text-4xl font-black">{store.name}</h1>
          <p className="text-gray-600 mt-2">{store.description}</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="font-black text-xl">Productos disponibles</h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {(products||[]).map(p=>(
            <div key={p.id} className="bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition">
              <img src={p.image_url} className="h-48 w-full object-cover"/>
              <div className="p-4">
                <h3 className="font-bold text-sm">{p.name}</h3>
                <p className="text-gray-500 text-sm mt-1">C$ {p.price}</p>
                <a href={'https://wa.me/'+store.whatsapp+'?text=Hola! Quiero pedir: '+encodeURIComponent(p.name)+' - C$ '+p.price} target="_blank" className="mt-3 block text-center bg-black text-white py-2.5 rounded-full text-sm font-bold">Pedir por WhatsApp</a>
              </div>
            </div>
          ))}
          {(!products || products.length===0) && <div className="col-span-4 bg-white border rounded-2xl p-8 text-center text-gray-400">El dueño aún está agregando productos. ¡Vuelve pronto!</div>}
        </div>

        <div className="mt-12 bg-black text-white rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-xs text-gray-400">¿TE GUSTÓ ESTA TIENDA?</p>
            <p className="font-bold text-lg">Nosotros creamos la tuya por ti, en 24 horas</p>
            <p className="text-sm text-gray-400">Solicita por WhatsApp al {ADMIN_WA}</p>
          </div>
          <a href={waSolicitar} target="_blank" className="bg-[#00D084] text-black px-7 py-3 rounded-full text-sm font-bold whitespace-nowrap">Solicitar mi tienda →</a>
        </div>
      </div>
    </main>
  )
}
