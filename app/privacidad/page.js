export default function PrivacidadPage(){
  return (
    <main style={{minHeight:'100vh', background:'#F5F1ED', fontFamily:'Inter, system-ui'}}>
      <div style={{background:'linear-gradient(90deg, #FF8A00 0%, #FF3B30 50%, #2962FF 100%)', color:'#fff', padding:'14px', textAlign:'center', fontWeight:800, fontSize:12}}>🔒 Privacidad • TiendaNica.store</div>
      <div style={{background:'#fff', borderRadius:20, padding:24, border:'1px solid #EDE6DF', maxWidth:800, margin:'20px auto', lineHeight:1.7}}>
        <h1 style={{fontWeight:900, fontSize:24}}>Política de Privacidad</h1>
        <p style={{fontSize:14, color:'#444', marginTop:10}}><b>De tiendas:</b> Guardamos nombre, WhatsApp, logo, productos. Cédula y selfie solo para verificación antifraude, privado, solo lo ven fundadores.</p>
        <p style={{fontSize:14, color:'#444', marginTop:10}}><b>De compradores:</b> No guardamos datos bancarios. El chat es directo por WhatsApp.</p>
        <p style={{fontSize:14, color:'#444', marginTop:10}}><b>Seguridad:</b> Usamos Supabase con RLS. Bucket verificaciones es privado. Puedes pedir borrar tus datos al 505 8173 2620.</p>
        <div style={{marginTop:20, background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:12, padding:12, fontSize:12}}><b>🛡️ Nunca pedimos contraseña bancaria. Pago siempre directo a tienda por WhatsApp.</b></div>
        <a href="/" style={{display:'block', marginTop:16, textAlign:'center', background:'#111', color:'#fff', padding:12, borderRadius:999, textDecoration:'none', fontWeight:800}}>← Volver al Market</a>
      </div>
    </main>
  )
}
