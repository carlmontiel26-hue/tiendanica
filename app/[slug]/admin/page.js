'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function OwnerAdmin({params}){
  const slug=params?.slug
  const [store,setStore]=useState(null); const [products,setProducts]=useState([])
  // Ahora boutique también tiene tipo de prenda
  const [pform,setPform]=useState({name:'',price:'',categoria:'blusa', categoriaComida:'plato'}); 
  const [img,setImg]=useState(null); const [extra1,setExtra1]=useState(null); const [extra2,setExtra2]=useState(null); const [tallas,setTallas]=useState([]); const [editing,setEditing]=useState(null); const [up,setUp]=useState(false)
  const [ordenBusy,setOrdenBusy]=useState(null)

  const fetchProducts = async (storeId) => {
    const {data} = await supabase.from('products').select('*').eq('store_id',storeId).order('created_at',{ascending:false})
    // Orden local por 'orden' si existe
    const withOrden = (data||[]).map((p,i)=> ({...p, orden: p.orden ?? i})).sort((a,b)=> (a.orden ?? 0)-(b.orden ?? 0))
    setProducts(withOrden)
  }

  useEffect(()=>{(async()=>{
    const {data:s}=await supabase.from('stores').select('*').eq('slug',slug).single()
    if(s){setStore(s); await fetchProducts(s.id)}
  })()},[slug])

  const upload=async(f)=>{const n=Date.now()+'-'+f.name; await supabase.storage.from('product-images').upload(n,f); const {data}=supabase.storage.from('product-images').getPublicUrl(n); return data.publicUrl}

  const save=async(e)=>{
    e.preventDefault(); setUp(true); try{
      let url=editing?.image_url||''; if(img) url=await upload(img)
      let extras=editing?.extra_images||[]; if(store.tipo_tienda==='boutique'){ if(extra1){const u=await upload(extra1); extras=[...extras,u]} if(extra2){const u=await upload(extra2); extras=[...extras,u]} extras=extras.slice(0,2) }
      const maxOrden = products.length>0 ? Math.max(...products.map(p=>p.orden ?? 0)) : 0
      // Categoria según tipo de tienda
      let categoriaFinal = 'plato'
      if(store.tipo_tienda==='comida') categoriaFinal = pform.categoriaComida
      if(store.tipo_tienda==='boutique') categoriaFinal = pform.categoria // blusa, vestido, etc

      const payload={
        store_id:store.id,
        name:pform.name,
        price:parseFloat(pform.price),
        image_url:url,
        extra_images:store.tipo_tienda==='boutique'?extras:[],
        tallas:store.tipo_tienda==='boutique'?tallas:[],
        categoria:categoriaFinal,
        is_active:true,
      }
      // Solo intenta guardar orden si es boutique (si la columna existe, bien, si no, no rompe)
      if(store.tipo_tienda==='boutique'){
        if(!editing) payload.orden = maxOrden+1
        else if(editing.orden!==undefined) payload.orden = editing.orden
      }

      let result
      if(editing) result = await supabase.from('products').update(payload).eq('id',editing.id)
      else result = await supabase.from('products').insert(payload)
      
      // Si falla por columna orden, reintenta sin orden
      if(result.error && result.error.message?.includes('orden')){
        delete payload.orden
        if(editing) await supabase.from('products').update(payload).eq('id',editing.id)
        else await supabase.from('products').insert(payload)
      }

      setPform({name:'',price:'',categoria:'blusa', categoriaComida:'plato'}); setImg(null); setExtra1(null); setExtra2(null); setTallas([]); setEditing(null)
      await fetchProducts(store.id)
    }finally{setUp(false)}
  }

  const startEdit=(p)=>{
    setEditing(p); 
    setPform({
      name:p.name,
      price:p.price,
      categoria: store?.tipo_tienda==='boutique' ? (p.categoria||'blusa') : 'blusa',
      categoriaComida: store?.tipo_tienda==='comida' ? (p.categoria||'plato') : 'plato'
    }); 
    setTallas(p.tallas||[])
  }
  const delProd=async(id)=>{if(!confirm('Eliminar?'))return; await supabase.from('products').delete().eq('id',id); await fetchProducts(store.id)}

  const moveProduct = async (index, dir) => {
    if(store.tipo_tienda!=='boutique') return
    const newIndex = index + dir
    if(newIndex<0 || newIndex>=products.length) return
    setOrdenBusy(products[index].id)
    const newProducts = [...products]
    const a = newProducts[index]
    const b = newProducts[newIndex]
    newProducts[index]=b
    newProducts[newIndex]=a
    const reordered = newProducts.map((p,i)=>({...p, orden:i}))
    setProducts(reordered)
    try{
      await supabase.from('products').update({orden: reordered[index].orden}).eq('id', reordered[index].id)
      await supabase.from('products').update({orden: reordered[newIndex].orden}).eq('id', reordered[newIndex].id)
    }catch(e){ console.log('Ejecuta ALTER TABLE products ADD COLUMN orden INT en Supabase para persistir orden') }
    setOrdenBusy(null)
  }

  if(!store) return <div className="p-10">Cargando {slug}...</div>
  const isBoutique=store.tipo_tienda==='boutique'; const isComida=store.tipo_tienda==='comida'
  return(
    <main className="p-6 bg-[#fafaf9] min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center"><h1 className="font-black">Admin {store.name} <span className="text-xs font-normal opacity-60">({store.tipo_tienda})</span></h1><a href={`/${slug}`} target="_blank" className="bg-black text-white px-4 py-2 rounded-full text-xs">Ver tienda</a></div>
        <div className="mt-4 bg-white border rounded-2xl p-4 flex gap-4 items-center"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://tiendanica.store/${slug}`} className="w-20 h-20"/><div><p className="font-bold text-sm">QR Clientes</p><p className="text-xs opacity-60">https://tiendanica.store/{slug}</p></div></div>

        <form onSubmit={save} className="grid md:grid-cols-3 gap-3 mt-6 bg-white p-4 rounded-2xl border-2 border-dashed">
          <div className="md:col-span-3 flex justify-between"><p className="font-bold text-sm">{editing?'✏️ Editando '+editing.name:'➕ Nuevo'} {isComida?`• ${pform.categoriaComida}`: isBoutique?`• ${pform.categoria}`:''}</p>{editing&&<button type="button" onClick={()=>{setEditing(null); setPform({name:'',price:'',categoria:'blusa', categoriaComida:'plato'}); setTallas([])}} className="text-xs underline">Cancelar</button>}</div>
          <input className="border rounded-xl px-3 py-2" placeholder="Nombre" value={pform.name} onChange={e=>setPform({...pform,name:e.target.value})} required/>
          <input className="border rounded-xl px-3 py-2" placeholder="Precio" type="number" value={pform.price} onChange={e=>setPform({...pform,price:e.target.value})} required/>
          
          {/* SELECTOR TIPO - COMIDA (original intacto) */}
          {isComida&&<select className="border rounded-xl px-3 py-2 font-bold text-xs" value={pform.categoriaComida} onChange={e=>setPform({...pform,categoriaComida:e.target.value})}><option value="plato">🍽️ Plato</option><option value="bebida">🥤 Bebida</option><option value="extra">➕ Extra</option></select>}
          
          {/* SELECTOR TIPO - BOUTIQUE (NUEVO, lo que te faltaba) */}
          {isBoutique&&<select className="border rounded-xl px-3 py-2 font-bold text-xs bg-[#FBF9F7]" value={pform.categoria} onChange={e=>setPform({...pform,categoria:e.target.value})}>
            <option value="blusa">👚 Blusa</option>
            <option value="vestido">👗 Vestido</option>
            <option value="pantalon">👖 Pantalón</option>
            <option value="falda">🩳 Falda</option>
            <option value="conjunto">👯 Conjunto</option>
            <option value="bolso">👜 Bolso</option>
            <option value="accesorio">💍 Accesorio</option>
            <option value="zapatos">👠 Zapatos</option>
            <option value="otro">✨ Otro</option>
          </select>}

          <label className="md:col-span-3 border-2 border-dashed rounded-xl py-4 text-center bg-gray-50 cursor-pointer">{img?'✅ '+img.name:'📸 Foto 1'}<input type="file" className="hidden" accept="image/*" onChange={e=>setImg(e.target.files[0])}/></label>
          {isBoutique&&<><label className="border rounded-xl py-3 text-center bg-[#FBF9F7] cursor-pointer">{extra1?'✅ '+extra1.name:'Foto 2'}<input type="file" className="hidden" onChange={e=>setExtra1(e.target.files[0])}/></label><label className="border rounded-xl py-3 text-center bg-[#FBF9F7] cursor-pointer">{extra2?'✅ '+extra2.name:'Foto 3'}<input type="file" className="hidden" onChange={e=>setExtra2(e.target.files[0])}/></label><div className="md:col-span-3 border rounded-xl p-3"><p className="font-black text-xs">📏 TALLAS</p><div className="flex gap-2 mt-2 flex-wrap">{['XS','S','M','L','XL','2','3','4','5','6','8','10','26','28','30','32','34','36','38','40','42','44'].map(t=><button type="button" key={t} onClick={()=>setTallas(v=>v.includes(t)?v.filter(x=>x!==t):[...v,t])} className={`px-3 py-2 rounded-full text-xs border ${tallas.includes(t)?'bg-black text-white':'bg-white'}`}>{t}</button>)}</div></div></>}
          <button className="md:col-span-3 bg-black text-white py-3 rounded-full font-bold">{up?'Guardando...': editing? 'Actualizar' : isComida? `Agregar ${pform.categoriaComida}` : isBoutique? `Agregar ${pform.categoria}` : 'Agregar producto'}</button>
        </form>

        <div className="grid md:grid-cols-3 gap-3 mt-6">
          {products.map((p, idx)=><div key={p.id} className="border rounded-2xl overflow-hidden bg-white relative">
            <img src={p.image_url} className="h-28 w-full object-cover"/>
            <div className="p-3"><p className="font-bold text-sm">{p.name}</p><p className="text-xs">C$ {p.price} • {p.categoria} {p.tallas?.length?`• ${p.tallas.join(', ')}`:''}</p></div>
            {isBoutique && (
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                <button type="button" disabled={idx===0 || ordenBusy===p.id} onClick={()=>moveProduct(idx,-1)} className="w-7 h-7 bg-white border shadow rounded-full text-xs disabled:opacity-30">↑</button>
                <button type="button" disabled={idx===products.length-1 || ordenBusy===p.id} onClick={()=>moveProduct(idx,1)} className="w-7 h-7 bg-white border shadow rounded-full text-xs disabled:opacity-30">↓</button>
              </div>
            )}
            <div className="p-2 border-t flex gap-2"><button onClick={()=>startEdit(p)} className="flex-1 bg-black text-white text-xs py-2 rounded-full">✏️ Editar</button><button onClick={()=>delProd(p.id)} className="flex-1 bg-red-50 text-red-600 text-xs py-2 rounded-full">🗑️ Eliminar</button></div>
          </div>)}
        </div>
      </div>
    </main>
  )
}
