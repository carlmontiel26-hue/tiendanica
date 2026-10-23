'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){ 
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if(!url || !key) return null
  return createClient(url,key) 
}

export default function AdminVerificaciones(){
  const [auth,setAuth]=useState(false)
  const [pass,setPass]=useState('')
  const [pendientes,setPendientes]=useState([])
  const [reportes,setReportes]=useState([])
  const [loading,setLoading]=useState(true)

  const login = ()=>{
    if(pass === 'tiendanica2025'){ // CAMBIA ESTA CLAVE POR LA QUE QUIERAS VOS Y TU SOCIO
      setAuth(true)
      cargarDatos()
    } else {
      alert('Clave incorrecta')
    }
  }

  const cargarDatos = async ()=>{
    setLoading(true)
    const supabase = getSupabase()
    if(!supabase){
      alert('Falta configurar NEXT_PUBLIC_SUPABASE_URL en .env.local')
      setLoading(false)
      return
    }
    const {data: v} = await supabase.from('store_verifications').select('*, stores(name, whatsapp, slug)').in('status',['pendiente','revision']).order('created_at',{ascending:false}).limit(50)
    const {data: r} = await supabase.from('fraud_reports').select('*, stores(name, whatsapp)').in('status',['abierto','investigando']).order('created_at',{ascending:false}).limit(50)
    setPendientes(v||[])
    setReportes(r||[])
    setLoading(false)
  }

  useEffect(()=>{ if(auth) cargarDatos() },[auth])

  const aprobar = async (id, store_id)=>{
    const supabase=getSupabase()
    if(!supabase) return
    await supabase.from('store_verifications').update({status:'verificada', nivel:'verificada', verificada_at:new Date().toISOString(), verificada_por:'admin'}).eq('id',id)
    await supabase.from('stores').update({verification_status:'verificada', verification_badge:'verificada'}).eq('id',store_id)
    setPendientes(p=>p.filter(x=>x.id!==id))
    alert('Aprobada ✓ Badge azul activado')
  }

  const rechazar = async (id)=>{
    const supabase=getSupabase()
    if(!supabase) return
    await supabase.from('store_verifications').update({status:'rechazada'}).eq('id',id)
    setPendientes(p=>p.filter(x=>x.id!==id))
  }

  if(!auth){
    return (
      <div style={{minHeight:'100vh', background:'#111', display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
        <div style={{background:'#fff', borderRadius:20, padding:24, maxWidth:350, width:'100%'}}>
          <h2 style={{fontWeight:900}}>🛡️ Admin TiendaNica</h2>
          <p style={{fontSize:12, color:'#666', marginTop:6}}>Solo vos y tu socio. Clave por defecto: tiendanica2025 (cámbiala en el código)</p>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Clave admin" style={{width:'100%', border:'1.5px solid #ddd', borderRadius:12, padding:12, marginTop:14}}/>
          <button onClick={login} style={{width:'100%', marginTop:12, background:'#0066FF', color:'#fff', border:'none', padding:12, borderRadius:999, fontWeight:800}}>Entrar</button>
          <a href="/" style={{display:'block', marginTop:10, textAlign:'center', fontSize:12, color:'#666'}}>← Volver al Market</a>
        </div>
      </div>
    )
  }

  if(loading) return <div style={{padding:20}}>Cargando panel antifraude...</div>

  return (
    <div style={{padding:16, background:'#F5F1ED', minHeight:'100vh', fontFamily:'Inter, system-ui'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1 style={{fontWeight:900, fontSize:22}}>🛡️ Panel Antifraude</h1>
        <button onClick={()=>setAuth(false)} style={{background:'#F0F0F0', border:'none', padding:'8px 12px', borderRadius:999, fontSize:12}}>Salir</button>
      </div>
      <p style={{fontSize:12, color:'#666'}}>Solo vos y tu socio. Revisar diario. Tiendas verificadas = badge azul.</p>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16}}>
        <div style={{background:'#fff', borderRadius:16, padding:14, border:'1px solid #E8E0D9'}}>
          <h3 style={{fontWeight:800}}>📋 Verificaciones pendientes ({pendientes.length})</h3>
          {pendientes.map(v=>(
            <div key={v.id} style={{border:'1px solid #eee', borderRadius:12, padding:10, marginTop:10}}>
              <b>{v.stores?.name || 'Sin nombre'}</b> - {v.stores?.whatsapp}<br/>
              <span style={{fontSize:11, color:'#666'}}>Nombre: {v.cedula_nombre} • {new Date(v.created_at).toLocaleString()}</span>
              <div style={{display:'flex', gap:6, marginTop:8, flexWrap:'wrap'}}>
                <button onClick={()=>aprobar(v.id, v.store_id)} style={{background:'#0066FF', color:'#fff', border:'none', padding:'6px 12px', borderRadius:999, fontSize:11, fontWeight:800}}>✓ Aprobar</button>
                <button onClick={()=>rechazar(v.id)} style={{background:'#F0F0F0', border:'none', padding:'6px 12px', borderRadius:999, fontSize:11}}>Rechazar</button>
                <a href={`https://wa.me/${v.stores?.whatsapp}`} target="_blank" style={{background:'#25D366', color:'#fff', padding:'6px 12px', borderRadius:999, fontSize:11, textDecoration:'none'}}>WhatsApp</a>
              </div>
            </div>
          ))}
          {pendientes.length===0 && <p style={{fontSize:12, color:'#999', marginTop:10}}>No hay pendientes.</p>}
        </div>

        <div style={{background:'#fff', borderRadius:16, padding:14, border:'1px solid #E8E0D9'}}>
          <h3 style={{fontWeight:800}}>🚨 Reportes ({reportes.length})</h3>
          {reportes.map(r=>(
            <div key={r.id} style={{border:'1px solid #FFD6D6', background:'#FFF5F5', borderRadius:12, padding:10, marginTop:10}}>
              <b>{r.stores?.name || 'Tienda'}</b> - <span style={{background:'#FF3B30', color:'#fff', padding:'2px 6px', borderRadius:999, fontSize:10}}>{r.tipo}</span>
              <p style={{fontSize:12, marginTop:6}}>{r.descripcion}</p>
              <p style={{fontSize:10, color:'#666'}}>Reportó: {r.reporter_name} - {r.reporter_whatsapp}</p>
            </div>
          ))}
          {reportes.length===0 && <p style={{fontSize:12, color:'#999', marginTop:10}}>Sin reportes. ¡Buena señal!</p>}
        </div>
      </div>

      <div style={{background:'#111', color:'#fff', borderRadius:16, padding:14, marginTop:16}}>
        <h3 style={{fontWeight:800}}>📊 Checklist diario (5 min)</h3>
        <ol style={{fontSize:12, marginTop:8, paddingLeft:16, lineHeight:'1.8'}}>
          <li>Revisar verificaciones pendientes + videollamada 30s</li>
          <li>Verificar depósito C$250</li>
          <li>Revisar reportes - ¿mismo WhatsApp repetido?</li>
          <li>Revisar tiendas que subieron +20 productos hoy (foto robada con Google Lens)</li>
          <li>Agregar WhatsApp estafadores a blacklist</li>
        </ol>
      </div>
      <div style={{textAlign:'center', marginTop:20}}>
        <a href="/" style={{background:'#111', color:'#fff', padding:'10px 16px', borderRadius:999, textDecoration:'none', fontSize:12}}>← Volver al Market</a>
      </div>
    </div>
  )
}