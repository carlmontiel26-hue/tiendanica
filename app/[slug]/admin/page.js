'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase' // ajusta tu import

// COMPONENTE PARA EL PANEL DEL DUEÑO DE TIENDA
// Pega esto en tu archivo de agregar/editar producto: app/[slug]/dashboard/page.js o components/AddProductForm.js

export default function ProductFormWithDescription({ storeId, existingProduct=null, onSaved }){
  const [name,setName]=useState(existingProduct?.name||'')
  const [price,setPrice]=useState(existingProduct?.price||'')
  const [categoria,setCategoria]=useState(existingProduct?.categoria||'vestidos')
  const [description,setDescription]=useState(existingProduct?.description||'')
  const [image,setImage]=useState(existingProduct?.image_url||'')
  const [loading,setLoading]=useState(false)

  const handleSave = async()=>{
    if(!name || !price) return alert('Nombre y precio obligatorios')
    if(description.length>200) return alert('Descripción máximo 200 caracteres')
    setLoading(true)
    const payload = {
      store_id: storeId,
      name: name.trim(),
      price: Number(price),
      categoria,
      description: description.trim(), // NUEVO CAMPO
      image_url: image
    }
    let res
    if(existingProduct){
      res = await supabase.from('products').update(payload).eq('id', existingProduct.id)
    }else{
      res = await supabase.from('products').insert(payload)
    }
    setLoading(false)
    if(res.error) alert(res.error.message)
    else { alert('Producto guardado con descripción!'); onSaved?.() }
  }

  return (
    <div style={{background:'#fff', border:'1px solid #EAE6E1', borderRadius:20, padding:16, maxWidth:480}}>
      <h3 style={{fontWeight:900, fontSize:14, marginBottom:12}}>{existingProduct ? 'Editar producto' : 'Agregar producto nuevo'}</h3>
      
      <label style={{fontSize:11, fontWeight:700}}>Nombre del producto *</label>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Vestido Rojo Floral Talla M" style={{width:'100%', padding:'10px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4, marginBottom:10, fontSize:13}}/>

      {/* NUEVA DESCRIPCION CORTA */}
      <label style={{fontSize:11, fontWeight:700}}>Descripción corta <span style={{fontWeight:400, color:'#9A9590'}}>(máx 200 caracteres, se ve en el market)</span></label>
      <textarea 
        value={description} 
        onChange={e=>setDescription(e.target.value.slice(0,200))} 
        placeholder="Ej: Tela lino fresca, ideal para calor, talla M queda a L, disponible en rojo y azul. Envío hoy." 
        style={{width:'100%', padding:'10px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4, marginBottom:4, fontSize:13, minHeight:70, resize:'none'}}
      />
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:12}}>
        <span style={{fontSize:10, color: description.length>180 ? '#ff5555' : '#9A9590'}}>{description.length}/200</span>
        <span style={{fontSize:10, color:'#9A9590'}}>Tip: 60-90 caracteres venden más</span>
      </div>

      <div style={{display:'flex', gap:8, marginBottom:10}}>
        <div style={{flex:1}}>
          <label style={{fontSize:11, fontWeight:700}}>Precio C$ *</label>
          <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="350" style={{width:'100%', padding:'10px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4, fontSize:13}}/>
        </div>
        <div style={{flex:1}}>
          <label style={{fontSize:11, fontWeight:700}}>Categoría</label>
          <select value={categoria} onChange={e=>setCategoria(e.target.value)} style={{width:'100%', padding:'10px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4, fontSize:13}}>
            <option value="vestidos">vestidos</option>
            <option value="blusas">blusas</option>
            <option value="jeans">jeans</option>
            <option value="faldas">faldas</option>
            <option value="accesorios">accesorios</option>
            <option value="hogar">hogar</option>
            <option value="tecnologia">tecnologia</option>
            <option value="belleza">belleza</option>
          </select>
        </div>
      </div>

      <label style={{fontSize:11, fontWeight:700}}>Imagen URL</label>
      <input value={image} onChange={e=>setImage(e.target.value)} placeholder="https://..." style={{width:'100%', padding:'10px 12px', borderRadius:12, border:'1px solid #EAE6E1', marginTop:4, marginBottom:14, fontSize:13}}/>

      <button onClick={handleSave} disabled={loading} style={{width:'100%', background:'#0A0A0A', color:'#fff', border:'none', padding:'12px', borderRadius:999, fontWeight:900, cursor:'pointer'}}>
        {loading ? 'Guardando...' : existingProduct ? 'Actualizar producto' : 'Guardar producto con descripción'}
      </button>

      {description && (
        <div style={{marginTop:12, background:'#FBF9F7', border:'1px dashed #EAE6E1', borderRadius:12, padding:10}}>
          <span style={{fontSize:10, fontWeight:700, color:'#9A9590'}}>Vista previa en market:</span>
          <p style={{fontSize:12, fontWeight:700, marginTop:4}}>{name||'Nombre producto'}</p>
          <p style={{fontSize:11, color:'#666', marginTop:2}}>{description}</p>
        </div>
      )}
    </div>
  )
}
