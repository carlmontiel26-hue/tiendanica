'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function Admin(){
  const [stores, setStores] = useState([])
  const [products, setProducts] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [form, setForm] = useState({name:'', slug:'', whatsapp:'', description:''})
  const [pform, setPform] = useState({name:'', price:'', image_url:'', id:null})
  const [imageFile, setImageFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const loadStores = async()=>{
    const { data } = await supabase.from('stores').select('*').order('created_at',{ascending:false})
    setStores(data||[])
    if(data?.[0]) setSelectedStore(data[0])
  }
  const loadProducts = async(id)=>{
    const { data } = await supabase.from('products').select('*').eq('store_id', id).order('created_at',{ascending:false})
    setProducts(data||[])
  }
  useEffect(()=>{ loadStores() },[])
  useEffect(()=>{ if(selectedStore) loadProducts(selectedStore.id) },[selectedStore])

  const upload = async(file)=>{
    const name = Date.now()+'-'+file.name.replace(/[^a-zA-Z0-9.-]/g,'-')
    const { error } = await supabase.storage.from('tienda-images').upload(name, file)
    if(error) throw error
    const { data } = supabase.storage.from('tienda-images').getPublicUrl(name)
    return data.publicUrl
  }

  const createStore = async(e)=>{
    e.preventDefault()
    setUploading(true)
    try{
      const cleanSlug = form.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g,'-')
      const { data, error } = await supabase.from('stores').insert({ name:form.name, slug:cleanSlug, whatsapp:form.whatsapp, description:form.description, is_active:true }).select().single()
      if(error) throw error
      if(coverFile){
        try{
          const url = await upload(coverFile)
          await supabase.from('stores').update({ cover_image: url }).eq('id', data.id)
        }catch{}
      }
      setForm({name:'', slug:'', whatsapp:'', description:''}); setCoverFile(null)
      await loadStores(); setSelectedStore(data); alert('Tienda creada: /'+cleanSlug)
    }catch(err){ alert(err.message) } finally{ setUploading(false) }
  }

  const createProduct = async(e)=>{
    e.preventDefault()
    if(!selectedStore) return alert('Selecciona tienda')
    setUploading(true)
    try{
      let url = pform.image_url
      if(imageFile) url = await upload(imageFile)
      if(!url) throw new Error('Sube foto')
      await supabase.from('products').insert({ store_id:selectedStore.id, name:pform.name, price:parseFloat(pform.price), image_url:url, is_active:true })
      setPform({name:'',price:'',image_url:'',id:null}); setImageFile(null)
      loadProducts(selectedStore.id)
    }catch(err){ alert(err.message) } finally{ setUploading(false) }
  }

  return (
    <main className="min-h-screen bg-[#fafaf9] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-black">Super Admin - TiendaNica</h1>
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="space-y-6">
            <div className="bg-white border rounded-2xl p-5">
              <h2 className="font-bold">Crear Tienda</h2>
              <form onSubmit={createStore} className="mt-3 space-y-3">
                <input className="w-full border rounded-xl px-3 py-2" placeholder="Nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                <input className="w-full border rounded-xl px-3 py-2" placeholder="slug ej: prueba2" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required/>
                <input className="w-full border rounded-xl px-3 py-2" placeholder="WhatsApp" value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} required/>
                <input className="w-full border rounded-xl px-3 py-2" placeholder="Descripcion" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
                <label className="w-full border-2 border-dashed rounded-xl p-3 bg-yellow-50 block text-center cursor-pointer">
                  <span className="text-xs font-bold">{coverFile? '✅ '+coverFile.name : '🖼️ Foto PORTADA (opcional)'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e=>setCoverFile(e.target.files[0])}/>
                </label>
                <button className="w-full bg-black text-white py-3 rounded-full font-bold">{uploading?'Creando...':'Crear Tienda'}</button>
              </form>
            </div>
            <div className="bg-white border rounded-2xl p-4">
              <h3 className="font-bold">Mis Tiendas ({stores.length})</h3>
              {stores.map(s=>(
                <div key={s.id} className="border rounded-xl p-3 mt-2 flex justify-between">
                  <button onClick={()=>setSelectedStore(s)} className="text-left"><b>{s.name}</b><div className="text-xs">/{s.slug}</div></button>
                  <a href={'/'+s.slug} target="_blank" className="text-xs underline">Ver</a>
                </div>
              ))}
            </div>
            {selectedStore && (
              <div className="bg-white border-2 border-black rounded-2xl p-4">
                <h3 className="font-bold text-sm">QR {selectedStore.name}</h3>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://tiendanica.store/${selectedStore.slug}`} className="w-40 h-40 mx-auto mt-3 bg-white p-2 rounded-xl"/>
                <a href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=https://tiendanica.store/${selectedStore.slug}`} target="_blank" className="block mt-3 bg-black text-white text-center py-2 rounded-full text-xs">⬇️ Descargar HD</a>
                <div className="text-[11px] mt-2 break-all">
                  <div>Tienda: tiendanica.store/{selectedStore.slug}</div>
                  <div>Admin: tiendanica.store/{selectedStore.slug}/admin</div>
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-2 bg-white border rounded-2xl p-5">
            <h2 className="font-bold">Productos de {selectedStore?.name||''}</h2>
            {selectedStore && (
              <>
                <form onSubmit={createProduct} className="grid grid-cols-3 gap-3 mt-4 bg-gray-50 p-4 rounded-2xl">
                  <input className="border rounded-xl px-3 py-2" placeholder="Nombre" value={pform.name} onChange={e=>setPform({...pform,name:e.target.value})} required/>
                  <input className="border rounded-xl px-3 py-2" placeholder="Precio" type="number" value={pform.price} onChange={e=>setPform({...pform,price:e.target.value})} required/>
                  <label className="col-span-3 border-2 border-dashed rounded-xl p-4 text-center bg-white cursor-pointer">
                    <span className="text-sm font-bold">{imageFile? '✅ '+imageFile.name : '📸 Foto producto'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e=>setImageFile(e.target.files[0])}/>
                  </label>
                  <button className="col-span-3 bg-[#00D084] py-3 rounded-full font-bold">{uploading?'Subiendo...':'Agregar Producto'}</button>
                </form>
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {products.map(p=>(
                    <div key={p.id} className="border rounded-2xl overflow-hidden"><img src={p.image_url} className="h-24 w-full object-cover"/><div className="p-2 text-xs"><b>{p.name}</b> C$ {p.price}</div></div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
