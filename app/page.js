'use client'
import { useState } from 'react'

export default function PublicHome(){
  const [tipo,setTipo]=useState('boutique')
  const waNumber='50576478028' // Cambia por tu WhatsApp de ventas

  const solicitar=(t)=>{
    const msg=`Hola TiendaNica! Quiero solicitar una tienda tipo ${t}. Mi negocio es: `
    window.open(`https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(msg)}`,'_blank')
  }

  return (
    <main style={{minHeight:'100vh', background:'#0A0A0A', color:'#fff'}}>
      <div style={{maxWidth:1100, margin:'0 auto', padding:20}}>
        <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0'}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:40,height:40,background:'#fff',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',color:'#000',fontWeight:900}}>TN</div>
            <div><h1 style={{fontWeight:900, fontSize:18}}>Tienda<span style={{color:'#00E676'}}>Nica</span>.Store</h1><p style={{fontSize:10, opacity:0.5}}>Plataforma premium Nicaragua</p></div>
          </div>
          <a href={`https://wa.me/${waNumber}`} target="_blank" style={{background:'#00E676', color:'#000', padding:'10px 16px', borderRadius:999, textDecoration:'none', fontWeight:800, fontSize:12}}>Solicitar tienda</a>
        </header>

        <section style={{marginTop:30, textAlign:'center'}}>
          <h2 style={{fontSize:36, fontWeight:900, lineHeight:1.1}}>Tu tienda online<br/>vende por <span style={{color:'#00E676'}}>WhatsApp</span><br/>en 24h</h2>
          <p style={{marginTop:12, opacity:0.7, fontSize:14, maxWidth:500, margin:'12px auto'}}>Boutique, restaurante o ferretería. Con portada editable, logo del dueño, fotos locales, carrito y cobro por WhatsApp. Sin comisiones.</p>
          <div style={{marginTop:20, display:'flex', gap:10, justifyContent:'center'}}>
            <button onClick={()=>solicitar(tipo)} style={{background:'#fff', color:'#000', padding:'14px 24px', borderRadius:999, fontWeight:900, border:'none'}}>Solicitar mi tienda ahora</button>
            <a href="#tipos" style={{border:'1px solid #333', color:'#fff', padding:'14px 24px', borderRadius:999, textDecoration:'none', fontWeight:700}}>Ver tipos</a>
          </div>
        </section>

        <section id="tipos" style={{marginTop:40, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:14}}>
          {[
            {id:'boutique', icon:'👗', title:'Boutique Premium', desc:'Moda, tallas S/M/L/XL, categorias vestidos/blusas/jeans, 4 fotos por producto, buscador', color:'#F6F3F0', text:'#000'},
            {id:'comida', icon:'🍔', title:'Comida & Restaurante', desc:'Menú por categorias platos/bebidas/extras, precio C$, foto grande, pedido rápido', color:'#FF6B00', text:'#fff'},
            {id:'general', icon:'🛠️', title:'General & Ferreteria', desc:'SKU, stock, categorias herramientas/hogar, lista utilitaria para pulperias', color:'#0066FF', text:'#fff'},
          ].map(t=>(
            <div key={t.id} style={{background: t.id==='boutique'?'#fff':'#1A1A1A', borderRadius:20, padding:16, border: tipo===t.id?'2px solid #00E676':'1px solid #222'}}>
              <div style={{width:44,height:44,borderRadius:12,background:t.color,color:t.text,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{t.icon}</div>
              <h3 style={{marginTop:10, fontWeight:900, color: t.id==='boutique'?'#000':'#fff'}}>{t.title}</h3>
              <p style={{fontSize:12, opacity:0.7, marginTop:6, color: t.id==='boutique'?'#000':'#aaa'}}>{t.desc}</p>
              <button onClick={()=>{setTipo(t.id); solicitar(t.id)}} style={{marginTop:12, width:'100%', background:'#000', color:'#fff', padding:'10px', borderRadius:999, fontWeight:700, border:'none'}}>Solicitar {t.id}</button>
            </div>
          ))}
        </section>

        <section style={{marginTop:40, background:'#fff', color:'#000', borderRadius:24, padding:20}}>
          <h3 style={{fontWeight:900}}>¿Cómo funciona?</h3>
          <div style={{marginTop:12, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:12, fontSize:12}}>
            <div><b>1. Solicitas</b><br/>Nos escribes por WhatsApp con tu tipo de tienda</div>
            <div><b>2. Creamos</b><br/>En super admin creamos tu slug, logo y portada en 5 min</div>
            <div><b>3. Te pasamos tu admin privado</b><br/>Link tipo tiendanica.store/tu-negocio/admin + clave = tu WhatsApp. Subes fotos locales ilimitadas</div>
            <div><b>4. Vendes</b><br/>Tus clientes añaden al carrito y te compran por WhatsApp. Sin admin visible para ellos</div>
          </div>
        </section>

        <div style={{marginTop:30, textAlign:'center', paddingBottom:30}}>
          <p style={{fontSize:11, opacity:0.4}}>© 2025 TiendaNica.Store • Plataforma premium • Hecho en Nicaragua • Powered by TiendaNica</p>
          <div style={{marginTop:8, opacity:0.2, fontSize:10}}>Super admin privado en /admin • Admin dueño privado en /[slug]/admin</div>
        </div>
      </div>
    </main>
  )
}
