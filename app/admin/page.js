'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if(!url || !key) return null
  return createClient(url,key)
}

const DEPARTAMENTOS_NI = ['Managua','León','Granada','Masaya','Chinandega','Estelí','Matagalpa','Jinotega','Carazo','Rivas','Boaco','Chontales','Madriz','Nueva Segovia','Río San Juan','RAAN','RAAS','Otro']

// === MAPA NICARAGUA SVG SIMPLIFICADO CON POSICIONES REALES APROX ===
function MapaNicaragua({data, max}){
  const getIntensity = (depto)=>{
    const count = data[depto] || 0
    if(count===0) return {fill:'#F5F1EC', stroke:'#E0D5CC', count:0}
    const ratio = count / (max||1)
    if(ratio>0.75) return {fill:'#7000FF', stroke:'#5000CC', count}
    if(ratio>0.5) return {fill:'#8B30FF', stroke:'#7000FF', count}
    if(ratio>0.25) return {fill:'#A86AFF', stroke:'#8B30FF', count}
    return {fill:'#C9A0FF', stroke:'#A86AFF', count}
  }

  const deptos = [
    // Oeste Pacifico
    {id:'Chinandega', d:'M30,60 L90,60 L95,90 L85,110 L35,105 Z'},
    {id:'León', d:'M35,110 L85,110 L90,145 L40,150 Z'},
    {id:'Managua', d:'M40,150 L90,145 L100,180 L80,200 L35,190 Z'},
    {id:'Masaya', d:'M80,200 L100,180 L110,190 L105,210 L85,215 Z'},
    {id:'Granada', d:'M85,215 L105,210 L120,230 L100,250 L80,240 Z'},
    {id:'Carazo', d:'M50,200 L80,200 L80,240 L60,250 L40,230 Z'},
    {id:'Rivas', d:'M60,250 L100,250 L110,310 L70,320 L50,280 Z'},
    // Norte
    {id:'Nueva Segovia', d:'M90,10 L170,15 L165,40 L95,35 Z'},
    {id:'Madriz', d:'M90,40 L165,40 L160,65 L95,60 Z'},
    {id:'Estelí', d:'M95,65 L160,65 L155,100 L90,90 Z'},
    {id:'Jinotega', d:'M160,65 L220,60 L230,120 L170,130 L155,100 Z'},
    {id:'Matagalpa', d:'M90,100 L155,100 L170,130 L160,180 L100,180 Z'},
    {id:'Boaco', d:'M120,190 L160,180 L180,210 L160,240 L120,230 Z'},
    {id:'Chontales', d:'M160,240 L180,210 L220,230 L210,270 L170,280 Z'},
    {id:'Río San Juan', d:'M110,310 L210,270 L230,310 L200,350 L120,340 Z'},
    // Caribe
    {id:'RAAN', d:'M220,60 L360,70 L350,180 L230,120 Z'},
    {id:'RAAS', d:'M230,120 L350,180 L340,300 L230,310 L210,270 L220,230 Z'},
  ]

  // Normalizar nombres con acentos
  const normalize = (s)=> s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  const dataNorm = {}
  Object.entries(data).forEach(([k,v])=>{ dataNorm[normalize(k)] = v })
  
  return (
    <div style={{position:'relative'}}>
      <svg viewBox="0 0 400 380" style={{width:'100%', height:'auto', maxHeight:380}}>
        <defs>
          <filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/></filter>
        </defs>
        {deptos.map(dep=>{
          const keyNorm = normalize(dep.id)
          // Buscar con y sin acento
          const count = data[dep.id] || dataNorm[keyNorm] || 0
          const style = getIntensity(dep.id)
          // Override si hay dato por nombre normalizado
          const hasData = count>0
          const finalFill = hasData ? (count/(max||1)>0.75?'#7000FF':count/(max||1)>0.5?'#8B30FF':count/(max||1)>0.25?'#A86AFF':'#C9A0FF') : '#F5F1EC'
          return (
            <g key={dep.id}>
              <path d={dep.d} fill={finalFill} stroke={hasData?'#7000FF':'#D9D0C8'} strokeWidth={hasData?2:1.2} filter={hasData?'url(#shadow)':''} style={{cursor:'pointer', transition:'all 0.4s'}}/>
              <text x={dep.d.match(/M(\d+),/)? parseInt(dep.d.split(' ')[0].replace('M','').split(',')[0])+15 : 100} y={dep.d.match(/,(\d+)/)? parseInt(dep.d.match(/,(\d+)/)[1])+20 : 100} fontSize="7" fontWeight="800" fill={hasData?'#fff':'#8A7F78'} style={{pointerEvents:'none', textShadow:hasData?'0 1px 2px rgba(0,0,0,0.5)':''}}>{dep.id.slice(0,6)}{count>0?` ${count}`:''}</text>
            </g>
          )
        })}
      </svg>
      <div style={{display:'flex', gap:6, marginTop:10, alignItems:'center', justifyContent:'center', flexWrap:'wrap'}}>
        <span style={{fontSize:10, color:'#8A7F78', fontWeight:700}}>Intensidad:</span>
        <div style={{display:'flex', gap:4, alignItems:'center'}}><div style={{width:12,height:12, borderRadius:3, background:'#F5F1EC', border:'1px solid #E0D5CC'}}/><span style={{fontSize:9}}>0</span></div>
        <div style={{display:'flex', gap:4, alignItems:'center'}}><div style={{width:12,height:12, borderRadius:3, background:'#C9A0FF'}}/><span style={{fontSize:9}}>Baja</span></div>
        <div style={{display:'flex', gap:4, alignItems:'center'}}><div style={{width:12,height:12, borderRadius:3, background:'#8B30FF'}}/><span style={{fontSize:9}}>Media</span></div>
        <div style={{display:'flex', gap:4, alignItems:'center'}}><div style={{width:12,height:12, borderRadius:3, background:'#7000FF'}}/><span style={{fontSize:9}}>Alta</span></div>
      </div>
    </div>
  )
}

