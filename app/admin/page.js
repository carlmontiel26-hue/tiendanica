'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const DEPARTAMENTOS_NIC = ["Managua","Matagalpa","León","Masaya","Granada","Estelí","Chinandega","Jinotega","Carazo","Rivas","Boaco","Chontales","Madriz","Nueva Segovia","Río San Juan","RAAN","RAAS","Ubú Norte","Zelaya Central"]

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
function CopyBtn({text, label}){
  const [ok,setOk]=useState(false)
  const copy=async()=>{
    try{ await navigator.clipboard.writeText(text); setOk(true); setTimeout(()=>setOk(false),1500) }catch{ prompt('Copia este link:', text) }
  }
  return <button onClick={copy} style={{background: ok?'#00E676':'#0A0A0A', color: ok?'#000':'#fff', border:'none', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:800, cursor:'pointer'}}>{ok?'¡Copiado!':label}</button>
}

export default function SuperAdminPremiumFull(){
  const [stores,setStores]=useState([])
  const [products,setProducts]=useState([])
  const [form,setForm]=useState({tipo:'boutique', slug:'', name:'', whatsapp:'', description:'', departamento:'', ciudad:'', tipo_entrega:'nacional'})
  const [logoFile,setLogoFile]=useState(null)
  const [coverFile,setCoverFile]=useState(null)
  const [logoPreview,setLogoPreview]=useState(null)
  const [coverPreview,setCoverPreview]=useState(null)
  const [search,setSearch]=useState('')
  const [filterTipo,setFilterTipo]=useState('all')
  const [filterDepto,setFilterDepto]=useState('all')
  const [msg,setMsg]=useState('')
  const [creating,setCreating]=useState(false)
  const [expandedStore,setExpandedStore]=useState(null)
  const [editingStore,setEditingStore]=useState(null)
  const [editForm,setEditForm]=useState({})
  const [editLogoFile,setEditLogoFile]=useState(null)
  const [editCoverFile,setEditCoverFile]=useState(null)
  const [prodForm,setProdForm]=useState({name:'', price:'', categoria:'', imageFile:null})
  const [prodPreview,setProdPreview]=useState(null)
  const [previewSelected,setPreviewSelected]=useState(null)

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
      if(logoFile){ try{ logoUrl=await uploadToBucket(supabase,'store-assets',logoFile) }catch{ try{ logoUrl=await uploadToBucket(supabase,'product-images',logoFile) }catch{} } }
      if(coverFile){ try{ coverUrl=await uploadToBucket(supabase,'store-assets',coverFile) }catch{ try{ coverUrl=await uploadToBucket(supabase,'product-images',coverFile) }catch{} } }
      const payload={ slug: form.slug.toLowerCase().trim().replace(/\s+/g,'-'), name: form.name, whatsapp: form.whatsapp.replace(/[^0-9]/g,''), description: form.description, tipo_tienda: form.tipo, logo_url: logoUrl, cover_image: coverUrl, departamento: form.departamento||null, ciudad: form.ciudad||null, tipo_entrega: form.tipo_entrega||'nacional' }
      const { error } = await supabase.from('stores').insert(payload)
      if(error) throw error
      setMsg('✅ Tienda creada!'); setForm({tipo:'boutique', slug:'', name:'', whatsapp:'', description:'', departamento:'', ciudad:'', tipo_entrega:'nacional'}); setLogoFile(null); setCoverFile(null); setLogoPreview(null); setCoverPreview(null); setPreviewSelected(null); load(); setTimeout(()=>setMsg(''),2500)
    }catch(e){ alert('Error: '+e.message); setMsg('') } finally{ setCreating(false) }
  }

  const startEdit=(s)=>{
    setEditingStore(s.id)
    setEditForm({ name: s.name||'', whatsapp: s.whatsapp||'', description: s.description||'', departamento: s.departamento||'', ciudad: s.ciudad||'', tipo_entrega: s.tipo_entrega||'nacional', tipo_tienda: s.tipo_tienda||'boutique' })
    setEditLogoFile(null); setEditCoverFile(null)
    setPreviewSelected(s)
    window.scrollTo({top:0, behavior:'smooth'})
  }

  const guardarEdicion=async(id)=>{
    const supabase=getSupabase()
    setMsg('Guardando cambios...')
    try{
      let logoUrl=null, coverUrl=null
      if(editLogoFile){ try{ logoUrl=await uploadToBucket(supabase,'store-assets',editLogoFile) }catch{ try{ logoUrl=await uploadToBucket(supabase,'product-images',editLogoFile) }catch(e){ console.warn(e) } } }
      if(editCoverFile){ try{ coverUrl=await uploadToBucket(supabase,'store-assets',editCoverFile) }catch{ try{ coverUrl=await uploadToBucket(supabase,'product-images',editCoverFile) }catch(e){ console.warn(e) } } }
      const payload={
        name: editForm.name,
        whatsapp: editForm.whatsapp.replace(/[^0-9]/g,''),
        description: editForm.description,
        departamento: editForm.departamento||null,
        ciudad: editForm.ciudad||null,
        tipo_entrega: editForm.tipo_entrega||'nacional',
        tipo_tienda: editForm.tipo_tienda||'boutique',
      }
      if(logoUrl) payload.logo_url=logoUrl
      if(coverUrl) payload.cover_image=coverUrl
      const { error } = await supabase.from('stores').update(payload).eq('id', id)
      if(error) throw error
      setMsg('✅ Tienda actualizada!'); setEditingStore(null); load(); setTimeout(()=>setMsg(''),2000)
    }catch(e){ alert('Error editando: '+e.message); setMsg('') }
  }

  const eliminarTienda=async(id, slug)=>{
    if(!confirm(`¿Seguro eliminar ${slug}?`)) return
    const supabase=getSupabase()
    try{ await supabase.from('products').delete().eq('store_id', id); const { error } = await supabase.from('stores').delete().eq('id', id); if(error) throw error; if(previewSelected?.id===id) setPreviewSelected(null); load() }catch(e){ alert('Error eliminando: '+e.message) }
  }
  const agregarProducto=async(storeId, tipoTienda)=>{
    if(!prodForm.name || !prodForm.price){ alert('Falta nombre o precio'); return }
    const supabase=getSupabase(); setMsg('Subiendo producto...')
    try{
      let imageUrl=null
      if(prodForm.imageFile){ try{ imageUrl=await uploadToBucket(supabase,'product-images',prodForm.imageFile) }catch(e){ alert('Error imagen: '+e.message); return } }
      const payload={ store_id: storeId, name: prodForm.name, price: Number(prodForm.price), categoria: prodForm.categoria || (tipoTienda==='comida'?'platos fuertes': tipoTienda==='general'?'otros':'vestidos'), image_url: imageUrl, is_active: true }
      const { error } = await supabase.from('products').insert(payload); if(error) throw error
      setMsg('Producto agregado!'); setProdForm({name:'', price:'', categoria:'', imageFile:null}); setProdPreview(null); load(); setTimeout(()=>setMsg(''),1500)
    }catch(e){ alert('Error: '+e.message); setMsg('') }
  }
  const eliminarProducto=async(prodId)=>{
    if(!confirm('¿Eliminar este producto?')) return
    const supabase=getSupabase(); const { error } = await supabase.from('products').delete().eq('id', prodId); if(error){ alert(error.message); return } load()
  }

  const filtered = stores.filter(s=>{
    if(filterTipo!=='all' && s.tipo_tienda!==filterTipo) return false
    if(filterDepto!=='all' && (s.departamento||'')!==filterDepto) return false
    if(search && !s.name.toLowerCase().includes(search.toLowerCase()) && !String(s.slug||'').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const isPreviewFromExisting = !!previewSelected
  const previewStore = isPreviewFromExisting ? {
    id: previewSelected.id, name: previewSelected.name, slug: previewSelected.slug, tipo: previewSelected.tipo_tienda || 'boutique', logo: previewSelected.logo_url, cover: previewSelected.cover_image, whatsapp: previewSelected.whatsapp, departamento: previewSelected.departamento, ciudad: previewSelected.ciudad, tipo_entrega: previewSelected.tipo_entrega,
  } : {
    name: form.name || 'TIENDA AGDIN', slug: form.slug || 'agdin-luna', tipo: form.tipo, logo: logoPreview, cover: coverPreview, whatsapp: form.whatsapp, departamento: form.departamento, ciudad: form.ciudad, tipo_entrega: form.tipo_entrega,
  }
  const previewLink = `https://tiendanica.store/${previewStore.slug}`
  const previewAdminLink = `https://tiendanica.store/${previewStore.slug}/admin`

  return (
    <main style={{background:'#F7F5F3', minHeight:'100vh', padding:16, fontFamily:'Inter, system-ui'}}>
      <style>{`
        .card{background:#fff; border:1px solid #EAE6E1; border-radius:20px; padding:18px; box-shadow:0 8px 24px rgba(0,0,0,0.04); margin-bottom:14px}
        .input{padding:12px 14px; border-radius:12px; border:1px solid #EAE6E1; width:100%; font-size:13px; background:#FBF9F7; outline:none}
        .btn-black{background:#0A0A0A; color:#fff; padding:14px; border-radius:999px; font-weight:800; width:100%; cursor:pointer; border:none}
        .btn-red{background:#fff; color:#E11D48; border:1px solid #FECDD3; padding:6px 10px; border-radius:999px; font-size:10px; font-weight:800; cursor:pointer}
        .btn-green{background:#00E676; color:#000; padding:8px 12px; border-radius:999px; font-size:10px; font-weight:800; border:none; cursor:pointer}
        .btn-blue{background:#0A0A0A; color:#fff; padding:8px 12px; border-radius:999px; font-size:10px; font-weight:800; border:none; cursor:pointer}
        .pill{padding:8px 14px; border-radius:999px; border:1px solid #EAE6E1; background:#fff; font-size:11px; font-weight:700; cursor:pointer}
        .pill.active{background:#0A0A0A; color:#fff}
        .preview-cover{height:200px; background:#E8E2DD; border-radius:16px; overflow:hidden; position:relative}
        .preview-cover img{width:100%; height:100%; object-fit:cover}
        .link-box{background:#FBF9F7; border:1px dashed #D6CFC8; border-radius:12px; padding:8px 10px; display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:8px}
        .link-text{font-size:11px; color:#0A0A0A; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px}
      `}</style>
      <div style={{maxWidth:960, margin:'0 auto'}}>
        <h1 style={{fontWeight:900, fontSize:20, color:'#0A0A0A'}}>Super Admin Privado <span style={{fontWeight:500, fontSize:12, color:'#9A9590'}}>• {stores.length} tiendas • {products.length} productos</span> {msg ? <span style={{fontSize:11, background:'#00E676', color:'#000', padding:'4px 10px', borderRadius:999, marginLeft:8}}>{msg}</span> : null}</h1>

        {/* EDITAR TIENDA EXISTENTE - APARECE ARRIBA CUANDO CLICAS EDITAR */}
        {editingStore && (
          <div className="card" style={{border:'2px solid #0A0A0A', background:'#FFFBEB'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <b style={{fontSize:13}}>✏️ Editando: {stores.find(s=>s.id===editingStore)?.name} - Agrega ubicación Nicaragua</b>
              <button onClick={()=>setEditingStore(null)} style={{background:'#fff', border:'1px solid #EAE6E1', padding:'6px 12px', borderRadius:999, fontSize:10, fontWeight:700, cursor:'pointer'}}>✕ Cancelar</button>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
              <input value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} placeholder="Nombre tienda" className="input"/>
              <select value={editForm.tipo_tienda} onChange={e=>setEditForm({...editForm, tipo_tienda:e.target.value})} className="input">
                <option value="boutique">👗 Boutique</option>
                <option value="comida">🍔 Comida</option>
                <option value="general">🛍️ General</option>
              </select>
            </div>
            <input value={editForm.whatsapp} onChange={e=>setEditForm({...editForm, whatsapp:e.target.value})} placeholder="WhatsApp" className="input" style={{marginTop:8}}/>
            <input value={editForm.description} onChange={e=>setEditForm({...editForm, description:e.target.value})} placeholder="Descripcion" className="input" style={{marginTop:8}}/>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8}}>
              <select value={editForm.departamento} onChange={e=>setEditForm({...editForm, departamento:e.target.value})} className="input">
                <option value="">Departamento</option>
                {DEPARTAMENTOS_NIC.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
              <input value={editForm.ciudad} onChange={e=>setEditForm({...editForm, ciudad:e.target.value})} placeholder="Ciudad / Municipio" className="input"/>
            </div>
            <select value={editForm.tipo_entrega} onChange={e=>setEditForm({...editForm, tipo_entrega:e.target.value})} className="input" style={{marginTop:8}}>
              <option value="nacional">📦 Envío nacional</option>
              <option value="local">🍔 Solo local - Comida</option>
              <option value="ambos">🔄 Ambos</option>
            </select>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:10}}>
              <div><div style={{fontSize:11, fontWeight:800}}>Nuevo logo (opcional)</div><input type="file" accept="image/*" onChange={e=>setEditLogoFile(e.target.files?.[0]||null)} style={{fontSize:11, width:'100%'}}/></div>
              <div><div style={{fontSize:11, fontWeight:800}}>Nueva portada (opcional)</div><input type="file" accept="image/*" onChange={e=>setEditCoverFile(e.target.files?.[0]||null)} style={{fontSize:11, width:'100%'}}/></div>
            </div>
            <button onClick={()=>guardarEdicion(editingStore)} className="btn-black" style={{marginTop:12}}>💾 Guardar cambios - Actualizar tienda</button>
            <div style={{fontSize:10, color:'#92400E', marginTop:6}}>Esto le agrega ubicación a tus tiendas existentes como Agdin Luna sin borrar productos.</div>
          </div>
        )}

        <div style={{display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:14, marginTop:14, alignItems:'start'}}>
          <div className="card">
            <b style={{fontSize:13}}>Crear nueva tienda premium + ubicación Nicaragua (opcional)</b>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
              <select value={form.tipo} onChange={e=>{setForm({...form, tipo:e.target.value}); setPreviewSelected(null)}} className="input">
                <option value="boutique">👗 Boutique</option>
                <option value="comida">🍔 Comida</option>
                <option value="general">🛍️ General</option>
              </select>
              <input value={form.slug} onChange={e=>{setForm({...form, slug:e.target.value}); setPreviewSelected(null)}} placeholder="slug ej: agdin-luna" className="input"/>
            </div>
            <input value={form.name} onChange={e=>{setForm({...form, name:e.target.value}); setPreviewSelected(null)}} placeholder="Nombre tienda" className="input" style={{marginTop:8}}/>
            <input value={form.whatsapp} onChange={e=>{setForm({...form, whatsapp:e.target.value}); setPreviewSelected(null)}} placeholder="WhatsApp 505..." className="input" style={{marginTop:8}}/>
            <input value={form.description} onChange={e=>{setForm({...form, description:e.target.value}); setPreviewSelected(null)}} placeholder="Descripcion corta" className="input" style={{marginTop:8}}/>
            <div style={{marginTop:12, background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:12, padding:10}}>
              <div style={{fontSize:11, fontWeight:800, color:'#92400E'}}>📍 Ubicación Nicaragua (opcional)</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8}}>
                <select value={form.departamento} onChange={e=>setForm({...form, departamento:e.target.value})} className="input" style={{fontSize:11}}>
                  <option value="">Departamento</option>
                  {DEPARTAMENTOS_NIC.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
                <input value={form.ciudad} onChange={e=>setForm({...form, ciudad:e.target.value})} placeholder="Ciudad / Municipio" className="input" style={{fontSize:11}}/>
              </div>
              <select value={form.tipo_entrega} onChange={e=>setForm({...form, tipo_entrega:e.target.value})} className="input" style={{fontSize:11, marginTop:8}}>
                <option value="nacional">📦 Envío nacional</option>
                <option value="local">🍔 Solo local</option>
                <option value="ambos">🔄 Ambos</option>
              </select>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12}}>
              <div><div style={{fontSize:11, fontWeight:800, marginBottom:6}}>Logo</div><input type="file" accept="image/*" onChange={e=>{setLogoFile(e.target.files?.[0]||null); setPreviewSelected(null)}} style={{fontSize:11, width:'100%'}}/>{logoPreview && !previewSelected ? <img src={logoPreview} style={{width:52, height:52, borderRadius:12, marginTop:8, objectFit:'cover'}}/> : null}</div>
              <div><div style={{fontSize:11, fontWeight:800, marginBottom:6}}>Portada</div><input type="file" accept="image/*" onChange={e=>{setCoverFile(e.target.files?.[0]||null); setPreviewSelected(null)}} style={{fontSize:11, width:'100%'}}/>{coverPreview && !previewSelected ? <img src={coverPreview} style={{width:'100%', height:52, borderRadius:12, marginTop:8, objectFit:'cover'}}/> : null}</div>
            </div>
            <button onClick={crearTienda} disabled={creating} className="btn-black" style={{marginTop:14, opacity: creating?0.6:1}}>{creating ? 'Creando...' : 'Crear tienda premium →'}</button>
            {previewSelected && <button onClick={()=>setPreviewSelected(null)} style={{marginTop:8, width:'100%', background:'#fff', border:'1px solid #EAE6E1', padding:'10px', borderRadius:999, fontSize:11, fontWeight:700, cursor:'pointer'}}>← Volver a crear nueva</button>}
          </div>
          <div style={{position:'sticky', top:14}}>
            <div style={{fontSize:11, fontWeight:800, color: isPreviewFromExisting ? '#0A0A0A' : '#9A9590', marginBottom:8}}>{isPreviewFromExisting ? `VISTA PREVIA: ${previewStore.name.toUpperCase()}` : 'VISTA PREVIA EN VIVO'}</div>
            <div className="card" style={{padding:0, overflow:'hidden', border: isPreviewFromExisting ? '2px solid #0A0A0A' : '1px solid #EAE6E1'}}>
              <div className="preview-cover">{previewStore.cover ? <img src={previewStore.cover}/> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#9A9590'}}>Sin portada</div>}<div style={{position:'absolute', top:10, left:10, background:'#fff', padding:'4px 10px', borderRadius:999, fontSize:10, fontWeight:800}}>{(previewStore.tipo||'boutique').toUpperCase()}</div>{previewStore.departamento && <div style={{position:'absolute', top:36, left:10, background:'#0A0A0A', color:'#fff', padding:'4px 10px', borderRadius:999, fontSize:9, fontWeight:800}}>📍 {previewStore.departamento} {previewStore.ciudad?`• ${previewStore.ciudad}`:''}</div>}</div>
              <div style={{padding:12}}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>{previewStore.logo ? <img src={previewStore.logo} style={{width:44, height:44, borderRadius:12, objectFit:'cover'}}/> : <div style={{width:44, height:44, borderRadius:12, background:'#0A0A0A', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900}}>A</div>}<div><b style={{fontSize:13}}>{previewStore.name}</b><div style={{fontSize:10, color:'#9A9590'}}>📍 {previewStore.departamento||'Sin depto'} {previewStore.ciudad||''} • {previewStore.tipo_entrega||'nacional'}</div></div></div>
                <div className="link-box" style={{marginTop:10}}><div className="link-text">{previewLink}</div><CopyBtn text={previewLink} label="Copiar"/></div>
                <div className="link-box"><div className="link-text">{previewAdminLink}</div><CopyBtn text={previewAdminLink} label="Copiar"/></div>
                <a href={`https://wa.me/${String(previewStore.whatsapp||'').replace(/[^0-9]/g,'')}?text=${encodeURIComponent(`Hola ${previewStore.name}! Tu tienda: ${previewLink} - Tu panel: ${previewAdminLink}`)}`} target="_blank" style={{display:'block', marginTop:10, background:'#00E676', color:'#000', padding:'10px', borderRadius:999, fontSize:11, fontWeight:800, textAlign:'center', textDecoration:'none'}}>📲 Compartir al dueño</a>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar tienda..." className="input" style={{maxWidth:180}}/>
            <select value={filterDepto} onChange={e=>setFilterDepto(e.target.value)} className="input" style={{maxWidth:160, fontSize:11}}><option value="all">Todos deptos</option>{DEPARTAMENTOS_NIC.map(d=><option key={d} value={d}>{d}</option>)}</select>
            <button onClick={()=>setFilterTipo('all')} className={`pill ${filterTipo==='all'?'active':''}`}>all</button>
            <button onClick={()=>setFilterTipo('boutique')} className={`pill ${filterTipo==='boutique'?'active':''}`}>boutique</button>
            <button onClick={()=>setFilterTipo('comida')} className={`pill ${filterTipo==='comida'?'active':''}`}>comida</button>
            <button onClick={()=>setFilterTipo('general')} className={`pill ${filterTipo==='general'?'active':''}`}>general</button>
          </div>
          <div style={{fontSize:10, color:'#9A9590', marginTop:6}}>💡 Para tus tiendas existentes como Agdin Luna, clicá Editar para ponerle Ubú Norte y Solo local sin borrar nada</div>
          <div style={{marginTop:10}}>
            {filtered.map(s=>{
              const prods = products.filter(p=>p.store_id===s.id)
              const isOpen = expandedStore===s.id
              const isSelected = previewSelected?.id===s.id
              const tiendaLink = `https://tiendanica.store/${s.slug}`
              const adminLink = `https://tiendanica.store/${s.slug}/admin`
              const hasLocation = !!(s.departamento || s.ciudad)
              return (
                <div key={s.id} style={{padding:'12px 0', borderBottom:'1px solid #F0EDE8', background: isSelected ? '#FFFBEB' : 'transparent', borderRadius: isSelected?12:0, paddingLeft: isSelected?8:0, paddingRight: isSelected?8:0}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap'}}>
                    <div style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer'}} onClick={()=>setPreviewSelected(s)}>
                      <img src={s.logo_url || s.cover_image || ''} style={{width:36, height:36, borderRadius:8, objectFit:'cover', background:'#F7F5F3', border: isSelected ? '2px solid #0A0A0A' : '1px solid #EAE6E1'}} onError={e=>e.currentTarget.style.display='none'}/>
                      <div><b style={{fontSize:12}}>{s.name} {hasLocation ? '📍' : '⚠️ sin ubicación'}</b><div style={{fontSize:10, color: hasLocation ? '#166534' : '#E11D48'}}>{s.slug} • {s.departamento||'sin depto'} {s.ciudad?`• ${s.ciudad}`:''} • {s.tipo_entrega||'nacional'} • {prods.length} prod {hasLocation ? '✅ lista para filtro' : '❌ necesita editar'}</div></div>
                    </div>
                    <div style={{display:'flex', gap:6, alignItems:'center', flexWrap:'wrap'}}>
                      <button onClick={()=>startEdit(s)} style={{background:'#FEF3C7', color:'#92400E', border:'1px solid #FDE68A', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:800, cursor:'pointer'}}>✏️ Editar ubicación</button>
                      <button onClick={()=>setPreviewSelected(s)} style={{background: isSelected ? '#0A0A0A':'#fff', color: isSelected?'#fff':'#0A0A0A', border:'1px solid #0A0A0A', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:800, cursor:'pointer'}}>{isSelected ? '✓ preview' : '👁 preview'}</button>
                      <a href={tiendaLink} target="_blank" style={{background:'#0A0A0A', color:'#fff', padding:'6px 12px', borderRadius:999, fontSize:10, fontWeight:800, textDecoration:'none'}}>ver tienda</a>
                      <button onClick={()=>setExpandedStore(isOpen?null:s.id)} style={{background:'#fff', border:'1px solid #EAE6E1', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:700, cursor:'pointer'}}>{isOpen?'cerrar':'productos'}</button>
                      <button onClick={()=>eliminarTienda(s.id, s.slug)} className="btn-red">eliminar</button>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{marginTop:12, background:'#FBF9F7', border:'1px solid #EAE6E1', borderRadius:16, padding:12}}>
                      <b style={{fontSize:11}}>Productos de {s.name}</b>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 100px 1fr', gap:8, marginTop:8}}>
                        <input value={prodForm.name} onChange={e=>setProdForm({...prodForm, name:e.target.value})} placeholder="Nombre producto" className="input" style={{fontSize:11}}/>
                        <input value={prodForm.price} onChange={e=>setProdForm({...prodForm, price:e.target.value})} placeholder="Precio C$" type="number" className="input" style={{fontSize:11}}/>
                        <input value={prodForm.categoria} onChange={e=>setProdForm({...prodForm, categoria:e.target.value})} placeholder="categoria" className="input" style={{fontSize:11}}/>
                      </div>
                      <div style={{display:'flex', gap:8, marginTop:8, alignItems:'center'}}><input type="file" accept="image/*" onChange={e=>setProdForm({...prodForm, imageFile:e.target.files?.[0]||null})} style={{fontSize:11}}/><button onClick={()=>agregarProducto(s.id, s.tipo_tienda)} className="btn-green">+ agregar</button></div>
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
