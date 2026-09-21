'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
export default function Admin(){
 const [stores,setStores]=useState([]); const [products,setProducts]=useState([]); const [sel,setSel]=useState(null)
 const [f,setF]=useState({name:'',price:'',cat:'plato'}); const [img,setImg]=useState(null); const [up,setUp]=useState(false)
 const load=async()=>{const {data}=await supabase.from('stores').select('*').order('created_at',{ascending:false}); setStores(data||[]); if(data?.[0]&&!sel) setSel(data[0])}
 const loadP=async(id)=>{const {data}=await supabase.from('products').select('*').eq('store_id',id).order('created_at',{ascending:false}); setProducts(data||[])}
 useEffect(()=>{load()},[]); useEffect(()=>{if(sel) loadP(sel.id)},[sel])
 const upl=async(fi)=>{const n=Date.now()+'-'+fi.name; await supabase.storage.from('product-images').upload(n,fi); const {data}=supabase.storage.from('product-images').getPublicUrl(n); return data.publicUrl}
 const save=async(e)=>{
  e.preventDefault(); setUp(true); try{
   let url=''; if(img) url=await upl(img)
   await supabase.from('products').insert({store_id:sel.id,name:f.name,price:parseFloat(f.price),image_url:url,categoria:f.cat,is_active:true})
   setF({name:'',price:'',cat:'plato'}); setImg(null); loadP(sel.id)
  }finally{setUp(false)}
 }
 return(
 <main className="p-6 bg-[#fafaf9] min-h-screen">
  <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
   <div className="bg-white border rounded-2xl p-5"><h3 className="font-bold">Tiendas</h3>{stores.map(s=><button key={s.id} onClick={()=>setSel(s)} className={`w-full text-left border rounded-xl px-4 py-3 mt-2 ${sel?.id===s.id?'bg-black text-white':'bg-white'}`}><b>{s.name}</b><br/><span className="text-xs">/{s.slug}</span></button>)}</div>
   <div className="lg:col-span-2 bg-white border rounded-2xl p-6"><h2 className="font-black">Productos {sel?.name}</h2>
    <form onSubmit={save} className="grid md:grid-cols-3 gap-3 mt-4 bg-gray-50 p-4 rounded-2xl border-2 border-dashed">
     <input className="border rounded-xl px-3 py-2" placeholder="Nombre" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required/>
     <input className="border rounded-xl px-3 py-2" placeholder="Precio" type="number" value={f.price} onChange={e=>setF({...f,price:e.target.value})} required/>
     <select className="border rounded-xl px-3 py-2 font-bold text-xs" value={f.cat} onChange={e=>setF({...f,cat:e.target.value})}>
      <option value="plato">🍽️ Plato</option><option value="bebida">🥤 Bebida</option><option value="extra">➕ Extra</option>
     </select>
     <label className="md:col-span-3 border-2 border-dashed rounded-xl py-4 text-center bg-white cursor-pointer">{img?'✅ '+img.name:'📸 Foto'}<input type="file" className="hidden" accept="image/*" onChange={e=>setImg(e.target.files[0])}/></label>
     <button className="md:col-span-3 bg-black text-white py-3 rounded-full font-bold">{up?'Guardando...':'Agregar '+f.cat}</button>
    </form>
    <div className="grid md:grid-cols-3 gap-3 mt-6">{products.map(p=><div key={p.id} className={`border rounded-2xl overflow-hidden ${p.categoria!=='plato'?'border-[#00E676] bg-[#00E676]/5':''}`}><img src={p.image_url} className="h-24 w-full object-cover"/><div className="p-2 text-xs"><b>{p.name}</b><br/>C$ {p.price} • {p.categoria}</div></div>)}</div>
   </div>
  </div>
 </main>
 )
}
