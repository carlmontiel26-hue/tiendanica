
import Link from 'next/link'
export default function Home(){
  const adminWhatsapp = "50581732620"
  const waLink = `https://wa.me/${adminWhatsapp}?text=Hola! Quiero solicitar mi tienda en Tienda Nica. Mi negocio es: `

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" className="h-10 object-contain" alt="Tienda Nica"/>
          </div>
          <div className="flex gap-3">
            <a href={waLink} target="_blank" className="px-5 py-2 border rounded-full text-sm font-bold">Solicitar tienda</a>
            <a href={waLink} target="_blank" className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-bold">Quiero mi tienda →</a>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-gray-50 border px-3 py-1 rounded-full text-xs mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Tiendas creadas por el equipo Tienda Nica - WhatsApp 50581732620
          </div>
          <h1 className="text-6xl font-black leading-[0.9] tracking-tight">Tu tienda online<br/>en 24 horas.<br/><span className="relative">Nosotros la creamos<span className="absolute -top-2 -right-16 bg-[#00D084] text-black text-base px-3 py-1 rounded-full rotate-3">por ti</span></span></h1>
          <p className="mt-8 text-gray-600 text-lg max-w-xl">Tu solo solicitas por WhatsApp al 50581732620. Nosotros creamos tu tienda, subimos tu logo y productos iniciales, y te entregamos tu link con QR y panel para que vendas directo por WhatsApp.</p>
          <div className="mt-8 flex gap-3">
            <a href={waLink} target="_blank" className="px-8 py-4 bg-black text-white rounded-full font-bold text-lg">Solicitar mi tienda por WhatsApp →</a>
          </div>
          <div className="mt-3 text-xs text-gray-500">Solo el admin crea tiendas. Tu recibes acceso de dueño para editar productos.</div>
        </div>

        <div className="bg-white border rounded-[20px] p-4 shadow-xl">
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
            <div><p className="text-xs text-gray-400">CONTACTO OFICIAL</p><p className="text-lg font-bold">WhatsApp 50581732620</p></div>
            <div className="w-10 h-10 bg-[#00D084] rounded-full flex items-center justify-center text-black">↗</div>
          </div>
        </div>
      </section>
    </main>
  )
}
