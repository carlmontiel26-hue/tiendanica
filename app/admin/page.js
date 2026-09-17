
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const ADMIN_PASSWORD = "NicaAdmin2025"

export default function Admin(){
  const [isAuth, setIsAuth] = useState(false)
  const [passInput, setPassInput] = useState("")
  const [stores, setStores] = useState([])
  const [products, setProducts] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [form, setForm] = useState({name:'', slug:'', whatsapp:'', description:'', cover_image:''})
  const [pform, setPform] = useState({name:'', price:'', image_url:''})
  const [log, setLog] = useState('Conectando...')
  const [netError, setNetError] = useState(false)

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

  const loadStores = async()=>{
    try{
      setNetError(false)
      setLog('Conectando...')
      const { data, error } = await supabase.from('stores').select('*').order('created_at', {ascending:false})
      if(error) throw error
      setStores(data||[])
      setLog('Super Admin OK - '+data.length+' tiendas - KIT VERDE 03844a')
      if(data?.[0] && !selectedStore) setSelectedStore(data[0])
    }catch(err){
      console.error(err)
      if(err.message?.includes('Failed to fetch') || err.name === 'TypeError'){
        setNetError(true)
        setLog('Sin conexión a Supabase - DNS no resuelve. Usa DATOS del celular o cambia DNS a 1.1.1.1')
      } else {
        setLog('ERROR: '+err.message)
      }
    }
  }

  const loadProducts = async(storeId)=>{
    if(!storeId) return
    try{
      const { data } = await supabase.from('products').select('*').eq('store_id', storeId).order('created_at', {ascending:false})
      setProducts(data||[])
    }catch(e){}
  }

  useEffect(()=>{ if(isAuth) loadStores() },[isAuth])
  useEffect(()=>{ if(selectedStore) loadProducts(selectedStore.id) },[selectedStore])

  const createStore = async(e)=>{
    e.preventDefault()
    try{
      const cleanSlug = form.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g,'-').replace(/--+/g,'-')
      const { data, error } = await supabase.from('stores').insert({ name:form.name, slug:cleanSlug, whatsapp:form.whatsapp, description:form.description, cover_image:form.cover_image, is_active:true }).select().single()
      if(error) throw error
      setForm({name:'',slug:'',whatsapp:'',description:'',cover_image:''})
      loadStores()
      setSelectedStore(data)
      alert('Tienda creada: /'+cleanSlug)
    }catch(err){
      alert('Error: '+err.message)
    }
  }

  const createProduct = async(e)=>{
    e.preventDefault()
    if(!selectedStore) return alert('Selecciona tienda')
    try{
      const { error } = await supabase.from('products').insert({ store_id:selectedStore.id, name:pform.name, price: parseFloat(pform.price), image_url:pform.image_url, is_active:true })
      if(error) throw error
      setPform({name:'',price:'',image_url:''})
      loadProducts(selectedStore.id)
    }catch(err){ alert(err.message) }
  }

  const deleteProduct = async(id)=>{
    if(!confirm('Eliminar?')) return
    await supabase.from('products').delete().eq('id', id)
    loadProducts(selectedStore.id)
  }

  const getQR = (slug)=> `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://tiendanica.store/${slug}`

  if(!isAuth){
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-white rounded-[24px] p-8 max-w-sm w-full text-center">
          <img src="/logo.png" className="h-10 mx-auto mb-6 object-contain" alt="logo"/>
          <h1 className="font-black text-xl">Super Admin - Solo Tú</h1>
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
          <img src="/logo.png" className="h-8 object-contain" alt="logo"/>
          <div className="flex gap-2 items-center">
            <div className={`text-xs px-3 py-1 rounded-full ${netError ? 'bg-red-500 text-white' : 'bg-black text-green-400'}`}>{log}</div>
            <button onClick={loadStores} className="text-xs border px-3 py-1 rounded-full bg-white">Reintentar</button>
          </div>
        </div>

        {netError && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-5">
            <h3 className="font-black text-red-700">No hay conexión con Supabase (Failed to fetch)</h3>
            <p className="text-sm mt-2 text-red-900">Esto pasa porque tu WiFi no resuelve nzrwrabgrlesetwkdvdvz.supabase.co. Es el problema de ayer (NXDOMAIN).</p>
            <ul className="list-disc ml-5 text-sm mt-3 text-red-900">
              <li><b>Solución inmediata (2 min):</b> Conecta tu PC al hotspot de tu celular con DATOS MÓVILES y recarga esta página. Con datos SÍ resuelve.</li>
              <li>Ve a Supabase Dashboard → tu proyecto → si dice PAUSED, dale Restore / Unpause.</li>
              <li>Si ya cambiaste DNS a 1.1.1.1, haz ipconfig /flushdns y reinicia el navegador.</li>
            </ul>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border rounded-2xl p-5">
              <h2 className="font-black text-lg">Crear Tienda</h2>
              <form onSubmit={createStore} className="mt-4 space-y-3">
                <input className="w-full border rounded-xl px-4 py-2" placeholder="Nombre ej: EL SAZÓN DEL PATRÓN" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="slug ej: el-sazon-del-patron" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="WhatsApp 505..." value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} required/>
                <textarea className="w-full border rounded-xl px-4 py-2" placeholder="Descripción" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
                <input className="w-full border rounded-xl px-4 py-2" placeholder="URL portada (opcional)" value={form.cover_image} onChange={e=>setForm({...form,cover_image:e.target.value})}/>
                <button className="w-full bg-black text-white py-3 rounded-full font-bold">Crear tienda</button>
              </form>
            </div>

            <div className="bg-white border rounded-2xl p-5">
              <h3 className="font-bold">Tiendas ({stores.length})</h3>
              <div className="mt-3 space-y-2">
                {stores.map(s=>(
                  <button key={s.id} onClick={()=>setSelectedStore(s)} className={`w-full text-left px-3 py-2 rounded-xl border text-sm ${selectedStore?.id===s.id ? 'bg-black text-white' : 'bg-white'}`}>
                    {s.name} - /{s.slug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedStore ? (
              <div className="bg-white border rounded-2xl p-5">
                <div className="flex justify-between">
                  <h2 className="font-black text-lg">Productos de {selectedStore.name}</h2>
                  <a href={`/${selectedStore.slug}`} target="_blank" className="text-xs border px-3 py-1 rounded-full">Ver tienda</a>
                </div>
                <form onSubmit={createProduct} className="mt-4 grid grid-cols-3 gap-2">
                  <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Nombre producto" value={pform.name} onChange={e=>setPform({...pform,name:e.target.value})} required/>
                  <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Precio" type="number" step="0.01" value={pform.price} onChange={e=>setPform({...pform,price:e.target.value})} required/>
                  <input className="border rounded-xl px-3 py-2 text-sm" placeholder="URL imagen" value={pform.image_url} onChange={e=>setPform({...pform,image_url:e.target.value})} required/>
                  <button className="col-span-3 bg-[#00D084] text-black py-2 rounded-full font-bold">Agregar producto</button>
                </form>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {products.map(p=>(
                    <div key={p.id} className="border rounded-xl overflow-hidden">
                      <img src={p.image_url} className="h-32 w-full object-cover"/>
                      <div className="p-2">
                        <p className="font-bold text-sm">{p.name}</p>
                        <p className="text-xs text-gray-500">C$ {p.price}</p>
                        <button onClick={()=>deleteProduct(p.id)} className="mt-1 text-xs text-red-500">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 border-t pt-4">
                  <p className="text-sm font-bold">QR de la tienda:</p>
                  <img src={getQR(selectedStore.slug)} className="mt-2 w-40 h-40"/>
                  <p className="text-xs mt-2">https://tiendanica.store/{selectedStore.slug}</p>
                </div>
              </div>
            ) : <p className="text-sm text-gray-500">Selecciona una tienda o crea una nueva.</p>}
          </div>
        </div>
      </div>
    </main>
  )
}
