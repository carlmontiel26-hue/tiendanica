'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key||!url.startsWith('http')) return null
  return createClient(url,key)
}

export default function StorePremium(){
  const { slug } = useParams()
  const [store,setStore]=useState(null)
  const [prods,setProds]=useState([])
  const [cart,setCart]=useState([])
  const [sel,setSel]=useState(null)
  const [showCart,setShowCart]=useState(false)
  const [talla,setTalla]=useState(null)
  const [imgIdx,setImgIdx]=useState(0)
  const [cat,setCat]=useState(null)
  const [q,setQ]=useState('')

  useEffect(()=>{
    if(!slug) return
    const supabase=getSupabase()
    supabase.from('stores').select('*').eq('slug',slug).single().then(({data})=>{
      if(!data) return
      setStore(data)
      supabase.from('products').select('*').eq('store_id',data.id).eq('is_active',true).order('created_at',{ascending:false}).then(({data:p})=>setProds(p||[]))
    })
  },[slug])

  const add=(p,t=null)=>{
    if(p.tallas?.length>0 && store.tipo_tienda==='boutique' && !t) return false
    const key=t? p.id+'-'+t : p.id
    setCart(v=>{
      const ex=v.find(i=>i.cid===key)
      if(ex) return v.map(i=>i.cid===key?{...i,qty:i.qty+1}:i)
      return [...v,{...p,cid:key,qty:1,tallaSel:t}]
    }); return true
  }
  const total=cart.reduce((a,b)=>a+b.price*b.qty,0)
  const count=cart.reduce((a,b)=>a+b.qty,0)
  const wa=(msg)=> window.open(`https://api.whatsapp.com/send?phone=${store.whatsapp}&text=${encodeURIComponent(msg)}`,'_blank')
  const waCart=()=>{
    let m=`Hola ${store.name}! Quiero:\n`
    cart.forEach(i=>m+=`• ${i.qty}x ${i.name}${i.tallaSel?' Talla '+i.tallaSel:''} - C$ ${i.price*i.qty}\n`)
    m+=`\nTotal C$ ${total}\nhttps://tiendanica.store/${slug}`
    wa(m)
  }
  const waOne=()=>{
    let m=`Hola ${store.name}! Quiero: ${sel.name}${talla? ' Talla '+talla:''} - C$ ${sel.price} https://tiendanica.store/${slug}`
    wa(m)
  }
  const imgs=(p)=> [p.image_url, ...(p.extra_images||[])].filter(Boolean).slice(0,4)

  if(!store) return <div style={{padding:40, background:'#0A0A0A', color:'#fff', minHeight:'100vh'}}>Cargando {slug}...</div>

  let filtered=[...prods]
  if(q) filtered=filtered.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()))
  if(cat) filtered=filtered.filter(p=>p.categoria===cat)
  const cats=[...new Set(prods.map(p=>p.categoria).filter(Boolean))]
  const isComida=store.tipo_tienda==='comida'
  const isGeneral=store.tipo_tienda==='general'
  const isBoutique=store.tipo_tienda==='boutique'

  const theme = isComida ? {bg:'#0A0A0A', card:'#1A1A1A', accent:'#FF6B00', text:'#fff'} : isGeneral ? {bg:'#F8FAFC', card:'#fff', accent:'#0066FF', text:'#000'} : {bg:'#F6F3F0', card:'#fff', accent:'#000', text:'#000'}
  const cover=store.cover_image || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200'

  return (
    <main style={{minHeight:'100vh', background:theme.bg, color:theme.text, paddingBottom:90}}>
      {/* COVER */}
      <div style={{height: isComida?380:420, position:'relative', background:'#000'}}>
        <img src={cover} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.85}}/>
        <div style={{position:'absolute',inset:0, background: isComida? 'linear-gradient(to top, #0A0A0A 20%, transparent)':'linear-gradient(to top, rgba(0,0,0,0.65), transparent)'}}/>
        <div style={{position:'absolute',top:12,left:12, display:'flex', gap:8, alignItems:'center'}}>
          {store.logo_url && <img src={store.logo_url} style={{width:44,height:44,borderRadius:12,background:'#fff',objectFit:'cover', border:'2px solid #fff'}}/>}
          <div style={{background:'rgba(0,0,0,0.6)', color:'#fff', padding:'4px 10px', borderRadius:999, fontSize:10, fontWeight:700}}>{isBoutique?'BOUTIQUE':isComida?'COMIDA':'GENERAL'}</div>
        </div>
        <div style={{position:'absolute',bottom:14,left:12,right:12, background:'#fff', borderRadius: isComida?12:20, padding:14, display:'flex', justifyContent:'space-between', alignItems:'center', color:'#000'}}>
          <div><h1 style={{fontWeight:900, fontSize: isComida?18:20, textTransform:'uppercase'}}>{store.name}</h1><p style={{fontSize:11, opacity:0.6, marginTop:2}}>{store.description||'Envíos a todo Nicaragua'} • WhatsApp: {store.whatsapp}</p></div>
          <a href={`https://wa.me/${store.whatsapp}`} target="_blank" style={{background:'#25D366', color:'#fff', padding:'10px 14px', borderRadius:999, textDecoration:'none', fontWeight:800, fontSize:12}}>WhatsApp</a>
        </div>
      </div>

      {/* CART */}
      <div style={{position:'fixed', bottom:18, right:12, zIndex:60}}>
        {showCart&&<div style={{background:'#fff', width:'92vw', maxWidth:360, borderRadius:20, padding:14, boxShadow:'0 20px 40px rgba(0,0,0,0.3)', marginBottom:10, color:'#000'}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><b>{isComida?'Mi Pedido':`Carrito (${count})`}</b><button onClick={()=>setShowCart(false)} style={{border:'none',background:'#eee',borderRadius:999,width:28,height:28}}>X</button></div>
          <div style={{marginTop:10, display:'grid', gap:8, maxHeight:300, overflowY:'auto'}}>
            {cart.length===0 && <p style={{fontSize:12, opacity:0.6}}>Vacío</p>}
            {cart.map(i=><div key={i.cid} style={{display:'flex',gap:8, background:'#F6F3F0', padding:8, borderRadius:12}}><img src={i.image_url} style={{width:44,height:44,borderRadius:8,objectFit:'cover'}}/><div style={{flex:1,fontSize:12}}><b>{i.name}</b>{i.tallaSel&&<span style={{background:'#000',color:'#fff',fontSize:9,padding:'2px 6px',borderRadius:99,marginLeft:6}}>{i.tallaSel}</span>}<br/>{i.qty} x C$ {i.price}</div><button onClick={()=>setCart(v=>v.filter(x=>x.cid!==i.cid))} style={{border:'none',background:'none'}}>🗑</button></div>)}
          </div>
          <div style={{marginTop:10,display:'flex',justifyContent:'space-between',fontWeight:900}}><span>Total</span><span>C$ {total}</span></div>
          <button onClick={waCart} style={{marginTop:10,width:'100%',background:theme.accent===' #000'? '#000':theme.accent, color:'#fff', padding:12, borderRadius:999, fontWeight:900, border:'none'}}>Enviar por WhatsApp</button>
        </div>}
        <button onClick={()=>setShowCart(!showCart)} style={{background:'#000', color:'#fff', padding:'14px 20px', borderRadius:999, fontWeight:900, border:'none', boxShadow:'0 10px 20px rgba(0,0,0,0.3)'}}>🛒 {count? `${count} • C$ ${total}`: isComida?'Ver pedido':'Carrito'}</button>
      </div>

      {/* CONTENT */}
      <div style={{maxWidth:1120, margin:'0 auto', padding:14}}>
        {/* search + cats */}
        <div style={{background:theme.card, borderRadius:16, padding:12, display:'flex', flexDirection:'column', gap:10, boxShadow:isGeneral? '0 1px 3px rgba(0,0,0,0.1)':'none'}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder={isComida?'Buscar plato...':isGeneral?'Buscar producto, SKU...':'Buscar: vestido, blusa...'} style={{border:'1px solid #e5e5e5', borderRadius:999, padding:'10px 14px', fontSize:13}}/>
          {cats.length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap'}}><button onClick={()=>setCat(null)} style={{padding:'6px 12px',borderRadius:999,border:'1px solid #000',background:cat===null?'#000':'#fff',color:cat===null?'#fff':'#000',fontSize:12,fontWeight:700}}>Todo</button>{cats.map(c=><button key={c} onClick={()=>setCat(c===cat?null:c)} style={{padding:'6px 12px',borderRadius:999,border:'1px solid #ddd',background:cat===c?'#000':'#fff',color:cat===c?'#fff':'#000',fontSize:12,fontWeight:700,textTransform:'capitalize'}}>{c}</button>)}</div>}
        </div>

        {/* GRID */}
        <div style={{marginTop:14, display:'grid', gridTemplateColumns: isGeneral? '1fr':'repeat(2,1fr)', gap: isGeneral?10:14}}>
          {filtered.map(p=>{
            const im=imgs(p)
            if(isGeneral){
              return <div key={p.id} style={{background:'#fff', borderRadius:12, padding:10, display:'flex', gap:10, border:'1px solid #eee'}}><img src={p.image_url} style={{width:72,height:72,borderRadius:8,objectFit:'cover'}}/><div style={{flex:1}}><b style={{fontSize:13}}>{p.name}</b> {p.sku&&<span style={{fontSize:10, opacity:0.5}}>SKU:{p.sku}</span>}<br/><span style={{fontSize:11, opacity:0.6}}>{p.categoria||''} {p.stock<5? `• Solo ${p.stock} disp`:''}</span><div style={{marginTop:4, display:'flex', gap:8, alignItems:'center'}}><span style={{fontWeight:900}}>C$ {p.price}</span><button onClick={()=>setSel(p)} style={{marginLeft:'auto', background:'#000', color:'#fff', border:'none', padding:'6px 12px', borderRadius:999, fontSize:11, fontWeight:700}}>Ver</button></div></div></div>
            }
            if(isComida){
              return <div key={p.id} style={{background:'#1A1A1A', borderRadius:14, overflow:'hidden', display:'flex', gap:0}}><img src={p.image_url} style={{width:90,height:90,objectFit:'cover'}}/><div style={{padding:10, flex:1}}><b style={{fontSize:13, color:'#fff'}}>{p.name}</b><p style={{fontSize:11, color:'#aaa', marginTop:2}}>{p.categoria||'Plato'}</p><div style={{marginTop:6, display:'flex', justifyContent:'space-between', alignItems:'center'}}><span style={{color:'#FF6B00', fontWeight:900}}>C$ {p.price}</span><button onClick={()=>setSel(p)} style={{background:'#00E676', color:'#000', border:'none', padding:'6px 12px', borderRadius:999, fontSize:11, fontWeight:800}}>Añadir</button></div></div></div>
            }
            // boutique
            return <div key={p.id} style={{background:'#fff',borderRadius:20,overflow:'hidden',boxShadow:'0 4px 12px rgba(0,0,0,0.05)'}}><button onClick={()=>setSel(p)} style={{width:'100%',aspectRatio:'4/5',border:'none',background:'#FBF9F7',position:'relative'}}><img src={p.image_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>{im.length>1&&<span style={{position:'absolute',top:8,left:8,background:'rgba(0,0,0,0.7)',color:'#fff',fontSize:9,padding:'4px 8px',borderRadius:999}}>{im.length} fotos</span>}{p.tallas?.length>0&&<span style={{position:'absolute',bottom:8,left:8,background:'#fff',color:'#000',fontSize:9,padding:'4px 8px',borderRadius:999,fontWeight:800}}>{p.tallas.join(' ')}</span>}</button><div style={{padding:12}}><p style={{fontSize:12,fontWeight:600}}>{p.name}</p><p style={{fontWeight:900,marginTop:4}}>C$ {p.price}</p><button onClick={()=>setSel(p)} style={{marginTop:8,width:'100%',background:'#111',color:'#fff',padding:10,borderRadius:999,fontSize:11,fontWeight:800,border:'none'}}>Ver tallas</button></div></div>
          })}
        </div>
        {filtered.length===0&&<div style={{marginTop:40,textAlign:'center',opacity:0.5, color:theme.text}}>No hay productos. Añade en /{slug}/admin</div>}

        <div style={{marginTop:30, textAlign:'center', opacity:0.35, fontSize:10}}>Powered by <span style={{fontWeight:900}}>Tienda<span style={{color:'#00E676'}}>Nica</span></span>.Store</div>
      </div>

      {/* MODAL */}
      {sel&&<div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setSel(null)}>
        <div style={{background:'#fff',width:'100%',maxWidth:500,borderTopLeftRadius:24,borderTopRightRadius:24,overflow:'hidden',maxHeight:'92vh',display:'flex',flexDirection:'column', color:'#000'}} onClick={e=>e.stopPropagation()}>
          <div style={{height:380,background:'#000',position:'relative'}}><img src={imgs(sel)[imgIdx]||sel.image_url} style={{width:'100%',height:'100%',objectFit:'contain'}}/><button onClick={()=>setSel(null)} style={{position:'absolute',top:12,right:12,background:'#fff',border:'none',width:36,height:36,borderRadius:999,fontWeight:900}}>X</button>{imgs(sel).length>1&&<><button onClick={()=>setImgIdx(i=>i===0?imgs(sel).length-1:i-1)} style={{position:'absolute',left:8,top:'50%',background:'#fff',border:'none',width:34,height:34,borderRadius:999}}>‹</button><button onClick={()=>setImgIdx(i=>i===imgs(sel).length-1?0:i+1)} style={{position:'absolute',right:8,top:'50%',background:'#fff',border:'none',width:34,height:34,borderRadius:999}}>›</button></>}</div>
          <div style={{padding:16,overflowY:'auto'}}>
            <h2 style={{fontWeight:900,fontSize:18}}>{sel.name}</h2><p style={{fontWeight:900,fontSize:20,marginTop:4}}>C$ {sel.price}</p>
            {sel.categoria&&<span style={{display:'inline-block',marginTop:6,background:'#F6F3F0',padding:'4px 10px',borderRadius:999,fontSize:11,textTransform:'capitalize'}}>{sel.categoria}</span>}
            {sel.tallas?.length>0&&isBoutique&&<div style={{marginTop:14}}><p style={{fontSize:12,fontWeight:800}}>Talla {talla&&<span style={{color:'#00C853'}}>• {talla} seleccionada</span>}</p><div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>{sel.tallas.map(t=><button key={t} onClick={()=>setTalla(t)} style={{minWidth:44,height:44,borderRadius:999,border:talla===t?'2px solid #000':'1px solid #ddd',background:talla===t?'#000':'#fff',color:talla===t?'#fff':'#000',fontWeight:800}}>{t}</button>)}</div></div>}
            {isGeneral&&<p style={{fontSize:12, opacity:0.7, marginTop:8}}>SKU: {sel.sku||'N/A'} • Stock: {sel.stock} unidades</p>}
            <div style={{display:'flex',gap:10,marginTop:16}}><button onClick={()=>setSel(null)} style={{flex:1,background:'#F0F0F0',border:'none',padding:12,borderRadius:999,fontWeight:700}}>Cerrar</button><button onClick={waOne} style={{flex:1,background:'#25D366',color:'#fff',border:'none',padding:12,borderRadius:999,fontWeight:900}}>WhatsApp</button></div>
            <button onClick={()=>{ if(add(sel,talla)){ setShowCart(true); setSel(null) } else alert('Elige talla')}} style={{marginTop:8,width:'100%',background:'#000',color:'#fff',border:'none',padding:12,borderRadius:999,fontWeight:800}}>Añadir al carrito {talla?`(${talla})`:''}</button>
          </div>
        </div>
      </div>}
    </main>
  )
}
