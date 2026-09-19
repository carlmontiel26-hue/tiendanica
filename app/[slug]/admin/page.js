'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
export default function Page({params}){
  const slug = params?.slug
  const [store,setStore]=useState(null)
  const [products,setProducts]=useState([])
  useEffect(()=>{ (async()=>{
    const {data}=await supabase.from('stores').select('*').eq('slug',slug).single()
    setStore(data)
    const {data:p}=await supabase.from('products').select('*').eq('store_id',data.id)
    setProducts(p||[])
  })() },[slug])
  if(!store) return <div className='p-10 text-white bg-black min-h-screen'>Cargando...</div>
  const tipo=store.tipo_tienda||'comida'
  return (<main className='min-h-screen bg-[#0A0A0A] text-white'>
    <div className='relative h-[60vh]'><img src={store.cover_image} className='absolute inset-0 w-full h-full object-cover'/><div className='absolute inset-0 bg-gradient-to-t from-black to-transparent'></div><div className='absolute bottom-6 left-6 bg-white/10 backdrop-blur border border-white/20 rounded-[24px] p-6'><span className='bg-[#00E676] text-black text-[10px] px-3 py-1 rounded-full font-black'>{tipo==='boutique'?'👗 Boutique':tipo==='electro'?'📱 Electro':'🍔 Comida'}</span><h1 className='text-3xl font-black mt-2 uppercase'>{store.name}</h1></div></div>
    <div className='max-w-6xl mx-auto p-6 grid grid-cols-2 md:grid-cols-3 gap-4'>
      {products.map(pr=><div key={pr.id} className='bg-white/10 backdrop-blur border border-white/10 rounded-[20px] overflow-hidden'><img src={pr.image_url} className='h-40 w-full object-cover'/><div className='p-3'><b className='text-sm'>{pr.name}</b><br/><span className='text-xs opacity-60'>{tipo==='boutique'?'€':'C$'} {pr.price}</span><a href={`https://wa.me/${store.whatsapp}?text=Hola quiero ${pr.name}`} target='_blank' className='mt-2 block bg-[#00E676] text-black text-center py-2 rounded-full text-xs font-black'>{tipo==='boutique'?'Añadir a bolsa':tipo==='electro'?'Comprar ahora':'Pedir'}</a></div></div>)}
    </div>
  </main>)
}
