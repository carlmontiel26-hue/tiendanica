'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
export default function OwnerAdmin({params}){
 const slug=params?.slug
 const [store,setStore]=useState(null); const [products,setProducts]=useState([])
 const [f,setF]=useState({name:'',price:'',cat:'plato'}); const [img,setImg]=useState(null); const [up,setUp]=useState(false)
 useEffect(()=>{(async()=>{
   const {data:s}=await supabase.from('stores').select('*').eq('slug',slug).single()
   if(s){setStore(s); const {data:p}=await supabase.from('products').select('*').eq('store_id',s.id).order('created_at',{ascending:false}); setProducts(p||[])}
 })()},[slug])
 const upl=async(fi)=>{const n=Date.now()+'-'+fi.name; await supabase.storage.from('product-images').upload(n,fi); const {data}=supabase.storage.from('product-images').getPublicUrl(n); return data.publicUrl}
 const save=async(e)=>{
  e.preventDefault(); setUp(true); try{
   let url=''; if(img) url=await upl(img)
   await supabase.from('products').insert({store_id:store.id,name:f.name,price:parseFloat(f.price),image_url:url,categoria:f.cat,is_active:true})
   setF({name:'',price:'',cat:'plato'}); setImg(null);
   const {data:p}=await supabase.from('products').select('*').eq('store_id',store.id).order('created_at',{ascending:false}); setProducts(p||[])
  }finally{setUp(false)}
 }
 if(!store) return <div className="p-10">Cargando {slug}...</div>
 return(
 <main className="p-6 bg-[#fafaf9] min-h-screen">
  <h1 className="font-black">Admin {store.name} • {slug}</h1>
  <form onSubmit={save} className="grid md:grid-cols-3 gap-3 mt-4 bg-white p-4 rounded-2xl border-2 border-dashed">
   <input className="border rounded-xl px-3 py-2" placeholder="Nombre" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required/>
   <input className="border rounded-xl px-3 py-2" placeholder="Precio" type="number" value={f.price} onChange={e=>setF({...f,price:e.target.value})} required/>
   <select className="border rounded-xl px-3 py-2 font-bold text-xs" value={f.cat} onChange={e=>setF({...f,cat:e.target.value})}>
    <option value="plato">🍽️ Plato</option><option value="bebida">🥤 Bebida</option><option value="extra">➕ Extra</option>
   </select>
   <label className="md:col-span-3 border-2 border-dashed rounded-xl py-4 text-center bg-gray-50 cursor-pointer">{img?'✅ '+img.name:'📸 Foto'}<input type="file" className="hidden" accept="image/*" onChange={e=>setImg(e.target.files[0])}/></label>
   <button className="md:col-span-3 bg-black text-white py-3 rounded-full font-bold">{up?'Guardando...':'Agregar '+f.cat}</button>
  </form>
  <div className="grid md:grid-cols-3 gap-3 mt-6">{products.map(p=><div key={p.id} className={`border rounded-2xl overflow-hidden bg-white ${p.categoria!=='plato'?'border-[#00E676]':''}`}><img src={p.image_url} className="h-24 w-full object-cover"/><div className="p-2 text-xs"><b>{p.name}</b><br/>C$ {p.price} • {p.categoria}</div></div>)}</div>
 </main>
 )
}
