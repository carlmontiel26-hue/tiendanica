'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key||!url.startsWith('http')) return null
  return createClient(url,key)
}

// ===== COMPONENTE CARRUSEL + VIDEO ESTILO TEMU - IMAGEN COMPLETA =====
function TemuProductGallery({ images=[], videoUrl, name }){
  const slides = []
  if(images && images.length>0) images.forEach(img=>{ if(img) slides.push({type:'image', url:img}) })
  if(videoUrl) slides.push({type:'video', url:videoUrl})
  if(slides.length===0) slides.push({type:'image', url:'/tienda-nica-logo.png'})

  const [current, setCurrent] = useState(0)
  const [muted, setMuted] = useState(true)
  const videoRef = useRef(null)

  useEffect(()=>{ setCurrent(0) },[images, videoUrl])

  return (
    <div style={{position:'relative', background:'#fff'}}>
      <div style={{display:'flex', overflow:'hidden', aspectRatio:'1/1', position:'relative', background:'#fff'}}>
        {slides.map((s,i)=>(
          <div key={i} style={{minWidth:'100%', display: i===current ? 'flex' : 'none', position:'relative', background:'#fff', alignItems:'center', justifyContent:'center'}}>
            {s.type==='image' ? (
              <img src={s.url} alt={name} style={{width:'100%', height:'100%', objectFit:'contain', background:'#fff'}}/>
            ) : (
              <div style={{width:'100%', height:'100%', position:'relative', background:'#000', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <video 
                  ref={videoRef}
                  src={s.url} 
                  autoPlay 
                  loop 
                  muted={muted} 
                  playsInline
                  style={{width:'100%', height:'100%', objectFit:'contain', background:'#000'}}
                />
                <button onClick={()=>setMuted(!muted)} style={{position:'absolute', bottom:16, right:16, background:'rgba(0,0,0,0.6)', color:'#fff', border:'none', width:36, height:36, borderRadius:999, fontSize:14}}>
                  {muted ? '🔇' : '🔊'}
                </button>
                <span style={{position:'absolute', top:12, left:12, background:'#FF3B30', color:'#fff', fontSize:10, fontWeight:900, padding:'4px 8px', borderRadius:999}}>VIDEO</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6, background:'rgba(0,0,0,0.35)', padding:'6px 10px', borderRadius:999}}>
        {slides.map((_,i)=>(
          <button key={i} onClick={()=>setCurrent(i)} style={{width: i===current ? 18 : 6, height:6, borderRadius:999, border:'none', background: i===current ? '#fff' : 'rgba(255,255,255,0.5)', transition:'all 0.2s', cursor:'pointer'}}/>
        ))}
      </div>
      <div style={{position:'absolute', top:12, right:12, display:'flex', gap:6}}>
        <span style={{background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:11, padding:'4px 8px', borderRadius:999}}>{current+1}/{slides.length}</span>
      </div>
      <button onClick={()=>setCurrent((current-1+slides.length)%slides.length)} style={{position:'absolute', left:0, top:0, bottom:0, width:'18%', background:'transparent', border:'none'}}/>
      <button onClick={()=>setCurrent((current+1)%slides.length)} style={{position:'absolute', right:0, top:0, bottom:0, width:'18%', background:'transparent', border:'none'}}/>
    </div>
  )
}

export default function StorePage(){
  const { slug } = useParams()
  const [store,setStore]=useState(null)
  const [prods,setProds]=useState([])
  const [cart,setCart]=useState([])
  const [sel,setSel]=useState(null)
  const [showCart,setShowCart]=useState(false)
  const [talla,setTalla]=useState(null)
  const [cat,setCat]=useState(null)
  const [q,setQ]=useState('')

  useEffect(()=>{
    if(!slug) return
    const supabase=getSupabase()
    if(!supabase) return
    supabase.from('stores').select('*').eq('slug',slug).single().then(({data})=>{
      if(!data) return
      setStore(data)
      supabase.from('products').select('*').eq('store_id',data.id).eq('is_active',true).order('created_at',{ascending:false}).then(({data:p})=>setProds(p||[]))
    })
  },[slug])

  const isBoutique = store?.tipo_tienda?.toLowerCase() === 'boutique' || store?.tipo_tienda?.toLowerCase().includes('boutique')

  const add=(p,t=null)=>{
    if(isBoutique && p.tallas?.length>0 && !t) return false
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
    cart.forEach(i=>m+=`• ${i.qty}x ${i.name}${isBoutique && i.tallaSel?' Talla '+i.tallaSel:''} - C$ ${i.price*i.qty}\n`)
    m+=`\nTotal C$ ${total}\nhttps://tiendanica.store/${slug}`
    wa(m)
  }
  const waOne=()=>{
    let desc = sel.description ? ` - ${sel.description}` : ''
    let m=`Hola ${store.name}! Quiero: ${sel.name}${isBoutique && talla? ' Talla '+talla:''} - C$ ${sel.price}${desc} https://tiendanica.store/${slug}`
    wa(m)
  }
  const getProductImages = (p)=>{
    if(p.images && p.images.length>0) return p.images.filter(Boolean)
    return [p.image_url, ...(p.extra_images||[])].filter(Boolean).slice(0,6)
  }

  if(!store) return <div style={{padding:40, background:'#0A0A0A', color:'#fff', minHeight:'100vh'}}>Cargando {slug}...</div>

  let filtered=[...prods]
  if(q) filtered=filtered.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()))
  if(cat) filtered=filtered.filter(p=>p.categoria===cat)
  const cats=[...new Set(prods.map(p=>p.categoria).filter(Boolean))]

  return (
    <main style={{background:'#F7F5F3', minHeight:'100vh', fontFamily:'Inter, system-ui'}}>
      <div style={{background:'#fff', borderBottom:'1px solid #EAE6E1', padding:12, position:'sticky', top:0, zIndex:10, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <img src={store.logo_url||'/tienda-nica-logo.png'} style={{width:36,height:36, borderRadius:10, objectFit:'cover'}}/>
          <b>{store.name}</b>
        </div>
        <button onClick={()=>setShowCart(!showCart)} style={{background:'#000', color:'#fff', padding:'10px 16px', borderRadius:999, fontWeight:900, border:'none', fontSize:12}}>🛒 {count? `${count} • C$ ${total}`: 'Carrito'}</button>
      </div>

      {showCart&&<div style={{position:'fixed', right:12, top:60, width:300, background:'#fff', border:'1px solid #EAE6E1', borderRadius:16, padding:12, zIndex:50, boxShadow:'0 10px 30px rgba(0,0,0,0.15)'}}>
        <b>Carrito</b>
        <div style={{maxHeight:200, overflowY:'auto', marginTop:8}}>
          {cart.map(i=><div key={i.cid} style={{display:'flex', justifyContent:'space-between', fontSize:12, padding:'6px 0', borderBottom:'1px solid #f0f0f0'}}><span>{i.qty}x {i.name} {i.tallaSel&&`(${i.tallaSel})`}</span><span>C$ {i.price*i.qty}</span></div>)}
          {cart.length===0&&<div style={{fontSize:12, color:'#999', textAlign:'center', padding:10}}>Vacío</div>}
        </div>
        <div style={{marginTop:10,display:'flex',justifyContent:'space-between',fontWeight:900}}><span>Total</span><span>C$ {total}</span></div>
        <button onClick={waCart} style={{marginTop:10,width:'100%',background:'#000',color:'#fff',padding:12,borderRadius:999,fontWeight:900,border:'none'}}>Enviar por WhatsApp</button>
      </div>}

      <div style={{maxWidth:1120, margin:'0 auto', padding:14}}>
        <div style={{background:'#fff', borderRadius:16, padding:12, display:'flex', flexDirection:'column', gap:10, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', border:'1px solid #f0f0f0'}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar en esta tienda..." style={{border:'1px solid #e8e8e8', borderRadius:999, padding:'10px 14px', fontSize:13}}/>
          {cats.length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap'}}><button onClick={()=>setCat(null)} style={{padding:'6px 12px',borderRadius:999,border:'1px solid #000',background:cat===null?'#000':'#fff',color:cat===null?'#fff':'#000',fontSize:12,fontWeight:700}}>Todo</button>{cats.map(c=><button key={c} onClick={()=>setCat(c===cat?null:c)} style={{padding:'6px 12px',borderRadius:999,border:'1px solid #eee',background:cat===c?'#000':'#fff',color:cat===c?'#fff':'#000',fontSize:12,fontWeight:700,textTransform:'capitalize'}}>{c}</button>)}</div>}
        </div>
        <div style={{marginTop:14, display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14}}>
          {filtered.map(p=>{
            const im=getProductImages(p)
            const hasVideo = !!p.video_url
            return (
              <div key={p.id} style={{background:'#fff',borderRadius:20,overflow:'hidden',boxShadow:'0 4px 12px rgba(0,0,0,0.05)', border:'1px solid #f5f5f5'}}>
                <button onClick={()=>setSel(p)} style={{width:'100%',aspectRatio:'1/1',border:'none',background:'#fff',position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <img src={p.image_url} style={{width:'100%',height:'100%',objectFit:'contain', background:'#fff'}}/>
                  {im.length>1&&<span style={{position:'absolute',top:8,left:8,background:'rgba(0,0,0,0.7)',color:'#fff',fontSize:9,padding:'4px 8px',borderRadius:999}}>{im.length} fotos</span>}
                  {hasVideo&&<span style={{position:'absolute',top:8,right:8,background:'#FF3B30',color:'#fff',fontSize:9,padding:'4px 8px',borderRadius:999,fontWeight:800}}>▶ VIDEO</span>}
                  {isBoutique && p.tallas?.length>0&&<span style={{position:'absolute',bottom:8,left:8,background:'#fff',color:'#000',fontSize:9,padding:'4px 8px',borderRadius:999,fontWeight:800, border:'1px solid #eee'}}>{p.tallas.join(' ')}</span>}
                </button>
                <div style={{padding:12, background:'#fff'}}>
                  <p style={{fontSize:12,fontWeight:600, color:'#000', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', minHeight:28}}>{p.name}</p>
                  {p.description&&<p style={{fontSize:10,color:'#666',marginTop:2, display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{p.description}</p>}
                  <p style={{fontWeight:900,marginTop:4, color:'#000'}}>C$ {p.price}</p>
                  <button onClick={()=>setSel(p)} style={{marginTop:8,width:'100%',background:'#111',color:'#fff',padding:10,borderRadius:999,fontSize:11,fontWeight:800,border:'none'}}>Ver fotos y video</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {sel&&<div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setSel(null)}>
        <div style={{background:'#F5F5F5',width:'100%',maxWidth:500,borderTopLeftRadius:24,borderTopRightRadius:24,overflow:'hidden',maxHeight:'92vh',display:'flex',flexDirection:'column', color:'#000'}} onClick={e=>e.stopPropagation()}>
          <TemuProductGallery images={getProductImages(sel)} videoUrl={sel.video_url} name={sel.name}/>
          <div style={{padding:16,overflowY:'auto', background:'#fff', flex:1}}>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <b style={{fontSize:22}}>C$ {sel.price}</b>
              <span style={{background:'#FF3B30', color:'#fff', fontSize:10, fontWeight:900, padding:'3px 6px', borderRadius:4}}>-20%</span>
              <span style={{fontSize:11, color:'#9A9590', textDecoration:'line-through'}}>C$ {Math.round(sel.price*1.25)}</span>
            </div>
            <h2 style={{fontWeight:900,fontSize:16, marginTop:6, lineHeight:1.2}}>{sel.name}</h2>
            {sel.description&&<p style={{fontSize:13, color:'#333', marginTop:6, lineHeight:1.4, background:'#F7F5F3', padding:'8px 10px', borderRadius:10}}>✓ {sel.description}</p>}
            <div style={{display:'flex', gap:8, marginTop:8, fontSize:11, color:'#666'}}><span>★ 4.8</span><span>•</span><span>1.2k+ vendidos</span><span>•</span><span style={{color:'#00C853', fontWeight:700}}>Envío Gratis</span></div>
            {sel.categoria&&<span style={{display:'inline-block',marginTop:8,background:'#F6F3F0',padding:'4px 10px',borderRadius:999,fontSize:11,textTransform:'capitalize'}}>{sel.categoria}</span>}
            {isBoutique && sel.tallas?.length>0&&<div style={{marginTop:14}}><p style={{fontSize:12,fontWeight:800}}>Talla {talla&&<span style={{color:'#00C853'}}>• {talla}</span>}</p><div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>{sel.tallas.map(t=><button key={t} onClick={()=>setTalla(t)} style={{minWidth:44,height:44,borderRadius:999,border:talla===t?'2px solid #000':'1px solid #ddd',background:talla===t?'#000':'#fff',color:talla===t?'#fff':'#000',fontWeight:800}}>{t}</button>)}</div></div>}
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button onClick={()=>setSel(null)} style={{flex:1,background:'#F0F0F0',border:'none',padding:12,borderRadius:999,fontWeight:700}}>Cerrar</button>
              <button onClick={waOne} style={{flex:1.5,background:'#25D366',color:'#fff',border:'none',padding:12,borderRadius:999,fontWeight:900}}>WhatsApp</button>
            </div>
            <button onClick={()=>{ if(add(sel,talla)){ setShowCart(true); } else alert('Elige talla')}} style={{marginTop:8,width:'100%',background:'#000',color:'#fff',border:'none',padding:12,borderRadius:999,fontWeight:800}}>Añadir al carrito {isBoutique && talla?`(${talla})`:''}</button>
          </div>
        </div>
      </div>}
    </main>
  )
}
