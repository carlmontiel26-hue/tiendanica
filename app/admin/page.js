'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function SuperAdmin(){
  const [stores,setStores]=useState([])
  const [selStore,setSelStore]=useState(null)
  const [prods,setProds]=useState([])
  const [loading,setLoading]=useState(true)
  const [uploadingCover,setUploadingCover]=useState(false)
  const [uploadingEditCover,setUploadingEditCover]=useState(false)
  const [uploadingProd,setUploadingProd]=useState(false)
  const [copied,setCopied]=useState(false)

  const [newStore,setNewStore]=useState({ name:'', slug:'', whatsapp:'', description:'', tipo_tienda:'boutique', cover_image:'' })
  const [formProd,setFormProd]=useState({ name:'', price:'', image_url:'', categoria:'', tallas:'', orden:'', extra_images:'' })
  const [editId,setEditId]=useState(null)

  const categoriasBoutique = ['Conjunto','Pantalón','Vestido','Falda','Blusa','Short','Enterizo','Hombres','Camisas','Niños','Eskimos','Otro','Plato','Bebida']

  useEffect(()=>{ cargarTiendas() },[])
  useEffect(()=>{ if(selStore) cargarProductos() },[selStore])

  const cargarTiendas = async()=>{
    setLoading(true)
    const { data } = await supabase.from('stores').select('*').order('created_at',{ascending:false})
    setStores(data||[])
    if(data && data[0] && !selStore) setSelStore(data[0])
    setLoading(false)
  }
  const cargarProductos = async()=>{
    if(!selStore) return
    let { data } = await supabase.from('products').select('*').eq('store_id', selStore.id).order('created_at',{ascending:false})
    try{ data = (data||[]).sort((a,b)=> (a.orden??9999) - (b.orden??9999)) }catch{}
    setProds(data||[])
  }

  const subirPortadaNueva = async(e)=>{
    const file = e.target.files?.[0]; if(!file) return
    setUploadingCover(true)
    try{
      const fileName = `cover-${Date.now()}-${file.name.replace(/\s+/g,'-')}`
      let bucket = 'covers'
      let up = await supabase.storage.from(bucket).upload(fileName, file)
      if(up.error){ bucket='product-images'; up = await supabase.storage.from(bucket).upload(fileName, file) }
      if(up.error) throw up.error
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
      setNewStore({...newStore, cover_image: data.publicUrl})
    }catch(err){ alert('Error portada: '+err.message) }
    finally{ setUploadingCover(false) }
  }
  const subirPortadaEditar = async(e, storeId)=>{
    const file = e.target.files?.[0]; if(!file) return
    setUploadingEditCover(true)
    try{
      const fileName = `cover-edit-${Date.now()}-${file.name.replace(/\s+/g,'-')}`
      let bucket = 'covers'
      let up = await supabase.storage.from(bucket).upload(fileName, file)
      if(up.error){ bucket='product-images'; up = await supabase.storage.from(bucket).upload(fileName, file) }
      if(up.error) throw up.error
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
      const { error } = await supabase.from('stores').update({ cover_image: data.publicUrl }).eq('id', storeId)
      if(error) throw error
      alert('Portada actualizada ✅')
      cargarTiendas()
      setSelStore({...selStore, cover_image: data.publicUrl})
    }catch(err){ alert('Error: '+err.message) }
    finally{ setUploadingEditCover(false) }
  }
  const subirImagenProducto = async(e)=>{
    const file = e.target.files?.[0]; if(!file) return
    setUploadingProd(true)
    try{
      const fileName = `prod-${Date.now()}-${file.name.replace(/\s+/g,'-')}`
      let bucket = 'product-images'
      let up = await supabase.storage.from(bucket).upload(fileName, file)
      if(up.error){ bucket='covers'; up = await supabase.storage.from(bucket).upload(fileName, file) }
      if(up.error) throw up.error
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
      setFormProd({...formProd, image_url: data.publicUrl})
    }catch(err){ alert('Error subiendo imagen: '+err.message) }
    finally{ setUploadingProd(false) }
  }

  const crearTienda = async(e)=>{
    e.preventDefault()
    if(!newStore.name || !newStore.slug) return alert('Nombre y slug obligatorios')
    const payload = { name: newStore.name, slug: newStore.slug.toLowerCase().replace(/\s+/g,'-'), whatsapp: newStore.whatsapp, description: newStore.description, tipo_tienda: newStore.tipo_tienda, cover_image: newStore.cover_image || null }
    const { error } = await supabase.from('stores').insert([payload])
    if(error) alert(error.message)
    else { setNewStore({ name:'', slug:'', whatsapp:'', description:'', tipo_tienda:'boutique', cover_image:'' }); cargarTiendas() }
  }
  const borrarTienda = async(id, name)=>{
    if(!confirm(`¿Borrar tienda ${name}?`)) return
    await supabase.from('products').delete().eq('store_id', id)
    const { error } = await supabase.from('stores').delete().eq('id', id)
    if(error) alert(error.message)
    else { setSelStore(null); cargarTiendas() }
  }
  const guardarProducto = async(e)=>{
    e.preventDefault()
    if(!selStore) return
    if(!formProd.image_url) return alert('Sube una imagen o pega URL')
    const tallasArr = formProd.tallas ? formProd.tallas.split(',').map(t=>t.trim()).filter(Boolean) : []
    const extrasArr = formProd.extra_images ? formProd.extra_images.split(',').map(u=>u.trim()).filter(Boolean) : []
    let payload = { store_id: selStore.id, name: formProd.name, price: parseFloat(formProd.price), image_url: formProd.image_url, is_active: true }
    if(formProd.categoria) payload.categoria = formProd.categoria.toLowerCase()
    if(tallasArr.length) payload.tallas = tallasArr
    if(extrasArr.length) payload.extra_images = extrasArr
    if(formProd.orden) payload.orden = parseInt(formProd.orden)
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

  const copiarLink = async(url)=>{
    try{ await navigator.clipboard.writeText(url); setCopied(true); setTimeout(()=>setCopied(false),2000) }catch{ prompt('Copia este link:', url) }
  }

  if(loading) return <div style={{padding:40}}>Cargando super admin...</div>

  const tiendaUrl = selStore ? `https://tiendanica.store/${selStore.slug}` : ''
  const qrUrl = selStore ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(tiendaUrl)}` : ''

  return (
    <main style={{minHeight:'100vh', background:'#0f0f0f', color:'#fff', padding:16}}>
      <h1 style={{fontWeight:900, fontSize:22}}>Super Admin - TiendaNica.Store</h1>
      <p style={{opacity:0.6, fontSize:11}}>Con categorías Hombres, Camisas, Niños + link y QR</p>

      <div style={{background:'#1a1a1a', borderRadius:16, padding:16, marginTop:16}}>
        <h3 style={{fontWeight:800}}>➕ Crear nueva tienda</h3>
        <form onSubmit={crearTienda} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
          <input placeholder="Nombre" value={newStore.name} onChange={e=>setNewStore({...newStore, name:e.target.value})} style={inp}/>
          <input placeholder="Slug" value={newStore.slug} onChange={e=>setNewStore({...newStore, slug:e.target.value})} style={inp}/>
          <input placeholder="WhatsApp" value={newStore.whatsapp} onChange={e=>setNewStore({...newStore, whatsapp:e.target.value})} style={inp}/>
          <select value={newStore.tipo_tienda} onChange={e=>setNewStore({...newStore, tipo_tienda:e.target.value})} style={inp}>
            <option value="boutique">Boutique</option><option value="comida">Comida</option><option value="generica">Genérica</option><option value="electro">Electro</option>
          </select>
          <div style={{gridColumn:'1 / span 2', background:'#000', padding:12, borderRadius:10}}>
            <label style={{fontSize:11, fontWeight:700}}>Portada con foto</label>
            <input type="file" accept="image/*" onChange={subirPortadaNueva} style={{...inp, marginTop:6, width:'100%'}}/>
            {uploadingCover && <div style={{fontSize:11, marginTop:6}}>Subiendo...</div>}
            {newStore.cover_image && <img src={newStore.cover_image} style={{width:'100%', maxHeight:180, objectFit:'cover', borderRadius:8, marginTop:8}}/>}
          </div>
          <textarea placeholder="Descripción corta" value={newStore.description} onChange={e=>setNewStore({...newStore, description:e.target.value})} style={{...inp, gridColumn:'1 / span 2'}}/>
          <button type="submit" style={{gridColumn:'1 / span 2', background:'#00E676', color:'#000', padding:12, borderRadius:999, fontWeight:900, border:'none'}}>Crear tienda</button>
        </form>
      </div>

      <div style={{display:'flex', gap:12, marginTop:20, flexWrap:'wrap'}}>
        <div style={{flex:1, minWidth:320, background:'#1a1a1a', borderRadius:16, padding:12}}>
          <h4 style={{fontWeight:800}}>📋 Tus tiendas ({stores.length})</h4>
          <div style={{marginTop:10, display:'flex', flexDirection:'column', gap:8, maxHeight:600, overflow:'auto'}}>
            {stores.map(s=>{
              const isSel = selStore?.id===s.id
              return (
                <div key={s.id} style={{background:isSel?'#fff':'#2a2a2a', color:isSel?'#000':'#fff', padding:10, borderRadius:10}}>
                  <button onClick={()=>setSelStore(s)} style={{background:'transparent', border:'none', textAlign:'left', color:isSel?'#000':'#fff', width:'100%'}}>
                    <b>{s.name}</b> <span style={{fontSize:10, opacity:0.7}}>{s.slug}</span><br/><span style={{fontSize:10}}>{s.tipo_tienda} • {s.whatsapp}</span>
                  </button>
                  <div style={{display:'flex', gap:6, marginTop:8, flexWrap:'wrap'}}>
                    <label style={{...miniBtn, background:isSel?'#000':'#fff', color:isSel?'#fff':'#000', cursor:'pointer'}}>Cambiar portada<input type="file" accept="image/*" style={{display:'none'}} onChange={(e)=>subirPortadaEditar(e, s.id)}/></label>
                    <button onClick={()=>borrarTienda(s.id, s.name)} style={{...miniBtn, background:'#ff4444', color:'#fff'}}>🗑️ Eliminar</button>
                    <a href={`https://tiendanica.store/${s.slug}`} target="_blank" style={{...miniBtn, textDecoration:'none', background:'#00E676', color:'#000'}}>Abrir</a>
                  </div>
                  {s.cover_image && <img src={s.cover_image} style={{width:'100%', height:80, objectFit:'cover', borderRadius:6, marginTop:6}}/>}
                </div>
              )
            })}
          </div>
        </div>

        {/* AQUI ESTA TU ESPACIO CON LINK Y QR - SIN TOCAR NADA MAS */}
        <div style={{flex:1, minWidth:320, background:'#1a1a1a', borderRadius:16, padding:12}}>
          <h4 style={{fontWeight:800}}>🛍️ {selStore?.name||'Selecciona tienda'} ({prods.length})</h4>
          {selStore && (
            <>
              <div style={{marginTop:12, background:'#000', borderRadius:12, padding:12, border:'1px solid #333'}}>
                <div style={{fontSize:11, fontWeight:800, opacity:0.7, marginBottom:8}}>🔗 LINK DE LA TIENDA</div>
                <div style={{background:'#1a1a1a', padding:8, borderRadius:8, fontSize:12, wordBreak:'break-all', border:'1px solid #333'}}>{tiendaUrl}</div>
                <div style={{display:'flex', gap:6, marginTop:8}}>
                  <button onClick={()=>copiarLink(tiendaUrl)} style={{flex:1, background: copied? '#00E676':'#fff', color:'#000', border:'none', padding:'8px 12px', borderRadius:999, fontSize:11, fontWeight:800}}>{copied? '¡Copiado! ✅' : '📋 Copiar link'}</button>
                  <a href={tiendaUrl} target="_blank" style={{flex:1, background:'#00E676', color:'#000', textAlign:'center', padding:'8px 12px', borderRadius:999, fontSize:11, fontWeight:800, textDecoration:'none'}}>👁️ Abrir tienda</a>
                </div>
                <a href={`https://wa.me/?text=${encodeURIComponent(`Mira mi tienda ${selStore.name} ${tiendaUrl}`)}`} target="_blank" style={{display:'block', marginTop:6, background:'#25D366', color:'#000', textAlign:'center', padding:'8px 12px', borderRadius:999, fontSize:11, fontWeight:800, textDecoration:'none'}}>📲 Compartir por WhatsApp</a>
              </div>

              <div style={{marginTop:12, background:'#fff', borderRadius:12, padding:12, textAlign:'center'}}>
                <div style={{fontSize:11, fontWeight:800, color:'#000', marginBottom:8}}>📱 CÓDIGO QR</div>
                <img src={qrUrl} alt="QR" style={{width:180, height:180, borderRadius:8}}/>
                <div style={{fontSize:10, color:'#000', opacity:0.6, marginTop:6}}>{selStore.slug}</div>
                <div style={{display:'flex', gap:6, marginTop:10}}>
                  <a href={qrUrl} download={`qr-${selStore.slug}.png`} target="_blank" style={{flex:1, background:'#000', color:'#fff', padding:'8px 12px', borderRadius:999, fontSize:11, fontWeight:800, textDecoration:'none', textAlign:'center'}}>⬇️ Descargar QR</a>
                  <button onClick={()=>window.print()} style={{flex:1, background:'#eee', color:'#000', border:'none', padding:'8px 12px', borderRadius:999, fontSize:11, fontWeight:800}}>🖨️ Imprimir</button>
                </div>
              </div>

              <div style={{marginTop:10, background:'#000', padding:8, borderRadius:8, fontSize:11, opacity:0.6}}>ID: {selStore.id.slice(0,8)}... • Productos: {prods.length}</div>
            </>
          )}
          {!selStore && <div style={{opacity:0.5, fontSize:12, marginTop:20, textAlign:'center'}}>Selecciona una tienda a la izquierda para ver su link y QR</div>}
        </div>
      </div>

      {selStore && (
        <div style={{background:'#1a1a1a', borderRadius:16, padding:16, marginTop:16}}>
          <h3 style={{fontWeight:800}}>Productos de {selStore.name}</h3>
          <form onSubmit={guardarProducto} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12, background:'#000', padding:12, borderRadius:12}}>
            <input placeholder="Nombre" value={formProd.name} onChange={e=>setFormProd({...formProd, name:e.target.value})} style={inp} required/>
            <input placeholder="Precio C$" value={formProd.price} onChange={e=>setFormProd({...formProd, price:e.target.value})} style={inp} required/>
            <div style={{gridColumn:'1 / span 2', background:'#1a1a1a', padding:10, borderRadius:10}}>
              <label style={{fontSize:11, fontWeight:700}}>Imagen principal - desde local o URL</label>
              <input type="file" accept="image/*" onChange={subirImagenProducto} style={{...inp, marginTop:6, width:'100%'}}/>
              {uploadingProd && <div style={{fontSize:11, marginTop:6}}>Subiendo...</div>}
              <input placeholder="O pega URL" value={formProd.image_url} onChange={e=>setFormProd({...formProd, image_url:e.target.value})} style={{...inp, marginTop:8, width:'100%'}} required/>
              {formProd.image_url && <img src={formProd.image_url} style={{width:'100%', maxHeight:180, objectFit:'cover', borderRadius:8, marginTop:8}}/>}
            </div>
            <select value={formProd.categoria} onChange={e=>setFormProd({...formProd, categoria:e.target.value})} style={inp}>
              <option value="">Sin categoría</option>
              {categoriasBoutique.map(c=><option key={c} value={c.toLowerCase()}>{c}</option>)}
            </select>
            <input placeholder="Tallas: 28,30 o S,M,L" value={formProd.tallas} onChange={e=>setFormProd({...formProd, tallas:e.target.value})} style={inp}/>
            <input placeholder="Orden 1,2,3" value={formProd.orden} onChange={e=>setFormProd({...formProd, orden:e.target.value})} style={inp}/>
            <input placeholder="Extras por coma (opc)" value={formProd.extra_images} onChange={e=>setFormProd({...formProd, extra_images:e.target.value})} style={inp}/>
            <div style={{gridColumn:'1 / span 2', display:'flex', gap:8, marginTop:4}}>
              <button type="submit" style={{flex:1, background:editId?'#fff':'#00E676', color:'#000', padding:12, borderRadius:999, fontWeight:900, border:'none'}}>{editId? 'Actualizar':'Agregar'}</button>
              {editId && <button type="button" onClick={()=>{setEditId(null); setFormProd({ name:'', price:'', image_url:'', categoria:'', tallas:'', orden:'', extra_images:'' })}} style={{background:'#333', color:'#fff', padding:12, borderRadius:999, border:'none'}}>Cancelar</button>}
            </div>
          </form>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px,1fr))', gap:10, marginTop:16}}>
            {prods.map(p=>(
              <div key={p.id} style={{background:'#2a2a2a', borderRadius:12, overflow:'hidden', border: editId===p.id? '2px solid #00E676':'1px solid #333'}}>
                <img src={p.image_url} style={{width:'100%', aspectRatio:'1/1', objectFit:'cover'}}/>
                <div style={{padding:8}}>
                  <div style={{fontSize:11, fontWeight:700}}>{p.name}</div>
                  <div style={{fontSize:10, opacity:0.6, textTransform:'capitalize'}}>{p.categoria||'sin cat'}</div>
                  <div style={{fontSize:12, fontWeight:900}}>C$ {p.price}</div>
                  <div style={{display:'flex', gap:4, marginTop:6}}>
                    <button onClick={()=>editarProd(p)} style={{...miniBtn, background:'#fff'}}>Editar</button>
                    <button onClick={async()=>{ if(confirm('¿Borrar?')){ await supabase.from('products').delete().eq('id', p.id); cargarProductos() }}} style={{...miniBtn, background:'#ff4444', color:'#fff'}}>Borrar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
const inp = { background:'#2a2a2a', border:'1px solid #333', padding:10, borderRadius:8, color:'#fff', fontSize:12 }
const miniBtn = { background:'#fff', color:'#000', border:'none', padding:'4px 8px', borderRadius:6, fontSize:10, fontWeight:700 }
