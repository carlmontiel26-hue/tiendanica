'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if(!url || !key) return null
  return createClient(url,key)
}

export default function SuperAdminMerged(){
  const [auth,setAuth]=useState(false)
  const [pass,setPass]=useState('')
  const [tab,setTab]=useState('tiendas') // tiendas | verificaciones | reportes
  const [stores,setStores]=useState([])
  const [form,setForm]=useState({name:'', slug:'', whatsapp:'', tipo_tienda:'boutique', logo_url:''})
  const [pendientes,setPendientes]=useState([])
  const [reportes,setReportes]=useState([])
  const [loading,setLoading]=useState(false)

  const login = ()=>{
    if(pass === 'tiendanica2025' || pass === 'admin123'){ // acepta las dos claves por si tu super admin tenía otra
      setAuth(true)
      cargarTodo()
    } else alert('Clave incorrecta')
  }

  const cargarTodo = async ()=>{
    setLoading(true)
    const supabase = getSupabase()
    if(!supabase){ setLoading(false); return }
    const {data: s} = await supabase.from('stores').select('*').order('created_at',{ascending:false}).limit(100)
    const {data: v} = await supabase.from('store_verifications').select('*, stores(name, whatsapp, slug)').in('status',['pendiente','revision']).order('created_at',{ascending:false}).limit(50)
    const {data: r} = await supabase.from('fraud_reports').select('*, stores(name, whatsapp)').in('status',['abierto','investigando']).order('created_at',{ascending:false}).limit(50)
    setStores(s||[])
    setPendientes(v||[])
    setReportes(r||[])
    setLoading(false)
  }

  const crearTienda = async (e)=>{
    e.preventDefault()
    const supabase = getSupabase()
    if(!supabase) return alert('Falta Supabase env')
    if(!form.name || !form.slug || !form.whatsapp) return alert('Falta nombre, slug y whatsapp')
    const {data, error} = await supabase.from('stores').insert({
      name: form.name,
      slug: form.slug.toLowerCase().replace(/ /g,'-'),
      whatsapp: form.whatsapp,
      tipo_tienda: form.tipo_tienda,
      logo_url: form.logo_url || '/tienda-nica-logo.png',
      verification_status: 'nueva',
      verification_badge: 'nueva'
    }).select()
    if(error) alert('Error: '+error.message)
    else {
      alert('Tienda creada ✓ '+form.name)
      setForm({name:'', slug:'', whatsapp:'', tipo_tienda:'boutique', logo_url:''})
      cargarTodo()
    }
  }

  const aprobar = async (id, store_id)=>{
    const supabase=getSupabase()
    await supabase.from('store_verifications').update({status:'verificada', nivel:'verificada', verificada_at:new Date().toISOString()}).eq('id',id)
    await supabase.from('stores').update({verification_status:'verificada', verification_badge:'verificada'}).eq('id',store_id)
    setPendientes(p=>p.filter(x=>x.id!==id))
    alert('Aprobada ✓ Badge azul activado')
  }
  const rechazar = async (id)=>{
    const supabase=getSupabase()
    await supabase.from('store_verifications').update({status:'rechazada'}).eq('id',id)
    setPendientes(p=>p.filter(x=>x.id!==id))
  }

  if(!auth){
    return (
      <div style={{minHeight:'100vh', background:'#111', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'Inter, system-ui'}}>
        <div style={{background:'#fff', borderRadius:20, padding:24, maxWidth:380, width:'100%'}}>
          <h2 style={{fontWeight:900}}>🛡️ Super Admin TiendaNica</h2>
          <p style={{fontSize:12, color:'#666', marginTop:6}}>Tu super admin original + antifraude. Clave: tiendanica2025 o tu clave vieja</p>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Clave admin" style={{width:'100%', border:'1.5px solid #ddd', borderRadius:12, padding:12, marginTop:14}}/>
          <button onClick={login} style={{width:'100%', marginTop:12, background:'#0066FF', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:800}}>Entrar</button>
          <p style={{fontSize:10, color:'#999', marginTop:10, textAlign:'center'}}>Si no recuerdas tu clave vieja, prueba con tiendanica2025 o admin123. Luego cámbiala en el código.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh', background:'#F5F1ED', padding:16, fontFamily:'Inter, system-ui'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:1100, margin:'0 auto'}}>
        <h1 style={{fontWeight:900, fontSize:22}}>🛡️ Super Admin TiendaNica</h1>
        <div style={{display:'flex', gap:8}}>
          <a href="/" style={{background:'#fff', border:'1px solid #ddd', padding:'8px 12px', borderRadius:999, fontSize:12, textDecoration:'none', color:'#111'}}>Ver Market</a>
          <button onClick={()=>setAuth(false)} style={{background:'#111', color:'#fff', border:'none', padding:'8px 12px', borderRadius:999, fontSize:12}}>Salir</button>
        </div>
      </div>

      <div style={{display:'flex', gap:8, marginTop:16, maxWidth:1100, marginLeft:'auto', marginRight:'auto'}}>
        <button onClick={()=>setTab('tiendas')} style={{padding:'10px 16px', borderRadius:999, border:'none', fontWeight:800, fontSize:12, background: tab==='tiendas' ? '#111' : '#fff', color: tab==='tiendas' ? '#fff' : '#111'}}>🏪 Crear Tiendas ({stores.length})</button>
        <button onClick={()=>setTab('verificaciones')} style={{padding:'10px 16px', borderRadius:999, border:'none', fontWeight:800, fontSize:12, background: tab==='verificaciones' ? '#0066FF' : '#fff', color: tab==='verificaciones' ? '#fff' : '#111'}}>🛡️ Verificaciones ({pendientes.length})</button>
        <button onClick={()=>setTab('reportes')} style={{padding:'10px 16px', borderRadius:999, border:'none', fontWeight:800, fontSize:12, background: tab==='reportes' ? '#FF3B30' : '#fff', color: tab==='reportes' ? '#fff' : '#111'}}>🚨 Reportes ({reportes.length})</button>
      </div>

      <div style={{maxWidth:1100, margin:'16px auto 0'}}>
        {tab==='tiendas' && (
          <div style={{display:'grid', gridTemplateColumns:'350px 1fr', gap:16}}>
            <div style={{background:'#fff', borderRadius:16, padding:16, border:'1px solid #EDE6E3', height:'fit-content'}}>
              <h3 style={{fontWeight:800}}>➕ Crear tienda (tu super admin original)</h3>
              <form onSubmit={crearTienda} style={{display:'flex', flexDirection:'column', gap:10, marginTop:12}}>
                <input required value={form.name} onChange={e=>setForm({...form, name:e.target.value, slug:e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-')})} placeholder="Nombre tienda Ej: Ileana Closet" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}/>
                <input required value={form.slug} onChange={e=>setForm({...form, slug:e.target.value})} placeholder="slug ej: ileana-closet" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, fontSize:12}}/>
                <input required value={form.whatsapp} onChange={e=>setForm({...form, whatsapp:e.target.value})} placeholder="WhatsApp 505..." style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}/>
                <select value={form.tipo_tienda} onChange={e=>setForm({...form, tipo_tienda:e.target.value})} style={{border:'1.5px solid #ddd', borderRadius:10, padding:10}}>
                  <option value="boutique">boutique (con tallas)</option>
                  <option value="general">general</option>
                  <option value="hogar">hogar</option>
                  <option value="otros">otros</option>
                </select>
                <input value={form.logo_url} onChange={e=>setForm({...form, logo_url:e.target.value})} placeholder="Logo URL opcional" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, fontSize:11}}/>
                <button type="submit" style={{background:'#0066FF', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:800}}>Crear tienda</button>
              </form>
              <p style={{fontSize:10, color:'#999', marginTop:10}}>Este era tu super admin para crear tiendas manualmente. Ahora lo tienes de vuelta + el antifraude.</p>
            </div>
            <div style={{background:'#fff', borderRadius:16, padding:16, border:'1px solid #EDE6E3'}}>
              <h3 style={{fontWeight:800}}>Tiendas existentes ({stores.length})</h3>
              <div style={{maxHeight:600, overflowY:'auto', marginTop:10, display:'flex', flexDirection:'column', gap:8}}>
                {stores.map(s=>(
                  <div key={s.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #f0f0f0', borderRadius:10, padding:8}}>
                    <div><b style={{fontSize:13}}>{s.name}</b><br/><span style={{fontSize:10, color:'#666'}}>{s.slug} • {s.whatsapp} • {s.verification_status || 'nueva'}</span></div>
                    <a href={`/${s.slug}`} target="_blank" style={{background:'#F0F0F0', padding:'6px 10px', borderRadius:999, fontSize:11, textDecoration:'none', color:'#111'}}>Ver</a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==='verificaciones' && (
          <div style={{background:'#fff', borderRadius:16, padding:16, border:'1px solid #EDE6E3'}}>
            <h3 style={{fontWeight:800}}>🛡️ Verificaciones pendientes ({pendientes.length})</h3>
            {loading && <p style={{fontSize:12, color:'#999'}}>Cargando...</p>}
            {pendientes.map(v=>(
              <div key={v.id} style={{border:'1px solid #eee', borderRadius:12, padding:12, marginTop:10}}>
                <b>{v.stores?.name}</b> - {v.stores?.whatsapp} - {v.stores?.slug}<br/>
                <span style={{fontSize:11, color:'#666'}}>Nombre cédula: {v.cedula_nombre} • {new Date(v.created_at).toLocaleString()}</span>
                <div style={{display:'flex', gap:6, marginTop:8, flexWrap:'wrap'}}>
                  <button onClick={()=>aprobar(v.id, v.store_id)} style={{background:'#0066FF', color:'#fff', border:'none', padding:'8px 14px', borderRadius:999, fontSize:12, fontWeight:800}}>✓ Aprobar + Badge azul</button>
                  <button onClick={()=>rechazar(v.id)} style={{background:'#F0F0F0', border:'none', padding:'8px 14px', borderRadius:999, fontSize:12}}>Rechazar</button>
                  <a href={`https://wa.me/${v.stores?.whatsapp}`} target="_blank" style={{background:'#25D366', color:'#fff', padding:'8px 14px', borderRadius:999, fontSize:12, textDecoration:'none'}}>WhatsApp</a>
                  <a href={`/${v.stores?.slug}`} target="_blank" style={{background:'#111', color:'#fff', padding:'8px 14px', borderRadius:999, fontSize:12, textDecoration:'none'}}>Ver tienda</a>
                </div>
              </div>
            ))}
            {pendientes.length===0 && !loading && <p style={{fontSize:12, color:'#999', marginTop:10}}>No hay verificaciones pendientes.</p>}
          </div>
        )}

        {tab==='reportes' && (
          <div style={{background:'#fff', borderRadius:16, padding:16, border:'1px solid #EDE6E3'}}>
            <h3 style={{fontWeight:800}}>🚨 Reportes de fraude ({reportes.length})</h3>
            {reportes.map(r=>(
              <div key={r.id} style={{border:'1px solid #FFD6D6', background:'#FFF5F5', borderRadius:12, padding:12, marginTop:10}}>
                <b>{r.stores?.name}</b> - <span style={{background:'#FF3B30', color:'#fff', padding:'2px 6px', borderRadius:999, fontSize:10}}>{r.tipo}</span>
                <p style={{fontSize:12, marginTop:6}}>{r.descripcion}</p>
                <p style={{fontSize:10, color:'#666'}}>Reportó: {r.reporter_name} - {r.reporter_whatsapp} • {new Date(r.created_at).toLocaleString()}</p>
              </div>
            ))}
            {reportes.length===0 && !loading && <p style={{fontSize:12, color:'#999', marginTop:10}}>Sin reportes. ¡Buena señal!</p>}
          </div>
        )}
      </div>
    </div>
  )
}