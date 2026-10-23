export default function PrivacidadPage(){
  return (
    <main style={{minHeight:'100vh', background:'#F5F1ED', fontFamily:'Inter, system-ui'}}>
      <style>{`.cinta{ background: linear-gradient(90deg, #FF8A00 0%, #FF3B30 50%, #2962FF 100%); color:#fff; padding:14px; text-align:center; font-weight:800; font-size:12px; } .card{ background:#fff; border-radius:20px; padding:24px; border:1px solid #EDE6DF; max-width:800px; margin:20px auto; line-height:1.7; }`}</style>
      <div className="cinta">🔒 Privacidad • TiendaNica.store</div>
      <div className="card">
        <h1 style={{fontWeight:900, fontSize:24}}>Política de Privacidad</h1>
        <p style={{fontSize:12, color:'#888', marginTop:6}}>Proyecto personal de Carlos Montiel y socio • Datos protegidos en Supabase</p>

        <h3 style={{fontWeight:800, marginTop:20}}>1. Qué datos guardamos</h3>
        <p style={{fontSize:14, color:'#444', marginTop:8}}>
          <b>De tiendas:</b> Nombre tienda, WhatsApp Business, logo, productos (fotos, precio, descripción, tallas), cédula y selfie para verificación antifraude (privado, solo lo ven los fundadores, no es público).<br/>
          <b>De compradores:</b> No guardamos datos bancarios. Solo WhatsApp si nos escribes para reportar. El chat de compra es directo entre comprador y tienda por WhatsApp, nosotros no lo leemos.<br/>
          <b>De navegación:</b> Productos vistos y carrito guardado localmente en tu celular (localStorage).
        </p>

        <h3 style={{fontWeight:800, marginTop:16}}>2. Cómo protegemos contra tiendas fantasma</h3>
        <p style={{fontSize:14, color:'#444', marginTop:8}}>Para evitar fraude, guardamos en tabla privada: foto cédula, selfie con cédula, video de stock y comprobante de depósito C$250. Esto solo lo ven los fundadores en panel admin. Se borra si la tienda se elimina y pide borrado escribiendo a 505 8173 2620. Nunca vendemos tus datos.</p>

        <h3 style={{fontWeight:800, marginTop:16}}>3. Base de datos y seguridad</h3>
        <p style={{fontSize:14, color:'#444', marginTop:8}}>Usamos Supabase con RLS (Row Level Security). Bucket de verificaciones es privado. Ratings y reportes de fraude son encriptados. Blacklist de WhatsApp estafadores es interna y no se comparte públicamente.</p>

        <h3 style={{fontWeight:800, marginTop:16}}>4. Tus derechos</h3>
        <p style={{fontSize:14, color:'#444', marginTop:8}}>Puedes pedir que borremos tu tienda y datos escribiendo por WhatsApp a 505 8173 2620. Respondemos en 48h. Si fuiste estafado por una tienda fantasma, reporta en /reportar y usaremos tu evidencia para suspenderla.</p>

        <div style={{marginTop:20, background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:12, padding:12}}>
          <p style={{fontSize:12, fontWeight:700}}>🛡️ Compromiso antifraude: Nunca pedimos tu contraseña bancaria. Todo pago es por WhatsApp directo con la tienda, nunca a cuenta de TiendaNica.</p>
        </div>
        <a href="/" style={{display:'block', marginTop:16, textAlign:'center', background:'#111', color:'#fff', padding:12, borderRadius:999, textDecoration:'none', fontWeight:800}}>← Volver al Market</a>
      </div>
    </main>
  )
}
