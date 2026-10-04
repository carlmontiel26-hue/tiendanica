'use client'
import { useState, useEffect, use } from 'react'
import { getSupabase } from '../lib/supabaseClient'

export default function Page({ params }){
 const { slug } = use(params)
 const [store,setStore]=useState(null)
 const [prods,setProds]=useState([])
 const [cart,setCart]=useState([])
 const [sel,setSel]=useState(null)
 const [showCart,setShowCart]=useState(false)
 const [showBebidas,setShowBebidas]=useState(false)
 const [tallaSel,setTallaSel]=useState(null)
 const [currentImg,setCurrentImg]=useState(0)
 const [filtroCat,setFiltroCat]=useState(null)
 const [busqueda,setBusqueda]=useState('')
 const [error,setError]=useState(null)

 useEffect(()=>{
   if(!slug) return
   const supabase = getSupabase()
   if(!supabase) return
   ;(async()=>{
     try{
       const {data:s, error:e1}=await supabase.from('stores').select('*').eq('slug',slug).single()
       if(e1) throw e1
       if(s){
         setStore(s)
         const {data:p}=await supabase.from('products').select('*').eq('store_id',s.id).eq('is_active',true).order('created_at',{ascending:false})
         setProds(p||[])
       } else {
         setError('Tienda no encontrada')
       }
     }catch(err){
       setError(err.message)
     }
   })()
 },[slug])

 useEffect(()=>{if(sel){ setTallaSel(null); setCurrentImg(0) }},[sel])

 const add=(pr,talla=null)=>{
   if(store?.tipo_tienda==='boutique'&&pr.tallas?.length>0&&!talla) return false
   setCart(v=>{
     const key=talla?pr.id+'-'+talla:pr.id
     const ex=v.find(i=>i.cartId===key)
     if(ex) return v.map(i=>i.cartId===key?{...i,qty:i.qty+1}:i)
     return [...v,{...pr,cartId:key,qty:1,tallaSel:talla}]
   })
   return true
 }

 const total=cart.reduce((s,i)=>s+i.price*i.qty,0)
 const count=cart.reduce((s,i)=>s+i.qty,0)

 const sendWACart=()=>{
   if(cart.length===0) return
   let m=`Hola ${store.name}! \nQuiero hacer este pedido:\n\n`
   cart.forEach(i=>{ m+=`• ${i.qty}x ${i.name}${i.tallaSel?' (Talla: '+i.tallaSel+')':''} - C$ ${i.price*i.qty}\n` })
   m+=`\nTotal: C$ ${total}\nhttps://tiendanica.store/${store.slug}`
   window.open(`https://api.whatsapp.com/send?phone=${store.whatsapp}&text=${encodeURIComponent(m)}`,'_blank')
 }

 const buyNowDirect=()=>{
   if(!sel) return
   if(store.tipo_tienda==='boutique'&&sel.tallas?.length>0&&!tallaSel){ alert('Selecciona una talla'); return }
   let m=`Hola ${store.name}! \nQuiero comprar:\n• 1x ${sel.name}${tallaSel?` (Talla: ${tallaSel})`:''} - C$ ${sel.price}\nhttps://tiendanica.store/${store.slug}`
   window.open(`https://api.whatsapp.com/send?phone=${store.whatsapp}&text=${encodeURIComponent(m)}`,'_blank')
 }

 const getImgs=(pr)=>{
   if(!pr) return []
   const main = pr.image_url ? [pr.image_url] : []
   const extras = Array.isArray(pr.extra_images) ? pr.extra_images : []
   return [...main, ...extras].filter(Boolean).slice(0,3)
 }

 if(error) return <div style={{padding:40, background:'#000', color:'#fff'}}>Error: {error}<br/>Slug: {slug}</div>
 if(!store) return <div style={{padding:40, background:'#000', color:'#fff'}}>Cargando {slug}...</div>

 const isComida=store.tipo_tienda==='comida'
 const isBoutique=store.tipo_tienda==='boutique'
 let platos=isComida?prods.filter(p=>!p.categoria||p.categoria==='plato'):prods
 const bebidas=isComida?prods.filter(p=>p.categoria==='bebida'||p.categoria==='extra'):[]

 if(isBoutique){
   let tmp=[...platos]
   if(busqueda.trim()){
     const q=busqueda.toLowerCase()
     tmp=tmp.filter(p=> (p.name||'').toLowerCase().includes(q))
   }
   if(filtroCat){
     tmp=tmp.filter(p=> (p.categoria||'')===filtroCat)
   }
   platos=tmp
 }

 const cover=store.cover_image || store.image_url || prods[0]?.image_url || ''
 let catsDisponibles=[]
 if(isBoutique){
   const cSet=new Set()
   prods.forEach(p=>{ if(p.categoria && p.categoria!=='plato') cSet.add(p.categoria) })
   catsDisponibles=Array.from(cSet)
 }

 return(
 <main style={{minHeight:'100vh', background:isBoutique?'#F6F3F0':'#0A0A0A', color:isBoutique?'#000':'#fff', paddingBottom:80}}>
  <div style={{height:520, position:'relative', background:'#000'}}>
    {cover && <img src={cover} alt={store.name} style={{width:'100%', height:'100%', objectFit:'cover'}} />}
    <div style={{position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.85), transparent)'}} />
    <div style={{position:'absolute', bottom:20, left:16, right:16, background:'rgba(255,255,255,0.92)', borderRadius:16, padding:14}}>
      <h1 style={{fontWeight:900, fontSize:18, textTransform:'uppercase', color:'#000'}}>{store.name}</h1>
      <p style={{fontSize:12, marginTop:4, color:'#000'}}>{store.description}</p>
    </div>
  </div>

  <div style={{position:'fixed', bottom:24, right:16, zIndex:100, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8}}>
   {showCart&&<div style={{background:'#fff', color:'#000', borderRadius:20, padding:16, width:'90vw', maxWidth:360, boxShadow:'0 20px 40px rgba(0,0,0,0.3)'}}>
     <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}><b>{cart.length>0?`Mi Pedido (${count})`:'Carrito vacio'}</b><button onClick={()=>setShowCart(false)}>X</button></div>
     {cart.map(i=><div key={i.cartId} style={{display:'flex', gap:8, background:'rgba(0,0,0,0.05)', borderRadius:12, padding:8, marginBottom:6, alignItems:'center'}}>
       <img src={i.image_url} style={{width:40, height:40, borderRadius:8, objectFit:'cover'}}/>
       <div style={{fontSize:12, flex:1}}><b>{i.name}</b>{i.tallaSel&&<span style={{background:'#000', color:'#fff', fontSize:9, padding:'2px 6px', borderRadius:99, marginLeft:6}}>Talla {i.tallaSel}</span>}<br/>{i.qty}x C$ {i.price}</div>
       <button onClick={()=>setCart(v=>v.filter(x=>x.cartId!==i.cartId))}>🗑</button>
     </div>)}
     <div style={{marginTop:8, fontWeight:900}}>Total C$ {total}</div>
     <button onClick={sendWACart} style={{marginTop:10, width:'100%', background:'#00E676', padding:12, borderRadius:999, fontWeight:900, border:'none'}}>Enviar WhatsApp</button>
   </div>}
   <button onClick={()=>setShowCart(!showCart)} style={{background:'#000', color:'#fff', padding:'14px 20px', borderRadius:999, fontWeight:900, border:'none'}}>🛒 {count?count+' - C$ '+total:'Carrito'}</button>
  </div>

  <div style={{maxWidth:1120, margin:'0 auto', padding:16}}>
   {isBoutique && (
     <div style={{background:'#fff', borderRadius:16, padding:12, marginBottom:16, display:'flex', flexDirection:'column', gap:10}}>
       <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar prenda..." style={{flex:1, border:'1px solid #e5e5e5', borderRadius:999, padding:'10px 14px', fontSize:12, color:'#000', width:'100%'}}/>
       {catsDisponibles.length>0 && (
         <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
           <button onClick={()=>setFiltroCat(null)} style={{padding:'8px 14px', borderRadius:999, fontSize:12, fontWeight:700, border:'1px solid #000', background:filtroCat===null?'#000':'#fff', color:filtroCat===null?'#fff':'#000'}}>Todo</button>
           {catsDisponibles.map(c=><button key={c} onClick={()=>setFiltroCat(c===filtroCat?null:c)} style={{padding:'8px 14px', borderRadius:999, fontSize:12, fontWeight:700, border:'1px solid #ddd', background:filtroCat===c?'#000':'#fff', color:filtroCat===c?'#fff':'#000', textTransform:'capitalize'}}>{c}</button>)}
         </div>
       )}
       <div style={{fontSize:11, opacity:0.6, color:'#000'}}>{platos.length} productos</div>
     </div>
   )}
   <div style={{display:'grid', gap:16, gridTemplateColumns:'repeat(2,1fr)'}}>
    {platos.map((pr)=>{
      const imgs = getImgs(pr)
      return <div key={pr.id} style={{background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
        <button onClick={()=>setSel(pr)} style={{width:'100%', aspectRatio:'4/5', position:'relative', border:'none', background:'#FBF9F7', cursor:'pointer'}}>
          <img src={pr.image_url} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
          {imgs.length>1&&<span style={{position:'absolute', top:10, left:10, background:'rgba(0,0,0,0.8)', color:'#fff', fontSize:9, padding:'4px 8px', borderRadius:999}}>{imgs.length} fotos</span>}
        </button>
        <div style={{padding:10}}>
          <p style={{fontSize:11, color:'#000', lineHeight:1.2}}>{pr.name}</p>
          <p style={{fontWeight:900, fontSize:13, marginTop:4, color:'#000'}}>C$ {pr.price}</p>
          <button onClick={()=>setSel(pr)} style={{marginTop:8, width:'100%', background:'#00E676', color:'#000', padding:10, borderRadius:999, fontSize:11, fontWeight:900, border:'none', cursor:'pointer'}}>Comprar por WhatsApp</button>
        </div>
      </div>
    })}
   </div>
  </div>

  {sel&&<div style={{position:'fixed', inset:0, zIndex:200, background:'#000', display:'flex', flexDirection:'column'}} onClick={()=>setSel(null)}>
    <div style={{flex:1, position:'relative', background:'#000', overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      <img src={getImgs(sel)[currentImg]||sel.image_url} style={{width:'100%', height:'100%', objectFit:'contain'}}/>
      <button onClick={()=>setSel(null)} style={{position:'absolute', top:14, right:14, background:'#fff', color:'#000', width:38, height:38, borderRadius:999, fontWeight:900, border:'none'}}>X</button>
      {getImgs(sel).length>1&&<><span style={{position:'absolute', top:14, left:14, background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:10, padding:'5px 10px', borderRadius:999}}>{currentImg+1}/{getImgs(sel).length}</span><button onClick={()=>setCurrentImg(c=> c===0? getImgs(sel).length-1 : c-1)} style={{position:'absolute', left:10, top:'50%', background:'rgba(255,255,255,0.9)', width:36, height:36, borderRadius:999, border:'none'}}>‹</button><button onClick={()=>setCurrentImg(c=> c===getImgs(sel).length-1? 0 : c+1)} style={{position:'absolute', right:10, top:'50%', background:'rgba(255,255,255,0.9)', width:36, height:36, borderRadius:999, border:'none'}}>›</button></>}
    </div>
    <div style={{background:'#fff', borderTopLeftRadius:28, borderTopRightRadius:28, padding:18, marginTop:-20, position:'relative'}} onClick={e=>e.stopPropagation()}>
      <h3 style={{fontWeight:900, fontSize:18, color:'#000'}}>{sel.name}</h3><p style={{fontWeight:900, fontSize:17, color:'#000', marginTop:4}}>C$ {sel.price}</p>
      {isBoutique&&sel.tallas?.length>0&&<div style={{marginTop:10}}><p style={{fontWeight:700, fontSize:12, color:'#000'}}>Elige tu talla {tallaSel&&<span style={{color:'#00C853'}}>• {tallaSel}</span>}</p><div style={{display:'flex', flexWrap:'wrap', gap:6, marginTop:8}}>{sel.tallas.map(t=><button key={t} onClick={()=>setTallaSel(t)} style={{minWidth:40, height:40, padding:'0 12px', borderRadius:999, fontSize:12, fontWeight:800, border:tallaSel===t?'2px solid #000':'1.2px solid #000', background:tallaSel===t?'#000':'#fff', color:tallaSel===t?'#fff':'#000'}}>{t}</button>)}</div></div>}
      <div style={{display:'flex', gap:10, marginTop:16}}>
        <button onClick={()=>setSel(null)} style={{flex:0.7, background:'#F0F0F0', padding:12, borderRadius:999, fontWeight:700, color:'#000', border:'none'}}>Cerrar</button>
        <button onClick={buyNowDirect} disabled={isBoutique&&sel.tallas?.length>0&&!tallaSel} style={{flex:1.3, background:isBoutique&&sel.tallas?.length>0&&!tallaSel?'#ccc':'#00E676', color:'#000', padding:12, borderRadius:999, fontWeight:900, border:'none'}}>Comprar WhatsApp</button>
      </div>
      <button onClick={()=>{ if(add(sel,tallaSel)){ setShowCart(true); setSel(null) } }} disabled={isBoutique&&sel.tallas?.length>0&&!tallaSel} style={{marginTop:8, width:'100%', background:'#000', color:'#fff', padding:10, borderRadius:999, fontWeight:700, border:'none', fontSize:12}}>Anadir al carrito {tallaSel?`(Talla ${tallaSel})`:''}</button>
    </div>
  </div>}

 </main>
 )
}
