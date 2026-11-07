'use client'
import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key||!url.startsWith('http')) return null
  return createClient(url,key)
}

function hashIP(ip){
  try{
    let h=0
    for(let i=0;i<ip.length;i++){ h = ((h<<5)-h)+ip.charCodeAt(i); h|=0 }
    return h.toString(36)
  }catch{ return 'unknown' }
}

export default function VisitTracker(){
  useEffect(()=>{
    // Evitar contar 2 veces en la misma sesion (15 min)
    const last = typeof window !== 'undefined' ? sessionStorage.getItem('tn_visit_logged') : null
    if(last && Date.now() - parseInt(last) < 15*60*1000) return

    const supabase = getSupabase()
    if(!supabase) return

    const pagina = window.location.pathname + window.location.search
    const referrer = document.referrer || ''
    const userAgent = navigator.userAgent || ''
    
    // Vercel ya inyecta geo en headers, pero desde cliente lo leemos de la API interna si existe
    // Por ahora guardamos lo que tenemos, el departamento lo sacamos en el servidor mas adelante
    const payload = {
      pagina: pagina.slice(0, 200),
      slug: window.location.pathname.split('/').filter(Boolean)[0] || null,
      pais: 'NI',
      ip_hash: hashIP(userAgent + pagina).slice(0, 20),
      user_agent: userAgent.slice(0, 250),
      referrer: referrer.slice(0, 250),
    }

    // Intentar obtener geo desde una API ligera si existe /api/geo, si no, solo guarda pagina
    // No bloquea la pagina
    fetch('/api/geo').then(r=>r.json()).then(geo=>{
      if(geo){
        payload.departamento = geo.departamento || geo.region || geo.city || null
        payload.municipio = geo.municipio || geo.city || null
        payload.ciudad_raw = geo.city || null
        payload.pais = geo.country || 'NI'
      }
      return supabase.from('visitas_market').insert(payload)
    }).catch(()=>{
      // Si no hay /api/geo, igual inserta sin geo
      supabase.from('visitas_market').insert(payload)
    }).then(()=>{
      try{ sessionStorage.setItem('tn_visit_logged', Date.now().toString()) }catch{}
    })

  },[])

  return null
}
