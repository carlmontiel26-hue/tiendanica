'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function Admin(){
  const [stores, setStores] = useState([])
  const [products, setProducts] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [form, setForm] = useState({name:'', slug:'', whatsapp:'', description:'', cover_image:'', tipo_tienda:'comida'})
  const [pform, setPform] = useState({name:'', price:'', image_url:''})
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [log, setLog] = useState('Conectando...')

  const loadStores = async()=>{
    const { data, error } = await supabase.from('stores').select('*').order('created_at', {ascending:false})
    if(error) setLog('ERROR: '+error.message)
    else { setStores(data||[]); setLog('Conectado OK - '+data.length+' tiendas'); if(data?.[0] &&!selectedStore) setSelectedStore(data[0]) }
  }
  const loadProducts = async(storeId)=>{
    if(!storeId) return
    const { data } = await supabase.from('products').select('*').eq('store_id', storeId)
    setProducts(data||[])
  }
  useEffect(()=>{ loadStores() },[])
  useEffect(()=>{ if(selectedStore) loadProducts(selectedStore.id) },[selectedStore])

  const createStore = async(e)=>{
    e.preventDefault()
    const cleanSlug = form.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g,'-').replace(/--+/g,'-')
    const payload = {
      name:form.name,
      slug:cleanSlug,
      whatsapp:form.whatsapp,
      description:form.description,
      cover_image: form.cover_image || null,
      tipo_tienda: form.tipo_tienda, // COMIDA, BOUTIQUE O ELECTRO
      is_active:true
    }
    const { data, error } = await supabase.from('stores').insert(payload).select().single()
    if(error) alert(error.message)
    else { loadStores(); setSelectedStore(data); setForm({name:'', slug:'', whatsapp:'', description:'', cover_image:'', tipo_tienda:'comida'}); alert('Tienda creada: /'+cleanSlug+' tipo: '+form.tipo_tienda) }
  }

  const createProduct = async(e)=>{
    e.preventDefault()
    if(!selectedStore) return alert('Selecciona una tienda primero')
    if(!imageFile &&!pform.image_url) return alert('Sube una foto')
    setUploading(true)
    let finalUrl = pform.image_url
    try {
      if(imageFile){
        const fileName = `${Date.now()}-${imageFile.name.replace(/\s/g,'-')}`
        const { error: upError } = await supabase.storage.from('product-images').upload(fileName, imageFile)
        if(upError) throw upError
        const { data: {publicUrl} } = supabase.storage.from('product-images').getPublicUrl(fileName)
        finalUrl = publicUrl
      }
      const { error } = await supabase.from('products').insert({ store_id:selectedStore.id, name:pform.name, price: parseFloat(pform.price), image_url:finalUrl, is_active:true }).select()
      if(error) throw error
      setPform({name:'',price:'',image_url:''})
      setImageFile(null)
      loadProducts(selectedStore.id)
    } catch(err){
      alert('Error: '+err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fafaf9] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <img src="/logo.png" className="h-8"/>
          <div className="bg-black text-green-400 text-xs px-3 py-1 rounded-full">{log}</div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border rounded-2xl p-5">
              <h2 className="font-black text-lg">Crear Tienda</h2>
              <form onSubmit={createStore} className="mt-4 space-y-3">
                <input className="w-full border rounded-xl px-4 py-2" placeholder="Nombre ej: Cafe Dulce Aroma" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="slug ej: cafe-dulce-aroma" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="WhatsApp 505..." value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="Descripcion" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="URL Portada (opcional)" value={form.cover_image} onChange={e=>setForm({...form,cover_image:e.target.value})}/>

                {/* SELECTOR DE TIPO DE TIENDA - REGRESADO */}
                <div>
                  <label className="text-xs font-bold">Tipo de tienda *</label>
                  <select className="w-full border rounded-xl px-4 py-3 mt-1 font-bold" value={form.tipo_tienda} onChange={e=>setForm({...form,tipo_tienda:e.target.value})} required>
                    <option value="comida">🍽️ Comida - El Sazón (con Bebidas y Especialidad)</option>
                    <option value="boutique">👗 Boutique - Casa Lino (con Tallas y 3 fotos)</option>
                    <option value="electro">📱 Tecnología / Hogar - Tecno Hogar (sin bebidas)</option>
                  </select>
                  <p className="text- opacity-60 mt-1">
                    {form.tipo_tienda==='comida'?'Mostrará: Menú + Bebidas y Extras + Especialidad': form.tipo_tienda==='boutique'?'Mostrará: Tallas + Carrusel de fotos':'Mostrará: Productos normales'}
                  </p>
                </div>

                <button className="w-full bg-black text-white py-3 rounded-full font-bold">Crear Tienda</button>
              </form>
            </div>
            <div className="bg-white border rounded-2xl p-5">
              <h3 className="font-bold">Mis Tiendas ({stores.length})</h3>
              <div className="mt-3 space-y-2">
                {stores.map(s=>(
                  <button key={s.id} onClick={()=>setSelectedStore(s)} className={'w-full text-left border rounded-xl px-4 py-3 flex justify-between '+(selectedStore?.id===s.id?'bg-black text-white':'bg-white')}>
                    <span><b>{s.name}</b> <span className="text- ml-1">{s.tipo_tienda==='boutique'?'👗': s.tipo_tienda==='electro'?'📱':'🍽️'} {s.tipo_tienda||'comida'}</span><br/><span className="text-xs opacity-70">/{s.slug}</span></span>
                    <a href={'/'+s.slug} target="_blank" className="text-xs underline">Ver</a>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-2xl p-6">
              <h2 className="font-black text-lg">Productos {selectedStore? 'de '+selectedStore.name : ''} <span className="text-xs font-normal opacity-60">{selectedStore?.tipo_tienda?`(${selectedStore.tipo_tienda})`:''}</span></h2>
              {!selectedStore && <p className="text-gray-500 mt-4">Selecciona una tienda a la izquierda</p>}
              {selectedStore && <>
                <form onSubmit={createProduct} className="grid md:grid-cols-3 gap-3 mt-4 bg-gray-50 p-4 rounded-2xl">
                  <input className="border rounded-xl px-3 py-2" placeholder="Nombre producto" value={pform.name} onChange={e=>setPform({...pform,name:e.target.value})} required/>
                  <input className="border rounded-xl px-3 py-2" placeholder="Precio C$" type="number" step="0.01" value={pform.price} onChange={e=>setPform({...pform,price:e.target.value})} required/>
                  <label className="md:col-span-3 w-full border-2 border-dashed border-gray-300 rounded-xl px-3 py-4 text-center bg-white cursor-pointer hover:bg-gray-100">
                    <span className="text-sm font-bold">{imageFile? `✅ ${imageFile.name}` : '📸 Toca para subir foto desde el celular'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e=> setImageFile(e.target.files[0])} />
                  </label>
                  <button disabled={uploading} className="md:col-span-3 bg-[#00D084] text-black py-3 rounded-full font-bold disabled:opacity-50">{uploading? 'Subiendo foto...' : 'Agregar Producto'}</button>
                </form>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  {products.map(p=>(
                    <div key={p.id} className="border rounded-2xl overflow-hidden bg-white">
                      <img src={p.image_url || 'https://via.placeholder.com/300'} className="h-32 w-full object-cover"/>
                      <div className="p-3"><p className="font-bold text-sm">{p.name}</p><p className="text-sm text-gray-500">C$ {p.price}</p></div>
                    </div>
                  ))}
                  {products.length===0 && <p className="text-gray-400 text-sm col-span-3">Aún no hay productos. Agrega el primero arriba.</p>}
                </div>
                <div className="mt-6">
                  <a href={'/'+selectedStore.slug} target="_blank" className="px-5 py-2 bg-black text-white rounded-full text-sm">Ver tienda /{selectedStore.slug} →</a>
                </div>
              </>}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}