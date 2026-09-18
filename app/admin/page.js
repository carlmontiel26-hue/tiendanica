
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const ADMIN_PASSWORD = "NicaAdmin2025"
const ADMIN_WA = "50581732620"

export default function Admin(){
  const [isAuth, setIsAuth] = useState(false)
  const [passInput, setPassInput] = useState("")
  const [stores, setStores] = useState([])
  const [products, setProducts] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [form, setForm] = useState({name:'', slug:'', whatsapp:'', description:'', cover_image:''})
  const [pform, setPform] = useState({name:'', price:'', image_url:''})
  const [uploading, setUploading] = useState(false)
  const [log, setLog] = useState('Conectando...')

  useEffect(()=>{
    const saved = localStorage.getItem("tn_admin_auth")
    if(saved === ADMIN_PASSWORD) setIsAuth(true)
  },[])

  const handleLogin = (e)=>{
    e.preventDefault()
    if(passInput === ADMIN_PASSWORD){
      localStorage.setItem("tn_admin_auth", ADMIN_PASSWORD)
      setIsAuth(true)
    } else alert("Contraseña incorrecta")
  }

  const uploadImage = async(file)=>{
    if(!file) return null
    setUploading(true)
    try{
      const fileName = Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]/g,'-')
      const { error } = await supabase.storage.from('tienda-images').upload(fileName, file)
      if(error){
        // if bucket not exists, fallback to base64 (temporal) and show instruction
        if(error.message.includes('Bucket not found')){
          alert('Falta crear el bucket tienda-images en Supabase Storage. Por ahora se usará la imagen local. Ejecuta el SQL de buckets que te mandé.')
          const reader = new FileReader()
          const base64 = await new Promise(res=>{
            reader.onload = ()=>res(reader.result)
            reader.readAsDataURL(file)
          })
          // can't store huge base64 in TEXT maybe, but try URL createObjectURL temp - for demo we return base64 and user can use URL later
          // Instead return empty and tell to create bucket
          setUploading(false)
          return null
        }
        throw error
      }
      const { data } = supabase.storage.from('tienda-images').getPublicUrl(fileName)
      setUploading(false)
      return data.publicUrl
    }catch(err){
      setUploading(false)
      alert('Error subiendo: '+err.message)
      return null
    }
  }

  const loadStores = async()=>{
    const { data, error } = await supabase.from('stores').select('*').order('created_at', {ascending:false})
    if(error) setLog('ERROR: '+error.message)
    else { setStores(data||[]); setLog('Super Admin OK - '+data.length+' tiendas'); if(data?.[0] && !selectedStore) setSelectedStore(data[0]) }
  }
  const loadProducts = async(storeId)=>{
    if(!storeId) return
    const { data } = await supabase.from('products').select('*').eq('store_id', storeId).order('created_at', {ascending:false})
    setProducts(data||[])
  }
  useEffect(()=>{ if(isAuth) loadStores() },[isAuth])
  useEffect(()=>{ if(selectedStore) loadProducts(selectedStore.id) },[selectedStore])

  const createStore = async(e)=>{
    e.preventDefault()
    const cleanSlug = form.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g,'-').replace(/--+/g,'-')
    const { data, error } = await supabase.from('stores').insert({ name:form.name, slug:cleanSlug, whatsapp:form.whatsapp, description:form.description, cover_image:form.cover_image, is_active:true }).select().single()
    if(error) alert(error.message)
    else { setForm({name:'',slug:'',whatsapp:'',description:'',cover_image:''}); loadStores(); setSelectedStore(data); alert('Tienda creada: /'+cleanSlug+' - Ahora pásale ese link al dueño') }
  }

  const createProduct = async(e)=>{
    e.preventDefault()
    if(!selectedStore) return alert('Selecciona una tienda')
    const { error } = await supabase.from('products').insert({ store_id:selectedStore.id, name:pform.name, price: parseFloat(pform.price), image_url:pform.image_url, is_active:true }).select()
    if(error) alert(error.message)
    else { setPform({name:'',price:'',image_url:''}); loadProducts(selectedStore.id) }
  }

  const deleteProduct = async(id)=>{
    if(!confirm('¿Eliminar este producto?')) return
    await supabase.from('products').delete().eq('id', id)
    loadProducts(selectedStore.id)
  }

  const updateProduct = async(p)=>{
    const newName = prompt('Nuevo nombre', p.name)
    if(newName===null) return
    const newPrice = prompt('Nuevo precio', p.price)
    if(newPrice===null) return
    await supabase.from('products').update({name:newName, price:parseFloat(newPrice)}).eq('id', p.id)
    loadProducts(selectedStore.id)
  }

  const getQR = (slug)=> `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https://tiendanica.vercel.app/${slug}`

  if(!isAuth){
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-white rounded-[24px] p-8 max-w-sm w-full text-center">
          <img src="/logo.png" className="h-10 mx-auto mb-6 object-contain"/>
          <h1 className="font-black text-xl">Super Admin - Solo Tú</h1>
          <p className="text-sm text-gray-500 mt-2">Tienda Nica - 50581732620</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            <input type="password" className="w-full border rounded-xl px-4 py-3 text-center" placeholder="Contraseña" value={passInput} onChange={e=>setPassInput(e.target.value)} required/>
            <button className="w-full bg-black text-white py-3 rounded-full font-bold">Entrar</button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fafaf9] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3"><img src="/logo.png" className="h-8 object-contain"/><span className="bg-black text-white text-[10px] px-3 py-1 rounded-full font-bold">SUPER ADMIN - SOLO TÚ CREAS TIENDAS</span></div>
          <div className="flex gap-2 items-center">
            <div className="bg-black text-green-400 text-xs px-3 py-1 rounded-full">{log}</div>
            <button onClick={()=>{localStorage.removeItem("tn_admin_auth"); setIsAuth(false)}} className="text-xs border px-3 py-1 rounded-full bg-white">Salir</button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border rounded-2xl p-5">
              <h2 className="font-black text-lg">Crear Tienda para Cliente</h2>
              <p className="text-xs text-gray-500 mt-1">Tú la creas, luego le entregas el panel al dueño</p>
              <form onSubmit={createStore} className="mt-4 space-y-3">
                <input className="w-full border rounded-xl px-4 py-2" placeholder="Nombre ej: Pulperia La Bendicion" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="slug ej: pulperia-bendicion" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="WhatsApp DUEÑO 50581732620" value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="Descripción corta" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
                <div>
                  <label className="text-xs font-bold">Portada de la tienda (subir archivo)</label>
                  <input type="file" accept="image/*" className="w-full mt-1 text-sm" onChange={async(e)=>{
                    const url = await uploadImage(e.target.files[0])
                    if(url) setForm({...form, cover_image:url})
                  }}/>
                  {uploading && <p className="text-xs text-green-600">Subiendo...</p>}
                  {form.cover_image && <img src={form.cover_image} className="w-full h-24 object-cover rounded-xl mt-2 border"/>}
                  <input className="w-full border rounded-xl px-4 py-2 mt-2 text-xs" placeholder="O pega URL si prefieres" value={form.cover_image} onChange={e=>setForm({...form,cover_image:e.target.value})}/>
                </div>
                <button className="w-full bg-black text-white py-3 rounded-full font-bold">Crear Tienda</button>
              </form>
            </div>

            <div className="bg-white border rounded-2xl p-5">
              <h3 className="font-bold">Mis Tiendas ({stores.length})</h3>
              <div className="mt-3 space-y-2">
                {stores.map(s=>(
                  <div key={s.id} className={'w-full text-left border rounded-xl px-4 py-3 flex justify-between items-center '+(selectedStore?.id===s.id?'bg-black text-white':'bg-white')}>
                    <button onClick={()=>setSelectedStore(s)} className="text-left flex-1">
                      <b>{s.name}</b><br/><span className="text-xs opacity-70">/{s.slug} - {s.whatsapp}</span>
                    </button>
                    <div className="flex gap-2 ml-2">
                      <a href={getQR(s.slug)} target="_blank" className="text-[10px] bg-white text-black border px-2 py-1 rounded-full font-bold">QR</a>
                      <a href={'/'+s.slug} target="_blank" className="text-xs underline">Ver</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white border rounded-2xl p-6">
              <h2 className="font-black text-lg">Gestionar Productos {selectedStore? 'de '+selectedStore.name : ''}</h2>
              <p className="text-xs text-gray-500">Solo tú y el dueño ven esto. El cliente final no ve botones de editar/borrar.</p>
              {selectedStore && <>
                <div className="mt-4 p-4 bg-gray-50 rounded-2xl flex gap-3 items-center">
                  <img src={getQR(selectedStore.slug)} className="w-20 h-20 border rounded-xl bg-white"/>
                  <div className="text-xs">
                    <p className="font-bold">Para entregar al dueño:</p>
                    <p>Tienda: tiendanica.vercel.app/{selectedStore.slug}</p>
                    <p>Panel dueño: tiendanica.vercel.app/{selectedStore.slug}/admin</p>
                    <p>WhatsApp dueño: {selectedStore.whatsapp}</p>
                  </div>
                </div>

                <form onSubmit={createProduct} className="grid md:grid-cols-2 gap-3 mt-4 bg-gray-50 p-4 rounded-2xl">
                  <input className="border rounded-xl px-3 py-2" placeholder="Nombre producto" value={pform.name} onChange={e=>setPform({...pform,name:e.target.value})} required/>
                  <input className="border rounded-xl px-3 py-2" placeholder="Precio C$" type="number" value={pform.price} onChange={e=>setPform({...pform,price:e.target.value})} required/>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold">Foto producto (desde celular)</label>
                    <input type="file" accept="image/*" className="w-full mt-1 text-sm" onChange={async(e)=>{
                      const url = await uploadImage(e.target.files[0])
                      if(url) setPform({...pform, image_url:url})
                    }}/>
                    {uploading && <p className="text-xs text-green-600">Subiendo...</p>}
                    {pform.image_url && <img src={pform.image_url} className="w-full h-24 object-cover rounded-xl mt-2 border"/>}
                    <input className="w-full border rounded-xl px-3 py-2 mt-2 text-xs" placeholder="O pega URL" value={pform.image_url} onChange={e=>setPform({...pform,image_url:e.target.value})}/>
                  </div>
                  <button className="md:col-span-2 bg-[#00D084] text-black py-2 rounded-full font-bold">Agregar Producto</button>
                </form>

                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  {products.map(p=>(
                    <div key={p.id} className="border rounded-2xl overflow-hidden bg-white relative group">
                      <img src={p.image_url || 'https://via.placeholder.com/300'} className="h-32 w-full object-cover"/>
                      <div className="p-3"><p className="font-bold text-sm">{p.name}</p><p className="text-sm text-gray-500">C$ {p.price}</p></div>
                      <div className="p-2 flex gap-2">
                        <button onClick={()=>updateProduct(p)} className="text-[11px] bg-black text-white px-3 py-1 rounded-full">Editar</button>
                        <button onClick={()=>deleteProduct(p.id)} className="text-[11px] bg-red-500 text-white px-3 py-1 rounded-full">Eliminar</button>
                      </div>
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
