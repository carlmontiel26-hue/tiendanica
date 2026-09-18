'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function OwnerAdmin({ params }){
  const slug = params.slug
  const [store, setStore] = useState(null)
  const [isAuth, setIsAuth] = useState(false)
  const [passInput, setPassInput] = useState('')
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({name:'', price:'', image_url:''})
  const [coverFile, setCoverFile] = useState(null)
  const [log, setLog] = useState('')

  useEffect(()=>{
    async function loadStore(){
      const { data } = await supabase.from('stores').select('*').eq('slug', slug).single()
      if(data) { setStore(data); loadProducts(data.id); const saved = localStorage.getItem('tn_owner_'+data.slug); if(saved && saved===data.owner_password) setIsAuth(true) }
    }
    loadStore()
  },[])

  const loadProducts = async (storeId)=>{
    const { data } = await supabase.from('products').select('*').eq('store_id', storeId).order('created_at', {ascending:false})
    setProducts(data||[])
  }

  const handleLogin = (e)=>{
    e.preventDefault()
    if(!store) return
    if(passInput===store.owner_password){ localStorage.setItem('tn_owner_'+store.slug, passInput); setIsAuth(true) } else alert('Contraseña incorrecta')
  }

  const uploadImage = async (file)=>{
    if(!file) return null
    const fileName = Date.now()+'-'+file.name.replace(/[^a-zA-Z0-9.]/g,'-')
    const { error } = await supabase.storage.from('tienda-images').upload(fileName, file)
    if(error){ alert('Crea el bucket tienda-images en Supabase Storage: '+error.message); return null }
    const { data } = supabase.storage.from('tienda-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  const updateCover = async ()=>{
    if(!coverFile || !store) return
    setLog('Subiendo portada...')
    const url = await uploadImage(coverFile)
    if(url){ await supabase.from('stores').update({cover_image:url}).eq('id', store.id); setStore({...store, cover_image:url}); setLog('Portada actualizada'); setCoverFile(null) }
  }

  const createProduct = async (e)=>{
    e.preventDefault()
    if(!store) return
    let imageUrl = form.image_url
    const fileInput = document.getElementById('prod-file')
    if(fileInput && fileInput.files[0]){ const up = await uploadImage(fileInput.files[0]); if(up) imageUrl=up }
    const { error } = await supabase.from('products').insert({store_id: store.id, name: form.name, price: parseFloat(form.price), image_url: imageUrl, is_active:true})
    if(error) alert(error.message); else { setForm({name:'', price:'', image_url:''}); if(fileInput) fileInput.value=''; loadProducts(store.id) }
  }

  const deleteProduct = async (id)=>{ if(!confirm('Eliminar?')) return; await supabase.from('products').delete().eq('id', id); loadProducts(store.id) }

  if(!store) return <main className='p-10 text-center'>Cargando tienda...</main>

  if(!isAuth){
    return (
      <main className='min-h-screen bg-black flex items-center justify-center p-6'>
        <div className='bg-white rounded-[24px] p-8 max-w-sm w-full text-center'>
          <h1 className='font-black text-xl'>Admin {store.name}</h1>
          <form onSubmit={handleLogin} className='mt-6 space-y-3'>
            <input type='password' className='w-full border rounded-xl px-4 py-3 text-center' placeholder='Contraseña de dueño' value={passInput} onChange={e=>setPassInput(e.target.value)} required/>
            <button className='w-full bg-black text-white py-3 rounded-full font-bold'>Entrar</button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-[#fafaf9] p-6'>
      <div className='max-w-5xl mx-auto'>
        <h1 className='font-black text-xl'>Panel {store.name}</h1>
        <div className='grid md:grid-cols-3 gap-6 mt-6'>
          <div className='bg-white border rounded-2xl p-5'>
            <h2 className='font-bold'>Portada</h2>
            {store.cover_image && <img src={store.cover_image} className='w-full h-32 object-cover rounded-xl mt-3'/>}
            <input type='file' accept='image/*' className='w-full mt-3 text-sm' onChange={e=>setCoverFile(e.target.files[0])}/>
            <button onClick={updateCover} disabled={!coverFile} className='w-full mt-2 bg-black text-white py-2 rounded-full text-sm font-bold disabled:opacity-30'>Subir portada</button>
            <p className='text-xs text-gray-500 mt-2'>{log}</p>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://tiendanica.store/${store.slug}`} className='w-40 h-40 mt-6 border rounded-xl'/>
          </div>
          <div className='md:col-span-2 space-y-6'>
            <div className='bg-white border rounded-2xl p-5'>
              <h2 className='font-bold'>Agregar producto</h2>
              <form onSubmit={createProduct} className='mt-3 space-y-3'>
                <input className='w-full border rounded-xl px-4 py-2' placeholder='Nombre' value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/>
                <input className='w-full border rounded-xl px-4 py-2' placeholder='Precio' value={form.price} onChange={e=>setForm({...form, price:e.target.value})} required/>
                <input className='w-full border rounded-xl px-4 py-2' placeholder='URL imagen (opcional)' value={form.image_url} onChange={e=>setForm({...form, image_url:e.target.value})}/>
                <input id='prod-file' type='file' accept='image/*' className='w-full text-sm'/>
                <button className='w-full bg-green-500 py-3 rounded-full font-bold'>Agregar</button>
              </form>
            </div>
            <div className='bg-white border rounded-2xl p-5'>
              <h2 className='font-bold'>Productos ({products.length})</h2>
              <div className='mt-3 space-y-2'>
                {products.map(p=>(
                  <div key={p.id} className='flex gap-3 border rounded-xl p-2 items-center'>
                    <img src={p.image_url} className='w-12 h-12 object-cover rounded-lg bg-gray-100'/>
                    <div className='flex-1'><p className='font-bold text-sm'>{p.name}</p><p className='text-xs'>C$ {p.price}</p></div>
                    <button onClick={()=>deleteProduct(p.id)} className='text-xs border px-3 py-1 rounded-full'>Eliminar</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
