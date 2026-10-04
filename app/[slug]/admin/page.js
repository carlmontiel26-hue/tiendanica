'use client'
import { useState, useEffect, use } from 'react'
import { createClient } from '@supabase/supabase-js'
function getSupabase(){ const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; if(!url||!key) return null; return createClient(url,key) }

export default function AdminPage({ params }){
 const { slug } = use(params)
 const [loading, setLoading] = useState(true)
 const [store, setStore] = useState(null)
 const [prods, setProds] = useState([])
 const [envError, setEnvError] = useState(false)

 useEffect(()=>{
   const supabase = getSupabase()
   if(!supabase){
     setEnvError(true)
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

 if(envError){
   return <div style={{padding:40}}>Falta env vars en Vercel - Settings - Environment Variables</div>
 }
 if(loading) return <div style={{padding:40}}>Cargando admin {slug}...</div>
 if(!store) return <div style={{padding:40}}>Tienda {slug} no encontrada</div>

 return (
   <main style={{padding:20, maxWidth:800, margin:'0 auto'}}>
     <h1 style={{fontWeight:900, fontSize:20}}>Admin - {store.name}</h1>
     <p>{prods.length} productos</p>
     <div style={{marginTop:16, display:'grid', gap:8}}>
       {prods.map(p=><div key={p.id} style={{border:'1px solid #eee', padding:10, borderRadius:10, display:'flex', gap:10}}>
         <img src={p.image_url} style={{width:60, height:60, objectFit:'cover', borderRadius:8}}/>
         <div><b>{p.name}</b><br/>C$ {p.price}</div>
       </div>)}
     </div>
   </main>
 )
}
