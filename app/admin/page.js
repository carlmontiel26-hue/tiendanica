'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const TIPOS = [
  { id: 'comida', label: '🍔 Comida', desc: 'Delivery 30min', color: '#00E676' },
  { id: 'boutique', label: '👗 Boutique / Ropa', desc: 'Tallas, €, bolsa', color: '#FF2D78' },
  { id: 'electro', label: '📱 Electro / Otros', desc: 'Cuotas, garantia', color: '#7C4DFF' },
]

export default function Admin(){
  const [stores, setStores] = useState([])
  const [products, setProducts] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [tipo, setTipo] = useState('comida')
  const [form, setForm] = useState({name:'', slug:'', whatsapp:'', description:''})
  const [pform, setPform] = useState({name:'', price:'', image_url:'', id:null})
  const [imageFile, setImageFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)

  const loadStores = async()=>{
    const { data } = await supabase.from('stores').select('*').order('created_at',{ascending:false})
    setStores(data||[]); if(data?.[0] && !selectedStore) setSelectedStore(data[0])
  }
  const loadProducts = async(id)=>{
    const { data } = await supabase.from('products').select('*').eq('store_id', id).order('created_at',{ascending:false})
    setProducts(data||[])
  }
  useEffect(()=>{ loadStores() },[])
  useEffect(()=>{ if(selectedStore) loadProducts(selectedStore.id) },[selectedStore])

  const upload = async(file)=>{
    const name = Date.now()+'-'+file.name.replace(/[^a-zA-Z0-9.-]/g,'-')
    let res = await supabase.storage.from('tienda-images').upload(name, file)
    if(res.error){
      res = await supabase.storage.from('product-images').upload(name, file)
      if(res.error) throw res.error
      const { data } = supabase.storage.from('product-images').getPublicUrl(name)
      return data.publicUrl
    }
    const { data } = supabase.storage.from('tienda-images').getPublicUrl(name)
    return data.publicUrl
  }

  const createStore = async(e)=>{
    e.preventDefault()
    setUploading(true)
    try{
      const cleanSlug = form.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g,'-').replace(/--+/g,'-')
      let payload = { name:form.name, slug:cleanSlug, whatsapp:form.whatsapp, description:form.description, is_active:true, tipo_tienda: tipo }
      let { data, error } = await supabase.from('stores').insert(payload).select().single()
      if(error && error.message.includes('tipo_tienda')){
        const { data: d2, error: e2 } = await supabase.from('stores').insert({ name:form.name, slug:cleanSlug, whatsapp:form.whatsapp, description:form.description, is_active:true }).select().single()
        if(e2) throw e2
        data = d2
        alert('Creada! Ejecuta en Supabase: ALTER TABLE stores ADD COLUMN tipo_tienda TEXT DEFAULT \'comida\'')
      } else if(error) throw error
      if(coverFile){
        try{ const url = await upload(coverFile); await supabase.from('stores').update({ cover_image: url }).eq('id', data.id) }catch{}
      }
      setForm({name:'', slug:'', whatsapp:'', description:''}); setCoverFile(null)
      await loadStores(); setSelectedStore(data)
    }catch(err){ alert('Error: '+err.message) } finally{ setUploading(false) }
  }

  const createProduct = async(e)=>{
    e.preventDefault()
    if(!selectedStore) return alert('Selecciona tienda')
    if(!imageFile && !pform.image_url && !editing) return alert('Sube foto')
    setUploading(true)
    try{
      let url = pform.image_url
      if(imageFile) url = await upload(imageFile)
      if(editing && pform.id){
        const { error } = await supabase.from('products').update({ name:pform.name, price: parseFloat(pform.price), image_url:url }).eq('id', pform.id)
        if(error) throw error
      }else{
        const { error } = await supabase.from('products').insert({ store_id:selectedStore.id, name:pform.name, price: parseFloat(pform.price), image_url:url, is_active:true }).select()
        if(error) throw error
      }
      setPform({name:'',price:'',image_url:'',id:null}); setImageFile(null); setEditing(false)
      loadProducts(selectedStore.id)
    }catch(err){ alert('Error: '+err.message) } finally{ setUploading(false) }
  }

  const startEdit=(p)=>{ setPform({name:p.name, price:p.price, image_url:p.image_url||'', id:p.id}); setEditing(true); window.scrollTo({top:0, behavior:'smooth'}) }
  const cancelEdit=()=>{ setPform({name:'',price:'',image_url:'',id:null}); setEditing(false); setImageFile(null) }
  const deleteStore=async(id)=>{ if(!confirm('Eliminar tienda y productos?'))return; await supabase.from('products').delete().eq('store_id',id); await supabase.from('stores').delete().eq('id',id); setSelectedStore(null); loadStores() }
  const deleteProduct=async(id)=>{ if(!confirm('Borrar producto?'))return; await supabase.from('products').delete().eq('id',id); loadProducts(selectedStore.id) }

  const tipoInfo = (id)=> TIPOS.find(t=>t.id===id) || TIPOS[0]

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white p-4 md:p-6">
      <style>{`.glass{background:rgba(255,255,255,0.07);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.1)} .glass-strong{background:rgba(255,255,255,0.11);backdrop-filter:blur(28px);border:1px solid rgba(255,255,255,0.12)}`}</style>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center glass rounded-full px-5 py-3">
          <div className="flex items-center gap-3"><span className="font-black">TiendaNica • SUPER ADMIN UNIVERSAL</span><span className="text-[10px] bg-white text-black px-2 py-1 rounded-full font-black">3 TIPOS A LA VEZ</span></div>
          <span className="bg-[#00E676] text-black text-xs px-3 py-1 rounded-full font-bold">{stores.length} tiendas</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="space-y-5">
            <div className="glass-strong rounded-[24px] p-5">
              <h2 className="font-black text-lg">Crear Tienda - 3 tipos</h2>
              <p className="text-white/50 text-xs mt-1">Elige tipo, cada una se ve diferente pero mismo sistema</p>
              <div className="mt-4 grid gap-2">
                {TIPOS.map(t=>(
                  <button key={t.id} type="button" onClick={()=>setTipo(t.id)} className={`text-left rounded-2xl p-3 border ${tipo===t.id?'bg-white text-black border-white':'glass'}`}>
                    <b className="text-sm">{t.label}</b><br/><span className="text-[11px] opacity-60">{t.desc}</span>{tipo===t.id && <span className="ml-2 text-[10px] bg-black text-white px-2 py-1 rounded-full">ACTIVO</span>}
                  </button>
                ))}
              </div>
              <form onSubmit={createStore} className="mt-5 space-y-3">
                <input className="w-full bg-white text-black rounded-full px-4 py-3 text-sm" placeholder={`Nombre ej: ${TIPOS.find(t=>t.id===tipo).label}`} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                <input className="w-full glass rounded-full px-4 py-3 text-sm placeholder:text-white/40" placeholder="slug ej: atelier-nica-madrid" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required/>
                <input className="w-full glass rounded-full px-4 py-3 text-sm placeholder:text-white/40" placeholder="WhatsApp 505..." value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} required/>
                <input className="w-full glass rounded-full px-4 py-3 text-sm placeholder:text-white/40" placeholder="Descripcion" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
                <label className="w-full glass rounded-2xl px-4 py-4 text-center cursor-pointer block text-xs font-bold hover:bg-white/10">{coverFile? `✅ Portada: ${coverFile.name}` : '🖼️ Foto de PORTADA (hero) - como antes'}<input type="file" accept="image/*" className="hidden" onChange={e=>setCoverFile(e.target.files[0])}/></label>
                <button disabled={uploading} className="w-full bg-[#00E676] text-black py-4 rounded-full font-black text-sm">{uploading?'Creando...':`Crear Tienda ${TIPOS.find(t=>t.id===tipo).label} →`}</button>
              </form>
            </div>

            <div className="glass rounded-[24px] p-5">
              <h3 className="font-bold text-sm">Mis Tiendas ({stores.length}) - 3 tipos a la vez</h3>
              <div className="mt-3 space-y-2">
                {stores.map(s=>{
                  const t = tipoInfo(s.tipo_tienda||'comida')
                  return (
                    <div key={s.id} className={`rounded-2xl p-3 border flex justify-between items-center ${selectedStore?.id===s.id?'bg-white text-black border-white':'glass'}`}>
                      <button onClick={()=>setSelectedStore(s)} className="text-left flex-1"><span className="text-[10px] bg-black text-white px-2 py-1 rounded-full">{t.label}</span><div className="mt-1"><b className="text-sm">{s.name}</b><br/><span className="text-[11px] opacity-60">/{s.slug} • {s.tipo_tienda||'comida'}</span></div></button>
                      <div className="flex flex-col gap-1 ml-2">
                        <a href={'/'+s.slug} target="_blank" className="text-[10px] bg-black text-white px-3 py-1.5 rounded-full text-center font-bold border border-white/20">Ver</a>
                        <button onClick={()=>deleteStore(s.id)} className="text-[10px] bg-red-500 text-white px-3 py-1 rounded-full">Eliminar</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {selectedStore && (
              <div className="glass-strong rounded-[24px] p-5">
                <h3 className="font-black text-sm">Links y QR - {selectedStore.name} ({tipoInfo(selectedStore.tipo_tienda||'comida').label})</h3>
                <div className="mt-3 flex gap-3">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://tiendanica.store/${selectedStore.slug}`} className="w-20 h-20 border rounded-xl bg-white p-1"/>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-white/50">Tienda:</p><a href={`https://tiendanica.store/${selectedStore.slug}`} target="_blank" className="text-[11px] text-[#00E676] underline break-all">tiendanica.store/{selectedStore.slug}</a>
                    <p className="text-[10px] font-black text-white/50 mt-2">Admin dueno:</p><a href={`https://tiendanica.store/${selectedStore.slug}/admin`} target="_blank" className="text-[11px] text-white underline break-all">.../{selectedStore.slug}/admin</a>
                  </div>
                </div>
                <div className="mt-4 bg-black rounded-xl p-3">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=https://tiendanica.store/${selectedStore.slug}`} className="w-full max-w-[240px] mx-auto bg-white rounded-xl p-2"/>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <a href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=https://tiendanica.store/${selectedStore.slug}`} target="_blank" className="bg-[#00ff88] text-black text-center py-2 rounded-full font-black text-xs">HD 1000px</a>
                    <button onClick={()=>{navigator.clipboard.writeText(`https://tiendanica.store/${selectedStore.slug}`); alert('Copiado')}} className="bg-white text-black text-center py-2 rounded-full font-bold text-xs">Copiar link</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white text-black rounded-[24px] p-6">
              <h2 className="font-black text-lg">Productos {selectedStore? `de ${selectedStore.name} - ${tipoInfo(selectedStore.tipo_tienda||'comida').label}` : ''} {editing && <span className="text-[#00D084]">- Editando</span>}</h2>
              {!selectedStore && <p className="text-gray-500 mt-4 text-sm">Selecciona una tienda. Ahora puedes tener comida, boutique y electro a la vez. Cada dueno ve solo su tienda. Tu ves todas.</p>}
              {selectedStore && (
                <>
                  <form onSubmit={createProduct} className="grid md:grid-cols-3 gap-3 mt-4 bg-gray-50 p-4 rounded-2xl">
                    <input className="border rounded-xl px-3 py-2 text-sm" placeholder={selectedStore.tipo_tienda==='boutique'?'Nombre ej: Vestido Lino M':'Nombre producto'} value={pform.name} onChange={e=>setPform({...pform,name:e.target.value})} required/>
                    <input className="border rounded-xl px-3 py-2 text-sm" placeholder={selectedStore.tipo_tienda==='boutique'?'Precio €':'Precio C$'} type="number" step="0.01" value={pform.price} onChange={e=>setPform({...pform,price:e.target.value})} required/>
                    <label className="md:col-span-3 w-full border-2 border-dashed border-gray-300 rounded-xl px-3 py-4 text-center bg-white cursor-pointer hover:bg-gray-100"><span className="text-sm font-bold">{imageFile? `✅ ${imageFile.name}` : '📸 Sube foto producto'} - como antes</span><input type="file" accept="image/*" className="hidden" onChange={e=> setImageFile(e.target.files[0])} /></label>
                    <div className="md:col-span-3 flex gap-2">
                      <button disabled={uploading} className="flex-1 bg-[#00D084] text-black py-3 rounded-full font-bold text-sm">{uploading? 'Subiendo...' : editing?'Guardar cambios':'Agregar Producto'}</button>
                      {editing && <button type="button" onClick={cancelEdit} className="flex-1 border-2 border-black py-3 rounded-full font-bold text-sm">Cancelar</button>}
                    </div>
                  </form>
                  <div className="grid md:grid-cols-3 gap-4 mt-6">
                    {products.map(p=>(
                      <div key={p.id} className="border rounded-2xl overflow-hidden bg-white">
                        <img src={p.image_url} className="h-32 w-full object-cover"/>
                        <div className="p-3"><p className="font-bold text-sm truncate">{p.name}</p><p className="text-sm text-gray-500">{(selectedStore.tipo_tienda==='boutique'?'€':'C$')} {p.price}</p>
                          <div className="flex gap-1 mt-2">
                            <button onClick={()=>startEdit(p)} className="flex-1 bg-black text-white text-[10px] py-2 rounded-full font-bold">Editar</button>
                            <button onClick={()=>{if(confirm('Borrar?')){deleteProduct(p.id)}}} className="flex-1 bg-red-500 text-white text-[10px] py-2 rounded-full font-bold">Borrar</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {products.length===0 && <p className="text-gray-400 text-sm col-span-3">Aun no hay productos. Agrega el primero.</p>}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <a href={'/'+selectedStore.slug} target="_blank" className="px-5 py-3 bg-black text-white rounded-full text-xs font-black">Ver tienda /{selectedStore.slug} →</a>
                    <a href={'/'+selectedStore.slug+'/admin'} target="_blank" className="px-5 py-3 border-2 border-black rounded-full text-xs font-bold">Admin dueno →</a>
                  </div>
                </>
              )}
            </div>
            <div className="glass rounded-[24px] p-4">
              <p className="text-[11px] text-white/50">SQL para activar 3 tipos (1 vez):</p><pre className="mt-2 bg-black rounded-xl p-3 text-[11px] text-[#00E676]">ALTER TABLE stores ADD COLUMN IF NOT EXISTS tipo_tienda TEXT DEFAULT 'comida';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS cover_image TEXT;</pre>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