export default function SuperAdminConEdicion(){
  const [auth,setAuth]=useState(false)
  const [pass,setPass]=useState('')
  const [tab,setTab]=useState('visitas')
  const [stores,setStores]=useState([])
  const [products,setProducts]=useState([])
  const [pendientes,setPendientes]=useState([])
  const [reportes,setReportes]=useState([])
  const [loading,setLoading]=useState(false)
  const [qTienda,setQTienda]=useState('')
  const [editingStore,setEditingStore]=useState(null)
  const [selectedStoreForProduct,setSelectedStoreForProduct]=useState('')
  const [previewStore,setPreviewStore]=useState(null)
  const [editingProduct,setEditingProduct]=useState(null)
  const [viewMode,setViewMode]=useState('grid')
  const fileLogoRef = useRef(null)
  const fileEditLogoRef = useRef(null)
  const fileProductRef = useRef(null)
  const fileEditProductRef = useRef(null)

  // VISITAS
  const [visitas,setVisitas]=useState([])
  const [visitasLoading,setVisitasLoading]=useState(false)
  const [filtroVisitas,setFiltroVisitas]=useState('todo')

  const cargarVisitas = async ()=>{
    const supabase = getSupabase()
    if(!supabase) return
    setVisitasLoading(true)
    try{
      const {data, error} = await supabase.from('visitas_market').select('*').order('created_at',{ascending:false}).limit(1000)
      if(error){ console.log('visitas error', error); setVisitas([]) }
      else setVisitas(data||[])
    }catch(e){ console.log(e) }
    setVisitasLoading(false)
  }

  useEffect(()=>{
    if(tab==='visitas') cargarVisitas()
  },[tab])

  const genPIN = ()=> Math.floor(100000 + Math.random()*900000).toString()

  const [formTienda,setFormTienda]=useState({
    name:'', slug:'', whatsapp:'', tipo_tienda:'boutique', 
    departamento:'Managua', municipio:'', direccion:'',
    logo_file:null, logo_preview:'', admin_password: genPIN()
  })
  const [formEdit,setFormEdit]=useState({})
  const [formProd,setFormProd]=useState({
    name:'', price:'', categoria:'vestidos', descripcion:'', 
    tallas:'S,M,L,XL', video_url:'', image_files:[], image_previews:[]
  })
  const [formEditProd,setFormEditProd]=useState({})

  const CATEGORIAS = ['vestidos','blusas','jeans','conjuntos','faldas','shorts','pijamas','zapatos','carteras','accesorios','belleza','salud','general','hogar','comida','vehiculos','motos','autos','repuestos','otros','nuevo']

  const login = ()=>{
    if(pass === 'tiendanica2025' || pass === 'admin123' || pass === 'Nica2024' || pass === '6052611890000'){
      setAuth(true)
      cargarTodo()
    } else alert('Clave incorrecta')
  }

  const cargarTodo = async ()=>{
    setLoading(true)
    try{
      const supabase = getSupabase()
      if(!supabase){ alert('Error ENV'); setLoading(false); return }
      const {data: s} = await supabase.from('stores').select('*').order('created_at',{ascending:false}).limit(300)
      const {data: p} = await supabase.from('products').select('*, stores(name,slug,tipo_tienda)').order('created_at',{ascending:false}).limit(500)
      let v=[], r=[]
      try{ const resV = await supabase.from('store_verifications').select('*, stores(name, whatsapp, slug)').in('status',['pendiente','revision']).order('created_at',{ascending:false}).limit(100); v = resV.data || [] }catch(e){}
      try{ const resR = await supabase.from('fraud_reports').select('*, stores(name, whatsapp)').in('status',['abierto','investigando']).order('created_at',{ascending:false}).limit(100); r = resR.data || [] }catch(e){}
      setStores(s||[]); setProducts(p||[]); setPendientes(v||[]); setReportes(r||[])
    }catch(e){ console.error(e) }finally{ setLoading(false) }
  }

  const uploadFile = async (file, bucket='product-images')=>{
    const supabase = getSupabase()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`
    const {error} = await supabase.storage.from(bucket).upload(fileName, file)
    if(error){
      const other = bucket==='store-logos' ? 'product-images' : 'store-logos'
      const res2 = await supabase.storage.from(other).upload(fileName, file)
      if(res2.error) return null
      const {data} = supabase.storage.from(other).getPublicUrl(fileName)
      return data.publicUrl
    }
    const {data} = supabase.storage.from(bucket).getPublicUrl(fileName)
    return data.publicUrl
  }

  const cambiarVerificacion = async (storeId, tipo)=>{
    const supabase = getSupabase()
    const { error } = await supabase.from('stores').update({ verification_status: tipo, verification_badge: tipo }).eq('id', storeId)
    if(error){ alert('Error: '+error.message); return }
    setStores(prev=> prev.map(s=> s.id===storeId ? {...s, verification_status: tipo, verification_badge: tipo} : s))
  }

  const crearTienda = async (e)=>{ e.preventDefault(); alert('Usa el archivo original para crear tienda - esta versión es solo demo visitas') }
  const abrirEdicion = (s)=>{ setEditingStore(s); setFormEdit({name:s.name, slug:s.slug, whatsapp:s.whatsapp, tipo_tienda:s.tipo_tienda, departamento:s.departamento||'Managua', municipio:s.municipio||'', direccion:s.direccion||'', logo_url:s.logo_url, admin_password:s.admin_password||genPIN()}) }
  const guardarEdicion = async (e)=>{ e.preventDefault(); const supabase=getSupabase(); const {error}=await supabase.from('stores').update({name:formEdit.name, slug:formEdit.slug, whatsapp:formEdit.whatsapp, tipo_tienda:formEdit.tipo_tienda, departamento:formEdit.departamento, municipio:formEdit.municipio, direccion:formEdit.direccion, admin_password:formEdit.admin_password}).eq('id',editingStore.id); if(error) alert(error.message); else {alert('Actualizado'); setEditingStore(null); cargarTodo()} }
  const eliminarTienda = async (store)=>{ if(!confirm(`¿Eliminar ${store.name}?`)) return; const supabase=getSupabase(); await supabase.from('products').delete().eq('store_id',store.id); await supabase.from('stores').delete().eq('id',store.id); cargarTodo() }
  const aprobarVerificacion = async (id, store_id)=>{ const supabase=getSupabase(); await supabase.from('store_verifications').update({status:'verificada'}).eq('id',id); await supabase.from('stores').update({verification_status:'verificada', verification_badge:'verificada'}).eq('id',store_id); setPendientes(p=>p.filter(x=>x.id!==id)) }
  const crearProducto = async (e)=>{ e.preventDefault() }
  const abrirEdicionProducto = (p)=>{ setEditingProduct(p); setFormEditProd({name:p.name, price:p.price, categoria:p.categoria, descripcion:p.description||'', video_url:p.video_url||'', tallas:p.tallas?.join(',')||'S,M,L,XL', image_url:p.image_url}) }
  const guardarEdicionProducto = async (e)=>{ e.preventDefault() }
  const copiar = (txt)=>{ navigator.clipboard.writeText(txt) }

  const tiendasFiltradas = stores.filter(s=> !qTienda || s.name.toLowerCase().includes(qTienda.toLowerCase()))
  const stats = {total: stores.length, boutique: stores.filter(s=>s.tipo_tienda==='boutique').length, general: stores.filter(s=>s.tipo_tienda==='general').length, comida: stores.filter(s=>s.tipo_tienda==='comida').length, vehiculos: stores.filter(s=>s.tipo_tienda==='vehiculos').length, verificadas: stores.filter(s=>s.verification_status==='verificada').length, productos: products.length}

  // CALCULO VISITAS
  const ahora = new Date()
  const visitasFiltradas = visitas.filter(v=>{
    const d = new Date(v.created_at)
    if(filtroVisitas==='hoy') return d.toDateString() === ahora.toDateString()
    if(filtroVisitas==='7d') return d >= new Date(ahora - 7*24*60*60*1000)
    return true
  })
  const visitasPorDepto = visitasFiltradas.reduce((acc,v)=>{
    const dep = v.departamento || 'Desconocido'
    if(dep==='Desconocido') return acc
    acc[dep] = (acc[dep]||0)+1
    return acc
  },{})
  // Normalizar para mapa (sin acentos)
  const normalize = (s)=> s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  const visitasNorm = {}
  Object.entries(visitasPorDepto).forEach(([k,v])=>{
    // Mapear León -> Leon etc para que cuadre con SVG
    const key = k
    visitasNorm[key]=v
    // También agregar versión sin acento
    const noAccent = k.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    if(noAccent!==k) visitasNorm[noAccent]= (visitasNorm[noAccent]||0)+v
  })

  const visitasPorDeptoOrdenadas = Object.entries(visitasPorDepto).sort((a,b)=>b[1]-a[1])
  const topDeptos = visitasPorDeptoOrdenadas.slice(0,5)
  const totalReal = visitasPorDeptoOrdenadas.reduce((s,[,c])=>s+c,0) || 1
  const maxDepto = visitasPorDeptoOrdenadas[0]?.[1]||1

  const visitasPorPagina = visitasFiltradas.reduce((acc,v)=>{ acc[v.pagina||'/']=(acc[v.pagina||'/']||0)+1; return acc},{})
  const visitasPorPaginaOrdenadas = Object.entries(visitasPorPagina).sort((a,b)=>b[1]-a[1]).slice(0,8)

  const dias = []
  for(let i=6;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i)
    const key = d.toISOString().slice(0,10)
    const count = visitas.filter(v=> v.created_at?.slice(0,10)===key).length
    dias.push({label: d.toLocaleDateString('es-NI',{weekday:'short'}), count, key})
  }
  const maxDia = Math.max(...dias.map(d=>d.count),1)
  const colores = ['#7000FF','#0066FF','#FF6A00','#00C853','#FF3B30','#FFD60A','#111']

  if(!auth){
    return (
      <div style={{minHeight:'100vh', background:'#0A0A0B', display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
        <div style={{background:'#fff', borderRadius:28, padding:32, maxWidth:420, width:'100%'}}>
          <h2 style={{fontWeight:900, fontSize:22}}>Super Admin</h2>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder="Clave" style={{width:'100%', border:'1.5px solid #E8E0DC', borderRadius:14, padding:'14px 16px', marginTop:20}}/>
          <button onClick={login} style={{width:'100%', marginTop:14, background:'#111', color:'#fff', border:'none', padding:14, borderRadius:14, fontWeight:800}}>Entrar →</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh', background:'#F6F1EC', fontFamily:'Inter, system-ui'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        *{font-family:'Inter', system-ui}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @media (max-width:768px){ .visitas-premium-grid{grid-template-columns:1fr !important} .mapa-grid{grid-template-columns:1fr !important} }
      `}</style>

      <div style={{position:'sticky', top:0, zIndex:40, background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)', borderBottom:'1px solid #EDE6E3'}}>
        <div style={{maxWidth:1400, margin:'0 auto', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h1 style={{fontWeight:900, fontSize:16}}>TiendaNica • Super Admin • Mapa</h1>
          <div style={{display:'flex', gap:8}}><button onClick={cargarTodo} style={{background:'#F0E9E2', border:'none', padding:'8px 14px', borderRadius:999, fontSize:11, fontWeight:700}}>↻ Sync</button><button onClick={()=>setAuth(false)} style={{background:'#111', color:'#fff', border:'none', padding:'8px 14px', borderRadius:999, fontSize:11}}>Salir</button></div>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'14px auto', padding:'0 20px', display:'flex', gap:8}}>
        {[{id:'tiendas', label:`🏪 Tiendas`},{id:'visitas', label:`📊 Visitas + Mapa ${visitas.length}`}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'11px 18px', borderRadius:999, border:'1px solid', borderColor: tab===t.id ? '#7000FF' : '#EDE6E3', fontWeight:800, fontSize:12, background: tab===t.id ? '#7000FF' : '#fff', color: tab===t.id ? '#fff' : '#111', cursor:'pointer'}}>{t.label}</button>
        ))}
      </div>

      <div style={{maxWidth:1400, margin:'16px auto', padding:'0 20px 40px'}}>
        {tab==='visitas' && (
          <div style={{display:'flex', flexDirection:'column', gap:16}}>

            <div style={{background:'linear-gradient(135deg, #0F0F10 0%, #1A1A1E 50%, #252529 100%)', borderRadius:24, padding:22, color:'#fff', border:'1px solid #2A2A2E', position:'relative', overflow:'hidden'}}>
              <div style={{position:'absolute', top:-40, right:-40, width:200, height:200, background:'radial-gradient(circle, rgba(112,0,255,0.3), transparent 70%)', borderRadius:'50%'}}/>
              <div style={{position:'relative', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:14}}>
                <div>
                  <div style={{display:'flex', alignItems:'center', gap:10}}><div style={{width:36, height:36, borderRadius:10, background:'linear-gradient(135deg, #7000FF, #0066FF)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900}}>📍</div><h2 style={{fontWeight:900, fontSize:20}}>Mapa Nicaragua • Analytics Premium</h2></div>
                  <p style={{fontSize:12, color:'#9A9AA0', marginTop:8}}>Visualiza dónde te visitan. Cada departamento se ilumina según visitas reales.</p>
                  <div style={{display:'flex', gap:8, marginTop:14}}>{[{id:'todo', l:'Todo'},{id:'7d', l:'7 días'},{id:'hoy', l:'Hoy'}].map(f=>(<button key={f.id} onClick={()=>setFiltroVisitas(f.id)} style={{background: filtroVisitas===f.id ? '#fff' : 'rgba(255,255,255,0.08)', color: filtroVisitas===f.id ? '#111' : '#fff', border:'1px solid rgba(255,255,255,0.12)', padding:'7px 14px', borderRadius:999, fontSize:11, fontWeight:800, cursor:'pointer'}}>{f.l}</button>))}</div>
                </div>
                <div style={{display:'flex', gap:8}}><button onClick={cargarVisitas} style={{background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', padding:'10px 16px', borderRadius:12, fontSize:12, fontWeight:700, cursor:'pointer'}}>{visitasLoading?'⏳':'↻'} Actualizar</button></div>
              </div>
              <div style={{position:'relative', marginTop:18, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:10}}>
                {[
                  {k:'Visitas totales', v:visitasFiltradas.length, sub:`${visitas.length} históricas`},
                  {k:'Hoy', v:visitas.filter(v=> new Date(v.created_at).toDateString() === ahora.toDateString()).length, sub:'24h'},
                  {k:'Top Depto', v:visitasPorDeptoOrdenadas[0]?.[0] || '—', sub:`${visitasPorDeptoOrdenadas[0]?.[1]||0} visitas`},
                  {k:'Cobertura', v:`${Object.keys(visitasPorDepto).length}/17`, sub:'deptos alcanzados'},
                ].map(c=>(
                  <div key={c.k} style={{background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'12px 14px'}}><p style={{fontSize:10, color:'#8A8A90', fontWeight:800, textTransform:'uppercase'}}>{c.k}</p><p style={{fontSize:18, fontWeight:900, marginTop:4}}>{c.v}</p><p style={{fontSize:10, color:'#6A6A70', marginTop:2}}>{c.sub}</p></div>
                ))}
              </div>
            </div>

            <div className="mapa-grid" style={{display:'grid', gridTemplateColumns:'0.9fr 1.1fr', gap:16}}>

              <div style={{background:'#fff', borderRadius:20, padding:20, border:'1px solid #EDE6E3', boxShadow:'0 8px 32px rgba(0,0,0,0.04)', position:'sticky', top:84}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <h3 style={{fontWeight:900, fontSize:14}}>🗺️ Mapa Nicaragua • Calor</h3>
                  <span style={{fontSize:10, background:'#7000FF', color:'#fff', padding:'4px 10px', borderRadius:999, fontWeight:800}}>{totalReal} con geo</span>
                </div>
                <p style={{fontSize:11, color:'#8A7F78', marginTop:4}}>Toca un departamento para ver detalles. Se pinta automáticamente morado intenso donde más te visitan.</p>
                <div style={{marginTop:16}}>
                  <MapaNicaragua data={visitasNorm} max={maxDepto}/>
                </div>
                <div style={{marginTop:16, background:'#F9F6F2', borderRadius:12, padding:12, border:'1px solid #EDE6E3'}}>
                  <p style={{fontSize:11, fontWeight:800}}>Cómo funciona</p>
                  <p style={{fontSize:11, color:'#6B5E55', marginTop:6, lineHeight:1.4}}>• Cada visita guarda `x-vercel-ip-city` → departamento real.<br/>• Si no hay geo (localhost), queda Desconocido y se excluye del mapa.<br/>• Después del deploy en Vercel, verás Managua, Carazo, etc iluminados.</p>
                </div>
              </div>

              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                <div style={{background:'#fff', borderRadius:20, padding:20, border:'1px solid #EDE6E3'}}>
                  <h3 style={{fontWeight:900, fontSize:14}}>📈 Últimos 7 días</h3>
                  <div style={{marginTop:18, display:'flex', alignItems:'end', gap:6, height:110}}>
                    {dias.map((d,i)=>{
                      const h = Math.round((d.count/maxDia)*100)
                      const isToday = d.key === ahora.toISOString().slice(0,10)
                      return (
                        <div key={d.key} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
                          <div style={{width:'100%', background:'#F5F1EC', borderRadius:10, height:90, position:'relative', overflow:'hidden', display:'flex', alignItems:'end'}}>
                            <div style={{width:'100%', height:`${h}%`, background: isToday ? 'linear-gradient(180deg, #7000FF, #0066FF)' : 'linear-gradient(180deg, #E8E0DC, #D9D0C8)', borderRadius:10, minHeight: d.count>0 ? 8 : 0}}/>
                            {d.count>0 && <span style={{position:'absolute', top:4, left:'50%', transform:'translateX(-50%)', fontSize:10, fontWeight:900, color: isToday ? '#7000FF' : '#6B5E55'}}>{d.count}</span>}
                          </div>
                          <span style={{fontSize:10, fontWeight:800, color: isToday ? '#7000FF' : '#8A7F78'}}>{d.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={{background:'#fff', borderRadius:20, padding:20, border:'1px solid #EDE6E3'}}>
                  <h3 style={{fontWeight:900, fontSize:14}}>📍 Ranking Departamentos</h3>
                  <div style={{marginTop:16, display:'flex', flexDirection:'column', gap:10}}>
                    {visitasPorDeptoOrdenadas.map(([depto,count],idx)=>{
                      const max = visitasPorDeptoOrdenadas[0]?.[1]||1
                      const pct = Math.round((count/max)*100)
                      const color = colores[idx % colores.length]
                      return (
                        <div key={depto} style={{display:'flex', alignItems:'center', gap:12}}>
                          <span style={{fontSize:11, fontWeight:800, minWidth:20, background: idx===0?'#7000FF':idx===1?'#0066FF':'#F5F1EC', color: idx<2?'#fff':'#6B5E55', width:20, height:20, borderRadius:999, display:'flex', alignItems:'center', justifyContent:'center'}}>{idx+1}</span>
                          <span style={{fontSize:12, fontWeight:800, minWidth:90}}>{depto}</span>
                          <div style={{flex:1, height:22, background:'#F5F1EC', borderRadius:999, overflow:'hidden', display:'flex', alignItems:'center'}}>
                            <div style={{width:`${pct}%`, height:'100%', background:`linear-gradient(90deg, ${color}, ${color}CC)`, borderRadius:999, display:'flex', alignItems:'center', paddingLeft:8}}><span style={{fontSize:10, fontWeight:900, color:'#fff'}}>{count}</span></div>
                          </div>
                          <span style={{fontSize:10, color:'#8A7F78'}}>{Math.round((count/totalReal)*100)}%</span>
                        </div>
                      )
                    })}
                    {visitasPorDeptoOrdenadas.length===0 && <p style={{fontSize:12, color:'#999'}}>Aún no hay visitas con departamento real. Haz deploy en Vercel y entra desde móvil en Nicaragua.</p>}
                  </div>
                </div>

                <div style={{background:'#111', color:'#fff', borderRadius:20, padding:20, border:'1px solid #222', display:'flex', gap:14, alignItems:'center'}}>
                  <div style={{width:44, height:44, borderRadius:12, background:'linear-gradient(135deg, #7000FF, #0066FF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20}}>💡</div>
                  <div>
                    <p style={{fontSize:11, fontWeight:800, opacity:0.6}}>INSIGHT AUTOMÁTICO</p>
                    <p style={{fontSize:13, fontWeight:700, marginTop:4, lineHeight:1.4}}>{visitasPorDeptoOrdenadas[0] ? `Tu audiencia está en ${visitasPorDeptoOrdenadas[0][0]} (${visitasPorDeptoOrdenadas[0][1]} visitas). Crea 2 tiendas boutique allí y duplica ventas.` : 'Cuando tengas 10 visitas con geo, te diré dónde enfocar marketing.'}</p>
                  </div>
                </div>

                <div style={{background:'#fff', borderRadius:20, padding:18, border:'1px solid #EDE6E3'}}>
                  <h3 style={{fontWeight:900, fontSize:13}}>⚡ En vivo</h3>
                  <div style={{marginTop:12, display:'flex', flexDirection:'column', gap:8, maxHeight:360, overflowY:'auto'}}>
                    {visitas.slice(0,20).map(v=>(
                      <div key={v.id} style={{display:'flex', gap:10, padding:'10px 12px', background:'#F9F6F2', borderRadius:12, border:'1px solid #F0E9E2'}}>
                        <div style={{width:32, height:32, borderRadius:10, background:`linear-gradient(135deg, #7000FF, #111)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:900}}>{(v.departamento||'?')[0]}</div>
                        <div style={{flex:1}}><b style={{fontSize:12}}>{v.departamento||'Desconocido'}</b><span style={{fontSize:10, marginLeft:6, color:'#8A7F78'}}>{v.municipio||''}</span><p style={{fontSize:10, color:'#8A7F78', fontFamily:'monospace'}}>{v.pagina} • {new Date(v.created_at).toLocaleTimeString('es-NI')}</p></div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
