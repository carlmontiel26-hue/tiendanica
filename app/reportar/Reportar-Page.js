'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){ return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) }

export default function ReportarPage(){
  const [form,setForm]=useState({ tienda:'', tipo:'no_entrega', desc:'', whatsapp:'', nombre:'' })
  const [enviado,setEnviado]=useState(false)

  const submit = async (e)=>{
    e.preventDefault()
    const supabase=getSupabase()
    await supabase.from('fraud_reports').insert({
      store_id: null, // en prod buscas por nombre
      reporter_name: form.nombre,
      reporter_whatsapp: form.whatsapp,
      tipo: form.tipo,
      descripcion: `[${form.tienda}] ${form.desc}`,
      status: 'abierto'
    })
    setEnviado(true)
  }

  return (
    <main style={{minHeight:'100vh', background:'#F5F1ED', fontFamily:'Inter, system-ui'}}>
      <style>{`.cinta{ background: linear-gradient(90deg, #FF8A00 0%, #FF3B30 50%, #2962FF 100%); color:#fff; padding:14px; text-align:center; font-weight:800; font-size:12px; } .card{ background:#fff; border-radius:20px; padding:24px; border:1px solid #EDE6DF; max-width:700px; margin:20px auto; }`}</style>
      <div className="cinta">🚨 Reporte Antifraude • TiendaNica.store</div>
      <div className="card">
        {enviado ? (
          <div style={{textAlign:'center', padding:20}}>
            <div style={{fontSize:40}}>🛡️</div>
            <h2 style={{fontWeight:900, marginTop:10}}>Reporte recibido</h2>
            <p style={{fontSize:13, color:'#666', marginTop:8}}>Gracias por ayudar a mantener TiendaNica sin estafas. Investigamos en 24-48h. Si es fraude comprobado, suspendemos la tienda y agregamos su WhatsApp a blacklist interna. Te contactamos por WhatsApp.</p>
            <p style={{fontSize:11, color:'#999', marginTop:12}}>Proyecto de Carlos Montiel y socio - Comprometidos con un market limpio para Nicaragua.</p>
            <a href="/" style={{display:'block', marginTop:16, background:'#111', color:'#fff', padding:12, borderRadius:999, textDecoration:'none', fontWeight:800}}>Volver al Market</a>
          </div>
        ) : (
          <>
            <h1 style={{fontWeight:900, fontSize:22}}>Reportar tienda / fraude</h1>
            <p style={{fontSize:13, color:'#666', marginTop:6}}>¿Te estafaron? ¿Foto robada? ¿No te entregaron? Reporta aquí. 100% anónimo para la tienda. Solo lo ven los fundadores.</p>
            
            <form onSubmit={submit} style={{marginTop:16, display:'flex', flexDirection:'column', gap:12}}>
              <div>
                <label style={{fontSize:12, fontWeight:700}}>Nombre de la tienda en TiendaNica</label>
                <input required value={form.tienda} onChange={e=>setForm({...form, tienda:e.target.value})} placeholder="Ej: Ileana Closet" style={{width:'100%', border:'1.5px solid #EDE6E3', borderRadius:12, padding:12, marginTop:6}}/>
              </div>
              <div>
                <label style={{fontSize:12, fontWeight:700}}>Tipo de fraude</label>
                <select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})} style={{width:'100%', border:'1.5px solid #EDE6E3', borderRadius:12, padding:12, marginTop:6}}>
                  <option value="no_entrega">No entregó después de pagar</option>
                  <option value="producto_falso">Producto falso / distinto a foto</option>
                  <option value="foto_robada">Usa fotos robadas de otra tienda</option>
                  <option value="no_responde">Cobró y no responde WhatsApp</option>
                  <option value="precio_falso">Precio falso para aparecer primero</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:12, fontWeight:700}}>Describe qué pasó + sube captura WhatsApp (describe)</label>
                <textarea required value={form.desc} onChange={e=>setForm({...form, desc:e.target.value})} placeholder="Ej: Pagué C$800 el 20/05 por transferencia y no me responde desde hace 3 días. Tengo captura..." style={{width:'100%', border:'1.5px solid #EDE6E3', borderRadius:12, padding:12, marginTop:6, minHeight:90}}/>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <div>
                  <label style={{fontSize:12, fontWeight:700}}>Tu nombre</label>
                  <input required value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} placeholder="Tu nombre" style={{width:'100%', border:'1.5px solid #EDE6E3', borderRadius:12, padding:12, marginTop:6}}/>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700}}>Tu WhatsApp</label>
                  <input required value={form.whatsapp} onChange={e=>setForm({...form, whatsapp:e.target.value})} placeholder="505..." style={{width:'100%', border:'1.5px solid #EDE6E3', borderRadius:12, padding:12, marginTop:6}}/>
                </div>
              </div>
              <div style={{background:'#FFF5F5', border:'1px solid #FED7D7', borderRadius:12, padding:10, fontSize:11, color:'#822727'}}>
                ⚠️ Reportes falsos para dañar competencia también son sancionados y van a blacklist. Solo reporta si es real con pruebas.
              </div>
              <button type="submit" style={{background:'#FF3B30', color:'#fff', border:'none', padding:14, borderRadius:999, fontWeight:900}}>Enviar reporte antifraude 🚨</button>
            </form>
            <p style={{fontSize:10, color:'#999', textAlign:'center', marginTop:12}}>Investigamos en 24-48h • Si es comprobado, tienda suspendida + WhatsApp baneado • Proyecto de Carlos y socio</p>
            <a href="/" style={{display:'block', marginTop:12, textAlign:'center', background:'#F0F0F0', color:'#111', padding:12, borderRadius:999, textDecoration:'none', fontWeight:800}}>← Volver al Market</a>
          </>
        )}
      </div>
    </main>
  )
}
