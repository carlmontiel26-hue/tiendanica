'use client'
import { useState, useEffect } from 'react'
import { getSupabase } from '../../../lib/supabaseclient'
import { useParams } from 'next/navigation'

export default function AdminPage(){
  const params = useParams()
  const slug = params?.slug

  const [store,setStore]=useState(null)
  const [products,setProducts]=useState([])
  const [loading,setLoading]=useState(true)
  const [showForm,setShowForm]=useState(false)
  const [editing,setEditing]=useState(null)

  // form states
  const [name,setName]=useState('')
  const [price,setPrice]=useState('')
  const [categoria,setCategoria]=useState('vestidos')
  const [description,setDescription]=useState('')
  const [image,setImage]=useState('')
  const [saving,setSaving]=useState(false)

  useEffect(()=>{
    if(!slug) return
    loadData()
  },[slug])

  const loadData = async()=>{
    const supabase = getSupabase()
    if(!supabase){
      alert('Falta configurar Supabase en Vercel: NEXT_PUBLIC_SUPABASE_URL y ANON_KEY')
      setLoading(false)
      return
    }
    setLoading(true)
    try{
      // 1. Buscar tienda por slug
      const { data: storeData, error: storeErr } = await supabase.from('stores').select('*').eq('slug', slug).single()
      if(storeErr) throw storeErr
      setStore(storeData)

      // 2. Productos de esa tienda
      const { data: prodData, error: prodErr } = await supabase.from('products').select('*').eq('store_id', storeData.id).order('created_at',{ascending:false})
      if(prodErr) throw prodErr
      setProducts(prodData||[])
    }catch(e){
      console.error(e)
      alert('Error cargando tienda: ' + e.message)
    }finally{
      setLoading(false)
    }
  }

  const resetForm = ()=>{
    setName('')
    setPrice('')
    setCategoria('vestidos')
    setDescription('')
    setImage('')
    setEditing(null)
    setShowForm(false)
  }

  const openEdit = (product)=>{
    setEditing(product)
    setName(product.name||'')
    setPrice(product.price||'')
    setCategoria(product.categoria||'vestidos')
    setDescription(product.description||'')
    setImage(product.image_url||'')
    setShowForm(true)
  }

  const handleSave = async()=>{
    if(!name.trim() || !price) return alert('Nombre y precio obligatorios')
    if(description.length>200) return alert('Máximo 200 caracteres en descripción')
    const supabase = getSupabase()
    if(!supabase) return alert('No hay conexión a Supabase')
    if(!store) return alert('Tienda no cargada')

    setSaving(true)
    const payload = {
      store_id: store.id,
      name: name.trim(),
      price: Number(price),
      categoria,
      description: description.trim(),
      image_url: image.trim()
    }
    try{
      let res
      if(editing){
        res = await supabase.from('products').update(payload).eq('id', editing.id)
      }else{
        res = await supabase.from('products').insert(payload)
      }
      if(res.error) throw res.error
      await loadData()
      resetForm()
      alert(editing ? 'Producto actualizado!' : 'Producto agregado con descripción!')
    }catch(e){
      alert('Error guardando: ' + e.message)
    }finally{
      setSaving(false)
    }
  }

  const handleDelete = async(id)=>{
    if(!confirm('¿Borrar este producto?')) return
    const supabase = getSupabase()
    if(!supabase) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if(error) alert(error.message)
    else loadData()
  }

  if(loading){
    return <div style={{padding:40, textAlign:'center', fontFamily:'Inter'}}>Cargando tu tienda {slug}...</div>
  }

  if(!store){
    return <div style={{padding:40, textAlign:'center'}}>Tienda no encontrada: {slug}</div>
  }

  return (
    <main style={{background:'#F7F5F3', minHeight:'100vh', fontFamily:'Inter, system-ui', padding:14}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        *{box-sizing:border-box}
        .card{background:#fff; border:1px solid #EAE6E1; border-radius:16px}
      `}</style>

      <div style={{maxWidth:1100, margin:'0 auto'}}>
        {/* HEADER TIENDA - ESTA ES LA PORTADA PROPIA DEL DUEÑO, NO LA DEL MARKET */}
        <div className="card" style={{padding:16, display:'flex', gap:12, alignItems:'center', justifyContent:'space-between', marginBottom:16}}>
          <div style={{display:'flex', gap:12, alignItems:'center'}}>
            <img src={store.logo_url||store.cover_image||'/tienda-nica-logo.png'} style={{width:48,height:48, borderRadius:12, objectFit:'cover', border:'1px solid #EAE6E1'}}/>
            <div>
              <b style={{fontSize:16}}>{store.name}</b>
              <div style={{fontSize:11, color:'#9A9590'}}>{slug} • {products.length} productos • {store.whatsapp}</div>
            </div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <a href={`/${slug}`} target="_blank" style={{background:'#fff', border:'1px solid #EAE6E1', padding:'10px 14px', borderRadius:999, fontSize:12, fontWeight:700, textDecoration:'none', color:'#0A0A0A'}}>Ver mi tienda →</a>
            <button onClick={()=>{resetForm(); setShowForm(true)}} style={{background:'#0A0A0A', color:'#fff', border:'none', padding:'10px 16px', borderRadius:999, fontSize:12, fontWeight:900, cursor:'pointer'}}>+ Agregar producto</button>
          </div>
        </div>

        {/* FORMULARIO COMPLETO CON DESCRIPCION */}
        {showForm && (
          <div className="card" style={{padding:18, marginBottom:16, border:'2px solid #0A0A0A'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
              <h3 style={{fontWeight:900, fontSize:14}}>{editing ? 'Editar producto' : 'Nuevo producto con descripción corta'}</h3>
              <button onClick={resetForm} style={{width:28,height:28, borderRadius:999, border:'1px solid #EAE6E1', background:'#fff', cursor:'pointer'}}>✕</button>
            </div>

            <label style={{fontSize:11, fontWeight:700}}>Nombre *</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Vestido Rojo Floral Talla M" style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4, marginBottom:12, fontSize:13}}/>

            <label style={{fontSize:11, fontWeight:700}}>Descripción corta <span style={{fontWeight:400, color:'#9A9590'}}>(máx 200, se ve en tu tienda y en el market)</span></label>
            <textarea value={description} onChange={e=>setDescription(e.target.value.slice(0,200))} placeholder="Ej: Tela lino fresca, talla M queda a L, disponible en rojo y azul. Envío hoy a todo Nicaragua." style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4, marginBottom:4, fontSize:13, minHeight:78, resize:'none'}}/>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:14}}>
              <span style={{fontSize:10, color: description.length>180 ? '#ff5555' : '#9A9590'}}>{description.length}/200 caracteres</span>
              <span style={{fontSize:10, color:'#9A9590'}}>Tip: entre 60-90 caracteres vende más</span>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12}}>
              <div>
                <label style={{fontSize:11, fontWeight:700}}>Precio C$ *</label>
                <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="350" style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4, fontSize:13}}/>
              </div>
              <div>
                <label style={{fontSize:11, fontWeight:700}}>Categoría</label>
                <select value={categoria} onChange={e=>setCategoria(e.target.value)} style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4, fontSize:13}}>
                  <option value="vestidos">vestidos</option>
                  <option value="blusas">blusas</option>
                  <option value="jeans">jeans</option>
                  <option value="faldas">faldas</option>
                  <option value="conjuntos">conjuntos</option>
                  <option value="shorts">shorts</option>
                  <option value="accesorios">accesorios</option>
                  <option value="zapatos">zapatos</option>
                  <option value="carteras">carteras</option>
                  <option value="hogar">hogar</option>
                  <option value="tecnologia">tecnologia</option>
                  <option value="belleza">belleza</option>
                  <option value="otros">otros</option>
                  <option value="oferta">oferta</option>
                  <option value="nuevo">nuevo</option>
                </select>
              </div>
            </div>

            <label style={{fontSize:11, fontWeight:700}}>Imagen URL (link de la foto)</label>
            <input value={image} onChange={e=>setImage(e.target.value)} placeholder="https://..." style={{width:'100%', padding:'11px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4, marginBottom:16, fontSize:13}}/>

            {image && <img src={image} style={{width:'100%', maxHeight:200, objectFit:'cover', borderRadius:12, marginBottom:12, border:'1px solid #EAE6E1'}}/>}

            <button onClick={handleSave} disabled={saving} style={{width:'100%', background:'#0A0A0A', color:'#fff', border:'none', padding:'13px', borderRadius:999, fontWeight:900, cursor:'pointer', fontSize:13}}>
              {saving ? 'Guardando...' : editing ? 'Actualizar con descripción' : 'Guardar producto con descripción'}
            </button>

            {description && (
              <div style={{marginTop:12, background:'#FBF9F7', border:'1px dashed #EAE6E1', borderRadius:12, padding:10}}>
                <span style={{fontSize:10, fontWeight:700, color:'#9A9590'}}>Así se verá en el market:</span>
                <p style={{fontSize:12, fontWeight:700, marginTop:4}}>{name||'Tu producto'}</p>
                <p style={{fontSize:11, color:'#555', marginTop:2, lineHeight:1.4}}>{description}</p>
              </div>
            )}
          </div>
        )}

        {/* LISTA DE PRODUCTOS */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12}}>
          {products.map(p=>(
            <div key={p.id} className="card" style={{padding:10, overflow:'hidden'}}>
              <img src={p.image_url} style={{width:'100%', aspectRatio:'1/1', objectFit:'cover', borderRadius:12, background:'#F7F5F3'}}/>
              <div style={{padding:'8px 4px'}}>
                <b style={{fontSize:13, lineHeight:1.2}}>{p.name}</b>
                {p.description ? <p style={{fontSize:11, color:'#555', marginTop:4, lineHeight:1.3, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{p.description}</p> : <p style={{fontSize:10, color:'#BBB', marginTop:4}}>Sin descripción</p>}
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8}}>
                  <b style={{fontSize:13}}>C$ {p.price}</b>
                  <span style={{fontSize:10, background:'#F7F5F3', padding:'3px 8px', borderRadius:999}}>{p.categoria}</span>
                </div>
                <div style={{display:'flex', gap:6, marginTop:10}}>
                  <button onClick={()=>openEdit(p)} style={{flex:1, background:'#fff', border:'1px solid #EAE6E1', padding:'8px', borderRadius:999, fontSize:11, fontWeight:700, cursor:'pointer'}}>Editar</button>
                  <button onClick={()=>handleDelete(p.id)} style={{flex:1, background:'#fff', border:'1px solid #FFE0E0', color:'#ff5555', padding:'8px', borderRadius:999, fontSize:11, fontWeight:700, cursor:'pointer'}}>Borrar</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length===0 && !showForm && (
          <div className="card" style={{padding:30, textAlign:'center', marginTop:20}}>
            <p style={{fontSize:14, fontWeight:700}}>Aún no tienes productos</p>
            <p style={{fontSize:12, color:'#9A9590', marginTop:6}}>Agrega tu primer producto con descripción corta y aparecerá en tu tienda y en el market nacional</p>
            <button onClick={()=>setShowForm(true)} style={{marginTop:14, background:'#0A0A0A', color:'#fff', border:'none', padding:'10px 18px', borderRadius:999, fontWeight:900, cursor:'pointer'}}>+ Agregar primer producto</button>
          </div>
        )}
      </div>
    </main>
  )
}
