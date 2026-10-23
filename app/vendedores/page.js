export default function VendedoresPage(){
  return (
    <main style={{minHeight:'100vh', background:'#F5F1ED', fontFamily:'Inter, system-ui'}}>
      <div style={{background:'linear-gradient(90deg, #FF8A00 0%, #FF3B30 50%, #2962FF 100%)', color:'#fff', padding:'14px', textAlign:'center', fontWeight:800, fontSize:12}}>🛡️ Política Vendedores Antifraude</div>
      <div style={{background:'#fff', borderRadius:20, padding:24, border:'1px solid #EDE6DF', maxWidth:850, margin:'20px auto', lineHeight:1.7}}>
        <h1 style={{fontWeight:900, fontSize:24}}>Política para Vendedores</h1>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:16}}>
          <div style={{border:'1px solid #ddd', borderRadius:12, padding:12}}><b>NUEVA</b><br/><span style={{fontSize:11}}>Sin badge, aparece abajo, límite 10 productos</span></div>
          <div style={{border:'1.5px solid #0066FF', background:'#F0F7FF', borderRadius:12, padding:12}}><b>VERIFICADA ✓</b><br/><span style={{fontSize:11}}>Cédula + video + depósito C$250, badge azul, aparece arriba</span></div>
          <div style={{border:'1.5px solid #FF8A00', background:'#FFF7ED', borderRadius:12, padding:12}}><b>PREMIUM ⭐</b><br/><span style={{fontSize:11}}>3 meses sin reportes + 20 ventas, badge naranja</span></div>
        </div>
        <h3 style={{fontWeight:800, marginTop:20}}>Requisitos antifraude</h3>
        <ul style={{fontSize:14, color:'#444', paddingLeft:18}}><li>WhatsApp Business que responda en 24h</li><li>Video 15s stock real (no fotos AliExpress)</li><li>Cédula + selfie (privado solo fundadores)</li><li>Depósito C$250 reembolsable</li></ul>
        <div style={{background:'#FFF5F5', border:'1px solid #FED7D7', borderRadius:12, padding:12, marginTop:12, fontSize:12}}><b>2 reportes comprobados = suspensión + blacklist WhatsApp</b></div>
        <a href="https://wa.me/50581732620?text=Quiero%20verificar%20mi%20tienda" target="_blank" style={{display:'block', marginTop:16, textAlign:'center', background:'#0066FF', color:'#fff', padding:12, borderRadius:999, textDecoration:'none', fontWeight:800}}>Verificar mi tienda ✓ por WhatsApp</a>
        <a href="/" style={{display:'block', marginTop:10, textAlign:'center', background:'#F0F0F0', color:'#111', padding:12, borderRadius:999, textDecoration:'none', fontWeight:800}}>← Volver al Market</a>
      </div>
    </main>
  )
}
