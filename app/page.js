'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key||!url.startsWith('http')) return null
  return createClient(url,key)
}

export default function Home(){
  const [form,setForm]=useState({slug:'',name:'',whatsapp:'',desc:''})
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState('')

  const createStore=async(e)=>{
    e.preventDefault()
    const supabase=getSupabase()
    if(!supabase){ setMsg('Falta conectar Supabase en Vercel'); return }
    if(!form.slug.match(/^[a-z0-9-]+$/)){ setMsg('Slug solo minusculas, numeros y guiones'); return }
    setLoading(true)
    try{
      const {data,error}=await supabase.from('stores').insert({
        slug: form.slug.toLowerCase(),
        name: form.name,
        whatsapp: form.whatsapp.replace(/[^0-9]/g,''),
        description: form.desc,
        tipo_tienda: 'boutique'
      }).select().single()
      if(error) throw error
      setMsg(`✅ Tienda creada! Ve a tiendanica.store/${data.slug} y admin en /${data.slug}/admin`)
      setForm({slug:'',name:'',whatsapp:'',desc:''})
    }catch(err){ setMsg('Error: '+err.message) }
    setLoading(false)
  }

  return (
    <main style={{minHeight:'100vh', background:'#0A0A0A', color:'#fff', padding:20}}>
      <div style={{maxWidth:900, margin:'0 auto'}}>
        <h1 style={{fontSize:32, fontWeight:900}}>TiendaNica.Store</h1>
        <p style={{opacity:0.7, marginTop:8}}>Crea tu tienda en 30 segundos. Boutique con tallas, carrito y WhatsApp.</p>
        
        <div style={{marginTop:30, background:'#fff', color:'#000', borderRadius:20, padding:20}}>
          <h2 style={{fontWeight:900, fontSize:18}}>Crear nueva tienda</h2>
          <form onSubmit={createStore} style={{marginTop:16, display:'grid', gap:12}}>
            <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nombre de la tienda (Ej: Moda Nica)" style={{border:'1px solid #ddd', padding:12, borderRadius:12}}/>
            <input required value={form.slug} onChange={e=>setForm({...form,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-')})} placeholder="slug unico (Ej: moda-nica) - sera tu link" style={{border:'1px solid #ddd', padding:12, borderRadius:12}}/>
            <input required value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} placeholder="WhatsApp con codigo pais (Ej: 50588888888)" style={{border:'1px solid #ddd', padding:12, borderRadius:12}}/>
            <input value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Descripcion corta" style={{border:'1px solid #ddd', padding:12, borderRadius:12}}/>
            <button disabled={loading} style={{background:'#000', color:'#fff', padding:14, borderRadius:999, fontWeight:900, border:'none'}}>{loading?'Creando...':'Crear tienda'}</button>
          </form>
          {msg && <div style={{marginTop:12, background:'#f5f5f5', padding:10, borderRadius:10, fontSize:13}}>{msg}</div>}
        </div>

        <div style={{marginTop:30}}>
          <a href="/admin" style={{color:'#00E676', textDecoration:'underline'}}>Ver todas las tiendas → /admin</a>
        </div>
      </div>
    </main>
  )
}
