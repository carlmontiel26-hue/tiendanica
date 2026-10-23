export default function VendedoresPage(){
  return (
    <main style={{minHeight:'100vh', background:'#F5F1ED', fontFamily:'Inter, system-ui'}}>
      <style>{`.cinta{ background: linear-gradient(90deg, #FF8A00 0%, #FF3B30 50%, #2962FF 100%); color:#fff; padding:14px; text-align:center; font-weight:800; font-size:12px; } .card{ background:#fff; border-radius:20px; padding:24px; border:1px solid #EDE6DF; max-width:850px; margin:20px auto; line-height:1.7; } .badge{ display:inline-block; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:900; }`}</style>
      <div className="cinta">🛡️ Política de Vendedores y Antifraude • TiendaNica</div>
      <div className="card">
        <h1 style={{fontWeight:900, fontSize:24}}>Política para Vendedores - Antifraude</h1>
        <p style={{fontSize:13, color:'#666', marginTop:6}}>Queremos ser el market más confiable de Nicaragua. Por eso filtramos tiendas fantasma. Proyecto de Carlos Montiel y socio.</p>

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:12, marginTop:20}}>
          <div style={{border:'1px solid #EDE6E3', borderRadius:16, padding:14}}>
            <span className="badge" style={{background:'#F0F0F0', color:'#666'}}>NIVEL 1</span>
            <h4 style={{fontWeight:800, marginTop:8}}>Tienda Nueva</h4>
            <p style={{fontSize:12, color:'#666', marginTop:6}}>Sin badge. Aparece abajo en el market. Sin verificación. Límite 10 productos. No aparece en buscador principal.</p>
          </div>
          <div style={{border:'1.5px solid #0066FF', borderRadius:16, padding:14, background:'#F0F7FF'}}>
            <span className="badge" style={{background:'#0066FF', color:'#fff'}}>NIVEL 2 • RECOMENDADO</span>
            <h4 style={{fontWeight:800, marginTop:8}}>Verificada ✓</h4>
            <p style={{fontSize:12, color:'#444', marginTop:6}}>Foto cédula + selfie + video 15s stock real + videollamada 30s + depósito C$250 reembolsable. Badge azul. Aparece arriba. Carrito activado.</p>
          </div>
          <div style={{border:'1.5px solid #FF8A00', borderRadius:16, padding:14, background:'#FFF7ED'}}>
            <span className="badge" style={{background:'#FF6A00', color:'#fff'}}>NIVEL 3</span>
            <h4 style={{fontWeight:800, marginTop:8}}>Premium ⭐</h4>
            <p style={{fontSize:12, color:'#444', marginTop:6}}>3 meses sin reportes + 20 ventas comprobadas + envío con guías CargoTrans. Badge naranja + prioridad en portada.</p>
          </div>
        </div>

        <h3 style={{fontWeight:800, marginTop:24}}>📋 Requisitos para evitar tiendas fantasma</h3>
        <ul style={{fontSize:14, color:'#444', marginTop:8, paddingLeft:18, lineHeight:'1.8'}}>
          <li><b>WhatsApp Business real y que responda en 24h.</b> Si no respondes 3 veces, bajas de ranking.</li>
          <li><b>Stock real:</b> Video de 15s mostrando tu bodega/closet. No se aceptan solo fotos de AliExpress/Shein como propias.</li>
          <li><b>Cédula y selfie:</b> Solo la ven los fundadores. Para evitar que la misma persona cree 5 tiendas fantasma con distinto WhatsApp.</li>
          <li><b>Depósito anti-fantasma C$250:</b> Reembolsable si te vas sin reportes. El estafador nunca paga. Se verifica por transferencia a cuenta de TiendaNica.</li>
        </ul>

        <h3 style={{fontWeight:800, marginTop:20}}>🚨 Qué es fraude y suspende tu tienda</h3>
        <div style={{background:'#FFF5F5', border:'1px solid #FED7D7', borderRadius:12, padding:12, marginTop:8}}>
          <ul style={{fontSize:13, color:'#822727', paddingLeft:16, lineHeight:'1.8'}}>
            <li>No entregar producto cobrado</li>
            <li>Enviar producto falso / distinto a la foto</li>
            <li>Usar fotos robadas de otras tiendas de TiendaNica</li>
            <li>No responder WhatsApp después de cobrar</li>
            <li>Precio falso (C$1 para aparecer primero)</li>
            <li>Vender productos prohibidos</li>
          </ul>
          <p style={{fontSize:12, fontWeight:800, marginTop:8, color:'#C53030'}}>2 reportes comprobados = suspensión inmediata + WhatsApp a blacklist interna de fundadores.</p>
        </div>

        <h3 style={{fontWeight:800, marginTop:20}}>💰 Modelo de negocio para vos y tu socio (próximos años)</h3>
        <p style={{fontSize:13, color:'#444', marginTop:8}}>
          Año 1: Comisión 0% - solo depósito. Gana confianza y volumen.<br/>
          Año 2: Plan Premium C$300/mes para aparecer arriba + badge.<br/>
          Año 3: Logística propia o convenio CargoTrans + comisión 3% opcional con pago dentro de TiendaNica.<br/>
          Visión: Ser el marketplace #1 de Nicaragua, sin estafas, con tiendas reales verificadas.
        </p>

        <div style={{marginTop:20, background:'#111', color:'#fff', borderRadius:12, padding:14, textAlign:'center'}}>
          <p style={{fontWeight:800}}>¿Quieres vender verificado?</p>
          <p style={{fontSize:12, opacity:0.8, marginTop:4}}>Escríbenos: WhatsApp 505 8173 2620 - Videollamada 30s y activamos tu badge azul hoy mismo.</p>
          <a href="https://wa.me/50581732620?text=Hola%20quiero%20verificar%20mi%20tienda%20en%20TiendaNica" target="_blank" style={{display:'inline-block', marginTop:10, background:'#0066FF', color:'#fff', padding:'10px 18px', borderRadius:999, textDecoration:'none', fontWeight:800, fontSize:13}}>Verificar mi tienda ✓</a>
        </div>
        <a href="/" style={{display:'block', marginTop:16, textAlign:'center', background:'#F0F0F0', color:'#111', padding:12, borderRadius:999, textDecoration:'none', fontWeight:800}}>← Volver al Market</a>
      </div>
    </main>
  )
}
