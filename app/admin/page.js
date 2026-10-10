'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key) return null
  return createClient(url,key)
}

async function uploadToBucket(supabase, bucket, file){
  if(!file) return null
  const ext = file.name.split('.').pop()||'png'
  const name = Date.now()+'_'+Math.random().toString(36).slice(2)+'.'+ext
  const { error } = await supabase.storage.from(bucket).upload(name, file, { upsert:true })
  if(error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(name)
  return data.publicUrl
}

export default function SuperAdminPremiumFull(){
  const [stores,setStores]=useState([])
  const [products,setProducts]=useState([])
  const [form,setForm]=useState({tipo:'boutique', slug:'', name:'', whatsapp:'', description:''})
  const [logoFile,setLogoFile]=useState(null)
  const [coverFile,setCoverFile]=useState(null)
  const [logoPreview,setLogoPreview]=useState(null)
  const [coverPreview,setCoverPreview]=useState(null)
  const [search,setSearch]=useState('')
  const [filterTipo,setFilterTipo]=useState('all')
  const [msg,setMsg]=useState('')
  const [creating,setCreating]=useState(false)
  const [expandedStore,setExpandedStore]=useState(null)
  const [prodForm,setProdForm]=useState({name:'', price:'', categoria:'', imageFile:null})
  const [prodPreview,setProdPreview]=useState(null)

  useEffect(()=>{ load() },[])
  useEffect(()=>{ if(logoFile) setLogoPreview(URL.createObjectURL(logoFile)); else setLogoPreview(null)},[logoFile])
  useEffect(()=>{ if(coverFile) setCoverPreview(URL.createObjectURL(coverFile)); else setCoverPreview(null)},[coverFile])
  useEffect(()=>{ if(prodForm.imageFile) setProdPreview(URL.createObjectURL(prodForm.imageFile)); else setProdPreview(null)},[prodForm.imageFile])

  const load=async()=>{
    const supabase=getSupabase()
    if(!supabase) return
    const {data: s}=await supabase.from('stores').select('*').order('created_at',{ascending:false})
    const {data: p}=await supabase.from('products').select('*').order('created_at',{ascending:false})
    setStores(s||[])
    setProducts(p||[])
  }

  const crearTienda=async()=>{
    if(!form.slug || !form.name || !form.whatsapp){ alert('Falta slug, nombre o WhatsApp'); return }
    setCreating(true); setMsg('Creando...')
    const supabase=getSupabase()
    try{
      let logoUrl=null, coverUrl=null
      if(logoFile){ try{ logoUrl=await uploadToBucket(supabase,'store-assets',logoFile) }catch{ try{ logoUrl=await uploadToBucket(supabase,'product-images',logoFile) }catch(e){ console.warn(e)} } }
      if(coverFile){ try{ coverUrl=await uploadToBucket(supabase,'store-assets',coverFile) }catch{ try{ coverUrl=await uploadToBucket(supabase,'product-images',coverFile) }catch(e){ console.warn(e)} } }
      const payload={ slug: form.slug.toLowerCase().trim().replace(/\s+/g,'-'), name: form.name, whatsapp: form.whatsapp.replace(/[^0-9]/g,''), description: form.description, tipo_tienda: form.tipo, logo_url: logoUrl, cover_image: coverUrl }
      const { error } = await supabase.from('stores').insert(payload)
      if(error) throw error
      setMsg('✅ Tienda creada!'); setForm({tipo:'boutique', slug:'', name:'', whatsapp:'', description:''}); setLogoFile(null); setCoverFile(null); setLogoPreview(null); setCoverPreview(null); load(); setTimeout(()=>setMsg(''),2500)
    }catch(e){ alert('Error: '+e.message); setMsg('') } finally{ setCreating(false) }
  }

  const eliminarTienda=async(id, slug)=>{
    if(!confirm(`¿Seguro eliminar ${slug}? También borrará sus productos. Esta acción no se puede deshacer.`)) return
    const supabase=getSupabase()
    try{
      await supabase.from('products').delete().eq('store_id', id)
      const { error } = await supabase.from('stores').delete().eq('id', id)
      if(error) throw error
      alert('Tienda eliminada')
      load()
    }catch(e){ alert('Error eliminando: '+e.message) }
  }

  const agregarProducto=async(storeId, tipoTienda)=>{
    if(!prodForm.name || !prodForm.price){ alert('Falta nombre o precio'); return }
    const supabase=getSupabase()
    setMsg('Subiendo producto...')
    try{
      let imageUrl=null
      if(prodForm.imageFile){
        try{ imageUrl=await uploadToBucket(supabase,'product-images',prodForm.imageFile) }catch(e){ alert('Error imagen: '+e.message); return }
      }
      const payload={ store_id: storeId, name: prodForm.name, price: Number(prodForm.price), categoria: prodForm.categoria || (tipoTienda==='comida'?'platos fuertes': tipoTienda==='general'?'otros':'vestidos'), image_url: imageUrl, is_active: true }
      const { error } = await supabase.from('products').insert(payload)
      if(error) throw error
      setMsg('Producto agregado!'); setProdForm({name:'', price:'', categoria:'', imageFile:null}); setProdPreview(null); load()
      setTimeout(()=>setMsg(''),1500)
    }catch(e){ alert('Error: '+e.message); setMsg('') }
  }

  const eliminarProducto=async(prodId)=>{
    if(!confirm('¿Eliminar este producto?')) return
    const supabase=getSupabase()
    const { error } = await supabase.from('products').delete().eq('id', prodId)
    if(error){ alert(error.message); return }
    load()
  }

  const filtered = stores.filter(s=>{
    if(filterTipo!=='all' && s.tipo_tienda!==filterTipo) return false
    if(search && !s.name.toLowerCase().includes(search.toLowerCase()) && !String(s.slug||'').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const previewStore={ name: form.name || 'TIENDA AGDIN', slug: form.slug || 'agdin-luna', tipo: form.tipo, logo: logoPreview, cover: coverPreview }

  return (
    <main style={{background:'#F7F5F3', minHeight:'100vh', padding:16, fontFamily:'Inter, system-ui'}}>
      <style>{`
        .card{background:#fff; border:1px solid #EAE6E1; border-radius:20px; padding:18px; box-shadow:0 8px 24px rgba(0,0,0,0.04); margin-bottom:14px}
        .input{padding:12px 14px; border-radius:12px; border:1px solid #EAE6E1; width:100%; font-size:13px; background:#FBF9F7; outline:none}
        .btn-black{background:#0A0A0A; color:#fff; padding:14px; border-radius:999px; font-weight:800; width:100%; cursor:pointer; border:none}
        .btn-red{background:#fff; color:#E11D48; border:1px solid #FECDD3; padding:6px 10px; border-radius:999px; font-size:10px; font-weight:800; cursor:pointer}
        .btn-green{background:#00E676; color:#000; padding:8px 12px; border-radius:999px; font-size:10px; font-weight:800; border:none; cursor:pointer}
        .pill{padding:8px 14px; border-radius:999px; border:1px solid #EAE6E1; background:#fff; font-size:11px; font-weight:700; cursor:pointer}
        .pill.active{background:#0A0A0A; color:#fff}
        .preview-cover{height:180px; background:#E8E2DD; border-radius:16px; overflow:hidden; position:relative}
        .preview-cover img{width:100%; height:100%; object-fit:cover}
      `}</style>
      <div style={{maxWidth:900, margin:'0 auto'}}>
        <h1 style={{fontWeight:900, fontSize:20, color:'#0A0A0A'}}>Super Admin Privado <span style={{fontWeight:500, fontSize:12, color:'#9A9590'}}>• {stores.length} tiendas • {products.length} productos</span> {msg ? <span style={{fontSize:11, background:'#00E676', color:'#000', padding:'4px 10px', borderRadius:999, marginLeft:8}}>{msg}</span> : null}</h1>

        <div style={{display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:14, marginTop:14}}>
          <div className="card">
            <b style={{fontSize:13}}>Crear nueva tienda premium</b>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
              <select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})} className="input">
                <option value="boutique">👗 Boutique</option>
                <option value="comida">🍔 Comida</option>
                <option value="general">🛍️ General</option>
              </select>
              <input value={form.slug} onChange={e=>setForm({...form, slug:e.target.value})} placeholder="slug ej: agdin-luna" className="input"/>
            </div>
            <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Nombre tienda" className="input" style={{marginTop:8}}/>
            <input value={form.whatsapp} onChange={e=>setForm({...form, whatsapp:e.target.value})} placeholder="WhatsApp 505..." className="input" style={{marginTop:8}}/>
            <input value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Descripcion corta" className="input" style={{marginTop:8}}/>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12}}>
              <div><div style={{fontSize:11, fontWeight:800, marginBottom:6}}>Logo dueño (local)</div><input type="file" accept="image/*" onChange={e=>setLogoFile(e.target.files?.[0]||null)} style={{fontSize:11, width:'100%'}}/>{logoPreview ? <img src={logoPreview} style={{width:52, height:52, borderRadius:12, marginTop:8, objectFit:'cover', border:'1px solid #EAE6E1'}}/> : null}</div>
              <div><div style={{fontSize:11, fontWeight:800, marginBottom:6}}>Portada editable (local)</div><input type="file" accept="image/*" onChange={e=>setCoverFile(e.target.files?.[0]||null)} style={{fontSize:11, width:'100%'}}/>{coverPreview ? <img src={coverPreview} style={{width:'100%', height:52, borderRadius:12, marginTop:8, objectFit:'cover', border:'1px solid #EAE6E1'}}/> : null}</div>
            </div>
            <button onClick={crearTienda} disabled={creating} className="btn-black" style={{marginTop:14, opacity: creating?0.6:1}}>{creating ? 'Creando...' : 'Crear tienda premium →'}</button>
          </div>
          <div>
            <div style={{fontSize:11, fontWeight:800, color:'#9A9590', letterSpacing:'0.8px', marginBottom:8}}>VISTA PREVIA EN VIVO</div>
            <div className="card" style={{padding:0, overflow:'hidden'}}>
              <div className="preview-cover">{previewStore.cover ? <img src={previewStore.cover}/> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#9A9590'}}>Portada por defecto</div>}<div style={{position:'absolute', top:10, left:10, background:'#fff', padding:'4px 10px', borderRadius:999, fontSize:10, fontWeight:800}}>{previewStore.tipo.toUpperCase()}</div></div>
              <div style={{padding:12, display:'flex', justifyContent:'space-between', alignItems:'center'}}><div style={{display:'flex', alignItems:'center', gap:10}}>{previewStore.logo ? <img src={previewStore.logo} style={{width:36, height:36, borderRadius:10, objectFit:'cover'}}/> : <div style={{width:36, height:36, borderRadius:10, background:'#0A0A0A', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900}}>A</div>}<b style={{fontSize:13}}>{previewStore.name}</b></div><div style={{background:'#00E676', padding:'6px 12px', borderRadius:999, fontSize:10, fontWeight:800}}>WA</div></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar tienda..." className="input" style={{maxWidth:220}}/>
            <button onClick={()=>setFilterTipo('all')} className={`pill ${filterTipo==='all'?'active':''}`}>all</button>
            <button onClick={()=>setFilterTipo('boutique')} className={`pill ${filterTipo==='boutique'?'active':''}`}>boutique</button>
            <button onClick={()=>setFilterTipo('comida')} className={`pill ${filterTipo==='comida'?'active':''}`}>comida</button>
            <button onClick={()=>setFilterTipo('general')} className={`pill ${filterTipo==='general'?'active':''}`}>general</button>
          </div>
          <div style={{marginTop:14}}>
            {filtered.map(s=>{
              const prods = products.filter(p=>p.store_id===s.id)
              const isOpen = expandedStore===s.id
              return (
                <div key={s.id} style={{padding:'12px 0', borderBottom:'1px solid #F0EDE8'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                      <img src={s.logo_url || s.cover_image || ''} style={{width:36, height:36, borderRadius:8, objectFit:'cover', background:'#F7F5F3', border:'1px solid #EAE6E1'}} onError={e=>e.currentTarget.style.display='none'}/>
                      <div><b style={{fontSize:12}}>{s.name}</b><div style={{fontSize:10, color:'#9A9590'}}>{s.slug} • {s.tipo_tienda} • {prods.length} prod • {s.whatsapp}</div></div>
                    </div>
                    <div style={{display:'flex', gap:6, alignItems:'center'}}>
                      <a href={'/'+s.slug} target="_blank" style={{background:'#0A0A0A', color:'#fff', padding:'6px 12px', borderRadius:999, fontSize:10, fontWeight:800, textDecoration:'none'}}>ver →</a>
                      <button onClick={()=>setExpandedStore(isOpen?null:s.id)} style={{background:'#fff', border:'1px solid #EAE6E1', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:700, cursor:'pointer'}}>{isOpen?'cerrar':'productos'}</button>
                      <button onClick={()=>eliminarTienda(s.id, s.slug)} className="btn-red">eliminar tienda</button>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{marginTop:12, background:'#FBF9F7', border:'1px solid #EAE6E1', borderRadius:16, padding:12}}>
                      <b style={{fontSize:11}}>Agregar producto para {s.name} - Ayuda a tu cliente</b>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 100px 1fr', gap:8, marginTop:8}}>
                        <input value={prodForm.name} onChange={e=>setProdForm({...prodForm, name:e.target.value})} placeholder="Nombre producto" className="input" style={{fontSize:11}}/>
                        <input value={prodForm.price} onChange={e=>setProdForm({...prodForm, price:e.target.value})} placeholder="Precio C$" type="number" className="input" style={{fontSize:11}}/>
                        <input value={prodForm.categoria} onChange={e=>setProdForm({...prodForm, categoria:e.target.value})} placeholder={s.tipo_tienda==='comida'?'platos fuertes / bebidas':'vestidos / blusas / oferta'} className="input" style={{fontSize:11}}/>
                      </div>
                      <div style={{display:'flex', gap:8, marginTop:8, alignItems:'center'}}>
                        <input type="file" accept="image/*" onChange={e=>setProdForm({...prodForm, imageFile:e.target.files?.[0]||null})} style={{fontSize:11}}/>
                        {prodPreview ? <img src={prodPreview} style={{width:36, height:36, borderRadius:8, objectFit:'cover'}}/> : null}
                        <button onClick={()=>agregarProducto(s.id, s.tipo_tienda)} className="btn-green">+ agregar producto</button>
                      </div>

                      <div style={{marginTop:12, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px,1fr))', gap:8}}>
                        {prods.map(p=>(
                          <div key={p.id} style={{background:'#fff', border:'1px solid #EAE6E1', borderRadius:12, padding:6}}>
                            <img src={p.image_url} style={{width:'100%', height:80, objectFit:'cover', borderRadius:8, background:'#F7F5F3'}}/>
                            <div style={{fontSize:10, fontWeight:700, marginTop:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.name}</div>
                            <div style={{fontSize:10, color:'#9A9590'}}>C$ {p.price} • {p.categoria}</div>
                            <button onClick={()=>eliminarProducto(p.id)} className="btn-red" style={{marginTop:6, width:'100%'}}>eliminar producto</button>
                          </div>
                        ))}
                        {prods.length===0 && <div style={{fontSize:11, color:'#9A9590'}}>Sin productos aún. Agrégale el primero para ayudar a tu cliente.</div>}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
