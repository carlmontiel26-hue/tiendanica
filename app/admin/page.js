'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const TIPOS = [
  { id: 'comida', label: 'Comida', desc: 'Delivery' },
  { id: 'boutique', label: 'Boutique', desc: 'Ropa' },
  { id: 'electro', label: 'Electro', desc: 'Otros' },
]
export default function Admin(){
  const [stores,setStores]=useState([])
  const [tipo,setTipo]=useState('comida')
  const [form,setForm]=useState({name:'',slug:'',whatsapp:''})
  const load=async()=>{const {data}=await supabase.from('stores').select('*');setStores(data||[])}
  useEffect(()=>{load()},[])
  const create=async(e)=>{
    e.preventDefault()
    const slug=form.slug.toLowerCase().replace(/[^a-z0-9-]/g,'-')
    await supabase.from('stores').insert({name:form.name,slug,whatsapp:form.whatsapp,tipo_tienda:tipo,is_active:true})
    load()
  }
  return (<main className="min-h-screen bg-black text-white p-6">
    <h1 className="font-black">SUPER ADMIN - 3 TIPOS A LA VEZ</h1>
    <p className="text-xs opacity-60">Si, puedes crear comida, boutique y electro a la vez. Cada dueno ve solo su tienda.</p>
    <div className="flex gap-2 mt-4">{TIPOS.map(t=><button key={t.id} onClick={()=>setTipo(t.id)} className={tipo===t.id?'bg-white text-black px-4 py-2 rounded-full':'bg-white/10 px-4 py-2 rounded-full'}>{t.label}</button>)}</div>
    <form onSubmit={create} className="mt-4 flex gap-2"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nombre" className="text-black rounded-full px-3 py-2"/><input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="slug" className="text-black rounded-full px-3 py-2"/><input value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} placeholder="WA" className="text-black rounded-full px-3 py-2"/><button className="bg-green-400 text-black px-4 rounded-full">Crear {tipo}</button></form>
    <div className="mt-6 grid grid-cols-3 gap-2">{stores.map(s=><div key={s.id} className="bg-white/10 p-3 rounded-xl"><b>{s.name}</b><br/>{s.tipo_tienda||'comida'} - /{s.slug}</div>)}</div>
  </main>)
}
