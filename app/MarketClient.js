'use client'
import { useState, useMemo } from 'react'

const CATS = {
  boutique: ['all','vestidos','blusas','jeans','faldas','conjuntos','shorts','accesorios','zapatos','carteras','nuevo','oferta'],
  comida: ['all','entradas','platos fuertes','pizzas','hamburguesas','pollo','mariscos','bebidas','postres','combos','ofertas'],
  general: ['all','hogar','tecnologia','belleza','juguetes','ferreteria','salud','deportes','libros','otros','oferta','nuevo']
}

export default function MarketClient({ initialStores, initialProducts }){
  const [stores] = useState(initialStores)
  const [products] = useState(initialProducts)
  const [tipo,setTipo]=useState('boutique')
  const [cat,setCat]=useState('all')
  const [search,setSearch]=useState('')

  const filtered = useMemo(()=> products.filter(pr=>{
    const st = pr._store
    if(!st) return false
    if(tipo!=='all' && (st.tipo_tienda||'boutique')!==tipo) return false
    if(cat!=='all' && pr.categoria!==cat) return false
    if(search){
      const q=search.toLowerCase()
      if(!pr.name.toLowerCase().includes(q) &&!st.name.toLowerCase().includes(q)) return false
    }
    return true
  }),[products,tipo,cat,search])

  const whatsappLink=(pr)=>{
    const phone = (pr._store.whatsapp||'').replace(/[^0-9]/g,'')
    const text = encodeURIComponent(`Hola ${pr._store.name} 👋 vi "${pr.name}" por C$ ${pr.price} en TiendaNica Market y lo quiero comprar`)
    return `https://wa.me/${phone}?text=${text}`
  }

  return (
    <main style={{background:'#F7F5F3', minHeight:'100vh', fontFamily:'Inter,system-ui'}}>
      <div style={{maxWidth:1120, margin:'0 auto', padding:'0 14px'}}>
        <header style={{padding:'16px 0 12px', display:'flex', flexDirection:'column', gap:12}}>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <img src="/tienda-nica-logo.png" alt="TiendaNica" style={{height:42}}/>
            <div style={{fontSize:11, background:'#fff', border:'1px solid #EAE6E1', padding:'6px 10px', borderRadius:999}}>{stores.length} tiendas • {products.length} productos</div>
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar vestido, pizza, licuadora..." style={{padding:'12px 14px', borderRadius:999, border:'1px solid #EAE6E1', width:'100%'}}/>
        </header>

        <div style={{display:'flex', gap:8, overflowX:'auto'}}>
          <button onClick={()=>{setTipo('boutique'); setCat('all')}} style={{padding:'9px 16px', borderRadius:999, background:tipo==='boutique'?'#0A0A0A':'#fff', color:tipo==='boutique'?'#fff':'#000'}}>👗 Boutique</button>
          <button onClick={()=>{setTipo('comida'); setCat('all')}} style={{padding:'9px 16px', borderRadius:999, background:tipo==='comida'?'#0A0A0A':'#fff', color:tipo==='comida'?'#fff':'#000'}}>🍔 Comida</button>
          <button onClick={()=>{setTipo('general'); setCat('all')}} style={{padding:'9px 16px', borderRadius:999, background:tipo==='general'?'#0A0A0A':'#fff', color:tipo==='general'?'#fff':'#000'}}>🛍️ General</button>
          <button onClick={()=>{setTipo('all'); setCat('all')}} style={{padding:'9px 16px', borderRadius:999, background:tipo==='all'?'#0A0A0A':'#fff', color:tipo==='all'?'#fff':'#000'}}>✨ Todo</button>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginTop:14}}>
          {filtered.map(pr=>(
            <div key={pr.id} style={{background:'#fff', borderRadius:16, padding:10, border:'1px solid #EAE6E1'}}>
              <img src={pr.image_url} alt={pr.name} style={{width:'100%', aspectRatio:'1/1', objectFit:'cover', borderRadius:12}}/>
              <b style={{fontSize:12, display:'block', marginTop:6}}>{pr.name}</b>
              <span style={{fontSize:10, color:'#888'}}>{pr._store.name}</span>
              <div style={{display:'flex', justifyContent:'space-between', marginTop:6}}>
                <b>C$ {pr.price}</b>
                <a href={whatsappLink(pr)} target="_blank" style={{background:'#00E676', padding:'6px 10px', borderRadius:999, fontSize:10, fontWeight:800, textDecoration:'none', color:'#000'}}>WhatsApp</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}