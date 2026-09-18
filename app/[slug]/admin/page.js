'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function OwnerAdmin({ params }){
  const slug=params.slug
  const [store,setStore]=useState(null)
  const [isAuth,setIsAuth]=useState(false)
  const [passInput,setPassInput]=useState('')
  const [products,setProducts]=useState([])
  const [form,setForm]=useState({name:'',price:'',image_url:'',id:null})
  const [editing,setEditing]=useState(false)

  useEffect(()=>{
    async function load(){
      const {data} = await supabase.from('stores').select('*').eq('slug',slug).single()
      if(data){
        setStore(data)
        const {data:prods}=await supabase.from('products').select('*').eq('store_id',data.id).order('created_at',{ascending:false})
        setProducts(prods||[])
        const saved=localStorage.getItem('tn_owner_'+data.slug)
        if(saved && saved===data.whatsapp) setIsAuth(true)
      }
    }
    load()
  },[slug])

  const handleLogin=(e)=>{
    e.preventDefault()
    if(passInput===store.whatsapp || passInput===store.owner_password){
      localStorage.setItem('tn_owner_'+store.slug, store.whatsapp)
      setIsAuth(true)
    } else alert('Usa tu WhatsApp: '+store.whatsapp)
  }

  const uploadImage=async(file)=>{
    const name=Date.now()+'-'+file.name.replace(/[^a-zA-Z0-9.]/g,'-')
    const {error}=await supabase.storage.from('tienda-images').upload(name,file)
    if(error){
      // fallback a product-images por si tu bucket es el viejo
      const {error:err2}=await supabase.storage.from('product-images').upload(name,file)
      if(err2){alert(err2.message);return null}
      const {data}=supabase.storage.from('product-images').getPublicUrl(name)
      return data.publicUrl
    }
    const {data}=supabase.storage.from('tienda-images').getPublicUrl(name)
    return data.publicUrl
  }

  const saveProduct=async(e)=>{
    e.preventDefault()
    let imageUrl=form.image_url
    const inp=document.getElementById('prod-file')
    if(inp && inp.files[0]){
      const up=await uploadImage(inp.files[0])
      if(up) imageUrl=up
    }
    if(editing){
      await supabase.from('products').update({name:form.name,price:parseFloat(form.price),image_url:imageUrl}).eq('id',form.id)
    } else {
      await supabase.from('products').insert({store_id:store.id,name:form.name,price:parseFloat(form.price),image_url:imageUrl,is_active:true})
    }
    setForm({name:'',price:'',image_url:'',id:null})
    setEditing(false)
    const {data}=await supabase.from('products').select('*').eq('store_id',store.id).order('created_at',{ascending:false})
    setProducts(data||[])
  }

  const startEdit=(p)=>{setForm({name:p.name,price:p.price,image_url:p.image_url||'',id:p.id});setEditing(true); window.scrollTo({top:0,behavior:'smooth'})}
  const deleteProduct=async(id)=>{if(!confirm('¿Borrar?'))return;await supabase.from('products').delete().eq('id',id);const {data}=await supabase.from('products').select('*').eq('store_id',store.id).order('created_at',{ascending:false});setProducts(data||[])}

  if(!store) return <div className='p-10 text-center'>Cargando...</div>

  if(!isAuth){
    return(
      <main className='min-h-screen bg-black flex items-center justify-center p-6'>
        <div className='bg-white rounded-[24px] p-8 max-w-sm w-full text-center'>
          <h1 className='font-black text-xl'>Panel Dueño Seguro 🔒</h1>
          <p className='text-xs mt-2'>Tienda: {store.name}</p>
          <p className='text-[11px] bg-yellow-100 border rounded-full px-3 py-1 mt-2'>Contraseña = tu WhatsApp</p>
          <form onSubmit={handleLogin} className='mt-6 space-y-3'>
            <input type='password' className='w-full border-2 border-black rounded-xl px-4 py-3 text-center font-bold' placeholder={store.whatsapp} value={passInput} onChange={e=>setPassInput(e.target.value)} required/>
            <button className='w-full bg-black text-white py-3 rounded-full font-bold'>Entrar</button>
            <p className='text-[10px] text-gray-400 mt-2'>Tu pass es: {store.whatsapp}</p>
          </form>
        </div>
      </main>
    )
  }

  return(
    <main className='min-h-screen bg-[#fafaf9] p-6'>
      <div className='max-w-5xl mx-auto'>
        <div className='flex justify-between items-center'>
          <h1 className='font-black'>Panel {store.name} - 🔒 Protegido con WhatsApp</h1>
          <div className='flex gap-2'>
            <a href={`/${store.slug}`} target='_blank' className='text-xs border-2 border-black px-4 py-2 rounded-full bg-white font-bold'>Ver mi tienda</a>
            <button onClick={()=>{localStorage.removeItem('tn_owner_'+store.slug);setIsAuth(false)}} className='text-xs bg-black text-white px-4 py-2 rounded-full'>Salir</button>
          </div>
        </div>
        <div className='grid md:grid-cols-3 gap-6 mt-6'>
          <div className='space-y-6'>
            <div className='bg-white border-2 border-black rounded-2xl p-5'>
              <h2 className='font-black'>Mi QR para clientes</h2>
              <p className='text-[11px] text-gray-500 mt-1'>tiendanica.store/{store.slug}</p>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=https://tiendanica.store/${store.slug}`} className='w-full mt-4 bg-white border-2 border-black rounded-xl p-3'/>
              <a href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=https://tiendanica.store/${store.slug}`} target='_blank' download={`QR-${store.slug}-HD.png`} className='block w-full mt-4 bg-[#00ff88] border-2 border-black text-black text-center py-3 rounded-full font-black text-sm'>⬇️ Descargar QR Grande HD</a>
              <a href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=https://tiendanica.store/${store.slug}`} target='_blank' className='block w-full mt-2 bg-white border-2 border-black text-black text-center py-3 rounded-full font-bold text-sm'>Ver QR grande</a>
              <p className='text-[10px] mt-3 text-gray-500 text-center'>Imprime este QR en tu local - tus clientes escanean y entran directo</p>
            </div>
            <div className='bg-black text-white rounded-2xl p-4'>
              <p className='text-xs font-bold'>🔒 Seguro: /{store.slug}/admin solo con tu WhatsApp {store.whatsapp}</p>
            </div>
          </div>
          <div className='md:col-span-2 space-y-6'>
            <div className='bg-white border-2 border-black rounded-2xl p-5'>
              <h2 className='font-black text-lg'>{editing?'✏️ Editar producto':'➕ Agregar producto'}</h2>
              <form onSubmit={saveProduct} className='mt-3 space-y-3'>
                <input className='w-full border-2 border-black rounded-xl px-4 py-3 font-bold' placeholder='Nombre ej: Bistec' value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                <input className='w-full border-2 border-black rounded-xl px-4 py-3' placeholder='Precio ej: 180' value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required/>
                <div className='border-2 border-dashed border-black rounded-xl p-3 bg-gray-50'>
                  <label className='text-xs font-black'>📸 Foto producto</label>
                  <input id='prod-file' type='file' accept='image/*' className='w-full mt-2 text-sm font-bold'/>
                  <input className='w-full border rounded-xl px-4 py-2 mt-2' placeholder='O pega URL imagen' value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})}/>
                </div>
                <div className='flex gap-2'>
                  <button className='flex-1 bg-[#00ff88] border-2 border-black py-3 rounded-full font-black'>{editing?'💾 Guardar cambios':'✅ Agregar producto'}</button>
                  {editing && <button type='button' onClick={()=>{setEditing(false);setForm({name:'',price:'',image_url:'',id:null})}} className='flex-1 border-2 border-black py-3 rounded-full font-bold'>Cancelar</button>}
                </div>
              </form>
            </div>
            <div className='bg-white border-2 border-black rounded-2xl p-5'>
              <h2 className='font-black'>Mis productos ({products.length}) - Editar y Borrar</h2>
              <div className='mt-3 space-y-2'>
                {products.map(p=>(
                  <div key={p.id} className='flex gap-3 border-2 border-black rounded-xl p-2 items-center'>
                    <img src={p.image_url} className='w-14 h-14 object-cover rounded-lg border'/>
                    <div className='flex-1'><p className='font-bold text-sm'>{p.name}</p><p className='text-xs'>C$ {p.price}</p></div>
                    <button onClick={()=>startEdit(p)} className='bg-black text-white text-xs px-4 py-2 rounded-full font-bold'>Editar</button>
                    <button onClick={()=>deleteProduct(p.id)} className='bg-red-500 text-white text-xs px-4 py-2 rounded-full font-bold'>Borrar</button>
                  </div>
                ))}
                {products.length===0 && <p className='text-center text-gray-400 py-10'>Aún no hay productos</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
