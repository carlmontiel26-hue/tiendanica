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

  const loadStores = async()=>{
    const { data, error } = await supabase.from('stores').select('*').order('created_at', {ascending:false})
    if(error) setLog('ERROR: '+error.message)
    else { setStores(data||[]); setLog('Conectado OK - '+data.length+' tiendas'); if(data?.[0] && !selectedStore) setSelectedStore(data[0]) }
  }
  const loadProducts = async(storeId)=>{
    if(!storeId) return
    const { data } = await supabase.from('products').select('*').eq('store_id', storeId).order('created_at',{ascending:false})
    setProducts(data||[])
  }
  useEffect(()=>{ loadStores() },[])
  useEffect(()=>{ if(selectedStore) { loadProducts(selectedStore.id); setTallas([]); setExtraFile1(null); setExtraFile2(null) } },[selectedStore])

  const createStore = async(e)=>{
    e.preventDefault()
    const cleanSlug = form.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g,'-').replace(/--+/g,'-')
    const { data, error } = await supabase.from('stores').insert({ name:form.name, slug:cleanSlug, whatsapp:form.whatsapp, description:form.description, is_active:true }).select().single()
    if(error) alert(error.message)
    else { loadStores(); setSelectedStore(data); alert('Tienda creada: /'+cleanSlug) }
  }

  const uploadOne = async (file) => {
    if(!file) return null
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name.replace(/\s/g,'-')}`
    const { error: upError } = await supabase.storage.from('product-images').upload(fileName, file)
    if(upError) throw upError
    const { data: {publicUrl} } = supabase.storage.from('product-images').getPublicUrl(fileName)
    return publicUrl
  }

  const toggleTalla = (t) => {
    setTallas(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])
  }

  const createProduct = async(e)=>{
    e.preventDefault()
    if(!selectedStore) return alert('Selecciona una tienda primero')
    if(!imageFile && !pform.image_url) return alert('Sube una foto principal')
    const isBoutique = selectedStore.tipo_tienda === 'boutique'
    if(isBoutique && tallas.length===0){
      const ok = confirm('No has seleccionado tallas. ¿Guardar como TALLA UNICA? (OK = si, Cancel = volver a elegir tallas)')
      if(!ok) return
    }
    setUploading(true)
    try {
      let finalUrl = pform.image_url
      if(imageFile){
        finalUrl = await uploadOne(imageFile)
      }
      let extraUrls = []
      if(isBoutique){
        if(extraFile1){ const u1 = await uploadOne(extraFile1); if(u1) extraUrls.push(u1) }
        if(extraFile2){ const u2 = await uploadOne(extraFile2); if(u2) extraUrls.push(u2) }
      }

      const payload = { 
        store_id:selectedStore.id, 
        name:pform.name, 
        price: parseFloat(pform.price), 
        image_url:finalUrl, 
        is_active:true,
        extra_images: isBoutique ? extraUrls : [],
        tallas: isBoutique ? tallas : [],
        tipo_talla: isBoutique ? tipoTalla : null
      }

      const { error } = await supabase.from('products').insert(payload).select()
      if(error) throw error
      setPform({name:'',price:'',image_url:''})
      setImageFile(null)
      setExtraFile1(null)
      setExtraFile2(null)
      setTallas([])
      loadProducts(selectedStore.id)
    } catch(err){
      alert('Error: '+err.message)
    } finally {
      setUploading(false)
    }
  }

  const isBoutique = selectedStore?.tipo_tienda === 'boutique'

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
                <button className="w-full bg-black text-white py-3 rounded-full font-bold">Crear Tienda</button>
              </form>
            </div>
            <div className="bg-white border rounded-2xl p-5">
              <h3 className="font-bold">Mis Tiendas ({stores.length})</h3>
              <div className="mt-3 space-y-2">
                {stores.map(s=>(
                  <button key={s.id} onClick={()=>setSelectedStore(s)} className={'w-full text-left border rounded-xl px-4 py-3 flex justify-between '+(selectedStore?.id===s.id?'bg-black text-white':'bg-white')}>
                    <span><b>{s.name}</b><br/><span className="text-xs opacity-70">/{s.slug} • {s.tipo_tienda||'comida'}</span></span>
                    <a href={'/'+s.slug} target="_blank" className="text-xs underline">Ver</a>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-2xl p-6">
              <h2 className="font-black text-lg">Productos {selectedStore? 'de '+selectedStore.name : ''} {isBoutique && <span className="bg-black text-white text-[10px] px-2 py-1 rounded-full ml-2">BOUTIQUE • CON TALLAS</span>}</h2>
              {!selectedStore && <p className="text-gray-500 mt-4">Selecciona una tienda a la izquierda</p>}
              {selectedStore && <>
                <form onSubmit={createProduct} className="grid md:grid-cols-3 gap-3 mt-4 bg-gray-50 p-4 rounded-2xl">
                  <input className="border rounded-xl px-3 py-2" placeholder="Nombre producto" value={pform.name} onChange={e=>setPform({...pform,name:e.target.value})} required/>
                  <input className="border rounded-xl px-3 py-2" placeholder="Precio C$" type="number" step="0.01" value={pform.price} onChange={e=>setPform({...pform,price:e.target.value})} required/>
                  <label className="md:col-span-3 w-full border-2 border-dashed border-gray-300 rounded-xl px-3 py-4 text-center bg-white cursor-pointer hover:bg-gray-100">
                    <span className="text-sm font-bold">{imageFile? `✅ Principal: ${imageFile.name}` : '📸 Foto 1 FRENTE (principal) - Toca para subir'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e=> setImageFile(e.target.files[0])} />
                  </label>

                  {isBoutique && (
                    <>
                      <div className="md:col-span-3 border-t pt-4 mt-2">
                        <p className="font-black text-[12px] tracking-widest">📸 GALERIA BOUTIQUE - 2 FOTOS EXTRAS (solo boutique)</p>
                        <p className="text-[11px] opacity-50 mt-1">Frente ya está arriba. Sube espalda y modelo vistiendo la prenda.</p>
                      </div>
                      <label className="w-full border-2 border-dashed border-black/20 rounded-xl px-3 py-3 text-center bg-[#FBF9F7] cursor-pointer hover:bg-[#F6F3F0]">
                        <span className="text-xs font-bold">{extraFile1? `✅ Espalda: ${extraFile1.name}` : 'Foto 2 - Espalda'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e=> setExtraFile1(e.target.files[0])} />
                      </label>
                      <label className="w-full border-2 border-dashed border-black/20 rounded-xl px-3 py-3 text-center bg-[#FBF9F7] cursor-pointer hover:bg-[#F6F3F0]">
                        <span className="text-xs font-bold">{extraFile2? `✅ Modelo: ${extraFile2.name}` : 'Foto 3 - Modelo'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e=> setExtraFile2(e.target.files[0])} />
                      </label>
                      <div className="md:col-span-3 bg-white border rounded-xl p-3">
                        <p className="font-black text-[12px]">📏 TALLAS DISPONIBLES (solo boutique)</p>
                        <div className="flex gap-2 mt-2">
                          <button type="button" onClick={()=>setTipoTalla('letras')} className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${tipoTalla==='letras'?'bg-black text-white':'bg-white'}`}>Letras S M L</button>
                          <button type="button" onClick={()=>setTipoTalla('numero')} className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${tipoTalla==='numero'?'bg-black text-white':'bg-white'}`}>Numero 28 30 32</button>
                          <button type="button" onClick={()=>setTipoTalla('kids')} className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${tipoTalla==='kids'?'bg-black text-white':'bg-white'}`}>Niños 3/4 11/12</button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(tipoTalla==='letras'?['S','M','L','XL','XXL']:tipoTalla==='numero'?['28','30','32','34','36','38','40']:['3/4','5/6','7/8','9/10','11/12','13/14']).map(t=>(
                            <button type="button" key={t} onClick={()=>toggleTalla(t)} className={`min-w-[44px] px-3 py-2 rounded-full text-xs font-bold border ${tallas.includes(t)?'bg-black text-white border-black':'bg-white border-black/20'}`}>{t}</button>
                          ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <input value={tallas.join(', ')} readOnly placeholder="Selecciona tallas arriba" className="flex-1 border rounded-full px-3 py-2 text-xs bg-black/5" />
                          <button type="button" onClick={()=>setTallas([])} className="text-[11px] underline opacity-50">Limpiar</button>
                        </div>
                        <p className="text-[10px] opacity-40 mt-2">Si no seleccionas tallas, se guardará como TALLA UNICA. Si seleccionas, el cliente deberá elegir talla antes de comprar.</p>
                      </div>
                    </>
                  )}

                  <button disabled={uploading} className="md:col-span-3 bg-[#00D084] text-black py-3 rounded-full font-bold disabled:opacity-50">{uploading? 'Subiendo fotos...' : isBoutique ? `Agregar Producto Boutique ${tallas.length>0?`(${tallas.join(', ')})`:''}` : 'Agregar Producto'}</button>
                </form>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  {products.map(p=>(
                    <div key={p.id} className="border rounded-2xl overflow-hidden bg-white">
                      <div className="relative">
                        <img src={p.image_url || 'https://via.placeholder.com/300'} className="h-32 w-full object-cover"/>
                        {p.extra_images?.length>0 && <span className="absolute top-2 left-2 bg-black text-white text-[9px] px-2 py-1 rounded-full">{p.extra_images.length+1} fotos</span>}
                      </div>
                      <div className="p-3">
                        <p className="font-bold text-sm truncate">{p.name}</p>
                        <p className="text-sm text-gray-500">C$ {p.price}</p>
                        {p.tallas?.length>0 && <p className="text-[10px] mt-1 bg-black/5 rounded-full px-2 py-1 inline-block">Tallas: {p.tallas.join(', ')}</p>}
                        {p.extra_images?.length>0 && <p className="text-[10px] mt-1 text-black/40">+{p.extra_images.length} fotos extra</p>}
                      </div>
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
