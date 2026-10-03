'use client'
import { useState, useEffect, use } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function TiendaClient({ params }){
 const { slug } = use(params) // <-- FIX: Next 15 params es promesa
 const [store,setStore]=useState(null); const [prods,setProds]=useState([]); const [cart,setCart]=useState([])
 const [sel,setSel]=useState(null); const [showCart,setShowCart]=useState(false); const [showBebidas,setShowBebidas]=useState(false)
 const [tallaSel,setTallaSel]=useState(null)
 const [currentImg, setCurrentImg] = useState(0)
 const [filtroCat, setFiltroCat]=useState(null)
 const [busqueda, setBusqueda]=useState('')
 const [error, setError]=useState(null)

 useEffect(()=>{
   if(!slug) return;
   (async()=>{
     try{
       const {data:s, error:e1}=await supabase.from('stores').select('*').eq('slug',slug).single()
       if(e1) throw e1
       if(s){
         setStore(s);
         const {data:p, error:e2}=await supabase.from('products').select('*').eq('store_id',s.id).eq('is_active',true).order('created_at',{ascending:false});
         if(e2) throw e2
         setProds(p||[])
       } else {
         setError('Tienda no encontrada: '+slug)
       }
     }catch(err){
       console.error(err)
       setError(err.message)
     }
 })()},[slug])