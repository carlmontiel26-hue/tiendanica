export const metadata = {
  title: 'Términos y Condiciones - TiendaNica.store',
  description: 'Términos y condiciones de TiendaNica.store'
}

export default function Terminos(){
  return (
    <main style={{background:'#FFFBF8', minHeight:'100vh', fontFamily:'Inter, system-ui', padding:'20px 16px'}}>
      <div style={{maxWidth:800, margin:'0 auto', background:'#fff', borderRadius:20, padding:'24px 20px', border:'1px solid #EDE6E3'}}>
        <h1 style={{fontWeight:900, fontSize:22}}>Términos y Condiciones</h1>
        <p style={{fontSize:12, color:'#888', marginTop:4}}>TiendaNica.store • Actualizado: 4 de noviembre de 2026</p>
        
        <div style={{marginTop:20, fontSize:13, lineHeight:1.7, color:'#222'}}>
          <h3 style={{fontWeight:800, marginTop:16}}>1. Qué es TiendaNica.store</h3>
          <p>Somos un directorio/marketplace que muestra productos de emprendedores nicaragüenses. No somos vendedores, no cobramos comisión, no manejamos dinero. La compra/venta ocurre directo por WhatsApp entre comprador y dueño de tienda.</p>

          <h3 style={{fontWeight:800, marginTop:16}}>2. Roles</h3>
          <p><b>Comprador:</b> Ve productos y contacta por WhatsApp. <b>Vendedor/Dueño:</b> Crea tienda con PIN de 6 dígitos, sube fotos/video y atiende pedidos. <b>Super Admin:</b> Verifica tiendas, puede marcar como Premium/Verificada/Nueva y eliminar fraude.</p>

          <h3 style={{fontWeight:800, marginTop:16}}>3. Tiendas y productos</h3>
          <ul style={{marginLeft:18}}>
            <li>Prohibido vender productos ilegales, armas, drogas, contenido sexual explícito, o estafas.</li>
            <li>Vehículos: el dueño debe declarar papeles en regla/pendiente y fotos reales. No nos hacemos responsables por estado mecánico.</li>
            <li>Comida: la entrega y calidad es responsabilidad del restaurante/tienda.</li>
            <li>Nos reservamos derecho a eliminar tiendas por fraude comprobado y agregar WhatsApp a blacklist.</li>
          </ul>

          <h3 style={{fontWeight:800, marginTop:16}}>4. PIN de dueño</h3>
          <p>Cada tienda tiene un PIN de 6 dígitos para entrar a /admin. El dueño es responsable de guardarlo. Puede cambiarlo desde su panel. Si lo olvida, contacta soporte +505 81732620.</p>

          <h3 style={{fontWeight:800, marginTop:16}}>5. Pagos</h3>
          <p>TiendaNica.store NO procesa pagos dentro de la web/app. Todo pago, envío, garantía se acuerda entre comprador y vendedor por WhatsApp. Recomendamos pago contra entrega o transferencia segura.</p>

          <h3 style={{fontWeight:800, marginTop:16}}>6. Reportar fraude</h3>
          <p>Si una tienda te estafó, usa botón "Reportar Fraude" en su perfil o escribe a WhatsApp soporte con evidencias. Investigamos y podemos eliminar tienda.</p>

          <h3 style={{fontWeight:800, marginTop:16}}>7. Propiedad</h3>
          <p>Las fotos de productos pertenecen a cada dueño. El logo y marca TiendaNica.store pertenecen a Carlos Montiel.</p>

          <h3 style={{fontWeight:800, marginTop:16}}>8. Uso de la App Android</h3>
          <p>La app es un TWA (Trusted Web Activity) de nuestra web PWA. Requiere internet. No recopila datos financieros. Ubicación solo opcional para comida.</p>

          <h3 style={{fontWeight:800, marginTop:16}}>9. Limitación</h3>
          <p>Servicio "tal cual". No garantizamos ventas ni disponibilidad de productos. No somos responsables por acuerdos entre comprador y vendedor.</p>

          <h3 style={{fontWeight:800, marginTop:16}}>10. Contacto</h3>
          <p>Soporte: WhatsApp +505 81732620 - tiendanica.store</p>
        </div>

        <div style={{marginTop:20, display:'flex', gap:8}}>
          <a href="/" style={{background:'#111', color:'#fff', padding:'10px 16px', borderRadius:999, fontSize:12, textDecoration:'none', fontWeight:700}}>← Market</a>
          <a href="/privacidad" style={{background:'#fff', border:'1px solid #EDE6E3', padding:'10px 16px', borderRadius:999, fontSize:12, textDecoration:'none', color:'#111', fontWeight:700}}>Privacidad</a>
        </div>
      </div>
    </main>
  )
}
