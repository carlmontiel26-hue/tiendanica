'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function Admin(){
  const [stores, setStores] = useState([])
  const [products, setProducts] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [form, setForm] = useState({name:'', slug:'', whatsapp:'', description:''})
  const [pform, setPform] = useState({name:'', price:'', image_url:''})
  const [imageFile, setImageFile] = useState(null)
  const [extraFile1, setExtraFile1] = useState(null)
  const [extraFile2, setExtraFile2] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [log, setLog] = useState('Conectando...')
  const [tallas, setTallas] = useState([])
  const [tipoTalla, setTipoTalla] = useState('letras')
  const [editing, setEditing] = useState(null)

  const loadStores = async()=>{
    const { data } = await supabase.from('stores').select('*').order('created_at',{ascending:false})
    setStores(data||[]); setLog('OK '+data.length+' tiendas'); if(data?.[0] && !selectedStore) setSelectedStore(data[0])
  }
  const loadProducts = async(id)=>{
    const { data } = await supabase.from('products').select('*').eq('store_id',id).order('created_at',{ascending:false})
    setProducts(data||[])
  }
  useEffect(()=>{ loadStores() },[])
  useEffect(()=>{ if(selectedStore) loadProducts(selectedStore.id) },[selectedStore])

  const createStore = async(e)=>{
    e.preventDefault()
    const slug = form.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g,'-')
    const { data } = await supabase.from('stores').insert({name:form.name, slug, whatsapp:form.whatsapp, description:form.description, is_active:true}).select().single()
    if(data){ loadStores(); setSelectedStore(data) }
  }
  const deleteStore = async(id)=>{
    if(!confirm('Eliminar tienda y productos?')) return
    await supabase.from('stores').delete().eq('id',id)
    setSelectedStore(null); loadStores()
  }
  const uploadOne = async(file)=>{
    if(!file) return null
    const name = `${Date.now()}-${file.name.replace(/\s/g,'-')}`
    await supabase.storage.from('product-images').upload(name, file)
    const { data } = supabase.storage.from('product-images').getPublicUrl(name)
    return data.publicUrl
  }
  const saveProduct = async(e)=>{
    e.preventDefault()
    if(!selectedStore) return
    setUploading(true)
    try{
      let finalUrl = pform.image_url
      if(imageFile) finalUrl = await uploadOne(imageFile)
      let extras = editing?.extra_images||[]
      if(selectedStore.tipo_tienda==='boutique'){
        if(extraFile1){ const u=await uploadOne(extraFile1); if(u) extras=[...extras,u] }
        if(extraFile2){ const u=await uploadOne(extraFile2); if(u) extras=[...extras,u] }
        extras=extras.slice(0,2)
      }
      const payload = {store_id:selectedStore.id, name:pform.name, price:parseFloat(pform.price), image_url:finalUrl, is_active:true, extra_images:selectedStore.tipo_tienda==='boutique'?extras:[], tallas:selectedStore.tipo_tienda==='boutique'?tallas:[], tipo_talla:selectedStore.tipo_tienda==='boutique'?tipoTalla:null}
      if(editing){ await supabase.from('products').update(payload).eq('id',editing.id) }
      else{ await supabase.from('products').insert(payload) }
      setPform({name:'',price:'',image_url:''}); setImageFile(null); setExtraFile1(null); setExtraFile2(null); setTallas([]); setEditing(null)
      loadProducts(selectedStore.id)
    }catch(err){ alert(err.message) } finally{ setUploading(false) }
  }
  const startEdit = (p)=>{ setEditing(p); setPform({name:p.name, price:p.price, image_url:p.image_url}); setTallas(p.tallas||[]); setTipoTalla(p.tipo_talla||'letras') }
  const delProd = async(id)=>{ if(!confirm('Eliminar producto?')) return; await supabase.from('products').delete().eq('id',id); loadProducts(selectedStore.id) }

  const isBoutique = selectedStore?.tipo_tienda==='boutique'
  return (
    <main className="min-h-screen bg-[#fafaf9] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between"><img src="/logo.png" className="h-8"/><div className="bg-black text-green-400 text-xs px-3 py-1 rounded-full">{log}</div></div>
        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border rounded-2xl p-5">
              <h2 className="font-black">Crear Tienda</h2>
              <form onSubmit={createStore} className="mt-4 space-y-3">
                <input className="w-full border rounded-xl px-4 py-2" placeholder="Nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="slug" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="WhatsApp" value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="Descripcion" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
                <button className="w-full bg-black text-white py-3 rounded-full font-bold">Crear Tienda</button>
              </form>
            </div>
            <div className="bg-white border rounded-2xl p-5">
              <h3 className="font-bold">Mis Tiendas ({stores.length})</h3>
              <div className="mt-3 space-y-2">
                {stores.map(s=>(
                  <div key={s.id} className={'border rounded-xl px-4 py-3 flex justify-between items-center '+(selectedStore?.id===s.id?'bg-black text-white':'bg-white')}>
                    <button onClick={()=>setSelectedStore(s)} className="text-left flex-1"><b>{s.name}</b><br/><span className="text-xs opacity-70">/{s.slug} • {s.tipo_tienda}</span></button>
                    <div className="flex gap-1"><a href={'/'+s.slug} target="_blank" className="text-[10px] bg-white/20 px-2 py-1 rounded-full">Ver</a><button onClick={()=>deleteStore(s.id)} className="text-[10px] bg-red-500 text-white px-2 py-1 rounded-full">🗑️</button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-2xl p-6">
              <h2 className="font-black">Productos {selectedStore?.name} {isBoutique && <span className="bg-black text-white text-[10px] px-2 py-1 rounded-full ml-2">BOUTIQUE CARRUSEL</span>}</h2>
              {selectedStore && <>
                <form onSubmit={saveProduct} className="grid md:grid-cols-3 gap-3 mt-4 bg-gray-50 p-4 rounded-2xl border-2 border-dashed">
                  <div className="md:col-span-3 flex justify-between"><p className="font-bold text-sm">{editing?'✏️ Editando '+editing.name:'➕ Nuevo'}</p>{editing && <button type="button" onClick={()=>{setEditing(null); setPform({name:'',price:'',image_url:''}); setTallas([])}} className="text-xs underline">Cancelar</button>}</div>
                  <input className="border rounded-xl px-3 py-2" placeholder="Nombre" value={pform.name} onChange={e=>setPform({...pform,name:e.target.value})} required/>
                  <input className="border rounded-xl px-3 py-2" placeholder="Precio" type="number" value={pform.price} onChange={e=>setPform({...pform,price:e.target.value})} required/>
                  <label className="md:col-span-3 border-2 border-dashed rounded-xl px-3 py-4 text-center bg-white cursor-pointer"><span className="text-sm font-bold">{imageFile?'✅ '+imageFile.name: editing?'Cambiar foto principal':'Foto 1 Frente'}</span><input type="file" accept="image/*" className="hidden" onChange={e=>setImageFile(e.target.files[0])}/></label>
                  {isBoutique && <>
                    <label className="border-2 border-dashed rounded-xl px-3 py-3 text-center bg-[#FBF9F7] cursor-pointer"><span className="text-xs font-bold">{extraFile1?'✅ '+extraFile1.name:'Foto 2 Espalda'}</span><input type="file" accept="image/*" className="hidden" onChange={e=>setExtraFile1(e.target.files[0])}/></label>
                    <label className="border-2 border-dashed rounded-xl px-3 py-3 text-center bg-[#FBF9F7] cursor-pointer"><span className="text-xs font-bold">{extraFile2?'✅ '+extraFile2.name:'Foto 3 Modelo'}</span><input type="file" accept="image/*" className="hidden" onChange={e=>setExtraFile2(e.target.files[0])}/></label>
                    <div className="md:col-span-3 bg-white border rounded-xl p-3">
                      <p className="font-black text-[12px]">📏 TALLAS</p>
                      <div className="flex gap-2 mt-2"><button type="button" onClick={()=>setTipoTalla('letras')} className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${tipoTalla==='letras'?'bg-black text-white':'bg-white'}`}>S M L</button><button type="button" onClick={()=>setTipoTalla('numero')} className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${tipoTalla==='numero'?'bg-black text-white':'bg-white'}`}>28 30 32</button></div>
                      <div className="flex flex-wrap gap-2 mt-3">{(tipoTalla==='letras'?['S','M','L','XL','XXL']:['28','30','32','34','36','38']).map(t=><button type="button" key={t} onClick={()=> setTallas(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])} className={`min-w-[44px] px-3 py-2 rounded-full text-xs font-bold border ${tallas.includes(t)?'bg-black text-white':'bg-white'}`}>{t}</button>)}</div>
                      <input value={tallas.join(', ')} readOnly className="mt-2 w-full border rounded-full px-3 py-2 text-xs bg-black/5" placeholder="Tallas seleccionadas"/>
                    </div>
                  </>}
                  <button disabled={uploading} className="md:col-span-3 bg-[#00D084] text-black py-3 rounded-full font-bold">{uploading?'Guardando...': editing?'Actualizar Producto':'Agregar Producto'}</button>
                </form>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  {products.map(p=>(
                    <div key={p.id} className="border rounded-2xl overflow-hidden bg-white">
                      <div className="relative"><img src={p.image_url} className="h-32 w-full object-cover"/>{p.extra_images?.length>0 && <span className="absolute top-2 left-2 bg-black text-white text-[9px] px-2 py-1 rounded-full">{p.extra_images.length+1} fotos</span>}</div>
                      <div className="p-3"><p className="font-bold text-sm truncate">{p.name}</p><p className="text-sm">C$ {p.price}</p>{p.tallas?.length>0 && <p className="text-[10px] mt-1 bg-black/5 rounded-full px-2 py-1 inline-block">Tallas: {p.tallas.join(', ')}</p>}</div>
                      <div className="p-2 border-t flex gap-2"><button onClick={()=>startEdit(p)} className="flex-1 bg-black text-white text-[11px] py-1.5 rounded-full">✏️ Editar</button><button onClick={()=>delProd(p.id)} className="flex-1 bg-red-50 text-red-600 text-[11px] py-1.5 rounded-full">🗑️ Eliminar</button></div>
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
