export const metadata = {
  title: 'Política de Privacidad - TiendaNica.store',
  description: 'Política de privacidad de TiendaNica.store - Marketplace de Nicaragua'
}

export default function Privacidad(){
  return (
    <main style={{background:'#FFFBF8', minHeight:'100vh', fontFamily:'Inter, system-ui', padding:'20px 16px'}}>
      <div style={{maxWidth:800, margin:'0 auto', background:'#fff', borderRadius:20, padding:'24px 20px', border:'1px solid #EDE6E3'}}>
        <h1 style={{fontWeight:900, fontSize:22}}>Política de Privacidad</h1>
        <p style={{fontSize:12, color:'#888', marginTop:4}}>TiendaNica.store • Última actualización: 4 de noviembre de 2026</p>
        
        <div style={{marginTop:20, fontSize:13, lineHeight:1.7, color:'#222'}}>
          <h3 style={{fontWeight:800, marginTop:16}}>1. ¿Quiénes somos?</h3>
          <p>TiendaNica.store es un marketplace de Nicaragua que conecta compradores con emprendedores locales. Operamos en https://tiendanica.store y en nuestra app Android. Contacto: soporte vía WhatsApp +505 81732620.</p>

          <h3 style={{fontWeight:800, marginTop:16}}>2. ¿Qué datos recopilamos?</h3>
          <ul style={{marginLeft:18}}>
            <li><b>WhatsApp del comprador/vendedor:</b> Solo cuando el usuario inicia un chat para comprar/vender. No almacenamos mensajes.</li>
            <li><b>Ubicación aproximada (opcional):</b> Solo si el usuario activa "🍔 Comida cerca de mí" para mostrar restaurantes por departamento/municipio. Puede ser GPS o selección manual. Nunca precisa sin permiso.</li>
            <li><b>Fotos y videos de productos:</b> Subidos por dueños de tiendas para mostrar sus productos.</li>
            <li><b>Nombre y slug de tienda:</b> Información pública de la tienda.</li>
            <li><b>PIN de 6 dígitos del dueño:</b> Contraseña local para proteger su panel /admin. Se guarda cifrado y solo el dueño lo conoce.</li>
            <li><b>Datos de uso anónimos:</b> Eventos de Meta Pixel (ViewContent, Contact) para mejorar anuncios, sin identificar personas.</li>
          </ul>

          <h3 style={{fontWeight:800, marginTop:16}}>3. ¿Para qué usamos los datos?</h3>
          <p>Para mostrar tiendas y productos, facilitar contacto por WhatsApp entre comprador y vendedor, filtrar comida por zona, proteger panel de dueños con PIN, y mejorar la experiencia.</p>

          <h3 style={{fontWeight:800, marginTop:16}}>4. ¿Compartimos datos con terceros?</h3>
          <p><b>No.</b> No vendemos ni compartimos datos personales con terceros. WhatsApp es una app externa donde el usuario decide chatear. Usamos Supabase para almacenar tiendas/productos de forma segura y Meta Pixel para estadísticas anónimas.</p>

          <h3 style={{fontWeight:800, marginTop:16}}>5. ¿Cómo protegemos tus datos?</h3>
          <p>Usamos HTTPS, almacenamiento seguro en Supabase, PIN de 6 dígitos para panel de dueños con expiración de 7 días, y no pedimos datos bancarios dentro de la app. Las compras son directo por WhatsApp entre partes.</p>

          <h3 style={{fontWeight:800, marginTop:16}}>6. Tus derechos</h3>
          <p>Puedes pedir que borremos tu tienda, tus productos o tu WhatsApp escribiendo a +505 81732620 con tu slug. También puedes cambiar tu PIN desde tu panel /admin.</p>

          <h3 style={{fontWeight:800, marginTop:16}}>7. Niños</h3>
          <p>Nuestra app no está dirigida a menores de 13 años. Las compras las realizan adultos.</p>

          <h3 style={{fontWeight:800, marginTop:16}}>8. Cambios</h3>
          <p>Si cambiamos esta política, lo publicaremos aquí con nueva fecha.</p>

          <h3 style={{fontWeight:800, marginTop:16}}>9. Contacto</h3>
          <p>WhatsApp soporte: +505 81732620<br/>Web: https://tiendanica.store<br/>Email: carlmontiel26@gmail.com</p>

          <div style={{marginTop:20, background:'#F5F1EC', padding:12, borderRadius:12, fontSize:11, color:'#666'}}>
            Esta política cumple con requisitos de Google Play Store - Sección Seguridad de los datos. No recopilamos ubicación precisa sin consentimiento, no recopilamos datos financieros, no usamos publicidad de terceros dentro de la app.
          </div>
        </div>

        <div style={{marginTop:20, display:'flex', gap:8}}>
          <a href="/" style={{background:'#111', color:'#fff', padding:'10px 16px', borderRadius:999, fontSize:12, textDecoration:'none', fontWeight:700}}>← Volver al Market</a>
          <a href="/terminos" style={{background:'#fff', border:'1px solid #EDE6E3', padding:'10px 16px', borderRadius:999, fontSize:12, textDecoration:'none', color:'#111', fontWeight:700}}>Ver Términos</a>
        </div>
      </div>
    </main>
  )
}
