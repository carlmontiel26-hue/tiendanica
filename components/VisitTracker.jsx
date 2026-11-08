'use client'
import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key||!url.startsWith('http')) return null
  return createClient(url,key)
}

export default function VisitTracker(){
  useEffect(()=>{
    const supabase = getSupabase()
    if(!supabase){
      console.log('[TN Visitas] Supabase no configurado')
      return
    }

    const run = async ()=>{
      try{
        const pagina = window.location.pathname + window.location.search
        const referrer = document.referrer || ''
        const userAgent = navigator.userAgent || ''
        
        let departamento = 'Desconocido'
        let municipio = ''
        let ciudad_raw = ''
        let pais = 'NI'

        try{
          const geoRes = await fetch('/api/geo', { cache: 'no-store' })
          if(geoRes.ok){
            const geo = await geoRes.json()
            departamento = geo.departamento || geo.region || geo.city || 'Desconocido'
            municipio = geo.municipio || geo.city || ''
            ciudad_raw = geo.city || ''
            pais = geo.country || 'NI'
            console.log('[TN Visitas] GEO:', geo)
          }
        }catch(e){
          console.log('[TN Visitas] /api/geo no disponible, guardando sin geo', e.message)
        }

        const payload = {
          pagina: pagina.slice(0, 200),
          slug: window.location.pathname.split('/').filter(Boolean)[0] || null,
          departamento: departamento,
          municipio: municipio,
          ciudad_raw: ciudad_raw,
          pais: pais,
          ip_hash: Math.random().toString(36).slice(2,10),
          user_agent: userAgent.slice(0, 250),
          referrer: referrer.slice(0, 250),
        }

        console.log('[TN Visitas] Insertando:', payload)

        const { error, data } = await supabase.from('visitas_market').insert(payload).select()

        if(error){
          console.error('[TN Visitas] Error insert:', error.message, error)
          // Si falla por RLS, muestra hint
          if(error.message.includes('RLS') || error.message.includes('policy')){
            console.error('[TN Visitas] FIX: Corre FIX_VISITAS_RLS.sql en Supabase')
          }
        }else{
          console.log('[TN Visitas] OK guardado:', data)
          try{ sessionStorage.setItem('tn_visit_logged_v2', Date.now().toString()) }catch{}
        }

      }catch(e){
        console.error('[TN Visitas] Fatal:', e)
      }
    }

    // Evita doble conteo rapido pero permite ver si funciona
    const last = typeof window !== 'undefined' ? sessionStorage.getItem('tn_visit_logged_v2') : null
    if(last && Date.now() - parseInt(last) < 2*60*1000){
      console.log('[TN Visitas] Ya contado hace poco, skip (2 min)')
      return
    }

    // Delay 1 seg para no bloquear carga inicial
    setTimeout(run, 1000)

  },[])

  return null
}
