'use client'
import { useState, useEffect, use } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey? createClient(supabaseUrl, supabaseKey) : null

export default function AdminPage({ params }){
 const { slug } = use(params)
 const [loading, setLoading] = useState(true)
 const [store, setStore] = useState(null)
 const [prods, setProds] = useState([])

 useEffect(()=>{
   if(!supabase){
     console.error('Falta NEXT_PUBLIC_SUPABASE_URL o ANON_KEY en Vercel')
     setLoading(false)
     return
   }
   if(!slug) return
   ;(async()=>{
     try{
       const { data: s } = await supabase.from('stores').select('*').eq('slug', slug).single()
       setStore(s)
       if(s){
         const { data: p } = await supabase.from('products').select('*').eq('store_id', s.id).order('created_at',{ascending:false})
         setProds(p||[])
       }
     }catch(e){ console.error(e) }
     setLoading(false)
   })()
 },[slug])

 if(!supabaseUrl ||!supabaseKey){
   return <div style={{padding:40}}>Error: Falta configurar NEXT_PUBLIC_SUPABASE_URL y ANON_KEY en Vercel - Settings - Environment Variables - All Environments y hacer Redeploy</div>
 }
 if(loading) return <div style={{padding:40}}>Cargando admin {slug}...</div>
 if(!store) return <div style={{padding:40}}>Tienda {slug} no encontrada. Creala primero en /admin</div>

 return (
   <main style={{padding:20, maxWidth:800, margin:'0 auto'}}>
     <h1 style={{fontWeight:900, fontSize:20}}>Admin - {store.name}</h1>
     <p style={{marginTop:8}}>WhatsApp: {store.whatsapp}</p>
     <p style={{marginTop:20, fontWeight:700}}>{prods.length} productos</p>
     <div style={{marginTop:16, display:'grid', gap:8}}>
       {prods.map(p=><div key={p.id} style={{border:'1px solid #eee', padding:10, borderRadius:10, display:'flex', gap:10}}>
         <img src={p.image_url} style={{width:60, height:60, objectFit:'cover', borderRadius:8}}/>
         <div><b>{p.name}</b><br/>C$ {p.price}</div>
       </div>)}
     </div>
   </main>
 )
}