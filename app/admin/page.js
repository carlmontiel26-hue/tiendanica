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
  const [log, setLog] = useState('Conectando...')
  const [editing, setEditing] = useState(false)

  const loadStores = async()=>{
    const { data } = await supabase.from('stores').select('*').order('created_at', {ascending:false})
    setStores(data||[]); setLog('Conectado OK - '+(data?.length||0)+' tiendas'); if(data?.[0]) setSelectedStore(data[0])
  }
  const loadProducts = async(id)=>{
    const { data } = await supabase.from('products').select('*').eq('store_id', id).order('created_at',{ascending:false})
    setProducts(data||[])
  }
  useEffect(()=>{ loadStores() },[])
  useEffect(()=>{ if(selectedStore) loadProducts(selectedStore.id) },[selectedStore])

  const uploadToBucket = async(file)=>{
    const name = Date.now()+'-'+file.name.replace(/[^a-zA-Z0-9.-]/g,'-')
    const { error } = await supabase.storage.from('product-images').upload(name, file)
    if(error) throw error
    const { data } = supabase.storage.from('product-images').getPublicUrl(name)
    return data.publicUrl
  }

  const createStore = async(e)=>{
    e.preventDefault()
    setUploading(true)
    try{
      const cleanSlug = form.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g,'-').replace(/--+/g,'-')
      // FIX: SOLO columnas que existen - sin banner_url
      const { data, error } = await supabase.from('stores').insert({
        name: form.name,
        slug: cleanSlug,
        whatsapp: form.whatsapp,
        description: form.description,
        is_active: true
      }).select().single()
      if(error) throw error
      setForm({name:'', slug:'', whatsapp:'', description:''}); setCoverFile(null)
      await loadStores(); setSelectedStore(data); alert('Tienda creada: /'+cleanSlug)
    }catch(err){ alert('Error: '+err.message) } finally{ setUploading(false) }
  }

  const createProduct = async(e)=>{
    e.preventDefault()
    if(!selectedStore) return alert('Selecciona tienda')
    if(!imageFile &&!pform.image_url &&!editing) return alert('Sube foto')
    setUploading(true)
    let finalUrl = pform.image_url
    try {
      if(imageFile){ finalUrl = await uploadToBucket(imageFile) }
      if(editing && pform.id){
        await supabase.from('products').update({ name:pform.name, price: parseFloat(pform.price), image_url:finalUrl }).eq('id', pform.id)
      } else {
        await supabase.from('products').insert({ store_id:selectedStore.id, name:pform.name, price: parseFloat(pform.price), image_url:finalUrl, is_active:true })
      }
      setPform({name:'',price:'',image_url:'',id:null}); setImageFile(null); setEditing(false)
      loadProducts(selectedStore.id)
    } catch(err){ alert(err.message) } finally { setUploading(false) }
  }

  const startEdit=(p)=>{ setPform({name:p.name, price:p.price, image_url:p.image_url||'', id:p.id}); setEditing(true) }
  const cancelEdit=()=>{ setPform({name:'',price:'',image_url:'',id:null}); setEditing(false); setImageFile(null) }
  const deleteStore=async(id)=>{ if(!confirm('¿Eliminar?'))return; await supabase.from('products').delete().eq('store_id',id); await supabase.from('stores').delete().eq('id',id); setSelectedStore(null); loadStores() }
  const deleteProduct=async(id)=>{ if(!confirm('¿Borrar?'))return; await supabase.from('products').delete().eq('id',id); loadProducts(selectedStore.id) }

  return (
    <main className="min-h-screen bg-[#fafaf9] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center"><img src="/logo.png" className="h-8"/><div className="bg-black text-green-400 text-xs px-3 py-1 rounded-full">{log}</div></div>
        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border rounded-2xl p-5">
              <h2 className="font-black">Crear Tienda</h2>
              <form onSubmit={createStore} className="mt-4 space-y-3">
                <input className="w-full border rounded-xl px-4 py-2" placeholder="Nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="slug" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="WhatsApp 505..." value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="Descripcion" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
                <button disabled={uploading} className="w-full bg-black text-white py-3 rounded-full font-bold">{uploading?'Creando...':'Crear Tienda'}</button>
              </form>
            </div>
            <div className="bg-white border rounded-2xl p-5">
              <h3 className="font-bold">Mis Tiendas ({stores.length})</h3>
              <div className="mt-3 space-y-2">
                {stores.map(s=>(
                  <div key={s.id} className={'border rounded-xl px-4 py-3 flex justify-between '+(selectedStore?.id===s.id?'bg-black text-white':'bg-white')}>
                    <button onClick={()=>setSelectedStore(s)} className="text-left"><b>{s.name}</b><br/><span className="text-xs">/{s.slug}</span></button>
                    <div className="flex flex-col gap-1"><a href={'/'+s.slug} target="_blank" className="text- bg-white text-black border px-2 py-1 rounded-full text-center">Ver</a><button onClick={()=>deleteStore(s.id)} className="text- bg-red-500 text-white px-2 py-1 rounded-full">Eliminar</button></div>
                  </div>
                ))}
              </div>
            </div>
            {selectedStore && (
              <div className="bg-white border-2 border-black rounded-2xl p-5">
                <h3 className="font-black text-sm">Links y QR - {selectedStore.name}</h3>
                <div className="mt-3 flex gap-3">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://tiendanica.store/${selectedStore.slug}`} className="w-20 h-20 border rounded-lg p-1"/>
                  <div className="flex-1">
                    <p className="text- font-bold">Tienda:</p><a href={`https://tiendanica.store/${selectedStore.slug}`} target="_blank" className="text- text-blue-600 underline break-all">tiendanica.store/{selectedStore.slug}</a>
                    <p className="text- font-bold mt-2">Admin:</p><a href={`https://tiendanica.store/${selectedStore.slug}/admin`} target="_blank" className="text- text-blue-600 underline break-all">tiendanica.store/{selectedStore.slug}/admin</a>
                    <p className="text- text-gray-500">Pass: {selectedStore.whatsapp}</p>
                  </div>
                </div>
                <div className="mt-4 bg-black text-white rounded-xl p-4">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=https://tiendanica.store/${selectedStore.slug}`} className="w-full max-w- mx-auto bg-white rounded-xl p-2"/>
                  <a href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=https://tiendanica.store/${selectedStore.slug}`} target="_blank" className="block mt-3 bg-[#00ff88] text-black text-center py-2 rounded-full font-black text-xs">⬇️ HD 1000px</a>
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-2xl p-6">
              <h2 className="font-black">Productos {selectedStore?.name||''}</h2>
              {selectedStore && <>
                <form onSubmit={createProduct} className="grid md:grid-cols-3 gap-3 mt-4 bg-gray-50 p-4 rounded-2xl">
                  <input className="border rounded-xl px-3 py-2" placeholder="Nombre" value={pform.name} onChange={e=>setPform({...pform,name:e.target.value})} required/>
                  <input className="border rounded-xl px-3 py-2" placeholder="Precio C$" type="number" value={pform.price} onChange={e=>setPform({...pform,price:e.target.value})} required/>
                  <label className="md:col-span-3 border-2 border-dashed rounded-xl px-3 py-4 text-center bg-white cursor-pointer"><span className="text-sm font-bold">{imageFile? `✅ ${imageFile.name}` : '📸 Subir foto'}</span><input type="file" accept="image/*" className="hidden" onChange={e=> setImageFile(e.target.files[0])} /></label>
                  <div className="md:col-span-3 flex gap-2"><button className="flex-1 bg-[#00D084] py-3 rounded-full font-bold">{editing?'Guardar':'Agregar'}</button>{editing && <button type="button" onClick={cancelEdit} className="flex-1 border-2 border-black py-3 rounded-full font-bold">Cancelar</button>}</div>
                </form>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  {products.map(p=>(<div key={p.id} className="border rounded-2xl overflow-hidden"><img src={p.image_url} className="h-32 w-full object-cover"/><div className="p-3"><p className="font-bold text-sm">{p.name}</p><p className="text-sm">C$ {p.price}</p><div className="flex gap-1 mt-2"><button onClick={()=>startEdit(p)} className="flex-1 bg-black text-white text- py-1 rounded-full">Editar</button><button onClick={()=>deleteProduct(p.id)} className="flex-1 bg-red-500 text-white text- py-1 rounded-full">Borrar</button></div></div></div>))}
                </div>
              </>}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}