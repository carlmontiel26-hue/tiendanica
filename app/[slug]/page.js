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

export default function StoreBannerTransparenteAngosto(){
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
  const cover=store.cover_image || store.image_url || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200'

  return (
    <main style={{minHeight:'100vh', background:'#F6F3F0', color:'#000', paddingBottom:90}}>
      <style>{`
        .banner-wrap {
          position: relative;
          height: 520px;
          background: #0A0A0A;
          overflow: hidden;
        }
        .banner-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
        }
        .info-card {
          position: absolute;
          bottom: 12px;
          left: 12px;
          right: 12px;
          background: linear-gradient(135deg, #ffffff 0%, #faf8f6 100%);
          border-radius: 20px;
          padding: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.35);
          z-index: 4;
        }
        /* MOVIL: TRANSPARENTE Y MAS ANGOSTO */
        @media (max-width: 768px) {
          .banner-wrap {
            height: auto !important;
          }
          .banner-img {
            position: relative !important;
            height: auto !important;
            max-height: 72vh;
            object-fit: contain !important;
            background: #0A0A0A;
          }
          .info-card {
            bottom: 8px !important;
            left: 8px !important;
            right: 8px !important;
            padding: 8px 10px !important;
            border-radius: 14px !important;
            min-height: 52px !important;
            max-height: 52px !important;
            background: rgba(0,0,0,0.42) !important;
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
            border: 1px solid rgba(255,255,255,0.18) !important;
            box-shadow: 0 8px 20px rgba(0,0,0,0.25) !important;
          }
          .info-card h1 {
            font-size: 13px !important;
            color: #fff !important;
            letter-spacing: -0.2px !important;
          }
          .info-logo {
            width: 32px !important;
            height: 32px !important;
            border: 1.5px solid rgba(255,255,255,0.8) !important;
          }
          .wa-btn {
            padding: 6px 10px !important;
            font-size: 10px !important;
            background: #00E676 !important;
            color: #000 !important;
            box-shadow: 0 2px 8px rgba(0,230,118,0.35) !important;
          }
        }
      `}</style>

      <div className="banner-wrap">
        <div style={{position:'absolute', inset:0, background: 'linear-gradient(180deg, #0A0A0A 0%, #121212 50%, #0A0A0A 100%)', zIndex:0}}/>
        <img src={cover} alt="portada" className="banner-img" style={{zIndex:1, opacity:0.95}}/>
        <div style={{position:'absolute', inset:0, zIndex:2, background: 'linear-gradient(to top, #0A0A0A 0%, transparent 70%)', pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:0,left:0,right:0,height:3, background: 'linear-gradient(90deg, #00E676, #00C853)', zIndex:3}}/>

        <div style={{position:'absolute',top:10,left:10,right:10, display:'flex', justifyContent:'space-between', zIndex:4}}>
          <div style={{background:'rgba(0,0,0,0.5)', backdropFilter:'blur(12px)', color:'#fff', padding:'5px 10px', borderRadius:999, fontSize:10, fontWeight:800, border:'1px solid rgba(255,255,255,0.15)'}}>BOUTIQUE</div>
          <div style={{background:'rgba(255,255,255,0.9)', color:'#000', padding:'5px 10px', borderRadius:999, fontSize:10, fontWeight:800}}>● Abierto</div>
        </div>

        {/* BANNER TRANSPARENTE ANGOSTO */}
        <div className="info-card">
          <div style={{display:'flex', gap:8, alignItems:'center', flex:1, minWidth:0}}>
            {store.logo_url && <img src={store.logo_url} className="info-logo" style={{width:46,height:46,borderRadius:10,background:'#fff',objectFit:'cover', flexShrink:0}}/>}
            <h1 style={{fontWeight:900, fontSize:20, textTransform:'uppercase', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{store.name}</h1>
          </div>
          <a href={`https://wa.me/${store.whatsapp}`} target="_blank" className="wa-btn" style={{background:'#00E676', color:'#000', padding:'10px 14px', borderRadius:999, textDecoration:'none', fontWeight:900, fontSize:12, marginLeft:10, flexShrink:0, display:'flex', alignItems:'center', gap:4}}>💬 WA</a>
        </div>
      </div>

      <div style={{position:'fixed', bottom:16, right:12, zIndex:60}}>
        {showCart&&<div style={{background:'#fff', width:'92vw', maxWidth:360, borderRadius:20, padding:14, boxShadow:'0 20px 40px rgba(0,0,0,0.3)', marginBottom:10, color:'#000'}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><b>Carrito ({count})</b><button onClick={()=>setShowCart(false)} style={{border:'none',background:'#eee',borderRadius:999,width:28,height:28}}>X</button></div>
          <div style={{marginTop:10, display:'grid', gap:8, maxHeight:300, overflowY:'auto'}}>
            {cart.length===0 && <p style={{fontSize:12, opacity:0.6}}>Vacío</p>}
            {cart.map(i=><div key={i.cid} style={{display:'flex',gap:8, background:'#F6F3F0', padding:8, borderRadius:12}}><img src={i.image_url} style={{width:44,height:44,borderRadius:8,objectFit:'cover'}}/><div style={{flex:1,fontSize:12}}><b>{i.name}</b>{i.tallaSel&&<span style={{background:'#000',color:'#fff',fontSize:9,padding:'2px 6px',borderRadius:99,marginLeft:6}}>{i.tallaSel}</span>}<br/>{i.qty} x C$ {i.price}</div><button onClick={()=>setCart(v=>v.filter(x=>x.cid!==i.cid))} style={{border:'none',background:'none'}}>🗑</button></div>)}
          </div>
          <div style={{marginTop:10,display:'flex',justifyContent:'space-between',fontWeight:900}}><span>Total</span><span>C$ {total}</span></div>
          <button onClick={waCart} style={{marginTop:10,width:'100%',background:'#000',color:'#fff',padding:12,borderRadius:999,fontWeight:900,border:'none'}}>Enviar por WhatsApp</button>
        </div>}
        <button onClick={()=>setShowCart(!showCart)} style={{background:'#000', color:'#fff', padding:'13px 18px', borderRadius:999, fontWeight:900, border:'none', boxShadow:'0 10px 20px rgba(0,0,0,0.3)', fontSize:13}}>🛒 {count? `${count} • C$ ${total}`: 'Carrito'}</button>
      </div>

      <div style={{maxWidth:1120, margin:'0 auto', padding:14}}>
        <div style={{background:'#fff', borderRadius:16, padding:12, display:'flex', flexDirection:'column', gap:10, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', border:'1px solid #f0f0f0'}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar: vestido, blusa..." style={{border:'1px solid #e8e8e8', borderRadius:999, padding:'10px 14px', fontSize:13}}/>
          {cats.length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap'}}><button onClick={()=>setCat(null)} style={{padding:'6px 12px',borderRadius:999,border:'1px solid #000',background:cat===null?'#000':'#fff',color:cat===null?'#fff':'#000',fontSize:12,fontWeight:700}}>Todo</button>{cats.map(c=><button key={c} onClick={()=>setCat(c===cat?null:c)} style={{padding:'6px 12px',borderRadius:999,border:'1px solid #eee',background:cat===c?'#000':'#fff',color:cat===c?'#fff':'#000',fontSize:12,fontWeight:700,textTransform:'capitalize'}}>{c}</button>)}</div>}
        </div>
        <div style={{marginTop:14, display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14}}>
          {filtered.map(p=>{
            const im=imgs(p)
            return <div key={p.id} style={{background:'#fff',borderRadius:20,overflow:'hidden',boxShadow:'0 4px 12px rgba(0,0,0,0.05)', border:'1px solid #f5f5f5'}}><button onClick={()=>setSel(p)} style={{width:'100%',aspectRatio:'4/5',border:'none',background:'#FBF9F7',position:'relative', overflow:'hidden'}}><img src={p.image_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>{im.length>1&&<span style={{position:'absolute',top:8,left:8,background:'rgba(0,0,0,0.7)',color:'#fff',fontSize:9,padding:'4px 8px',borderRadius:999}}>{im.length} fotos</span>}{p.tallas?.length>0&&<span style={{position:'absolute',bottom:8,left:8,background:'#fff',color:'#000',fontSize:9,padding:'4px 8px',borderRadius:999,fontWeight:800}}>{p.tallas.join(' ')}</span>}</button><div style={{padding:12, background:'#fff'}}><p style={{fontSize:12,fontWeight:600, color:'#000'}}>{p.name}</p><p style={{fontWeight:900,marginTop:4, color:'#000'}}>C$ {p.price}</p><button onClick={()=>setSel(p)} style={{marginTop:8,width:'100%',background:'#111',color:'#fff',padding:10,borderRadius:999,fontSize:11,fontWeight:800,border:'none'}}>Ver tallas</button></div></div>
          })}
        </div>
      </div>

      {sel&&<div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setSel(null)}>
        <div style={{background:'#fff',width:'100%',maxWidth:500,borderTopLeftRadius:24,borderTopRightRadius:24,overflow:'hidden',maxHeight:'92vh',display:'flex',flexDirection:'column', color:'#000'}} onClick={e=>e.stopPropagation()}>
          <div style={{height:400,background:'#000',position:'relative'}}><img src={imgs(sel)[imgIdx]||sel.image_url} style={{width:'100%',height:'100%',objectFit:'contain'}}/><button onClick={()=>setSel(null)} style={{position:'absolute',top:12,right:12,background:'#fff',border:'none',width:36,height:36,borderRadius:999,fontWeight:900}}>X</button>{imgs(sel).length>1&&<><button onClick={()=>setImgIdx(i=>i===0?imgs(sel).length-1:i-1)} style={{position:'absolute',left:8,top:'50%',background:'#fff',border:'none',width:34,height:34,borderRadius:999}}>‹</button><button onClick={()=>setImgIdx(i=>i===imgs(sel).length-1?0:i+1)} style={{position:'absolute',right:8,top:'50%',background:'#fff',border:'none',width:34,height:34,borderRadius:999}}>›</button></>}</div>
          <div style={{padding:16,overflowY:'auto', background:'#fff'}}>
            <h2 style={{fontWeight:900,fontSize:18}}>{sel.name}</h2><p style={{fontWeight:900,fontSize:20,marginTop:4}}>C$ {sel.price}</p>
            {sel.categoria&&<span style={{display:'inline-block',marginTop:6,background:'#F6F3F0',padding:'4px 10px',borderRadius:999,fontSize:11,textTransform:'capitalize'}}>{sel.categoria}</span>}
            {sel.tallas?.length>0&&<div style={{marginTop:14}}><p style={{fontSize:12,fontWeight:800}}>Talla {talla&&<span style={{color:'#00C853'}}>• {talla}</span>}</p><div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>{sel.tallas.map(t=><button key={t} onClick={()=>setTalla(t)} style={{minWidth:44,height:44,borderRadius:999,border:talla===t?'2px solid #000':'1px solid #ddd',background:talla===t?'#000':'#fff',color:talla===t?'#fff':'#000',fontWeight:800}}>{t}</button>)}</div></div>}
            <div style={{display:'flex',gap:10,marginTop:16}}><button onClick={()=>setSel(null)} style={{flex:1,background:'#F0F0F0',border:'none',padding:12,borderRadius:999,fontWeight:700}}>Cerrar</button><button onClick={waOne} style={{flex:1,background:'#25D366',color:'#fff',border:'none',padding:12,borderRadius:999,fontWeight:900}}>WhatsApp</button></div>
            <button onClick={()=>{ if(add(sel,talla)){ setShowCart(true); setSel(null) } else alert('Elige talla')}} style={{marginTop:8,width:'100%',background:'#000',color:'#fff',border:'none',padding:12,borderRadius:999,fontWeight:800}}>Añadir al carrito {talla?`(${talla})`:''}</button>
          </div>
        </div>
      </div>}
    </main>
  )
}
