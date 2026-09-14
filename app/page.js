
import Link from 'next/link'

export default function Home(){
  const adminWhatsapp = "50588888888" // CAMBIA ESTE NUMERO POR EL TUYO
  const waLink = `https://wa.me/${adminWhatsapp}?text=Hola! Quiero solicitar mi tienda en Tienda Nica. Mi negocio es: `

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" className="h-8" alt="Tienda Nica"/>
            <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">NICARAGUA • LATAM</span>
          </div>
          <div className="flex gap-3">
            <a href={waLink} target="_blank" className="px-4 py-2 text-sm border rounded-full font-bold">Solicitar tienda</a>
            <a href={waLink} target="_blank" className="px-5 py-2 bg-black text-white rounded-full text-sm font-bold">Quiero mi tienda →</a>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-gray-50 border px-3 py-1 rounded-full text-xs mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> 32 tiendas activas hoy • hecho para Nicaragua
          </div>
          <h1 className="text-6xl font-black leading-[0.9] tracking-tight">Crea tu tienda online<br/>en 5 minutos. Vende por <br/><span className="relative">WhatsApp.<span className="absolute -top-2 -right-16 bg-[#00D084] text-black text-base px-3 py-1 rounded-full rotate-3">Sin código</span></span></h1>
          <p className="mt-8 text-gray-600 text-lg max-w-xl">Sin programadores. Sin comisiones por venta. Sube productos, comparte tu link y recibe pedidos directo en tu WhatsApp. Cobra en C$ o USD.</p>
          <div className="mt-8 flex gap-3">
            <a href={waLink} target="_blank" className="px-7 py-3 bg-black text-white rounded-full font-bold">Solicitar mi tienda por WhatsApp →</a>
            <Link href="/cafe-dulce-aroma" className="px-7 py-3 border rounded-full font-bold">Ver tienda ejemplo</Link>
          </div>
          <div className="mt-2 text-xs text-gray-400">Tú solicitas, nosotros la creamos y te damos acceso en 24h</div>
          <div className="mt-8 flex gap-6 text-sm text-gray-500">
            <span>✅ Pagos por transferencia</span><span>✅ Entrega en todo NI</span><span>✅ Dominio .com.ni</span>
          </div>
        </div>

        <div className="bg-white border rounded-[20px] p-4 shadow-xl">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
            <span className="flex gap-1"><span className="w-3 h-3 bg-gray-200 rounded-full"></span><span className="w-3 h-3 bg-gray-200 rounded-full"></span><span className="w-3 h-3 bg-gray-200 rounded-full"></span></span>
            <span>tiendanica.com/cafelabruna • en vivo</span>
            <span className="bg-[#00D084] text-black px-2 py-0.5 rounded-full font-bold">LIVE</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              {n:'Café Bourbon Lavado 250g', p:'C$ 180', img:'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400'},
              {n:'Café Pacamara Honey 500g', p:'C$ 320', img:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'},
              {n:'Cold Brew La Bruma', p:'C$ 95', img:'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'},
              {n:'Café Catuai Natural 1kg', p:'C$ 550', img:'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400'},
            ].map(it=>(
              <div key={it.n} className="border rounded-2xl overflow-hidden">
                <img src={it.img} className="h-32 w-full object-cover"/>
                <div className="p-3"><p className="text-sm font-bold">{it.n}</p><p className="text-sm text-gray-500">{it.p}</p></div>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-black text-white rounded-2xl p-4 flex justify-between items-center">
            <div><p className="text-xs text-gray-400">PEDIDOS HOY</p><p className="text-xl font-bold">C$ 2,340 • 7 pedidos</p></div>
            <div className="w-10 h-10 bg-[#00D084] rounded-full flex items-center justify-center text-black">↗</div>
          </div>
        </div>
      </section>
    </main>
  )
}
