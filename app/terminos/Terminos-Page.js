export default function TerminosPage(){
  return (
    <main style={{minHeight:'100vh', background:'#F5F1ED', fontFamily:'Inter, system-ui', paddingBottom:40}}>
      <style>{`
        .cinta{ background: linear-gradient(90deg, #FF8A00 0%, #FF3B30 50%, #2962FF 100%); color:#fff; padding:14px; text-align:center; font-weight:800; font-size:12px; }
        .card{ background:#fff; border-radius:20px; padding:24px; border:1px solid #EDE6DF; max-width:800px; margin:20px auto; line-height:1.7; }
      `}</style>
      <div className="cinta">🛡️ TiendaNica • Marketplace verificado de Nicaragua</div>
      <div className="card">
        <h1 style={{fontWeight:900, fontSize:24}}>Términos y Condiciones - TiendaNica.store</h1>
        <p style={{fontSize:12, color:'#888', marginTop:6}}>Última actualización: {new Date().toLocaleDateString('es-NI')} • Proyecto de Carlos Montiel y socio</p>
        
        <h3 style={{fontWeight:800, marginTop:20}}>1. Qué es TiendaNica</h3>
        <p style={{fontSize:14, color:'#444', marginTop:8}}>TiendaNica.store es un marketplace intermediario que conecta compradores con tiendas reales de Nicaragua. Nosotros no vendemos directamente. La venta, envío, pago y garantía se acuerda directamente por WhatsApp entre el comprador y la tienda. TiendaNica facilita el contacto pero no es parte de la transacción final.</p>

        <h3 style={{fontWeight:800, marginTop:16}}>2. Rol de intermediario</h3>
        <p style={{fontSize:14, color:'#444', marginTop:8}}>Al usar TiendaNica, aceptas que:<br/>• No somos responsables por la calidad, entrega, devolución o garantía del producto.<br/>• No manejamos dinero. No hay pagos dentro de la web, todo es por WhatsApp directo.<br/>• Podemos mediar en caso de reporte de fraude comprobado, suspendiendo tiendas, pero no garantizamos reembolsos.</p>

        <h3 style={{fontWeight:800, marginTop:16}}>3. Cuentas y tiendas</h3>
        <p style={{fontSize:14, color:'#444', marginTop:8}}>Para vender necesitas pasar verificación antifraude: cédula, selfie, video de stock y depósito C$250 reembolsable. Nos reservamos el derecho de rechazar o suspender tiendas con reportes de estafa, fotos robadas o inactividad. Lista negra interna de WhatsApp de estafadores es compartida entre fundadores.</p>

        <h3 style={{fontWeight:800, marginTop:16}}>4. Uso aceptable</h3>
        <p style={{fontSize:14, color:'#444', marginTop:8}}>Prohibido: vender productos ilegales, armas, drogas, contenido adulto, estafas, fotos de otras tiendas como propias, precios engañosos. 2 reportes comprobados = suspensión inmediata.</p>

        <h3 style={{fontWeight:800, marginTop:16}}>5. Futuro del proyecto</h3>
        <p style={{fontSize:14, color:'#444', marginTop:8}}>Este es un proyecto personal de largo plazo de sus fundadores, con visión de ser el marketplace más confiable y popular de Nicaragua en los próximos años. Mejoramos constantemente nuestras políticas antifraude.</p>

        <div style={{marginTop:20, background:'#F0F7FF', border:'1px solid #BFDBFE', borderRadius:12, padding:12}}>
          <p style={{fontSize:12, fontWeight:700}}>Contacto legal: WhatsApp 505 8173 2620 • tiendanica.store</p>
        </div>
        <a href="/" style={{display:'block', marginTop:16, textAlign:'center', background:'#111', color:'#fff', padding:12, borderRadius:999, textDecoration:'none', fontWeight:800}}>← Volver al Market</a>
      </div>
    </main>
  )
}
