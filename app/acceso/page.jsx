'use client'
import { useState, useEffect } from 'react'

export default function AccesoDueno(){
  const [input, setInput] = useState('')
  const [mySlug, setMySlug] = useState('')
  const [savedAt, setSavedAt] = useState('')

  useEffect(()=>{
    const s = localStorage.getItem('tn_my_store_slug')
    const t = localStorage.getItem('tn_my_store_saved_at')
    if(s){ setMySlug(s); if(t) setSavedAt(t) }
  },[])

  const extractSlug = (val)=>{
    let v = val.trim().toLowerCase()
    if(!v) return ''
    // si pega url completa https://tiendanica.store/mi-tienda
    if(v.includes('tiendanica.store')) {
      const parts = v.split('/').filter(Boolean)
      v = parts[parts.length-1]
    }
    v = v.replace('https://','').replace('http://','').replace('www.','')
    v = v.split('/').pop()
    v = v.split('?')[0].split('#')[0]
    return v.trim()
  }

  const guardar = ()=>{
    const slug = extractSlug(input)
    if(!slug){ alert('Pega tu link válido, ej: tiendanica.store/mi-boutique o solo mi-boutique'); return }
    localStorage.setItem('tn_my_store_slug', slug)
    localStorage.setItem('tn_my_store_saved_at', new Date().toLocaleDateString())
    setMySlug(slug)
    setInput('')
  }

  const borrar = ()=>{
    if(confirm('¿Quitar tu tienda guardada?')){
      localStorage.removeItem('tn_my_store_slug')
      localStorage.removeItem('tn_my_store_saved_at')
      setMySlug('')
    }
  }

  const irTienda = ()=> window.location.href = `/${mySlug}`
  const irAdmin = ()=> window.location.href = `/${mySlug}/admin`
  const irProductos = ()=> window.location.href = `/${mySlug}/admin?tab=productos`

  return (
    <main style={{minHeight:'100vh', background:'#F5F1ED', fontFamily:'Inter, system-ui', paddingBottom:40}}>
      <style>{`
        .wrap{max-width:480px; margin:0 auto; padding:16px}
        .card{ background:#fff; border-radius:22px; border:1px solid #EDE6DF; padding:18px; box-shadow:0 8px 30px rgba(0,0,0,0.06); }
        .btn{ border:none; border-radius:999px; padding:14px 18px; font-weight:900; cursor:pointer; width:100%; font-size:14px }
        .input{ width:100%; border:1.8px solid #E8E0D9; border-radius:14px; padding:14px 16px; font-size:14px; outline:none; background:#FFFEFD }
        .input:focus{ border-color:#FF8A00; box-shadow:0 0 0 3px rgba(255,138,0,0.15) }
      `}</style>

      <div style={{background:'#111', color:'#fff', padding:'14px 16px', display:'flex', alignItems:'center', gap:10}}>
        <a href="/" style={{color:'#fff', textDecoration:'none', fontWeight:800}}>← TiendaNica</a>
        <span style={{opacity:0.4}}>•</span>
        <span style={{fontWeight:800, fontSize:13}}>Acceso Dueños</span>
      </div>

      <div className="wrap">
        <div style={{textAlign:'center', padding:'18px 0 14px'}}>
          <div style={{width:64,height:64, borderRadius:18, background:'linear-gradient(135deg,#FF8A00,#FF3B30)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto', fontSize:28, boxShadow:'0 8px 20px rgba(255,138,0,0.3)'}}>🔑</div>
          <h1 style={{fontWeight:900, fontSize:22, marginTop:12, letterSpacing:-0.5}}>Mi Tienda Guardada</h1>
          <p style={{fontSize:13, color:'#6B625C', marginTop:6, lineHeight:1.4}}>Guarda tu link una sola vez en esta app y entra rápido a tu tienda y panel sin tener que recordar el link.</p>
        </div>

        {!mySlug ? (
          <div className="card">
            <p style={{fontSize:13, fontWeight:800, marginBottom:8}}>Pega tu link de tienda</p>
            <input className="input" value={input} onChange={e=>setInput(e.target.value)} placeholder="Ej: tiendanica.store/mi-boutique  o  mi-boutique"/>
            <p style={{fontSize:11, color:'#8B7E74', marginTop:8}}>Acepta link completo o solo el nombre. Ej: <b>rosita-boutique</b>, <b>mi-boutique</b></p>
            <button onClick={guardar} className="btn" style={{background:'#111', color:'#fff', marginTop:14}}>💾 Guardar en esta app</button>
            <div style={{marginTop:14, background:'#FFF7E8', border:'1px solid #FFD9A0', borderRadius:12, padding:'10px 12px'}}>
              <p style={{fontSize:11, fontWeight:800}}>¿Dónde está mi link?</p>
              <p style={{fontSize:11, color:'#666', marginTop:4, lineHeight:1.4}}>Te lo enviamos por WhatsApp cuando creamos tu tienda. Es algo como: <br/><span style={{background:'#fff', padding:'2px 6px', borderRadius:6, border:'1px solid #FFE0C0', fontWeight:700}}>tiendanica.store/tu-nombre-tienda</span></p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <p style={{fontSize:11, color:'#8B7E74', fontWeight:700, textTransform:'uppercase'}}>Tienda guardada</p>
                <p style={{fontSize:18, fontWeight:900, marginTop:2}}>{mySlug}</p>
                {savedAt && <p style={{fontSize:11, color:'#999', marginTop:2}}>Guardado el {savedAt} en este dispositivo</p>}
              </div>
              <div style={{width:44, height:44, borderRadius:12, background:'#F7F2EE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20}}>🏪</div>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:10, marginTop:16}}>
              <button onClick={irTienda} className="btn" style={{background:'#FF8A00', color:'#fff', boxShadow:'0 6px 18px rgba(255,138,0,0.3)'}}>🏪 Ver mi tienda</button>
              <button onClick={irAdmin} className="btn" style={{background:'#0066FF', color:'#fff', boxShadow:'0 6px 18px rgba(0,102,255,0.3)'}}>⚙️ Mi Panel de Dueño</button>
              <button onClick={irProductos} className="btn" style={{background:'#111', color:'#fff'}}>📦 Mis Productos</button>
            </div>

            <div style={{display:'flex', gap:8, marginTop:14}}>
              <button onClick={borrar} style={{flex:1, background:'#F5F1ED', border:'1px solid #E8E0D9', padding:'10px', borderRadius:999, fontWeight:700, fontSize:12}}>Cambiar tienda</button>
              <a href="/" style={{flex:1, background:'#fff', border:'1px solid #E8E0D9', padding:'10px', borderRadius:999, fontWeight:700, fontSize:12, textAlign:'center', textDecoration:'none', color:'#000'}}>Ir al Market</a>
            </div>

            <p style={{fontSize:10, color:'#999', marginTop:12, textAlign:'center'}}>Guardado solo en este teléfono. Si cambias de celular, vuelve a pegarlo aquí.</p>
          </div>
        )}

        <div style={{marginTop:16, display:'flex', gap:8}}>
          <a href="https://wa.me/50581732620?text=Hola%20TiendaNica%2C%20perdi%20mi%20link%20de%20tienda" style={{flex:1, background:'#25D366', color:'#fff', textDecoration:'none', padding:'12px', borderRadius:999, fontWeight:900, fontSize:13, textAlign:'center'}}>WhatsApp Ayuda</a>
          <a href="/" style={{flex:1, background:'#fff', border:'1px solid #EDE6DF', textDecoration:'none', color:'#000', padding:'12px', borderRadius:999, fontWeight:800, fontSize:13, textAlign:'center'}}>Volver al Market</a>
        </div>

        <p style={{fontSize:10, color:'#B8AEA6', textAlign:'center', marginTop:18}}>TiendaNica.store • Acceso rápido para dueños verificados</p>
      </div>
    </main>
  )
}
