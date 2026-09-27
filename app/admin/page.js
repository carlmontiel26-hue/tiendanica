'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function Admin(){
  const [stores, setStores] = useState([])
  const [products, setProducts] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [form, setForm] = useState({name:'', slug:'', whatsapp:'', description:'', cover_image:'', tipo_tienda:'comida'})
  const [pform, setPform] = useState({name:'', price:'', image_url:'', tallas:''})
  const [imageFile, setImageFile] = useState(null)
  const [extraFile1, setExtraFile1] = useState(null)
  const [extraFile2, setExtraFile2] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
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
    setUploading(true)
    try{
      const cleanSlug = form.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g,'-').replace(/--+/g,'-')
      let finalCover = form.cover_image || null
      if(coverFile){
        const fileName = `cover-${Date.now()}-${coverFile.name.replace(/\s/g,'-')}`
        const { error: upError } = await supabase.storage.from('product-images').upload(fileName, coverFile)
        if(upError) throw upError
        const { data: {publicUrl} } = supabase.storage.from('product-images').getPublicUrl(fileName)
        finalCover = publicUrl
      }
      const payload = { name:form.name, slug:cleanSlug, whatsapp:form.whatsapp, description:form.description, cover_image: finalCover, tipo_tienda: form.tipo_tienda, is_active:true }
      const { data, error } = await supabase.from('stores').insert(payload).select().single()
      if(error) throw error
      loadStores(); setSelectedStore(data);
      setForm({name:'', slug:'', whatsapp:'', description:'', cover_image:'', tipo_tienda:'comida'})
      setCoverFile(null)
      alert('Tienda creada: /'+cleanSlug)
    }catch(err){ alert('Error: '+err.message) } finally{ setUploading(false) }
  }

  const deleteStore = async(id, slug)=>{
    if(!confirm(`¿Eliminar /${slug}? Borrará productos.`)) return
    try{
      await supabase.from('products').delete().eq('store_id', id)
      const { error } = await supabase.from('stores').delete().eq('id', id)
      if(error) throw error
      setSelectedStore(null)
      loadStores()
    }catch(err){ alert('Error: '+err.message) }
  }

  const uploadOne = async(file)=>{
    const fileName = `${Date.now()}-${file.name.replace(/\s/g,'-')}`
    const { error } = await supabase.storage.from('product-images').upload(fileName, file)
    if(error) throw error
    const { data: {publicUrl} } = supabase.storage.from('product-images').getPublicUrl(fileName)
    return publicUrl
  }

  const createProduct = async(e)=>{
    e.preventDefault()
    if(!selectedStore) return alert('Selecciona tienda')
    if(!imageFile &&!pform.image_url) return alert('Sube foto')
    setUploading(true)
    try {
      let finalUrl = pform.image_url
      if(imageFile) finalUrl = await uploadOne(imageFile)
      let extraImgs = []
      if(extraFile1) extraImgs.push(await uploadOne(extraFile1))
      if(extraFile2) extraImgs.push(await uploadOne(extraFile2))
      let tallasArray = null
      if(selectedStore.tipo_tienda==='boutique' && pform.tallas){
        tallasArray = pform.tallas.split(',').map(t=>t.trim()).filter(Boolean)
      }
      const insertData = { store_id:selectedStore.id, name:pform.name, price: parseFloat(pform.price), image_url:finalUrl, extra_images: extraImgs.length>0? extraImgs : null, tallas: tallasArray, is_active:true }
      const { error } = await supabase.from('products').insert(insertData).select()
      if(error) throw error
      setPform({name:'',price:'',image_url:'', tallas:''})
      setImageFile(null); setExtraFile1(null); setExtraFile2(null)
      loadProducts(selectedStore.id)
    } catch(err){ alert('Error: '+err.message) } finally { setUploading(false) }
  }

  const isBoutique = selectedStore?.tipo_tienda==='boutique'
  const storeUrl = selectedStore? `https://tiendanica.store/${selectedStore.slug}` : ''

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
                <input className="w-full border rounded-xl px-4 py-2" placeholder="Nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="slug" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="WhatsApp 505..." value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="Descripcion" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
                <label className="w-full border-2 border-dashed rounded-xl px-3 py-3 text-center bg-white cursor-pointer block">
                  <span className="text-xs font-bold">{coverFile? `✅ ${coverFile.name}` : '🖼️ Subir portada local'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e=> setCoverFile(e.target.files[0])} />
                </label>
                <input className="w-full border rounded-xl px-4 py-2 text-xs" placeholder="O URL portada" value={form.cover_image} onChange={e=>setForm({...form,cover_image:e.target.value})}/>
                <select className="w-full border rounded-xl px-4 py-3 font-bold" value={form.tipo_tienda} onChange={e=>setForm({...form,tipo_tienda:e.target.value})}>
                  <option value="comida">🍽️ Comida</option>
                  <option value="boutique">👗 Boutique</option>
                  <option value="electro">📱 Electro</option>
                </select>
                <button disabled={uploading} className="w-full bg-black text-white py-3 rounded-full font-bold">{uploading?'Creando...':'Crear Tienda'}</button>
              </form>
            </div>

            {/* QR Y LINKS REGRESADOS */}
            {selectedStore && (
              <div className="bg-black text-white border rounded-2xl p-5">
                <h3 className="font-bold text-sm">🔗 Links y QR - {selectedStore.name}</h3>
                <div className="bg-white rounded-xl p-3 mt-3 flex flex-col items-center">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(storeUrl)}`} alt="QR" className="w-40 h-40"/>
                  <p className="text-black text- mt-2 font-bold">Escanea para abrir la tienda</p>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text- opacity-60">Link de la tienda</p>
                    <p className="text-xs font-bold break-all">{storeUrl}</p>
                    <button onClick={()=>navigator.clipboard.writeText(storeUrl)} className="mt-2 w-full bg-white text-black py-1 rounded-full text-xs font-bold">Copiar Link</button>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text- opacity-60">Link de WhatsApp</p>
                    <p className="text- break-all">https://wa.me/{selectedStore.whatsapp}</p>
                  </div>
                  <a href={storeUrl} target="_blank" className="block w-full bg-[#00E676] text-black py-2 rounded-full text-center text-xs font-black mt-2">Abrir Tienda →</a>
                </div>
              </div>
            )}

            <div className="bg-white border rounded-2xl p-5">
              <h3 className="font-bold">Mis Tiendas ({stores.length})</h3>
              <div className="mt-3 space-y-2">
                {stores.map(s=>(
                  <div key={s.id} className={'border rounded-xl px-4 py-3 flex justify-between items-center '+(selectedStore?.id===s.id?'bg-black text-white':'bg-white')}>
                    <button onClick={()=>setSelectedStore(s)} className="flex-1 text-left"><b>{s.name}</b><br/><span className="text-xs opacity-70">/{s.slug}</span></button>
                    <div className="flex flex-col gap-1 ml-2">
                      <a href={'/'+s.slug} target="_blank" className="text- bg-white text-black px-2 py-1 rounded-full text-center">Ver</a>
                      <button onClick={()=>deleteStore(s.id, s.slug)} className="text- bg-red-500 text-white px-2 py-1 rounded-full">X</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white border rounded-2xl p-6">
              <h2 className="font-black text-lg">Productos {selectedStore? 'de '+selectedStore.name : ''}</h2>
              {selectedStore && <>
                <form onSubmit={createProduct} className="grid md:grid-cols-3 gap-3 mt-4 bg-gray-50 p-4 rounded-2xl">
                  <input className="border rounded-xl px-3 py-2" placeholder="Nombre" value={pform.name} onChange={e=>setPform({...pform,name:e.target.value})} required/>
                  <input className="border rounded-xl px-3 py-2" placeholder="Precio C$" type="number" step="0.01" value={pform.price} onChange={e=>setPform({...pform,price:e.target.value})} required/>
                  {isBoutique && <input className="border rounded-xl px-3 py-2" placeholder="Tallas S,M,L" value={pform.tallas} onChange={e=>setPform({...pform,tallas:e.target.value})}/>}
                  <label className="md:col-span-3 border-2 border-dashed rounded-xl px-3 py-4 text-center bg-white cursor-pointer">
                    <span className="text-sm font-bold">{imageFile? `✅ ${imageFile.name}` : '📸 Foto principal'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e=> setImageFile(e.target.files[0])} />
                  </label>
                  {isBoutique && <>
                    <label className="md:col-span-3 border border-dashed rounded-xl px-3 py-3 text-center bg-[#F6F3F0] cursor-pointer block">
                      <span className="text-xs font-bold">{extraFile1? `✅ Extra 1: ${extraFile1.name}` : '➕ Foto extra 1 carrusel'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e=> setExtraFile1(e.target.files[0])} />
                    </label>
                    <label className="md:col-span-3 border border-dashed rounded-xl px-3 py-3 text-center bg-[#F6F3F0] cursor-pointer block">
                      <span className="text-xs font-bold">{extraFile2? `✅ Extra 2: ${extraFile2.name}` : '➕ Foto extra 2 carrusel'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e=> setExtraFile2(e.target.files[0])} />
                    </label>
                  </>}
                  <button disabled={uploading} className="md:col-span-3 bg-[#00D084] text-black py-3 rounded-full font-bold">{uploading? 'Subiendo...' : 'Agregar Producto'}</button>
                </form>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  {products.map(p=>(
                    <div key={p.id} className="border rounded-2xl overflow-hidden bg-white">
                      <img src={p.image_url} className="h-32 w-full object-cover"/>
                      <div className="p-3"><p className="font-bold text-sm">{p.name}</p><p className="text-sm">C$ {p.price}</p>{p.extra_images?.length>0 && <p className="text- text-green-600 font-bold">+{p.extra_images.length} extras</p>}</div>
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