'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
export default function AdminDueno({params}){
  const slug=params?.slug
  const [store,setStore]=useState(null)
  const [products,setProducts]=useState([])
  const [pform,setPform]=useState({name:'',price:''})
  const [f1,setF1]=useState(null); const [f2,setF2]=useState(null); const [f3,setF3]=useState(null)
  const [tallas,setTallas]=useState([]); const [tipo,setTipo]=useState('letras')
  const [editing,setEditing]=useState(null); const [uploading,setUploading]=useState(false)
  useEffect(()=>{(async()=>{const {data}=await supabase.from('stores').select('*').eq('slug',slug).single(); if(data){setStore(data); const {data:p}=await supabase.from('products').select('*').eq('store_id',data.id).order('created_at',{ascending:false}); setProducts(p||[])}})()},[slug])
  const upload=async(file)=>{if(!file)return null; const n=`${Date.now()}-${file.name.replace(/\s/g,'-')}`; await supabase.storage.from('product-images').upload(n,file); const {data}=supabase.storage.from('product-images').getPublicUrl(n); return data.publicUrl}
  const save=async(e)=>{
    e.preventDefault(); setUploading(true)
    try{
      let url=editing?.image_url||''; if(f1) url=await upload(f1)
      let extras=editing?.extra_images||[]
      if(store.tipo_tienda==='boutique'){
        if(f2){const u=await upload(f2); if(u) extras=[...extras,u]}
        if(f3){const u=await upload(f3); if(u) extras=[...extras,u]}
        extras=extras.slice(0,2)
      }
      const payload={store_id:store.id,name:pform.name,price:parseFloat(pform.price),image_url:url,is_active:true,extra_images:store.tipo_tienda==='boutique'?extras:[],tallas:store.tipo_tienda==='boutique'?tallas:[],tipo_talla:tipo}
      if(editing) await supabase.from('products').update(payload).eq('id',editing.id)
      else await supabase.from('products').insert(payload)
      setPform({name:'',price:''}); setF1(null); setF2(null); setF3(null); setTallas([]); setEditing(null)
      const {data:p}=await supabase.from('products').select('*').eq('store_id',store.id).order('created_at',{ascending:false}); setProducts(p||[])
    }catch(err){alert(err.message)}finally{setUploading(false)}
  }
  if(!store) return <div className="p-10">Cargando /{slug}...</div>
  const isBoutique=store.tipo_tienda==='boutique'
  return(
    <main className="min-h-screen bg-[#fafaf9] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between"><h1 className="font-black">Panel {store.name} {isBoutique&&<span className="bg-black text-white text-[10px] px-2 py-1 rounded-full ml-2">BOUTIQUE 3 FOTOS + TALLAS</span>}</h1><a href={'/'+store.slug} target="_blank" className="bg-black text-white px-3 py-1 rounded-full text-xs">Ver tienda</a></div>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white border rounded-2xl p-5 h-fit">
            <h2 className="font-bold">Mi QR para clientes</h2><p className="text-xs opacity-60">tiendanica.store/{store.slug}</p>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://tiendanica.store/${store.slug}`} className="w-full mt-4 border rounded-xl bg-white p-2"/>
            <a href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=https://tiendanica.store/${store.slug}`} target="_blank" className="mt-4 block w-full bg-[#00E676] text-black text-center py-3 rounded-full font-bold text-sm">Descargar QR HD</a>
          </div>
          <div className="md:col-span-2 bg-white border rounded-2xl p-6">
            <h2 className="font-black">{editing?'✏️ Editando '+editing.name:'➕ Agregar producto'}</h2>
            <form onSubmit={save} className="grid gap-3 mt-4 bg-gray-50 p-4 rounded-2xl border-2 border-dashed">
              <input className="border rounded-xl px-3 py-2" placeholder="Nombre" value={pform.name} onChange={e=>setPform({...pform,name:e.target.value})} required/>
              <input className="border rounded-xl px-3 py-2" placeholder="Precio" type="number" value={pform.price} onChange={e=>setPform({...pform,price:e.target.value})} required/>
              <label className="border-2 border-dashed rounded-xl px-3 py-4 text-center bg-white cursor-pointer"><span className="text-sm font-bold">{f1?'✅ '+f1.name:'📸 Foto 1 Frente (principal)'}</span><input type="file" accept="image/*" className="hidden" onChange={e=>setF1(e.target.files[0])}/></label>
              {isBoutique&&<>
                <div className="grid grid-cols-2 gap-3">
                  <label className="border-2 border-dashed rounded-xl px-3 py-3 text-center bg-[#FBF9F7] cursor-pointer"><span className="text-xs font-bold">{f2?'✅ '+f2.name:'Foto 2 Espalda'}</span><input type="file" accept="image/*" className="hidden" onChange={e=>setF2(e.target.files[0])}/></label>
                  <label className="border-2 border-dashed rounded-xl px-3 py-3 text-center bg-[#FBF9F7] cursor-pointer"><span className="text-xs font-bold">{f3?'✅ '+f3.name:'Foto 3 Modelo'}</span><input type="file" accept="image/*" className="hidden" onChange={e=>setF3(e.target.files[0])}/></label>
                </div>
                <div className="bg-white border rounded-xl p-3">
                  <p className="font-black text-[12px]">📏 TALLAS</p>
                  <div className="flex flex-wrap gap-2 mt-2">{['S','M','L','XL','XXL','28','30','32','34','36','38'].map(t=><button type="button" key={t} onClick={()=>setTallas(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])} className={`min-w-[44px] px-3 py-2 rounded-full text-xs font-bold border ${tallas.includes(t)?'bg-black text-white':'bg-white'}`}>{t}</button>)}</div>
                  <input value={tallas.join(', ')} readOnly className="mt-2 w-full border rounded-full px-3 py-2 text-xs bg-black/5" placeholder="Tallas seleccionadas"/>
                </div>
              </>}
              <button disabled={uploading} className="bg-[#00D084] text-black py-3 rounded-full font-bold">{uploading?'Guardando...': editing?'Actualizar':'Agregar Producto'}</button>
              {editing&&<button type="button" onClick={()=>{setEditing(null); setPform({name:'',price:''}); setTallas([])}} className="border py-2 rounded-full text-xs">Cancelar edición</button>}
            </form>
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              {products.map(p=>(
                <div key={p.id} className="border rounded-2xl overflow-hidden bg-white">
                  <div className="relative"><img src={p.image_url} className="h-40 w-full object-cover"/>{p.extra_images?.length>0&&<span className="absolute top-2 left-2 bg-black text-white text-[9px] px-2 py-1 rounded-full">{p.extra_images.length+1} fotos</span>}</div>
                  <div className="p-3"><p className="font-bold text-sm truncate">{p.name}</p><p className="text-sm">C$ {p.price}</p>{p.tallas?.length>0&&<p className="text-[10px] mt-1 bg-black/5 rounded-full px-2 py-1 inline-block">Tallas: {p.tallas.join(', ')}</p>}</div>
                  <div className="p-2 border-t flex gap-2"><button onClick={()=>{setEditing(p); setPform({name:p.name,price:p.price}); setTallas(p.tallas||[])}} className="flex-1 bg-black text-white text-[11px] py-2 rounded-full">Editar</button><button onClick={async()=>{if(confirm('Borrar?')){await supabase.from('products').delete().eq('id',p.id); setProducts(products.filter(x=>x.id!==p.id))}}} className="flex-1 bg-red-50 text-red-600 text-[11px] py-2 rounded-full">Borrar</button></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
