'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function Admin(){
  const [stores,setStores]=useState([])
  const [products,setProducts]=useState([])
  const [sel,setSel]=useState(null)
  const [form,setForm]=useState({name:'',slug:'',whatsapp:'',description:''})
  const [pform,setPform]=useState({name:'',price:'',image_url:'',categoria:'plato'})
  const [imgFile,setImgFile]=useState(null)
  const [extra1,setExtra1]=useState(null)
  const [extra2,setExtra2]=useState(null)
  const [tallas,setTallas]=useState([])
  const [editing,setEditing]=useState(null)
  const [up,setUp]=useState(false)
  const [log,setLog]=useState('Conectando...')

  const loadStores=async()=>{
    const {data}=await supabase.from('stores').select('*').order('created_at',{ascending:false})
    setStores(data||[]); setLog('OK '+data?.length+' tiendas'); if(data?.[0]&&!sel) setSel(data[0])
  }
  const loadProds=async(id)=>{const {data}=await supabase.from('products').select('*').eq('store_id',id).order('created_at',{ascending:false}); setProducts(data||[])}
  useEffect(()=>{loadStores()},[])
  useEffect(()=>{if(sel) loadProds(sel.id)},[sel])

  const uploadOne=async(file)=>{
    if(!file) return null
    const name=Date.now()+'-'+file.name.replace(/\s/g,'-')
    await supabase.storage.from('product-images').upload(name,file)
    const {data}=supabase.storage.from('product-images').getPublicUrl(name)
    return data.publicUrl
  }

  const saveProduct=async(e)=>{
    e.preventDefault(); if(!sel) return; setUp(true)
    try{
      let finalUrl=pform.image_url; if(imgFile) finalUrl=await uploadOne(imgFile)
      let extras=editing?.extra_images||[]
      if(sel.tipo_tienda==='boutique'){
        if(extra1){const u=await uploadOne(extra1); if(u) extras=[...extras,u]}
        if(extra2){const u=await uploadOne(extra2); if(u) extras=[...extras,u]}
        extras=extras.slice(0,2)
      }
      const payload={
        store_id:sel.id,
        name:pform.name,
        price:parseFloat(pform.price),
        image_url:finalUrl,
        is_active:true,
        extra_images: sel.tipo_tienda==='boutique'?extras:[],
        tallas: sel.tipo_tienda==='boutique'?tallas:[],
        categoria: sel.tipo_tienda==='comida'?pform.categoria:'plato'
      }
      if(editing) await supabase.from('products').update(payload).eq('id',editing.id)
      else await supabase.from('products').insert(payload)
      setPform({name:'',price:'',image_url:'',categoria:'plato'}); setImgFile(null); setExtra1(null); setExtra2(null); setTallas([]); setEditing(null)
      loadProds(sel.id)
    }catch(err){alert(err.message)}finally{setUp(false)}
  }

  const startEdit=(p)=>{setEditing(p); setPform({name:p.name,price:p.price,image_url:p.image_url,categoria:p.categoria||'plato'}); setTallas(p.tallas||[])}
  const delProd=async(id)=>{if(!confirm('Eliminar producto?'))return; await supabase.from('products').delete().eq('id',id); loadProds(sel.id)}
  const delStore=async(id)=>{if(!confirm('Eliminar tienda y productos?'))return; await supabase.from('stores').delete().eq('id',id); setSel(null); loadStores()}

  const isBoutique=sel?.tipo_tienda==='boutique'; const isComida=sel?.tipo_tienda==='comida'
  return(
    <main className="min-h-screen bg-[#fafaf9] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between"><img src="/logo.png" className="h-8"/><div className="bg-black text-green-400 text-xs px-3 py-1 rounded-full">{log}</div></div>
        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          <div className="space-y-6">
            <div className="bg-white border rounded-2xl p-5">
              <h2 className="font-black">Crear Tienda</h2>
              <form onSubmit={async(e)=>{e.preventDefault(); const slug=form.slug.toLowerCase().replace(/[^a-z0-9-]/g,'-'); const {data}=await supabase.from('stores').insert({name:form.name,slug,whatsapp:form.whatsapp,description:form.description,is_active:true}).select().single(); if(data){loadStores(); setSel(data)}}} className="mt-4 space-y-3">
                <input className="w-full border rounded-xl px-4 py-2" placeholder="Nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="slug" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="WhatsApp" value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} required/>
                <button className="w-full bg-black text-white py-3 rounded-full font-bold">Crear Tienda</button>
              </form>
            </div>
            <div className="bg-white border rounded-2xl p-5">
              <h3 className="font-bold">Mis Tiendas ({stores.length})</h3>
              <div className="mt-3 space-y-2">
                {stores.map(s=>(
                  <div key={s.id} className={'border rounded-xl px-4 py-3 flex justify-between items-center '+(sel?.id===s.id?'bg-black text-white':'bg-white')}>
                    <button onClick={()=>setSel(s)} className="text-left flex-1"><b>{s.name}</b><br/><span className="text-xs opacity-70">/{s.slug} • {s.tipo_tienda}</span></button>
                    <div className="flex gap-1"><a href={'/'+s.slug} target="_blank" className="text- bg-white/20 px-2 py-1 rounded-full">Ver</a><button onClick={()=>delStore(s.id)} className="text- bg-red-500 text-white px-2 py-1 rounded-full">🗑️</button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            {/* QR GRANDE RESTAURADO - SOLO ESTO ES NUEVO */}
            {sel&&(
              <div className="bg-white border-2 border-black rounded-2xl p-5 flex gap-5 items-center">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://tiendanica.store/${sel.slug}`} className="w-36 h-36 rounded-xl border"/>
                <div className="flex-1">
                  <p className="font-black text-">📱 QR {sel.name}</p>
                  <p className="text- opacity-60 mt-1">https://tiendanica.store/{sel.slug}</p>
                  <p className="text- mt-2">Imprime este QR y ponlo en tu negocio. Tus clientes escanean y entran directo a tu tienda.</p>
                  <div className="flex gap-2 mt-3">
                    <a href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=https://tiendanica.store/${sel.slug}`} target="_blank" download className="bg-black text-white text-xs px-4 py-2 rounded-full font-bold">⬇️ Descargar QR Grande</a>
                    <button onClick={()=>{navigator.clipboard.writeText(`https://tiendanica.store/${sel.slug}`); alert('Link copiado')}} className="bg-black/5 text-black text-xs px-4 py-2 rounded-full font-bold">📋 Copiar Link</button>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white border rounded-2xl p-6">
              <h2 className="font-black">Productos {sel?.name} {isBoutique&&<span className="bg-black text-white text- px-2 py-1 rounded-full ml-2">BOUTIQUE 3 FOTOS</span>} {isComida&&<span className="bg-[#00E676] text-black text- px-2 py-1 rounded-full ml-2">COMIDA CON BEBIDAS</span>}</h2>
              {sel&&<>
                <form onSubmit={saveProduct} className="grid md:grid-cols-3 gap-3 mt-4 bg-gray-50 p-4 rounded-2xl border-2 border-dashed">
                  <div className="md:col-span-3 flex justify-between"><p className="font-bold text-sm">{editing?'✏️ Editando '+editing.name:'➕ Nuevo'} {isComida?`• ${pform.categoria}`:isBoutique?'• Prenda':''}</p>{editing&&<button type="button" onClick={()=>{setEditing(null); setPform({name:'',price:'',image_url:'',categoria:'plato'}); setTallas([])}} className="text-xs underline">Cancelar</button>}</div>
                  <input className="border rounded-xl px-3 py-2" placeholder="Nombre" value={pform.name} onChange={e=>setPform({...pform,name:e.target.value})} required/>
                  <input className="border rounded-xl px-3 py-2" placeholder="Precio" type="number" value={pform.price} onChange={e=>setPform({...pform,price:e.target.value})} required/>
                  {isComida?(
                    <select className="border rounded-xl px-3 py-2 font-bold text-xs" value={pform.categoria} onChange={e=>setPform({...pform,categoria:e.target.value})}>
                      <option value="plato">🍽️ Plato principal</option><option value="bebida">🥤 Bebida</option><option value="extra">➕ Extra</option>
                    </select>
                  ):<div className="hidden md:block"></div>}
                  <label className="md:col-span-3 border-2 border-dashed rounded-xl px-3 py-4 text-center bg-white cursor-pointer"><span className="text-sm font-bold">{imgFile?'✅ '+imgFile.name: editing?'Cambiar Foto 1':'📸 Foto 1 Frente'}</span><input type="file" accept="image/*" className="hidden" onChange={e=>setImgFile(e.target.files[0])}/></label>
                  {isBoutique&&<>
                    <label className="border-2 border-dashed rounded-xl px-3 py-3 text-center bg-[#FBF9F7] cursor-pointer"><span className="text-xs font-bold">{extra1?'✅ '+extra1.name:'Foto 2 Espalda'}</span><input type="file" accept="image/*" className="hidden" onChange={e=>setExtra1(e.target.files[0])}/></label>
                    <label className="border-2 border-dashed rounded-xl px-3 py-3 text-center bg-[#FBF9F7] cursor-pointer"><span className="text-xs font-bold">{extra2?'✅ '+extra2.name:'Foto 3 Modelo'}</span><input type="file" accept="image/*" className="hidden" onChange={e=>setExtra2(e.target.files[0])}/></label>
                    <div className="md:col-span-3 bg-white border rounded-xl p-3"><p className="font-black text-">📏 TALLAS</p><div className="flex flex-wrap gap-2 mt-3">{['S','M','L','XL','XXL','28','30','32','34'].map(t=><button type="button" key={t} onClick={()=>setTallas(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])} className={`min-w- px-3 py-2 rounded-full text-xs font-bold border ${tallas.includes(t)?'bg-black text-white':'bg-white'}`}>{t}</button>)}</div></div>
                  </>}
                  <button disabled={up} className="md:col-span-3 bg-black text-white py-3 rounded-full font-bold">{up?'Guardando...': editing? 'Actualizar' : isComida? `Agregar ${pform.categoria}` : isBoutique? 'Agregar prenda' : 'Agregar producto'}</button>
                </form>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  {products.map(p=>(
                    <div key={p.id} className={`border rounded-2xl overflow-hidden bg-white ${p.categoria!=='plato'?'border-[#00E676]':''}`}>
                      <div className="relative"><img src={p.image_url} className="h-32 w-full object-cover"/>{p.extra_images?.length>0&&<span className="absolute top-2 left-2 bg-black text-white text- px-2 py-1 rounded-full">{p.extra_images.length+1} fotos</span>}{p.categoria==='bebida'&&<span className="absolute top-2 right-2 bg-[#00E676] text-black text- px-2 py-1 rounded-full">🥤 Bebida</span>}</div>
                      <div className="p-3"><p className="font-bold text-sm truncate">{p.name}</p><p className="text-sm">C$ {p.price} • {p.categoria||'plato'}</p>{p.tallas?.length>0&&<p className="text- mt-1 bg-black/5 rounded-full px-2 py-1 inline-block">Tallas: {p.tallas.join(', ')}</p>}</div>
                      <div className="p-2 border-t flex gap-2"><button onClick={()=>startEdit(p)} className="flex-1 bg-black text-white text- py-1.5 rounded-full">✏️ Editar</button><button onClick={()=>delProd(p.id)} className="flex-1 bg-red-50 text-red-600 text- py-1.5 rounded-full">🗑️ Eliminar</button></div>
                    </div>
                  ))}
                </div>
              </>}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}