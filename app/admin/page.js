'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function SuperAdmin(){
  const [isAuth, setIsAuth] = useState(false)
  const [pass, setPass] = useState('')
  const [stores, setStores] = useState([])
  const [products, setProducts] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [form, setForm] = useState({name:'', slug:'', whatsapp:'', description:''})
  const [coverFile, setCoverFile] = useState(null)
  const [prodForm, setProdForm] = useState({name:'', price:'', image_url:''})
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(()=>{
    const saved = localStorage.getItem('tn_super_admin')
    if(saved==='ok') setIsAuth(true)
    loadStores()
  },[])

  const loadStores = async()=>{
    setLoading(true)
    const { data, error } = await supabase.from('stores').select('*').order('created_at', {ascending:false})
    if(error){ setStatus('Error: '+error.message) }
    else { setStores(data||[]); if(data&&data.length>0&&!selectedStore){ setSelectedStore(data[0]); loadProducts(data[0].id) } setStatus(`Super Admin OK - ${data?.length||0} tiendas`) }
    setLoading(false)
  }

  const loadProducts = async(storeId)=>{
    const { data } = await supabase.from('products').select('*').eq('store_id', storeId).order('created_at',{ascending:false})
    setProducts(data||[])
  }

  const handleLogin=(e)=>{
    e.preventDefault()
    if(pass==='NicaAdmin2025'){ localStorage.setItem('tn_super_admin','ok'); setIsAuth(true) }
    else alert('Pass incorrecto')
  }

  const uploadImage=async(file)=>{
    if(!file) return null
    const name=Date.now()+'-'+file.name.replace(/[^a-zA-Z0-9.]/g,'-')
    const { error } = await supabase.storage.from('tienda-images').upload(name,file)
    if(error){ alert('Crea bucket tienda-images: '+error.message); return null}
    const { data }=supabase.storage.from('tienda-images').getPublicUrl(name)
    return data.publicUrl
  }

  const createStore=async(e)=>{
    e.preventDefault()
    setLoading(true)
    let coverUrl = null
    if(coverFile){ coverUrl = await uploadImage(coverFile) }
    const slug = form.slug.toLowerCase().replace(/[^a-z0-9-]/g,'-')
    const { data, error } = await supabase.from('stores').insert({
      name: form.name,
      slug: slug,
      whatsapp: form.whatsapp,
      owner_password: form.whatsapp,
      description: form.description,
      cover_image: coverUrl
    }).select().single()
    if(error){ alert(error.message) }
    else { setForm({name:'',slug:'',whatsapp:'',description:''}); setCoverFile(null); loadStores() }
    setLoading(false)
  }

  const createProduct=async(e)=>{
    e.preventDefault()
    if(!selectedStore) return
    let imageUrl = prodForm.image_url
    const fileInput=document.getElementById('prod-file-super')
    if(fileInput&&fileInput.files[0]){ const up=await uploadImage(fileInput.files[0]); if(up) imageUrl=up }
    const { error } = await supabase.from('products').insert({store_id:selectedStore.id,name:prodForm.name,price:parseFloat(prodForm.price),image_url:imageUrl,is_active:true})
    if(error) alert(error.message)
    else { setProdForm({name:'',price:'',image_url:''}); if(fileInput) fileInput.value=''; loadProducts(selectedStore.id) }
  }

  const deleteStore=async(id)=>{ if(!confirm('Borrar tienda?'))return; await supabase.from('stores').delete().eq('id',id); setSelectedStore(null); loadStores() }

  if(!isAuth){
    return(<main className='min-h-screen bg-black flex items-center justify-center p-6'><div className='bg-white rounded-[24px] p-8 max-w-sm w-full text-center'><h1 className='font-black text-xl'>Super Admin - Solo tu creas tiendas</h1><form onSubmit={handleLogin} className='mt-6 space-y-3'><input type='password' className='w-full border rounded-xl px-4 py-3 text-center' placeholder='Pass Super Admin' value={pass} onChange={e=>setPass(e.target.value)} required/><button className='w-full bg-black text-white py-3 rounded-full font-bold'>Entrar</button></form></div></main>)
  }

  if(loading && stores.length===0) return <main className='p-10'>Cargando tiendas...</main>

  return(
    <main className='min-h-screen bg-[#fafaf9] p-6'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex justify-between items-center'><h1 className='font-black'>TiendaNica <span className='text-xs bg-black text-white px-3 py-1 rounded-full ml-2'>SUPER ADMIN - SOLO TU CREAS TIENDAS</span></h1><div className='flex gap-2 items-center'><span className='bg-black text-green-400 text-xs px-3 py-1 rounded-full'>{status}</span><button onClick={()=>{localStorage.removeItem('tn_super_admin'); setIsAuth(false)}} className='text-xs border px-3 py-1 rounded-full bg-white'>Salir</button></div></div>

        <div className='grid lg:grid-cols-3 gap-6 mt-6'>
          <div className='space-y-6'>
            <div className='bg-white border rounded-2xl p-5'>
              <h2 className='font-bold'>Crear Tienda para Cliente</h2><p className='text-xs text-gray-500'>Tu la creas, luego le entregas el panel al dueño</p>
              <form onSubmit={createStore} className='mt-4 space-y-3'>
                <input className='w-full border rounded-xl px-4 py-2' placeholder='Nombre ej: Pulperia La Bendicion' value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                <input className='w-full border rounded-xl px-4 py-2' placeholder='slug ej: pulperia-bendicion' value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required/>
                <input className='w-full border rounded-xl px-4 py-2' placeholder='WhatsApp DUEÑO 505...' value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} required/>
                <input className='w-full border rounded-xl px-4 py-2' placeholder='Descripcion corta' value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
                <div className='border rounded-xl p-3'><label className='text-xs font-bold'>Portada de la tienda (subir archivo)</label><input type='file' accept='image/*' className='w-full mt-1 text-sm' onChange={e=>setCoverFile(e.target.files[0])}/>{coverFile&&<p className='text-[10px] text-green-600 mt-1'>Archivo listo: {coverFile.name}</p>}</div>
                <button className='w-full bg-black text-white py-3 rounded-full font-bold'>Crear Tienda</button>
              </form>
            </div>
            <div className='bg-white border rounded-2xl p-5'>
              <h2 className='font-bold'>Mis Tiendas ({stores.length})</h2>
              <div className='mt-3 space-y-2'>
                {stores.map(s=>(
                  <div key={s.id} className={`border rounded-xl p-3 cursor-pointer ${selectedStore?.id===s.id?'bg-black text-white':'bg-white'}`} onClick={()=>{setSelectedStore(s); loadProducts(s.id)}}>
                    <div className='flex justify-between items-center'><div><p className='font-bold text-sm'>{s.name}</p><p className='text-xs opacity-60'>/{s.slug} - {s.whatsapp}</p></div><div className='flex gap-1'><a href={`/${s.slug}`} target='_blank' className='text-[10px] bg-white text-black border px-2 py-1 rounded-full'>Ver</a><a href={`/${s.slug}/admin`} target='_blank' className='text-[10px] bg-green-400 text-black px-2 py-1 rounded-full'>Dueño</a></div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='lg:col-span-2'>
            {selectedStore?(
              <div className='bg-white border rounded-2xl p-5'>
                <h2 className='font-bold'>Gestionar Productos de {selectedStore.name}</h2>
                <div className='bg-gray-50 rounded-xl p-3 mt-3 flex gap-3 items-center'>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://tiendanica.store/${selectedStore.slug}`} className='w-20 h-20 border rounded-lg'/>
                  <div className='text-xs'><p className='font-bold'>Para entregar al dueño:</p><p>Tienda: tiendanica.store/{selectedStore.slug}</p><p>Panel dueño: tiendanica.store/{selectedStore.slug}/admin</p><p>WhatsApp dueño: {selectedStore.whatsapp} (esa es su contraseña)</p></div>
                </div>

                <form onSubmit={createProduct} className='mt-5 space-y-3 bg-gray-50 rounded-xl p-4'>
                  <div className='grid grid-cols-2 gap-3'><input className='border rounded-xl px-4 py-2' placeholder='Nombre producto' value={prodForm.name} onChange={e=>setProdForm({...prodForm,name:e.target.value})} required/><input className='border rounded-xl px-4 py-2' placeholder='Precio C$' value={prodForm.price} onChange={e=>setProdForm({...prodForm,price:e.target.value})} required/></div>
                  <div className='border rounded-xl p-3 bg-white'><label className='text-xs font-bold'>Foto producto (desde celular)</label><input id='prod-file-super' type='file' accept='image/*' className='w-full mt-1 text-sm'/><input className='w-full border rounded-xl px-4 py-2 mt-2' placeholder='O pega URL' value={prodForm.image_url} onChange={e=>setProdForm({...prodForm,image_url:e.target.value})}/></div>
                  <button className='w-full bg-green-500 py-3 rounded-full font-bold'>Agregar Producto</button>
                </form>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-6'>
                  {products.map(p=>(
                    <div key={p.id} className='border rounded-2xl overflow-hidden'>
                      <div className='h-36 bg-gray-100 overflow-hidden'><img src={p.image_url} className='w-full h-full object-cover object-center'/></div>
                      <div className='p-3'><p className='font-bold text-sm'>{p.name}</p><p className='text-xs'>C$ {p.price}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            ):<div className='bg-white border rounded-2xl p-10 text-center text-gray-400'>Selecciona una tienda</div>}
          </div>
        </div>
      </div>
    </main>
  )
}
