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
  const [uploading, setUploading] = useState(false)
  const [log, setLog] = useState('Conectando...')
  const [editing, setEditing] = useState(false)

  const loadStores = async()=>{
    const { data, error } = await supabase.from('stores').select('*').order('created_at', {ascending:false})
    if(error) setLog('ERROR: '+error.message)
    else { setStores(data||[]); setLog('Conectado OK - '+data.length+' tiendas'); if(data?.[0] && !selectedStore){ setSelectedStore(data[0]); loadProducts(data[0].id) } }
  }
  const loadProducts = async(storeId)=>{
    if(!storeId) return
    const { data } = await supabase.from('products').select('*').eq('store_id', storeId).order('created_at',{ascending:false})
    setProducts(data||[])
  }
  useEffect(()=>{ loadStores() },[])
  useEffect(()=>{ if(selectedStore) loadProducts(selectedStore.id) },[selectedStore])

  const createStore = async(e)=>{
    e.preventDefault()
    const cleanSlug = form.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g,'-').replace(/--+/g,'-')
    const { data, error } = await supabase.from('stores').insert({ name:form.name, slug:cleanSlug, whatsapp:form.whatsapp, description:form.description, is_active:true, owner_password:form.whatsapp }).select().single()
    if(error) alert(error.message)
    else { loadStores(); setSelectedStore(data); setForm({name:'',slug:'',whatsapp:'',description:''}); alert('Tienda creada: /'+cleanSlug) }
  }

  const createProduct = async(e)=>{
    e.preventDefault()
    if(!selectedStore) return alert('Selecciona una tienda primero')
    if(!imageFile && !pform.image_url && !editing) return alert('Sube una foto')
    setUploading(true)
    let finalUrl = pform.image_url
    try {
      if(imageFile){
        const fileName = `${Date.now()}-${imageFile.name.replace(/\s/g,'-')}`
        // intenta ambos buckets por compatibilidad
        let up = await supabase.storage.from('tienda-images').upload(fileName, imageFile)
        if(up.error){
          const up2 = await supabase.storage.from('product-images').upload(fileName, imageFile)
          if(up2.error) throw up2.error
          const { data: {publicUrl} } = supabase.storage.from('product-images').getPublicUrl(fileName)
          finalUrl = publicUrl
        } else {
          const { data: {publicUrl} } = supabase.storage.from('tienda-images').getPublicUrl(fileName)
          finalUrl = publicUrl
        }
      }
      if(editing && pform.id){
        const { error } = await supabase.from('products').update({ name:pform.name, price: parseFloat(pform.price), image_url:finalUrl }).eq('id', pform.id)
        if(error) throw error
      } else {
        const { error } = await supabase.from('products').insert({ store_id:selectedStore.id, name:pform.name, price: parseFloat(pform.price), image_url:finalUrl, is_active:true }).select()
        if(error) throw error
      }
      setPform({name:'',price:'',image_url:'',id:null})
      setImageFile(null)
      setEditing(false)
      loadProducts(selectedStore.id)
    } catch(err){
      alert('Error: '+err.message)
    } finally {
      setUploading(false)
    }
  }

  const startEdit=(p)=>{ setPform({name:p.name, price:p.price, image_url:p.image_url||'', id:p.id}); setEditing(true); window.scrollTo({top:0,behavior:'smooth'}) }
  const cancelEdit=()=>{ setPform({name:'',price:'',image_url:'',id:null}); setEditing(false); setImageFile(null) }
  const deleteStore=async(id)=>{ if(!confirm('¿Eliminar tienda y todos sus productos?'))return; await supabase.from('products').delete().eq('store_id',id); await supabase.from('stores').delete().eq('id',id); setSelectedStore(null); loadStores() }
  const deleteProduct=async(id)=>{ if(!confirm('¿Borrar producto?'))return; await supabase.from('products').delete().eq('id',id); loadProducts(selectedStore.id) }

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
                  <div key={s.id} className={'w-full text-left border rounded-xl px-4 py-3 flex justify-between items-center '+(selectedStore?.id===s.id?'bg-black text-white':'bg-white')}>
                    <button onClick={()=>setSelectedStore(s)} className="text-left flex-1"><b>{s.name}</b><br/><span className="text-xs opacity-70">/{s.slug}</span></button>
                    <div className="flex flex-col gap-1 ml-2">
                      <a href={'/'+s.slug} target="_blank" className="text-[10px] bg-white text-black border px-2 py-1 rounded-full text-center">Ver</a>
                      <button onClick={()=>deleteStore(s.id)} className="text-[10px] bg-red-500 text-white px-2 py-1 rounded-full">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border rounded-2xl p-6">
              <h2 className="font-black text-lg">Productos {selectedStore? 'de '+selectedStore.name : ''} {editing?' - Editando':''}</h2>
              {!selectedStore && <p className="text-gray-500 mt-4">Selecciona una tienda a la izquierda</p>}
              {selectedStore && <>
                <form onSubmit={createProduct} className="grid md:grid-cols-3 gap-3 mt-4 bg-gray-50 p-4 rounded-2xl">
                  <input className="border rounded-xl px-3 py-2" placeholder="Nombre producto" value={pform.name} onChange={e=>setPform({...pform,name:e.target.value})} required/>
                  <input className="border rounded-xl px-3 py-2" placeholder="Precio C$" type="number" step="0.01" value={pform.price} onChange={e=>setPform({...pform,price:e.target.value})} required/>
                  <label className="md:col-span-3 w-full border-2 border-dashed border-gray-300 rounded-xl px-3 py-4 text-center bg-white cursor-pointer hover:bg-gray-100">
                    <span className="text-sm font-bold">{imageFile? `✅ ${imageFile.name}` : '📸 Toca para subir foto desde el celular'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e=> setImageFile(e.target.files[0])} />
                  </label>
                  <input className="md:col-span-3 border rounded-xl px-3 py-2 text-sm" placeholder="O pega URL imagen (opcional)" value={pform.image_url} onChange={e=>setPform({...pform,image_url:e.target.value})}/>
                  <div className="md:col-span-3 flex gap-2">
                    <button disabled={uploading} className="flex-1 bg-[#00D084] text-black py-3 rounded-full font-bold disabled:opacity-50">{uploading? 'Subiendo...' : editing ? 'Guardar cambios' : 'Agregar Producto'}</button>
                    {editing && <button type="button" onClick={cancelEdit} className="flex-1 border-2 border-black py-3 rounded-full font-bold">Cancelar</button>}
                  </div>
                </form>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  {products.map(p=>(
                    <div key={p.id} className="border rounded-2xl overflow-hidden bg-white">
                      <img src={p.image_url || 'https://via.placeholder.com/300'} className="h-32 w-full object-cover"/>
                      <div className="p-3"><p className="font-bold text-sm">{p.name}</p><p className="text-sm text-gray-500">C$ {p.price}</p>
                        <div className="flex gap-1 mt-2">
                          <button onClick={()=>startEdit(p)} className="flex-1 bg-black text-white text-[10px] py-1 rounded-full">Editar</button>
                          <button onClick={()=>deleteProduct(p.id)} className="flex-1 bg-red-500 text-white text-[10px] py-1 rounded-full">Borrar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {products.length===0 && <p className="text-gray-400 text-sm col-span-3">Aún no hay productos. Agrega el primero arriba.</p>}
                </div>
                {/* QR GRANDE CON DESCARGA - NUEVO */}
                <div className="mt-8 bg-black text-white rounded-[20px] p-5">
                  <h3 className="font-black text-sm">QR de {selectedStore.name} - Descarga HD</h3>
                  <p className="text-[11px] opacity-70 mt-1">tiendanica.store/{selectedStore.slug}</p>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=https://tiendanica.store/${selectedStore.slug}`} className="w-full max-w-[320px] mx-auto mt-4 bg-white rounded-xl p-3"/>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <a href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=https://tiendanica.store/${selectedStore.slug}`} target="_blank" download={`QR-${selectedStore.slug}-HD.png`} className="bg-[#00ff88] text-black text-center py-3 rounded-full font-black text-sm">⬇️ Descargar HD 1000px</a>
                    <a href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=https://tiendanica.store/${selectedStore.slug}`} target="_blank" className="bg-white text-black text-center py-3 rounded-full font-bold text-sm">Ver grande</a>
                  </div>
                  <p className="text-[10px] mt-3 opacity-60 text-center">Para imprimir en flyer, sticker o banner</p>
                  <div className="mt-4 flex gap-2">
                    <a href={'/'+selectedStore.slug} target="_blank" className="flex-1 text-center px-5 py-2 bg-white/10 border border-white/20 text-white rounded-full text-sm">Ver tienda /{selectedStore.slug} →</a>
                  </div>
                </div>
              </>}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
