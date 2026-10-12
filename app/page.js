"use client"
import { useEffect, useState, useMemo } from 'react'
import { getSupabase } from '../lib/supabaseClient'

const CAT_MAP = { boutique:['vestidos','blusas','jeans','faldas','conjuntos','shorts','accesorios','zapatos','carteras','nuevo','oferta'], comida:['hamburguesas','pizzas','pollo','tacos','bebidas'], general:['electronica','hogar','cocina','juguetes'] }

export default function Page(){
  const supabase = getSupabase()
  const [stores,setStores]=useState([]); const [products,setProducts]=useState([])
  const [tipo,setTipo]=useState('boutique'); const [cat,setCat]=useState('all')
  const [q,setQ]=useState(''); const [loading,setLoading]=useState(true)

  useEffect(()=>{ (async()=>{
    const {data:s}=await supabase.from('stores').select('*').eq('is_active',true).order('created_at',{ascending:false})
    const {data:p}=await supabase.from('products').select('*').eq('is_active',true).order('created_at',{ascending:false})
    setStores(s||[]); setProducts(p||[]); setLoading(false)
  })() },[])

  const storeMap = useMemo(()=>{ const m={}; stores.forEach(s=>m[s.id]=s); return m },[stores])

  const filtered = useMemo(()=>{
    return products.filter(pr=>{
      if(tipo!=='Todo'){
        const st=storeMap[pr.store_id]; if(!st) return false
        const t = (st.tipo||'').toLowerCase()
        if(tipo==='boutique' && t!=='boutique') return false
        if(tipo==='comida' && t!=='comida') return false
        if(tipo==='general' && t!=='general') return false
      }
      if(cat!=='all' && (pr.categoria||'').toLowerCase()!==cat) return false
      if(q){
        const qq=q.toLowerCase()
        if(!(`${pr.name} ${pr.categoria||''} ${(storeMap[pr.store_id]?.name||'')}`.toLowerCase().includes(qq))) return false
      }
      return true
    })
  },[products,tipo,cat,q,storeMap])

  const categorias = tipo==='Todo' ? [] : (CAT_MAP[tipo]||[])

  return (
    <main className="min-h-screen bg-[#f6f5f2]">
      {/* HEADER STICKY CON MAS COLOR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-zinc-200 shadow-[0_8px_30px_-20px_rgba(0,0,0,0.3)]">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          {/* Fila 1: Logo + contador + Vender - MAS COLOR */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight">👜 Tienda<span className="text-emerald-500">Nica</span></span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden md:inline-flex items-center rounded-full border bg-zinc-50 px-3 py-1 text-xs text-zinc-600">
                {stores.length} tiendas • {products.length} productos
              </span>
              <a href="/vender" className="rounded-full bg-black text-white px-5 py-2.5 text-sm font-semibold hover:bg-zinc-900">Vender</a>
            </div>
          </div>

          {/* Fila 2: Busqueda - siempre visible */}
          <div className="pb-3">
            <div className="relative">
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar vestido, pizza, licuadora..." className="w-full rounded-full border border-zinc-200 bg-white px-5 py-3.5 text-[15px] outline-none focus:ring-2 focus:ring-black/10" />
            </div>
          </div>

          {/* Fila 3: Tipos - siempre visible */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
            <button onClick={()=>{setTipo('boutique');setCat('all')}} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium border ${tipo==='boutique'?'bg-black text-white border-black':'bg-white text-zinc-700'}`}>👗 Boutique</button>
            <button onClick={()=>{setTipo('comida');setCat('all')}} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium border ${tipo==='comida'?'bg-black text-white border-black':'bg-white text-zinc-700'}`}>🍔 Comida</button>
            <button onClick={()=>{setTipo('general');setCat('all')}} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium border ${tipo==='general'?'bg-black text-white border-black':'bg-white text-zinc-700'}`}>🛍️ General / Todo</button>
            <button onClick={()=>{setTipo('Todo');setCat('all')}} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium border ${tipo==='Todo'?'bg-black text-white border-black':'bg-white text-zinc-700'}`}>✨ Todo</button>
          </div>

          {/* Fila 4: Categorias */}
          {categorias.length>0 && (
            <div className="flex gap-2 overflow-x-auto pb-4">
              <button onClick={()=>setCat('all')} className={`rounded-full px-3.5 py-1.5 text-sm border ${cat==='all'?'bg-black text-white border-black':'bg-white'}`}>all</button>
              {categorias.map(c=><button key={c} onClick={()=>setCat(c)} className={`rounded-full px-3.5 py-1.5 text-sm border whitespace-nowrap ${cat===c?'bg-black text-white border-black':'bg-white text-zinc-700'}`}>{c}</button>)}
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 md:px-6">
        {/* Banner con mas color - se queda igual como lo tienes */}
        <div className="mt-4 rounded-[20px] bg-black text-white p-4 md:p-5 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-[16px] md:text-[18px]">Tus productos, Tu tienda, tus clientes <span className="text-emerald-400">•</span></h2>
            <p className="text-zinc-400 text-xs md:text-sm mt-1">Lo más vendido de tus tiendas favoritas. Compra directo por WhatsApp al dueño.</p>
          </div>
          <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">👗</div>
        </div>

        {/* PRODUCTOS - BLANCO INTACTO COMO TE GUSTA */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pb-20">
          {loading ? Array.from({length:8}).map((_,i)=><div key={i} className="h-[320px] animate-pulse rounded-[18px] bg-white border" />) :
            filtered.map(pr=>{
              const st=storeMap[pr.store_id]
              return (
                <div key={pr.id} className="rounded-[18px] bg-white border border-zinc-200 overflow-hidden">
                  <div className="aspect-square bg-zinc-100 overflow-hidden">
                    {pr.image_url ? <img src={pr.image_url} alt={pr.name} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-[13px] font-semibold leading-tight min-h-[32px]">{pr.name}</p>
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-zinc-500 truncate"> <span className="h-4 w-4 rounded-full bg-zinc-200 inline-block" /> {st?.name||''} • {pr.categoria||''}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold">C$ {pr.price}</span>
                      <a href={`https://wa.me/${st?.whatsapp||''}?text=Hola me interesa ${encodeURIComponent(pr.name)}`} target="_blank" className="rounded-full bg-[#00d26a] px-3.5 py-1.5 text-xs font-bold text-black">WhatsApp</a>
                    </div>
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>
    </main>
  )
}
