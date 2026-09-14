
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const MASTER_PASSWORD = "NicaAdmin2025"

export default function OwnerAdmin({ params }){
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [isAuth, setIsAuth] = useState(false)
  const [waInput, setWaInput] = useState("")
  const [pform, setPform] = useState({name:'', price:'', image_url:''})
  const [coverFile, setCoverFile] = useState("")
  const [uploading, setUploading] = useState(false)
  const [editStore, setEditStore] = useState({name:'', description:'', cover_image:'', whatsapp:''})

  const load = async()=>{
    const { data } = await supabase.from('stores').select('*').eq('slug', params.slug).single()
    if(data){
      setStore(data)
      setEditStore({name:data.name, description:data.description||'', cover_image:data.cover_image||'', whatsapp:data.whatsapp})
      const { data: prods } = await supabase.from('products').select('*').eq('store_id', data.id).order('created_at', {ascending:false})
      setProducts(prods||[])
    }
  }
  useEffect(()=>{ load() },[])

  const uploadImage = async(file)=>{
    if(!file) return null
    setUploading(true)
    try{
      const fileName = Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]/g,'-')
      const { error } = await supabase.storage.from('tienda-images').upload(fileName, file)
      if(error) throw error
      const { data } = supabase.storage.from('tienda-images').getPublicUrl(fileName)
      setUploading(false)
      return data.publicUrl
    }catch(err){
      setUploading(false)
      alert('Error subiendo (¿creaste el bucket tienda-images?): '+err.message)
      return null
    }
  }

  const handleLogin = (e)=>{
    e.preventDefault()
    if(!store) return
    if(waInput === store.whatsapp || waInput === MASTER_PASSWORD){
      setIsAuth(true)
    } else alert('WhatsApp incorrecto. Debe ser el WhatsApp del dueño o la contraseña maestra.')
  }

  const createProduct = async(e)=>{
    e.preventDefault()
    const { error } = await supabase.from('products').insert({ store_id:store.id, name:pform.name, price: parseFloat(pform.price), image_url:pform.image_url, is_active:true })
    if(error) alert(error.message)
    else { setPform({name:'',price:'',image_url:''}); load() }
  }
  const deleteProduct = async(id)=>{
    if(!confirm('¿Eliminar producto?')) return
    await supabase.from('products').delete().eq('id', id)
    load()
  }
  const updateProduct = async(p)=>{
    const newName = prompt('Nuevo nombre', p.name)
    if(newName===null) return
    const newPrice = prompt('Nuevo precio', p.price)
    if(newPrice===null) return
    await supabase.from('products').update({name:newName, price:parseFloat(newPrice)}).eq('id', p.id)
    load()
  }
  const saveStore = async(e)=>{
    e.preventDefault()
    const { error } = await supabase.from('stores').update({ name:editStore.name, description:editStore.description, cover_image:editStore.cover_image, whatsapp:editStore.whatsapp }).eq('id', store.id)
    if(error) alert(error.message)
    else { alert('Tienda actualizada'); load() }
  }

  if(!store) return <div className="p-10 text-center">Cargando tienda {params.slug}...</div>

  if(!isAuth){
    return (
      <main className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-6">
        <div className="bg-white border rounded-[24px] p-8 max-w-sm w-full text-center">
          <img src="/logo.png" className="h-8 mx-auto mb-4 object-contain"/>
          <h1 className="font-black text-lg">Panel de {store.name}</h1>
          <p className="text-xs text-gray-500 mt-1">Solo el dueño puede editar. Ingresa el WhatsApp de la tienda.</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            <input className="w-full border rounded-xl px-4 py-3 text-center" placeholder="WhatsApp dueño ej: 50581732620" value={waInput} onChange={e=>setWaInput(e.target.value)} required/>
            <button className="w-full bg-black text-white py-3 rounded-full font-bold">Entrar a mi panel</button>
          </form>
          <p className="text-[10px] text-gray-400 mt-3">Si eres Super Admin usa: NicaAdmin2025</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fafaf9] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3"><img src="/logo.png" className="h-7 object-contain"/><span className="bg-[#00D084] text-black text-[10px] px-3 py-1 rounded-full font-bold">PANEL DUEÑO - {store.name}</span></div>
          <a href={'/'+store.slug} className="text-xs border px-3 py-1 rounded-full bg-white">Ver tienda pública</a>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="font-black">Datos de mi tienda</h2>
            <form onSubmit={saveStore} className="mt-4 space-y-3">
              <input className="w-full border rounded-xl px-4 py-2" placeholder="Nombre" value={editStore.name} onChange={e=>setEditStore({...editStore, name:e.target.value})}/>
              <input className="w-full border rounded-xl px-4 py-2" placeholder="WhatsApp" value={editStore.whatsapp} onChange={e=>setEditStore({...editStore, whatsapp:e.target.value})}/>
              <textarea className="w-full border rounded-xl px-4 py-2" placeholder="Descripción" value={editStore.description} onChange={e=>setEditStore({...editStore, description:e.target.value})}/>
              <div>
                <label className="text-xs font-bold">Portada (subir desde celular)</label>
                <input type="file" accept="image/*" className="w-full mt-1 text-sm" onChange={async(e)=>{
                  const url = await uploadImage(e.target.files[0])
                  if(url) setEditStore({...editStore, cover_image:url})
                }}/>
                {uploading && <p className="text-xs text-green-600">Subiendo...</p>}
                {editStore.cover_image && <img src={editStore.cover_image} className="w-full h-32 object-cover rounded-xl mt-2 border"/>}
                <input className="w-full border rounded-xl px-4 py-2 mt-2 text-xs" placeholder="O URL" value={editStore.cover_image} onChange={e=>setEditStore({...editStore, cover_image:e.target.value})}/>
              </div>
              <button className="w-full bg-black text-white py-2 rounded-full font-bold">Guardar cambios de mi tienda</button>
            </form>
          </div>

          <div className="bg-white border rounded-2xl p-6">
            <h2 className="font-black">Agregar producto</h2>
            <p className="text-xs text-gray-500">Sube foto desde tu galería, no necesitas URL</p>
            <form onSubmit={createProduct} className="mt-4 space-y-3">
              <input className="w-full border rounded-xl px-4 py-2" placeholder="Nombre" value={pform.name} onChange={e=>setPform({...pform,name:e.target.value})} required/>
              <input className="w-full border rounded-xl px-4 py-2" type="number" placeholder="Precio C$" value={pform.price} onChange={e=>setPform({...pform,price:e.target.value})} required/>
              <div>
                <label className="text-xs font-bold">Foto del producto</label>
                <input type="file" accept="image/*" className="w-full mt-1 text-sm" onChange={async(e)=>{
                  const url = await uploadImage(e.target.files[0])
                  if(url) setPform({...pform, image_url:url})
                }}/>
                {uploading && <p className="text-xs text-green-600">Subiendo...</p>}
                {pform.image_url && <img src={pform.image_url} className="w-full h-24 object-cover rounded-xl mt-2 border"/>}
                <input className="w-full border rounded-xl px-4 py-2 mt-2 text-xs" placeholder="O URL" value={pform.image_url} onChange={e=>setPform({...pform,image_url:e.target.value})}/>
              </div>
              <button className="w-full bg-[#00D084] text-black py-2 rounded-full font-bold">Agregar producto</button>
            </form>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-6 mt-6">
          <h2 className="font-black">Mis productos ({products.length}) - Puedo editar y eliminar</h2>
          <div className="grid md:grid-cols-4 gap-4 mt-4">
            {products.map(p=>(
              <div key={p.id} className="border rounded-2xl overflow-hidden">
                <img src={p.image_url} className="h-32 w-full object-cover"/>
                <div className="p-3"><p className="font-bold text-sm">{p.name}</p><p className="text-sm text-gray-500">C$ {p.price}</p></div>
                <div className="p-2 flex gap-2">
                  <button onClick={()=>updateProduct(p)} className="text-[11px] bg-black text-white px-3 py-1 rounded-full">Cambiar</button>
                  <button onClick={()=>deleteProduct(p.id)} className="text-[11px] bg-red-500 text-white px-3 py-1 rounded-full">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
