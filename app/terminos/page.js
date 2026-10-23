export default function TerminosPage(){
  return (
    <main style={{minHeight:'100vh', background:'#F5F1ED', fontFamily:'Inter, system-ui', paddingBottom:40}}>
      <div style={{background:'linear-gradient(90deg, #FF8A00 0%, #FF3B30 50%, #2962FF 100%)', color:'#fff', padding:'14px', textAlign:'center', fontWeight:800, fontSize:12}}>🛡️ TiendaNica • Marketplace verificado de Nicaragua</div>
      <div style={{background:'#fff', borderRadius:20, padding:24, border:'1px solid #EDE6DF', maxWidth:800, margin:'20px auto', lineHeight:1.7}}>
        <h1 style={{fontWeight:900, fontSize:24}}>Términos y Condiciones - TiendaNica.store</h1>
        <p style={{fontSize:12, color:'#888', marginTop:6}}>Actualizado: Mayo 2025 • Proyecto de Carlos Montiel y socio</p>
        <h3 style={{fontWeight:800, marginTop:20}}>1. Qué es TiendaNica</h3>
        <p style={{fontSize:14, color:'#444', marginTop:8}}>TiendaNica.store es un marketplace intermediario que conecta compradores con tiendas reales de Nicaragua. Nosotros no vendemos directamente. La venta, envío, pago y garantía se acuerda directamente por WhatsApp entre comprador y tienda.</p>
        <h3 style={{fontWeight:800, marginTop:16}}>2. Rol de intermediario</h3>
        <p style={{fontSize:14, color:'#444', marginTop:8}}>No somos responsables por calidad, entrega o garantía. No manejamos dinero. Podemos mediar en caso de reporte de fraude comprobado suspendiendo tiendas, pero no garantizamos reembolsos. El sistema antifraude con verificación de cédula y video es para filtrar tiendas fantasma.</p>
        <h3 style={{fontWeight:800, marginTop:16}}>3. Tiendas verificadas</h3>
        <p style={{fontSize:14, color:'#444', marginTop:8}}>Para vender necesitas pasar verificación: cédula, selfie, video stock y depósito C$250 reembolsable. 2 reportes comprobados = suspensión + WhatsApp a blacklist interna.</p>
        <a href="/" style={{display:'block', marginTop:20, textAlign:'center', background:'#111', color:'#fff', padding:12, borderRadius:999, textDecoration:'none', fontWeight:800}}>← Volver al Market</a>
      </div>
    </main>
  )
}
