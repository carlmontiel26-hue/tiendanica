import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default async function StorePage({ params }){
  const { data: store } = await supabase.from('stores').select('*').eq('slug', params.slug).single()
  if(!store) return notFound()
  const { data: products } = await supabase.from('products').select('*').eq('store_id', store.id).eq('is_active', true)

  return (
    <main className="min-h-screen bg-[#fafaf9]">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <img src="/logo.png" className="h-7"/>
        <a href={'https://wa.me/'+store.whatsapp+'?text=Hola! Vi tu tienda '+store.name} className="bg-[#25D366] text-white px-5 py-2 rounded-full text-sm font-bold">WhatsApp</a>
      </header>

      {store.cover_image ? (
        <div className="relative h-[320px] w-full overflow-hidden">
          <img src={store.cover_image} className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">{store.name}</h1>
              <p className="text-white/80 mt-2 text-lg max-w-2xl">{store.description || 'Mi tienda Nica'}</p>
              <div className="mt-4 flex gap-2">
                <span className="bg-white text-black text-xs px-3 py-1 rounded-full font-bold">✅ Abierto</span>
                <span className="bg-[#00D084] text-black text-xs px-3 py-1 rounded-full font-bold">Envíos en Nicaragua</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-6 pt-10">
          <h1 className="text-4xl font-black">{store.name}</h1>
          <p className="text-gray-600 mt-2">{store.description || 'Mi tienda Nica'}</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center">
          <h2 className="font-bold">Productos ({products?.length || 0})</h2>
          <div className="flex gap-2">
            <a href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https://tiendanica.vercel.app/${store.slug}`} target="_blank" className="text-xs border px-3 py-1 rounded-full bg-white">Ver QR</a>
            <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">{store.slug}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {(products?.length? products : [
            {id:1,name:'Café Bourbon Lavado 250g',price:180,image_url:'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400'},
            {id:2,name:'Café Pacamara Honey 500g',price:320,image_url:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'},
            {id:3,name:'Cold Brew La Bruma',price:95,image_url:'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'},
            {id:4,name:'Café Catuai Natural 1kg',price:550,image_url:'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400'},
          ]).map(p=>(
            <div key={p.id} className="bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition">
              <img src={p.image_url} className="h-44 w-full object-cover"/>
              <div className="p-4">
                <h3 className="font-bold text-sm">{p.name}</h3>
                <p className="text-gray-500 text-sm mt-1">C$ {p.price}</p>
                <a href={'https://wa.me/'+store.whatsapp+'?text=Quiero pedir: '+p.name+' - C$ '+p.price} className="mt-3 block text-center bg-black text-white py-2 rounded-full text-sm font-bold">Pedir por WhatsApp</a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-black text-white rounded-[24px] p-6 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400">TIENDA NICA</p>
            <p className="font-bold">¿Te gustó esta tienda? Crea la tuya gratis en 5 minutos</p>
          </div>
          <a href="/" className="bg-[#00D084] text-black px-5 py-2 rounded-full text-sm font-bold">Crear mi tienda →</a>
        </div>
      </div>
    </main>
  )
}
