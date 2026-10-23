'use client'
import { useState } from 'react'

export default function ReportarPage(){
  const [form,setForm]=useState({ tienda:'', tipo:'no_entrega', desc:'', whatsapp:'', nombre:'' })
  const [enviado,setEnviado]=useState(false)

  const submit = (e)=>{
    e.preventDefault()
    // En vez de depender de Supabase que te da cargando, lo mandamos directo a tu WhatsApp
    const msg = `🚨 REPORTE ANTIFRAUDE TIENDANICA\n\nTienda: ${form.tienda}\nTipo: ${form.tipo}\nDesc: ${form.desc}\nReporta: ${form.nombre} - ${form.whatsapp}`
    window.open(`https://wa.me/50581732620?text=${encodeURIComponent(msg)}`,'_blank')
    setEnviado(true)
  }

  return (
    <main style={{minHeight:'100vh', background:'#F5F1ED', fontFamily:'Inter, system-ui'}}>
      <div style={{background:'linear-gradient(90deg, #FF8A00 0%, #FF3B30 50%, #2962FF 100%)', color:'#fff', padding:'14px', textAlign:'center', fontWeight:800, fontSize:12}}>🚨 Reporte Antifraude • TiendaNica.store</div>
      <div style={{background:'#fff', borderRadius:20, padding:24, border:'1px solid #EDE6DF', maxWidth:700, margin:'20px auto'}}>
        {enviado ? (
          <div style={{textAlign:'center', padding:20}}>
            <div style={{fontSize:40}}>🛡️</div>
            <h2 style={{fontWeight:900, marginTop:10}}>Reporte enviado a fundadores</h2>
            <p style={{fontSize:13, color:'#666', marginTop:8}}>Gracias por mantener TiendaNica sin estafas. Te abrimos WhatsApp con tu reporte. Investigamos en 24-48h.</p>
            <a href="/" style={{display:'block', marginTop:16, background:'#111', color:'#fff', padding:12, borderRadius:999, textDecoration:'none', fontWeight:800}}>Volver al Market</a>
          </div>
        ) : (
          <>
            <h1 style={{fontWeight:900, fontSize:22}}>Reportar tienda / fraude</h1>
            <p style={{fontSize:13, color:'#666', marginTop:6}}>100% anónimo para la tienda. Solo lo ven Carlos y su socio. No depende de base de datos, va directo a WhatsApp 50581732620.</p>
            <form onSubmit={submit} style={{marginTop:16, display:'flex', flexDirection:'column', gap:12}}>
              <input required value={form.tienda} onChange={e=>setForm({...form, tienda:e.target.value})} placeholder="Nombre tienda en TiendaNica" style={{border:'1.5px solid #EDE6E3', borderRadius:12, padding:12}}/>
              <select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})} style={{border:'1.5px solid #EDE6E3', borderRadius:12, padding:12}}>
                <option value="no_entrega">No entregó después de pagar</option>
                <option value="producto_falso">Producto falso / distinto a foto</option>
                <option value="foto_robada">Usa fotos robadas</option>
                <option value="no_responde">Cobró y no responde</option>
                <option value="precio_falso">Precio falso</option>
                <option value="otro">Otro</option>
              </select>
              <textarea required value={form.desc} onChange={e=>setForm({...form, desc:e.target.value})} placeholder="Describe qué pasó con pruebas..." style={{border:'1.5px solid #EDE6E3', borderRadius:12, padding:12, minHeight:90}}/>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <input required value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} placeholder="Tu nombre" style={{border:'1.5px solid #EDE6E3', borderRadius:12, padding:12}}/>
                <input required value={form.whatsapp} onChange={e=>setForm({...form, whatsapp:e.target.value})} placeholder="Tu WhatsApp 505..." style={{border:'1.5px solid #EDE6E3', borderRadius:12, padding:12}}/>
              </div>
              <button type="submit" style={{background:'#FF3B30', color:'#fff', border:'none', padding:14, borderRadius:999, fontWeight:900}}>Enviar reporte a fundadores 🚨</button>
            </form>
            <a href="/" style={{display:'block', marginTop:12, textAlign:'center', background:'#F0F0F0', color:'#111', padding:12, borderRadius:999, textDecoration:'none', fontWeight:800}}>← Volver</a>
          </>
        )}
      </div>
    </main>
  )
}
