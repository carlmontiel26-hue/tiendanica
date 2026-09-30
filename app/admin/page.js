'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function SuperAdmin(){
  const [stores,setStores]=useState([])
  const [selStore,setSelStore]=useState(null)
  const [prods,setProds]=useState([])
  const [visitas,setVisitas]=useState([])
  const [filtroVisita,setFiltroVisita]=useState('hoy')
  const [loading,setLoading]=useState(true)
  const [uploadingCover,setUploadingCover]=useState(false)

  const [newStore,setNewStore]=useState({ name:'', slug:'', whatsapp:'', description:'', tipo_tienda:'boutique', cover_image:'' })
  const [formProd,setFormProd]=useState({ name:'', price:'', image_url:'', categoria:'', tallas:'', orden:'', extra_images:'' })
  const [editId,setEditId]=useState(null)
  const categoriasBoutique = ['Conjunto','Pantalón','Vestido','Falda','Blusa','Short','Enterizo','Otro']

  useEffect(()=>{ cargarTiendas() },[])
  useEffect(()=>{ if(selStore){ cargarProductos(); cargarVisitas() } },[selStore, filtroVisita])

  const cargarTiendas = async()=>{
    setLoading(true)
    const { data } = await supabase.from('stores').select('*').order('created_at',{ascending:false})
    setStores(data||[])
    if(data && data[0] && !selStore) setSelStore(data[0])
    setLoading(false)
  }
  const cargarProductos = async()=>{
    const { data } = await supabase.from('products').select('*').eq('store_id', selStore.id).order('orden',{ascending:true, nullsFirst:false}).order('created_at',{ascending:false})
    setProds(data||[])
  }
  const cargarVisitas = async()=>{
    try{
      let fromDate = new Date()
      if(filtroVisita==='hoy') fromDate.setHours(0,0,0,0)
      if(filtroVisita==='7dias') fromDate.setDate(fromDate.getDate()-7)
      if(filtroVisita==='30dias') fromDate.setDate(fromDate.getDate()-30)
      const { data } = await supabase.from('visitas').select('*').eq('store_id', selStore.id).gte('created_at', fromDate.toISOString()).order('created_at',{ascending:false}).limit(200)
      setVisitas(data||[])
    }catch(e){ setVisitas([]) }
  }

  // SUBIR PORTADA COMO FOTO (como antes)
  const subirPortada = async(e)=>{
    const file = e.target.files?.[0]
    if(!file) return
    setUploadingCover(true)
    try{
      const fileName = `cover-${Date.now()}-${file.name.replace(/\s+/g,'-')}`
      // intenta bucket covers, si no product-images, si no store-images
      let bucket = 'covers'
      let up = await supabase.storage.from(bucket).upload(fileName, file)
      if(up.error){
        bucket = 'product-images'
        up = await supabase.storage.from(bucket).upload(fileName, file)
      }
      if(up.error){
        bucket = 'store-images'
        up = await supabase.storage.from(bucket).upload(fileName, file)
      }
      if(up.error) throw up.error
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
      setNewStore({...newStore, cover_image: data.publicUrl})
      alert('Portada subida ✅')
    }catch(err){
      alert('Error subiendo portada: '+err.message+' - verifica que exista bucket covers/product-images en Supabase Storage')
    }finally{ setUploadingCover(false) }
  }

  const crearTienda = async(e)=>{
    e.preventDefault()
    if(!newStore.name || !newStore.slug) return alert('Nombre y slug')
    const { error } = await supabase.from('stores').insert([{
      name: newStore.name,
      slug: newStore.slug.toLowerCase().replace(/\s+/g,'-'),
      whatsapp: newStore.whatsapp,
      description: newStore.description,
      tipo_tienda: newStore.tipo_tienda,
      cover_image: newStore.cover_image || null,
      image_url: newStore.cover_image || null
    }])
    if(error) alert(error.message)
    else { setNewStore({ name:'', slug:'', whatsapp:'', description:'', tipo_tienda:'boutique', cover_image:'' }); cargarTiendas() }
  }

  const guardarProducto = async(e)=>{
    e.preventDefault()
    if(!selStore) return
    const tallasArr = formProd.tallas ? formProd.tallas.split(',').map(t=>t.trim()).filter(Boolean) : []
    const extrasArr = formProd.extra_images ? formProd.extra_images.split(',').map(u=>u.trim()).filter(Boolean) : []
    const payload = {
      store_id: selStore.id,
      name: formProd.name,
      price: parseFloat(formProd.price),
      image_url: formProd.image_url,
      categoria: formProd.categoria || null,
      tallas: tallasArr.length? tallasArr : null,
      orden: formProd.orden ? parseInt(formProd.orden) : null,
      extra_images: extrasArr.length? extrasArr : null,
      is_active: true
    }
    let err
    if(editId){ const { error } = await supabase.from('products').update(payload).eq('id', editId); err=error }
    else { const { error } = await supabase.from('products').insert([payload]); err=error }
    if(err) alert(err.message)
    else { setFormProd({ name:'', price:'', image_url:'', categoria:'', tallas:'', orden:'', extra_images:'' }); setEditId(null); cargarProductos() }
  }
  const editarProd = (p)=>{
    setEditId(p.id)
    setFormProd({ name: p.name||'', price: p.price||'', image_url: p.image_url||'', categoria: p.categoria||'', tallas: (p.tallas||[]).join(', '), orden: p.orden||'', extra_images: (p.extra_images||[]).join(', ') })
    window.scrollTo({ top: 600, behavior: 'smooth' })
  }
  const borrarProd = async(id)=>{ if(!confirm('¿Borrar?')) return; await supabase.from('products').delete().eq('id', id); cargarProductos() }
  const moverOrden = async(p, dir)=>{
    const idx = prods.findIndex(x=>x.id===p.id); if(idx===-1) return
    const newIdx = dir==='up' ? idx-1 : idx+1; if(newIdx<0 || newIdx>=prods.length) return
    const other = prods[newIdx]; const ordenA = p.orden ?? idx; const ordenB = other.orden ?? newIdx
    await supabase.from('products').update({ orden: ordenB }).eq('id', p.id)
    await supabase.from('products').update({ orden: ordenA }).eq('id', other.id)
    cargarProductos()
  }

  const visitasHoy = visitas.filter(v=> new Date(v.created_at).toDateString() === new Date().toDateString()).length

  if(loading) return <div style={{padding:40}}>Cargando super admin...</div>

  return (
    <main style={{minHeight:'100vh', background:'#0f0f0f', color:'#fff', padding:16}}>
      <h1 style={{fontWeight:900, fontSize:22}}>Super Admin - TiendaNica.Store</h1>
      <p style={{opacity:0.6, fontSize:12}}>Tienes {stores.length} tiendas • Con categorías boutique + portada con foto + visitas</p>

      <div style={{background:'#1a1a1a', borderRadius:16, padding:16, marginTop:16}}>
        <h3 style={{fontWeight:800}}>➕ Crear nueva tienda</h3>
        <form onSubmit={crearTienda} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
          <input placeholder="Nombre: UBU NORTE" value={newStore.name} onChange={e=>setNewStore({...newStore, name:e.target.value})} style={inp}/>
          <input placeholder="Slug: ubu-norte" value={newStore.slug} onChange={e=>setNewStore({...newStore, slug:e.target.value})} style={inp}/>
          <input placeholder="WhatsApp" value={newStore.whatsapp} onChange={e=>setNewStore({...newStore, whatsapp:e.target.value})} style={inp}/>
          <select value={newStore.tipo_tienda} onChange={e=>setNewStore({...newStore, tipo_tienda:e.target.value})} style={inp}>
            <option value="boutique">Boutique</option><option value="comida">Comida</option><option value="generica">Genérica</option>
          </select>
          <div style={{gridColumn:'1 / span 2', background:'#000', padding:12, borderRadius:10}}>
            <label style={{fontSize:11, fontWeight:700}}>Portada de tienda (como antes - con foto)</label>
            <input type="file" accept="image/*" onChange={subirPortada} style={{...inp, marginTop:6, width:'100%'}}/>
            {uploadingCover && <div style={{fontSize:11, marginTop:6}}>Subiendo...</div>}
            {newStore.cover_image && <><img src={newStore.cover_image} style={{width:'100%', maxHeight:180, objectFit:'cover', borderRadius:8, marginTop:8}}/><div style={{fontSize:10, opacity:0.5, marginTop:4, wordBreak:'break-all'}}>{newStore.cover_image}</div></>}
          </div>
          <textarea placeholder="Descripción corta" value={newStore.description} onChange={e=>setNewStore({...newStore, description:e.target.value})} style={{...inp, gridColumn:'1 / span 2'}}/>
          <button type="submit" style={{gridColumn:'1 / span 2', background:'#00E676', color:'#000', padding:12, borderRadius:999, fontWeight:900, border:'none'}}>Crear tienda</button>
        </form>
      </div>

      <div style={{display:'flex', gap:12, marginTop:20, flexWrap:'wrap'}}>
        <div style={{flex:1, minWidth:300, background:'#1a1a1a', borderRadius:16, padding:12}}>
          <h4 style={{fontWeight:800}}>📋 Tus tiendas</h4>
          <div style={{marginTop:10, display:'flex', flexDirection:'column', gap:6, maxHeight:400, overflow:'auto'}}>
            {stores.map(s=><button key={s.id} onClick={()=>setSelStore(s)} style={{textAlign:'left', background:selStore?.id===s.id?'#fff':'#2a2a2a', color:selStore?.id===s.id?'#000':'#fff', padding:10, borderRadius:10, border:'none'}}><b>{s.name}</b> <span style={{fontSize:10}}>{s.slug}</span><br/><span style={{fontSize:10}}>{s.tipo_tienda}</span></button>)}
          </div>
        </div>
        <div style={{flex:1, minWidth:300, background:'#1a1a1a', borderRadius:16, padding:12}}>
          <h4 style={{fontWeight:800}}>📊 Actividad - {selStore?.name}</h4>
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <button onClick={()=>setFiltroVisita('hoy')} style={filtroBtn(filtroVisita==='hoy')}>Hoy ({visitasHoy})</button>
            <button onClick={()=>setFiltroVisita('7dias')} style={filtroBtn(filtroVisita==='7dias')}>7d ({filtroVisita==='7dias'?visitas.length:'..'})</button>
            <button onClick={()=>setFiltroVisita('30dias')} style={filtroBtn(filtroVisita==='30dias')}>30d</button>
          </div>
          <div style={{marginTop:12, background:'#000', borderRadius:12, padding:12}}>
            <div style={{fontSize:28, fontWeight:900}}>{filtroVisita==='hoy'? visitasHoy : visitas.length}</div>
            <div style={{fontSize:11, opacity:0.6}}>visitas {filtroVisita}</div>
            <div style={{fontSize:10, marginTop:8, opacity:0.5}}>Última: {visitas[0]? new Date(visitas[0].created_at).toLocaleString() : 'aún no'}</div>
            {visitas.length===0 && <div style={{marginTop:8, fontSize:11, background:'#333', padding:6, borderRadius:6}}>Abre la tienda de nuevo ahora que la tabla ya tiene permisos - antes no guardaba.</div>}
            {visitas.length>0 && visitas.length<5 && <div style={{marginTop:8, background:'#ff9800', color:'#000', padding:6, borderRadius:8, fontSize:11, fontWeight:700}}>⚠️ Pocas visitas - apóyala compartiendo</div>}
          </div>
          <div style={{marginTop:8, fontSize:10, opacity:0.4}}>Debug: Tabla visitas tiene {visitas.length} filas para este filtro. Si sigue en 0, revisa en Supabase Table Editor {'>'} visitas si hay filas.</div>
          <a href={`https://tiendanica.store/${selStore?.slug}`} target="_blank" style={{display:'block', marginTop:10, background:'#fff', color:'#000', textAlign:'center', padding:10, borderRadius:999, fontWeight:800, textDecoration:'none'}}>👁️ Abrir tienda (suma visita)</a>
        </div>
      </div>

      {selStore && (
        <div style={{background:'#1a1a1a', borderRadius:16, padding:16, marginTop:16}}>
          <h3 style={{fontWeight:800}}>🛍️ Productos de {selStore.name} ({prods.length})</h3>
          <form onSubmit={guardarProducto} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12, background:'#000', padding:12, borderRadius:12}}>
            <input placeholder="Nombre" value={formProd.name} onChange={e=>setFormProd({...formProd, name:e.target.value})} style={inp} required/>
            <input placeholder="Precio" value={formProd.price} onChange={e=>setFormProd({...formProd, price:e.target.value})} style={inp} required/>
            <input placeholder="Imagen URL (o pega url de storage)" value={formProd.image_url} onChange={e=>setFormProd({...formProd, image_url:e.target.value})} style={{...inp, gridColumn:'1 / span 2'}} required/>
            <input placeholder="Imágenes extra por coma" value={formProd.extra_images} onChange={e=>setFormProd({...formProd, extra_images:e.target.value})} style={{...inp, gridColumn:'1 / span 2'}}/>
            <select value={formProd.categoria} onChange={e=>setFormProd({...formProd, categoria:e.target.value})} style={inp}><option value="">Sin categoría</option>{categoriasBoutique.map(c=><option key={c} value={c.toLowerCase()}>{c}</option>)}<option value="plato">Plato</option><option value="bebida">Bebida</option></select>
            <input placeholder="Tallas: 28,30 o S,M,L" value={formProd.tallas} onChange={e=>setFormProd({...formProd, tallas:e.target.value})} style={inp}/>
            <input placeholder="Orden: 1,2,3" value={formProd.orden} onChange={e=>setFormProd({...formProd, orden:e.target.value})} style={inp}/>
            <div style={{gridColumn:'1 / span 2', display:'flex', gap:8}}>
              <button type="submit" style={{flex:1, background:editId?'#fff':'#00E676', color:'#000', padding:12, borderRadius:999, fontWeight:900, border:'none'}}>{editId? 'Actualizar':'Agregar con categoría'}</button>
              {editId && <button type="button" onClick={()=>{setEditId(null); setFormProd({ name:'', price:'', image_url:'', categoria:'', tallas:'', orden:'', extra_images:'' })}} style={{background:'#333', color:'#fff', padding:12, borderRadius:999, border:'none'}}>Cancelar</button>}
            </div>
          </form>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:10, marginTop:16}}>
            {prods.map((p,i)=><div key={p.id} style={{background:'#2a2a2a', borderRadius:12, overflow:'hidden'}}><img src={p.image_url} style={{width:'100%', aspectRatio:'1/1', objectFit:'cover'}}/><div style={{padding:8}}><div style={{fontSize:11, fontWeight:700}}>{p.name}</div><div style={{fontSize:10, opacity:0.6}}>{p.categoria||'sin cat'} {p.tallas?`• ${p.tallas.join(',')}`:''}</div><div style={{fontSize:12, fontWeight:900}}>C$ {p.price} • Ord {p.orden??i}</div><div style={{display:'flex', gap:4, marginTop:6}}><button onClick={()=>{ const idx=prods.findIndex(x=>x.id===p.id); if(idx>0){ const other=prods[idx-1]; supabase.from('products').update({orden:other.orden??idx-1}).eq('id',p.id).then(()=>supabase.from('products').update({orden:p.orden??idx}).eq('id',other.id).then(()=>cargarProductos()))}}} style={miniBtn}>↑</button><button onClick={()=>{ const idx=prods.findIndex(x=>x.id===p.id); if(idx<prods.length-1){ const other=prods[idx+1]; supabase.from('products').update({orden:other.orden??idx+1}).eq('id',p.id).then(()=>supabase.from('products').update({orden:p.orden??idx}).eq('id',other.id).then(()=>cargarProductos()))}}} style={miniBtn}>↓</button><button onClick={()=>editarProd(p)} style={miniBtn}>Editar</button><button onClick={()=>borrarProd(p.id)} style={{...miniBtn, background:'#ff4444', color:'#fff'}}>Borrar</button></div></div></div>)}
          </div>
        </div>
      )}
    </main>
  )
}
const inp = { background:'#2a2a2a', border:'1px solid #333', padding:10, borderRadius:8, color:'#fff', fontSize:12 }
const miniBtn = { background:'#fff', color:'#000', border:'none', padding:'4px 8px', borderRadius:6, fontSize:10, fontWeight:700 }
const filtroBtn = (active)=>({ background: active?'#00E676':'#2a2a2a', color: active?'#000':'#fff', border:'none', padding:'6px 12px', borderRadius:999, fontSize:11, fontWeight:700 })
