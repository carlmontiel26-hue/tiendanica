'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  try{
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
    const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
    if(!url ||!key) return null
    if(!url.startsWith('http')) return null
    return createClient(url, key)
  }catch(e){ return null }
}

export default function Page(){
 const params = useParams()
 const slug = params?.slug
 const [store,setStore]=useState(null)
 const [prods,setProds]=useState([])
 const [cart,setCart]=useState([])
 const [sel,setSel]=useState(null)
 const [showCart,setShowCart]=useState(false)
 const [tallaSel,setTallaSel]=useState(null)
 const [currentImg,setCurrentImg]=useState(0)
 const [filtroCat,setFiltroCat]=useState(null)
 const [busqueda,setBusqueda]=useState('')
 const [error,setError]=useState(null)

 useEffect(()=>{
   if(!slug) return
   const supabase = getSupabase()
   if(!supabase){ setError('Falta env vars en Vercel - Production'); return }
   ;(async()=>{
     try{
       const {data:s}=await supabase.from('stores').select('*').eq('slug',slug).single()
       if(s){ setStore(s); const {data:p}=await supabase.from('products').select('*').eq('store_id',s.id).eq('is_active',true).order('created_at',{ascending:false}); setProds(p||[]) }
       else setError('Tienda no encontrada')
     }catch(err){ setError(err.message) }
   })()
 },[slug])

 useEffect(()=>{if(sel){ setTallaSel(null); setCurrentImg(0) }},[sel])
 const add=(pr,talla=null)=>{ if(store?.tipo_tienda==='boutique'&&pr.tallas?.length>0&&!talla) return false; setCart(v=>{ const key=talla?pr.id+'-'+talla:pr.id; const ex=v.find(i=>i.cartId===key); if(ex) return v.map(i=>i.cartId===key?{...i,qty:i.qty+1}:i); return [...v,{...pr,cartId:key,qty:1,tallaSel:talla}] }); return true }
 const total=cart.reduce((s,i)=>s+i.price*i.qty,0)
 const count=cart.reduce((s,i)=>s+i.qty,0)
 const sendWACart=()=>{ let m=`Hola ${store.name}! \nPedido:\n\n`; cart.forEach(i=>{ m+=`• ${i.qty}x ${i.name}${i.tallaSel?' (Talla: '+i.tallaSel+')':''} - C$ ${i.price*i.qty}\n` }); m+=`\nTotal: C$ ${total}\nhttps://tiendanica.store/${store.slug}`; window.open(`https://api.whatsapp.com/send?phone=${store.whatsapp}&text=${encodeURIComponent(m)}`,'_blank') }
 const buyNowDirect=()=>{ if(!sel) return; if(store.tipo_tienda==='boutique'&&sel.tallas?.length>0&&!tallaSel){ alert('Selecciona una talla'); return } let m=`Hola ${store.name}! \nQuiero: 1x ${sel.name}${tallaSel?` (Talla: ${tallaSel})`:''} - C$ ${sel.price}\nhttps://tiendanica.store/${store.slug}`; window.open(`https://api.whatsapp.com/send?phone=${store.whatsapp}&text=${encodeURIComponent(m)}`,'_blank') }
 const getImgs=(pr)=>{ if(!pr) return []; const main = pr.image_url? [pr.image_url] : []; const extras = Array.isArray(pr.extra_images)? pr.extra_images : []; return [...main,...extras].filter(Boolean).slice(0,3) }
 if(error) return <div style={{padding:40, background:'#000', color:'#fff'}}>Error: {error}<br/>Slug: {slug}</div>
 if(!store) return <div style={{padding:40, background:'#000', color:'#fff'}}>Cargando {slug}...</div>
 const isBoutique=store.tipo_tienda==='boutique'
 let platos=store.tipo_tienda==='comida'?prods.filter(p=>!p.categoria||p.categoria==='plato'):prods
 if(isBoutique){ let tmp=[...platos]; if(busqueda.trim()){ const q=busqueda.toLowerCase(); tmp=tmp.filter(p=> (p.name||'').toLowerCase().includes(q)) } if(filtroCat){ tmp=tmp.filter(p=> (p.categoria||'')===filtroCat) } platos=tmp }
 const cover=store.cover_image || store.image_url || prods[0]?.image_url || ''
 let catsDisponibles=[]; if(isBoutique){ const cSet=new Set(); prods.forEach(p=>{ if(p.categoria && p.categoria!=='plato') cSet.add(p.categoria) }); catsDisponibles=Array.from(cSet) }
 return(<main style={{minHeight:'100vh', background:isBoutique?'#F6F3F0':'#0A0A0A', color:isBoutique?'#000':'#fff', paddingBottom:80}}>
  <div style={{height:520, position:'relative', background:'#000'}}>{cover && <img src={cover} alt={store.name} style={{width:'100%', height:'100%', objectFit:'cover'}} />}<div style={{position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.85), transparent)'}} /><div style={{position:'absolute', bottom:20, left:16, right:16, background:'rgba(255,255,255,0.92)', borderRadius:16, padding:14}}><h1 style={{fontWeight:900, fontSize:18, textTransform:'uppercase', color:'#000'}}>{store.name}</h1><p style={{fontSize:12, marginTop:4, color:'#000'}}>{store.description}</p></div></div>
  <div style={{position:'fixed', bottom:24, right:16, zIndex:100}}><button onClick={()=>setShowCart(!showCart)} style={{background:'#000', color:'#fff', padding:'14px 20px', borderRadius:999, fontWeight:900, border:'none'}}>🛒 {count?count+' - C$ '+total:'Carrito'}</button></div>
  <div style={{maxWidth:1120, margin:'0 auto', padding:16}}><div style={{display:'grid', gap:16, gridTemplateColumns:'repeat(2,1fr)'}}>{platos.map(pr=><div key={pr.id} style={{background:'#fff', borderRadius:20, overflow:'hidden'}}><button onClick={()=>setSel(pr)} style={{width:'100%', aspectRatio:'4/5', border:'none', background:'#FBF9F7'}}><img src={pr.image_url} style={{width:'100%', height:'100%', objectFit:'cover'}}/></button><div style={{padding:10}}><p style={{fontSize:11, color:'#000'}}>{pr.name}</p><p style={{fontWeight:900, fontSize:13, marginTop:4, color:'#000'}}>C$ {pr.price}</p><button onClick={()=>setSel(pr)} style={{marginTop:8, width:'100%', background:'#00E676', color:'#000', padding:10, borderRadius:999, fontSize:11, fontWeight:900, border:'none'}}>Comprar</button></div></div>)}</div></div>
  {sel&&<div style={{position:'fixed', inset:0, zIndex:200, background:'#000', display:'flex', flexDirection:'column'}} onClick={()=>setSel(null)}><div style={{flex:1, position:'relative'}} onClick={e=>e.stopPropagation()}><img src={getImgs(sel)[currentImg]||sel.image_url} style={{width:'100%', height:'100%', objectFit:'contain'}}/><button onClick={()=>setSel(null)} style={{position:'absolute', top:14, right:14, background:'#fff', color:'#000', width:38, height:38, borderRadius:999, border:'none'}}>X</button></div><div style={{background:'#fff', borderTopLeftRadius:28, borderTopRightRadius:28, padding:18, marginTop:-20}} onClick={e=>e.stopPropagation()}><h3 style={{fontWeight:900, color:'#000'}}>{sel.name}</h3><p style={{fontWeight:900, color:'#000'}}>C$ {sel.price}</p><button onClick={buyNowDirect} style={{marginTop:10, width:'100%', background:'#00E676', padding:12, borderRadius:999, fontWeight:900, border:'none'}}>Comprar WhatsApp</button></div></div>}
 </main>)
}