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
  }catch(e){ return null }'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key||!url.startsWith('http')) return null
  return createClient(url,key)
}

export default function BoutiqueStore(){
  const params=useParams()
  const slug=params?.slug
  const [store,setStore]=useState(null)
  const [prods,setProds]=useState([])
  const [cart,setCart]=useState([])
  const [sel,setSel]=useState(null)
  const [showCart,setShowCart]=useState(false)
  const [tallaSel,setTallaSel]=useState(null)
  const [imgIdx,setImgIdx]=useState(0)
  const [cat,setCat]=useState(null)
  const [q,setQ]=useState('')
  const [err,setErr]=useState(null)

  useEffect(()=>{
    if(!slug) return
    const supabase=getSupabase()
    if(!supabase){ setErr('Falta conectar Supabase'); return }
    supabase.from('stores').select('*').eq('slug',slug).single().then(({data,error})=>{
      if(error||!data){ setErr('Tienda no encontrada'); return }
      setStore(data)
      supabase.from('products').select('*').eq('store_id',data.id).eq('is_active',true).order('created_at',{ascending:false}).then(({data:p})=>setProds(p||[]))
    })
  },[slug])
  useEffect(()=>{ if(sel){ setTallaSel(null); setImgIdx(0)} },[sel])

  const add=(p,t=null)=>{
    if(p.tallas?.length>0 && !t) return false
    setCart(v=>{
      const key=t? p.id+'-'+t : p.id
      const ex=v.find(i=>i.cid===key)
      if(ex) return v.map(i=>i.cid===key?{...i,qty:i.qty+1}:i)
      return [...v,{...p,cid:key,qty:1,talla:t}]
    }); return true
  }
  const total=cart.reduce((a,b)=>a+b.price*b.qty,0)
  const count=cart.reduce((a,b)=>a+b.qty,0)
  const waCart=()=>{
    let m=`Hola ${store.name}! Quiero:\n`
    cart.forEach(i=>m+=`• ${i.qty}x ${i.name}${i.talla?' Talla '+i.talla:''} - C$ ${i.price*i.qty}\n`)
    m+=`\nTotal C$ ${total}\nhttps://tiendanica.store/${slug}`
    window.open(`https://api.whatsapp.com/send?phone=${store.whatsapp}&text=${encodeURIComponent(m)}`,'_blank')
  }
  const waDirect=()=>{
    let m=`Hola ${store.name}! Quiero: ${sel.name}${tallaSel?' Talla '+tallaSel:''} C$ ${sel.price} https://tiendanica.store/${slug}`
    window.open(`https://api.whatsapp.com/send?phone=${store.whatsapp}&text=${encodeURIComponent(m)}`,'_blank')
  }
  const imgs=(p)=>{ if(!p) return []; return [p.image_url, ...(p.extra_images||[])].filter(Boolean).slice(0,4) }

  if(err) return <div style={{padding:40}}>{err}</div>
  if(!store) return <div style={{padding:40}}>Cargando {slug}...</div>

  let filtered=[...prods]
  if(q) filtered=filtered.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()))
  if(cat) filtered=filtered.filter(p=>p.categoria===cat)
  const cats=[...new Set(prods.map(p=>p.categoria).filter(Boolean))]
  const cover=store.cover_image || store.image_url || prods[0]?.image_url || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200'

  return (
    <main style={{minHeight:'100vh', background:'#F6F3F0', color:'#000'}}>
      <div style={{height:420, position:'relative', background:'#000'}}>
        <img src={cover} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.9}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))'}}/>
        <div style={{position:'absolute',bottom:16,left:12,right:12, background:'#fff', borderRadius:20, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div><h1 style={{fontWeight:900, fontSize:20, textTransform:'uppercase'}}>{store.name}</h1><p style={{fontSize:12,opacity:0.7,marginTop:2}}>{store.description||'Envíos a todo Nicaragua'}</p></div>
          <a href={`https://wa.me/${store.whatsapp}`} target="_blank" style={{background:'#25D366',color:'#fff',padding:'10px 14px',borderRadius:999,textDecoration:'none',fontWeight:800,fontSize:12}}>WhatsApp</a>
        </div>
      </div>

      <div style={{position:'fixed',bottom:20,right:14,zIndex:50}}>
        {showCart&&<div style={{background:'#fff',width:'90vw',maxWidth:360,borderRadius:20,padding:14,boxShadow:'0 20px 40px rgba(0,0,0,0.2)',marginBottom:10}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><b>Carrito ({count})</b><button onClick={()=>setShowCart(false)} style={{border:'none',background:'#eee',borderRadius:999,width:28,height:28}}>X</button></div>
          <div style={{marginTop:10, display:'grid',gap:8,maxHeight:300,overflowY:'auto'}}>
            {cart.length===0 && <p style={{fontSize:12,opacity:0.6}}>Vacío</p>}
            {cart.map(i=><div key={i.cid} style={{display:'flex',gap:8,background:'#F6F3F0',padding:8,borderRadius:12}}><img src={i.image_url} style={{width:44,height:44,borderRadius:8,objectFit:'cover'}}/><div style={{flex:1,fontSize:12}}><b>{i.name}</b>{i.talla&&<span style={{background:'#000',color:'#fff',fontSize:9,padding:'2px 6px',borderRadius:99,marginLeft:6}}>{i.talla}</span>}<br/>{i.qty} x C$ {i.price}</div><button onClick={()=>setCart(v=>v.filter(x=>x.cid!==i.cid))} style={{border:'none',background:'none'}}>🗑</button></div>)}
          </div>
          <div style={{marginTop:10,display:'flex',justifyContent:'space-between',fontWeight:900}}><span>Total</span><span>C$ {total}</span></div>
          <button onClick={waCart} style={{marginTop:10,width:'100%',background:'#000',color:'#fff',padding:12,borderRadius:999,fontWeight:900,border:'none'}}>Enviar por WhatsApp</button>
        </div>}
        <button onClick={()=>setShowCart(!showCart)} style={{background:'#000',color:'#fff',padding:'14px 20px',borderRadius:999,fontWeight:900,border:'none',boxShadow:'0 10px 20px rgba(0,0,0,0.3)'}}>🛒 {count? `${count} - C$ ${total}`:'Carrito'}</button>
      </div>

      <div style={{maxWidth:1100,margin:'0 auto',padding:16}}>
        <div style={{background:'#fff',borderRadius:16,padding:12,display:'flex',flexDirection:'column',gap:10}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar: vestido, blusa, jean..." style={{border:'1px solid #e5e5e5',borderRadius:999,padding:'10px 14px',fontSize:13}}/>
          {cats.length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap'}}><button onClick={()=>setCat(null)} style={{padding:'6px 12px',borderRadius:999,border:'1px solid #000',background:cat===null?'#000':'#fff',color:cat===null?'#fff':'#000',fontSize:12,fontWeight:700}}>Todo</button>{cats.map(c=><button key={c} onClick={()=>setCat(c===cat?null:c)} style={{padding:'6px 12px',borderRadius:999,border:'1px solid #ddd',background:cat===c?'#000':'#fff',color:cat===c?'#fff':'#000',fontSize:12,fontWeight:700,textTransform:'capitalize'}}>{c}</button>)}</div>}
          <span style={{fontSize:11,opacity:0.6}}>{filtered.length} productos</span>
        </div>

        <div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
          {filtered.map(p=>{
            const im=imgs(p)
            return <div key={p.id} style={{background:'#fff',borderRadius:20,overflow:'hidden',boxShadow:'0 4px 12px rgba(0,0,0,0.05)'}}>
              <button onClick={()=>setSel(p)} style={{width:'100%',aspectRatio:'4/5',border:'none',background:'#FBF9F7',position:'relative'}}>
                <img src={p.image_url} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                {im.length>1&&<span style={{position:'absolute',top:8,left:8,background:'rgba(0,0,0,0.7)',color:'#fff',fontSize:9,padding:'4px 8px',borderRadius:999}}>{im.length} fotos</span>}
                {p.tallas?.length>0&&<span style={{position:'absolute',bottom:8,left:8,background:'#fff',color:'#000',fontSize:9,padding:'4px 8px',borderRadius:999,fontWeight:800}}>{p.tallas.join(' ')}</span>}
              </button>
              <div style={{padding:12}}><p style={{fontSize:12,lineHeight:1.2,fontWeight:600}}>{p.name}</p><p style={{fontWeight:900,marginTop:4}}>C$ {p.price}</p><button onClick={()=>setSel(p)} style={{marginTop:8,width:'100%',background:'#111',color:'#fff',padding:10,borderRadius:999,fontSize:11,fontWeight:800,border:'none'}}>Ver tallas</button></div>
            </div>
          })}
        </div>
        {filtered.length===0&&<div style={{marginTop:40,textAlign:'center',opacity:0.5}}>No hay productos. Añade en /{slug}/admin</div>}
      </div>

      {sel&&<div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setSel(null)}>
        <div style={{background:'#fff',width:'100%',maxWidth:500,borderTopLeftRadius:24,borderTopRightRadius:24,overflow:'hidden',maxHeight:'92vh',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
          <div style={{height:380,background:'#000',position:'relative'}}>
            <img src={imgs(sel)[imgIdx]||sel.image_url} style={{width:'100%',height:'100%',objectFit:'contain'}}/>
            <button onClick={()=>setSel(null)} style={{position:'absolute',top:12,right:12,background:'#fff',border:'none',width:36,height:36,borderRadius:999,fontWeight:900}}>X</button>
            {imgs(sel).length>1&&<><button onClick={()=>setImgIdx(i=>i===0?imgs(sel).length-1:i-1)} style={{position:'absolute',left:8,top:'50%',background:'#fff',border:'none',width:34,height:34,borderRadius:999}}>‹</button><button onClick={()=>setImgIdx(i=>i===imgs(sel).length-1?0:i+1)} style={{position:'absolute',right:8,top:'50%',background:'#fff',border:'none',width:34,height:34,borderRadius:999}}>›</button><div style={{position:'absolute',bottom:10,left:'50%',transform:'translateX(-50%)',display:'flex',gap:6}}>{imgs(sel).map((_,i)=><div key={i} style={{width:6,height:6,borderRadius:99,background:imgIdx===i?'#fff':'rgba(255,255,255,0.4)'}}/>)}</div></>}
          </div>
          <div style={{padding:16,overflowY:'auto'}}>
            <h2 style={{fontWeight:900,fontSize:18}}>{sel.name}</h2>
            <p style={{fontWeight:900,fontSize:20,marginTop:4}}>C$ {sel.price}</p>
            {sel.categoria&&<span style={{display:'inline-block',marginTop:6,background:'#F6F3F0',padding:'4px 10px',borderRadius:999,fontSize:11,textTransform:'capitalize'}}>{sel.categoria}</span>}
            {sel.tallas?.length>0&&<div style={{marginTop:14}}><p style={{fontSize:12,fontWeight:800}}>Talla {tallaSel&&<span style={{color:'#00C853'}}>• {tallaSel} seleccionada</span>}</p><div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>{sel.tallas.map(t=><button key={t} onClick={()=>setTallaSel(t)} style={{minWidth:44,height:44,borderRadius:999,border:tallaSel===t?'2px solid #000':'1px solid #ddd',background:tallaSel===t?'#000':'#fff',color:tallaSel===t?'#fff':'#000',fontWeight:800}}>{t}</button>)}</div></div>}
            <div style={{display:'flex',gap:10,marginTop:16}}><button onClick={()=>setSel(null)} style={{flex:1,background:'#F0F0F0',border:'none',padding:12,borderRadius:999,fontWeight:700}}>Cerrar</button><button onClick={waDirect} style={{flex:1,background:'#25D366',color:'#fff',border:'none',padding:12,borderRadius:999,fontWeight:900}}>WhatsApp</button></div>
            <button onClick={()=>{ if(add(sel,tallaSel)){ setShowCart(true); setSel(null) } else alert('Elige talla')}} style={{marginTop:8,width:'100%',background:'#000',color:'#fff',border:'none',padding:12,borderRadius:999,fontWeight:800}}>Añadir al carrito {tallaSel?`(${tallaSel})`:''}</button>
          </div>
        </div>
      </div>}
    </main>
  )
}

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