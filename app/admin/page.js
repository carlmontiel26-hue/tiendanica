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

  // crear tienda
  const [newStore,setNewStore]=useState({ name:'', slug:'', whatsapp:'', description:'', tipo_tienda:'boutique', cover_image:'' })

  // producto
  const [formProd,setFormProd]=useState({ name:'', price:'', image_url:'', categoria:'', tallas:'', orden:'', extra_images:'' })
  const [editId,setEditId]=useState(null)

  const categoriasBoutique = ['Conjunto','Pantalón','Vestido','Falda','Blusa','Short','Enterizo','Otro']

  useEffect(()=>{ cargarTiendas() },[])
  useEffect(()=>{ if(selStore) { cargarProductos(); cargarVisitas() } },[selStore, filtroVisita])

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
    // requiere tabla visitas - ver SQL abajo
    try{
      let fromDate = new Date()
      if(filtroVisita==='hoy') fromDate.setHours(0,0,0,0)
      if(filtroVisita==='7dias') fromDate.setDate(fromDate.getDate()-7)
      if(filtroVisita==='30dias') fromDate.setDate(fromDate.getDate()-30)
      const { data } = await supabase.from('visitas').select('*').eq('store_id', selStore.id).gte('created_at', fromDate.toISOString()).order('created_at',{ascending:false}).limit(100)
      setVisitas(data||[])
    }catch(e){ setVisitas([]) }
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
    if(editId){
      const { error } = await supabase.from('products').update(payload).eq('id', editId)
      err = error
    }else{
      const { error } = await supabase.from('products').insert([payload])
      err = error
    }
    if(err) alert(err.message)
    else { setFormProd({ name:'', price:'', image_url:'', categoria:'', tallas:'', orden:'', extra_images:'' }); setEditId(null); cargarProductos() }
  }

  const editarProd = (p)=>{
    setEditId(p.id)
    setFormProd({
      name: p.name||'',
      price: p.price||'',
      image_url: p.image_url||'',
      categoria: p.categoria||'',
      tallas: (p.tallas||[]).join(', '),
      orden: p.orden||'',
      extra_images: (p.extra_images||[]).join(', ')
    })
    window.scrollTo({ top: 600, behavior: 'smooth' })
  }

  const borrarProd = async(id)=>{
    if(!confirm('¿Borrar producto?')) return
    await supabase.from('products').delete().eq('id', id)
    cargarProductos()
  }

  const moverOrden = async(p, dir)=>{
    const idx = prods.findIndex(x=>x.id===p.id)
    if(idx===-1) return
    const newIdx = dir==='up' ? idx-1 : idx+1
    if(newIdx<0 || newIdx>=prods.length) return
    const other = prods[newIdx]
    // swap orden
    const ordenA = p.orden ?? idx
    const ordenB = other.orden ?? newIdx
    await supabase.from('products').update({ orden: ordenB }).eq('id', p.id)
    await supabase.from('products').update({ orden: ordenA }).eq('id', other.id)
    cargarProductos()
  }

  const visitasHoy = visitas.filter(v=> new Date(v.created_at).toDateString() === new Date().toDateString()).length

  if(loading) return <div style={{padding:40}}>Cargando super admin...</div>

  return (
    <main style={{minHeight:'100vh', background:'#0f0f0f', color:'#fff', padding:16}}>
      <h1 style={{fontWeight:900, fontSize:22}}>Super Admin - TiendaNica.Store</h1>
      <p style={{opacity:0.6, fontSize:12, marginTop:4}}>Tienes {stores.length} tiendas activas • Todo lo anterior sigue funcionando</p>

      {/* CREAR TIENDA - lo que solo tiene super admin */}
      <div style={{background:'#1a1a1a', borderRadius:16, padding:16, marginTop:16}}>
        <h3 style={{fontWeight:800}}>➕ Crear nueva tienda (solo super admin)</h3>
        <form onSubmit={crearTienda} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
          <input placeholder="Nombre: UBU NORTE" value={newStore.name} onChange={e=>setNewStore({...newStore, name:e.target.value})} style={inp}/>
          <input placeholder="Slug: ubu-norte" value={newStore.slug} onChange={e=>setNewStore({...newStore, slug:e.target.value})} style={inp}/>
          <input placeholder="WhatsApp: 50575190074" value={newStore.whatsapp} onChange={e=>setNewStore({...newStore, whatsapp:e.target.value})} style={inp}/>
          <select value={newStore.tipo_tienda} onChange={e=>setNewStore({...newStore, tipo_tienda:e.target.value})} style={inp}>
            <option value="boutique">Boutique</option>
            <option value="comida">Comida</option>
            <option value="generica">Genérica</option>
          </select>
          <input placeholder="Portada URL (https://...)" value={newStore.cover_image} onChange={e=>setNewStore({...newStore, cover_image:e.target.value})} style={{...inp, gridColumn:'1 / span 2'}}/>
          <textarea placeholder="Descripción corta" value={newStore.description} onChange={e=>setNewStore({...newStore, description:e.target.value})} style={{...inp, gridColumn:'1 / span 2'}}/>
          <button type="submit" style={{gridColumn:'1 / span 2', background:'#00E676', color:'#000', padding:12, borderRadius:999, fontWeight:900, border:'none'}}>Crear tienda</button>
        </form>
      </div>

      {/* SELECTOR TIENDAS + ACTIVIDAD */}
      <div style={{display:'flex', gap:12, marginTop:20, flexWrap:'wrap'}}>
        <div style={{flex:1, minWidth:300, background:'#1a1a1a', borderRadius:16, padding:12}}>
          <h4 style={{fontWeight:800}}>📋 Tus tiendas</h4>
          <div style={{marginTop:10, display:'flex', flexDirection:'column', gap:6, maxHeight:400, overflow:'auto'}}>
            {stores.map(s=>{
              const isSel = selStore?.id===s.id
              return (
                <button key={s.id} onClick={()=>setSelStore(s)} style={{textAlign:'left', background:isSel?'#fff':'#2a2a2a', color:isSel?'#000':'#fff', padding:10, borderRadius:10, border:'none'}}>
                  <b>{s.name}</b> <span style={{fontSize:10, opacity:0.7}}>{s.slug}</span><br/>
                  <span style={{fontSize:10}}>{s.tipo_tienda} • {s.whatsapp}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div style={{flex:1, minWidth:300, background:'#1a1a1a', borderRadius:16, padding:12}}>
          <h4 style={{fontWeight:800}}>📊 Actividad - {selStore?.name}</h4>
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <button onClick={()=>setFiltroVisita('hoy')} style={filtroBtn(filtroVisita==='hoy')}>Hoy</button>
            <button onClick={()=>setFiltroVisita('7dias')} style={filtroBtn(filtroVisita==='7dias')}>7 días</button>
            <button onClick={()=>setFiltroVisita('30dias')} style={filtroBtn(filtroVisita==='30dias')}>30 días</button>
          </div>
          <div style={{marginTop:12, background:'#000', borderRadius:12, padding:12}}>
            <div style={{fontSize:28, fontWeight:900}}>{filtroVisita==='hoy'? visitasHoy : visitas.length}</div>
            <div style={{fontSize:11, opacity:0.6}}>visitas {filtroVisita}</div>
            <div style={{fontSize:10, marginTop:8, opacity:0.5}}>Última actividad: {visitas[0]? new Date(visitas[0].created_at).toLocaleString() : 'sin datos'}</div>
            {visitas.length<5 && visitas.length>0 && <div style={{marginTop:8, background:'#ff9800', color:'#000', padding:6, borderRadius:8, fontSize:11, fontWeight:700}}>⚠️ Pocas visitas - necesita apoyo</div>}
            {visitas.length===0 && <div style={{marginTop:8, fontSize:11, opacity:0.6}}>Aún no hay tabla visitas. Ejecuta SQL abajo.</div>}
          </div>
          <a href={`https://tiendanica.store/${selStore?.slug}`} target="_blank" style={{display:'block', marginTop:10, background:'#fff', color:'#000', textAlign:'center', padding:10, borderRadius:999, fontWeight:800, textDecoration:'none'}}>👁️ Vista previa tienda</a>
        </div>
      </div>

      {/* PRODUCTOS - con categorias boutique */}
      {selStore && (
        <div style={{background:'#1a1a1a', borderRadius:16, padding:16, marginTop:16}}>
          <h3 style={{fontWeight:800}}>🛍️ Productos de {selStore.name} ({prods.length}) - con categorías boutique</h3>
          
          <form onSubmit={guardarProducto} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12, background:'#000', padding:12, borderRadius:12}}>
            <input placeholder="Nombre producto" value={formProd.name} onChange={e=>setFormProd({...formProd, name:e.target.value})} style={inp} required/>
            <input placeholder="Precio C$" value={formProd.price} onChange={e=>setFormProd({...formProd, price:e.target.value})} style={inp} required/>
            <input placeholder="Imagen principal URL" value={formProd.image_url} onChange={e=>setFormProd({...formProd, image_url:e.target.value})} style={{...inp, gridColumn:'1 / span 2'}} required/>
            <input placeholder="Imágenes extra separadas por coma" value={formProd.extra_images} onChange={e=>setFormProd({...formProd, extra_images:e.target.value})} style={{...inp, gridColumn:'1 / span 2'}}/>
            
            {/* CATEGORIAS - NUEVO */}
            <select value={formProd.categoria} onChange={e=>setFormProd({...formProd, categoria:e.target.value})} style={inp}>
              <option value="">Sin categoría</option>
              {categoriasBoutique.map(c=><option key={c} value={c.toLowerCase()}>{c}</option>)}
              <option value="plato">Plato (comida)</option>
              <option value="bebida">Bebida</option>
            </select>
            <input placeholder="Tallas: 28,30,32 o S,M,L" value={formProd.tallas} onChange={e=>setFormProd({...formProd, tallas:e.target.value})} style={inp}/>
            <input placeholder="Orden: 1,2,3 (menor primero)" value={formProd.orden} onChange={e=>setFormProd({...formProd, orden:e.target.value})} style={inp}/>
            <div style={{gridColumn:'1 / span 2', display:'flex', gap:8}}>
              <button type="submit" style={{flex:1, background:editId?'#fff':'#00E676', color:'#000', padding:12, borderRadius:999, fontWeight:900, border:'none'}}>{editId? 'Actualizar producto' : 'Agregar producto con categoría'}</button>
              {editId && <button type="button" onClick={()=>{setEditId(null); setFormProd({ name:'', price:'', image_url:'', categoria:'', tallas:'', orden:'', extra_images:'' })}} style={{background:'#333', color:'#fff', padding:12, borderRadius:999, border:'none'}}>Cancelar</button>}
            </div>
          </form>

          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:10, marginTop:16}}>
            {prods.map((p, i)=>(
              <div key={p.id} style={{background:'#2a2a2a', borderRadius:12, overflow:'hidden'}}>
                <img src={p.image_url} style={{width:'100%', aspectRatio:'1/1', objectFit:'cover'}}/>
                <div style={{padding:8}}>
                  <div style={{fontSize:11, fontWeight:700}}>{p.name}</div>
                  <div style={{fontSize:10, opacity:0.6, textTransform:'capitalize'}}>{p.categoria || 'sin categoria'} {p.tallas? `• Tallas ${p.tallas.join(',')}`:''}</div>
                  <div style={{fontSize:12, fontWeight:900, marginTop:4}}>C$ {p.price} • Orden {p.orden ?? i}</div>
                  <div style={{display:'flex', gap:4, marginTop:6, flexWrap:'wrap'}}>
                    <button onClick={()=>moverOrden(p,'up')} style={miniBtn}>↑</button>
                    <button onClick={()=>moverOrden(p,'down')} style={miniBtn}>↓</button>
                    <button onClick={()=>editarProd(p)} style={miniBtn}>Editar</button>
                    <button onClick={()=>borrarProd(p.id)} style={{...miniBtn, background:'#ff4444', color:'#fff'}}>Borrar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SQL PARA VISITAS */}
      <div style={{background:'#1a1a1a', borderRadius:16, padding:16, marginTop:16, border:'1px dashed #444'}}>
        <h4 style={{fontWeight:800}}>🔧 SQL para activar visitas (ejecuta 1 vez en Supabase SQL Editor)</h4>
        <pre style={{background:'#000', padding:10, borderRadius:8, fontSize:10, overflow:'auto', marginTop:8, whiteSpace:'pre-wrap'}}>{`
-- Tabla visitas para super admin
create table if not exists visitas (
  id uuid default gen_random_uuid() primary key,
  store_id uuid references stores(id) on delete cascade,
  created_at timestamp default now()
);
-- Para que tienda sume visita (añade esto en app/[slug]/page.js cliente)
-- useEffect(()=>{ supabase.from('visitas').insert([{ store_id: store.id }]) },[store])
-- Opcional: RLS
alter table visitas enable row level security;
create policy "public insert visitas" on visitas for insert with check (true);
create policy "public read visitas" on visitas for select using (true);
        `}</pre>
      </div>
    </main>
  )
}

const inp = { background:'#2a2a2a', border:'1px solid #333', padding:10, borderRadius:8, color:'#fff', fontSize:12 }
const miniBtn = { background:'#fff', color:'#000', border:'none', padding:'4px 8px', borderRadius:6, fontSize:10, fontWeight:700 }
const filtroBtn = (active)=>({ background: active?'#00E676':'#2a2a2a', color: active?'#000':'#fff', border:'none', padding:'6px 12px', borderRadius:999, fontSize:11, fontWeight:700 })
