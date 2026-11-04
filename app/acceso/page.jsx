'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key) return null
  return createClient(url,key)
}

export default function AccesoDueno(){
  const [input, setInput] = useState('')
  const [pin, setPin] = useState('')
  const [mySlug, setMySlug] = useState('')
  const [step, setStep] = useState('login') // login | setpin | success
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [storeInfo, setStoreInfo] = useState(null)

  useEffect(()=>{
    const s = localStorage.getItem('tn_my_store_slug')
    if(s) setMySlug(s)
  },[])

  const extractSlug = (val)=>{
    let v = val.trim().toLowerCase()
    if(!v) return ''
    if(v.includes('tiendanica.store')) {
      const parts = v.split('/').filter(Boolean)
      v = parts[parts.length-1]
    }
    v = v.replace('https://','').replace('http://','').replace('www.','')
    v = v.split('/').pop()
    v = v.split('?')[0].split('#')[0]
    return v.trim()
  }

  const login = async ()=>{
    setError('')
    const slug = extractSlug(input || mySlug)
    if(!slug){ setError('Pega tu link de tienda'); return }
    if(!pin || pin.length !== 6){ setError('El PIN debe ser de 6 dígitos'); return }
    setLoading(true)
    const supabase = getSupabase()
    if(!supabase){ setError('Error de conexión'); setLoading(false); return }
    
    const { data, error: err } = await supabase.from('stores').select('id, slug, name, logo_url, admin_password').eq('slug', slug).single()
    if(err || !data){ setError('Tienda no encontrada'); setLoading(false); return }
    
    // Si no tiene PIN aún, dejar establecer
    if(!data.admin_password){
      setStoreInfo(data)
      setStep('setpin')
      setLoading(false)
      return
    }
    
    if(data.admin_password !== pin){
      setError('PIN incorrecto. Contacta a soporte si lo olvidaste.')
      setLoading(false)
      return
    }
    
    // OK
    localStorage.setItem('tn_my_store_slug', data.slug)
    localStorage.setItem('tn_my_store_pin', pin)
    localStorage.setItem('tn_my_store_auth', JSON.stringify({ slug: data.slug, at: Date.now() }))
    localStorage.setItem('tn_my_store_name', data.name)
    setMySlug(data.slug)
    setStoreInfo(data)
    setStep('success')
    setLoading(false)
  }

  const establecerPin = async ()=>{
    setError('')
    if(!newPin || newPin.length !== 6){ setError('PIN debe ser 6 dígitos'); return }
    if(newPin !== confirmPin){ setError('Los PIN no coinciden'); return }
    if(!/^\d{6}$/.test(newPin)){ setError('Solo números, 6 dígitos'); return }
    setLoading(true)
    const supabase = getSupabase()
    const slug = storeInfo?.slug || extractSlug(input)
    const { error } = await supabase.from('stores').update({ admin_password: newPin, admin_password_set: true }).eq('slug', slug)
    if(error){ setError('Error al guardar PIN'); setLoading(false); return }
    localStorage.setItem('tn_my_store_slug', slug)
    localStorage.setItem('tn_my_store_pin', newPin)
    localStorage.setItem('tn_my_store_auth', JSON.stringify({ slug, at: Date.now() }))
    setMySlug(slug)
    setStep('success')
    setLoading(false)
  }

  const irTienda = ()=> window.location.href = `/${mySlug}`
  const irAdmin = ()=> window.location.href = `/${mySlug}/admin`
  const borrar = ()=>{
    if(confirm('¿Quitar tienda guardada?')){
      localStorage.removeItem('tn_my_store_slug')
      localStorage.removeItem('tn_my_store_pin')
      localStorage.removeItem('tn_my_store_auth')
      localStorage.removeItem('tn_my_store_name')
      setMySlug(''); setStep('login'); setInput(''); setPin('')
    }
  }

  return (
    <main style={{minHeight:'100vh', background:'#F5F1ED', fontFamily:'Inter, system-ui'}}>
      <style>{`
        .wrap{max-width:440px; margin:0 auto; padding:16px}
        .card{ background:#fff; border-radius:22px; border:1px solid #EDE6DF; padding:18px; box-shadow:0 8px 30px rgba(0,0,0,0.06); }
        .btn{ border:none; border-radius:999px; padding:14px 18px; font-weight:900; cursor:pointer; width:100%; font-size:14px }
        .input{ width:100%; border:1.8px solid #E8E0D9; border-radius:14px; padding:14px 16px; font-size:15px; outline:none; background:#FFFEFD; font-weight:700 }
        .input:focus{ border-color:#FF8A00; box-shadow:0 0 0 3px rgba(255,138,0,0.15) }
        .pin-input{ letter-spacing:8px; text-align:center; font-size:22px; font-weight:900 }
      `}</style>

      <div style={{background:'#111', color:'#fff', padding:'14px 16px', display:'flex', alignItems:'center', gap:10}}>
        <a href="/" style={{color:'#fff', textDecoration:'none', fontWeight:800}}>← TiendaNica</a>
        <span style={{opacity:0.4}}>•</span>
        <span style={{fontWeight:800, fontSize:13}}>Acceso Dueños Seguro</span>
      </div>

      <div className="wrap">
        <div style={{textAlign:'center', padding:'18px 0 14px'}}>
          <div style={{width:64,height:64, borderRadius:18, background:'linear-gradient(135deg,#FF8A00,#FF3B30)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto', fontSize:28}}>🔑</div>
          <h1 style={{fontWeight:900, fontSize:20, marginTop:12}}>Acceso seguro con PIN</h1>
          <p style={{fontSize:12, color:'#6B625C', marginTop:6}}>Tu link + PIN de 6 dígitos. Solo tú entras a tu panel.</p>
        </div>

        {step === 'login' && (
          <div className="card">
            {!mySlug ? (
              <>
                <p style={{fontSize:12, fontWeight:800, marginBottom:8}}>Link de tu tienda</p>
                <input className="input" value={input} onChange={e=>setInput(e.target.value)} placeholder="mi-boutique o tiendanica.store/mi-boutique"/>
              </>
            ) : (
              <div style={{background:'#F7F2EE', borderRadius:12, padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div><p style={{fontSize:11, color:'#888', fontWeight:700}}>TIENDA GUARDADA</p><p style={{fontWeight:900}}>{mySlug}</p></div>
                <button onClick={borrar} style={{background:'#fff', border:'1px solid #E8E0D9', padding:'6px 10px', borderRadius:999, fontSize:11, fontWeight:700}}>Cambiar</button>
              </div>
            )}

            <p style={{fontSize:12, fontWeight:800, marginTop:14, marginBottom:8}}>PIN de 6 dígitos</p>
            <div style={{position:'relative'}}>
              <input className="input pin-input" type={showPin ? 'text' : 'password'} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="••••••" maxLength={6} inputMode="numeric"/>
              <button onClick={()=>setShowPin(!showPin)} style={{position:'absolute', right:10, top:10, background:'#F5F1ED', border:'none', padding:'6px 10px', borderRadius:999, fontSize:11, fontWeight:700}}>{showPin ? 'Ocultar' : 'Ver'}</button>
            </div>

            {error && <p style={{fontSize:12, color:'#FF3B30', background:'#FFF0F0', padding:'8px 10px', borderRadius:10, marginTop:10, fontWeight:700}}>{error}</p>}

            <button onClick={login} disabled={loading} className="btn" style={{background:'#111', color:'#fff', marginTop:14, opacity: loading ? 0.6 : 1}}>
              {loading ? 'Verificando...' : '🔓 Entrar a mi panel'}
            </button>

            <div style={{marginTop:12, background:'#FFF7E8', border:'1px solid #FFD9A0', borderRadius:12, padding:'10px 12px'}}>
              <p style={{fontSize:11, fontWeight:800}}>¿Olvidaste tu PIN?</p>
              <p style={{fontSize:11, color:'#666', marginTop:4}}>Contacta a soporte por WhatsApp con tu link de tienda y te lo reseteamos en 2 min.</p>
              <a href="https://wa.me/50581732620?text=Hola%20olvide%20mi%20PIN%20de%20mi%20tienda" style={{display:'inline-block', marginTop:6, fontSize:11, background:'#25D366', color:'#fff', padding:'6px 12px', borderRadius:999, fontWeight:800, textDecoration:'none'}}>WhatsApp Soporte</a>
            </div>
          </div>
        )}

        {step === 'setpin' && (
          <div className="card">
            <p style={{fontSize:16, fontWeight:900}}>¡Crea tu PIN por primera vez!</p>
            <p style={{fontSize:12, color:'#666', marginTop:4}}>Tienda: <b>{storeInfo?.name} - {storeInfo?.slug}</b></p>
            <p style={{fontSize:11, color:'#888', marginTop:6}}>Esta tienda aún no tiene PIN. Crea uno de 6 dígitos que solo tú sabrás.</p>

            <p style={{fontSize:12, fontWeight:800, marginTop:14}}>Nuevo PIN (6 números)</p>
            <input className="input pin-input" type={showPin ? 'text' : 'password'} value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="Ej: 123456" maxLength={6} inputMode="numeric"/>

            <p style={{fontSize:12, fontWeight:800, marginTop:12}}>Confirmar PIN</p>
            <input className="input pin-input" type={showPin ? 'text' : 'password'} value={confirmPin} onChange={e=>setConfirmPin(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="Repite PIN" maxLength={6} inputMode="numeric"/>

            {error && <p style={{fontSize:12, color:'#FF3B30', background:'#FFF0F0', padding:'8px 10px', borderRadius:10, marginTop:10, fontWeight:700}}>{error}</p>}

            <button onClick={establecerPin} disabled={loading} className="btn" style={{background:'#FF8A00', color:'#fff', marginTop:14}}>
              {loading ? 'Guardando...' : '💾 Guardar mi PIN'}
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="card" style={{textAlign:'center'}}>
            <p style={{fontSize:32}}>✅</p>
            <p style={{fontWeight:900, fontSize:18, marginTop:6}}>¡Acceso concedido!</p>
            <p style={{fontSize:13, color:'#666', marginTop:4}}>{storeInfo?.name || mySlug} • PIN verificado</p>

            <div style={{display:'flex', flexDirection:'column', gap:10, marginTop:16}}>
              <button onClick={irTienda} className="btn" style={{background:'#F5F1ED', color:'#000', border:'1px solid #E8E0D9'}}>🏪 Ver mi tienda</button>
              <button onClick={irAdmin} className="btn" style={{background:'#0066FF', color:'#fff'}}>⚙️ Ir a mi Panel (admin)</button>
            </div>

            <p style={{fontSize:10, color:'#999', marginTop:12}}>PIN guardado seguro en este celular. Si cambias de teléfono, vuelve a ponerlo aquí.</p>
            <button onClick={borrar} style={{marginTop:10, background:'transparent', border:'none', color:'#999', fontSize:11, textDecoration:'underline'}}>Cerrar sesión y cambiar tienda</button>
          </div>
        )}

        <div style={{marginTop:16, display:'flex', gap:8}}>
          <a href="https://wa.me/50581732620" style={{flex:1, background:'#25D366', color:'#fff', textDecoration:'none', padding:'12px', borderRadius:999, fontWeight:900, fontSize:13, textAlign:'center'}}>Ayuda</a>
          <a href="/" style={{flex:1, background:'#fff', border:'1px solid #EDE6DF', color:'#000', textDecoration:'none', padding:'12px', borderRadius:999, fontWeight:800, fontSize:13, textAlign:'center'}}>Market</a>
        </div>
      </div>
    </main>
  )
}
