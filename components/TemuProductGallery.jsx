'use client'
import { useState, useRef } from 'react'

export default function TemuProductGallery({ images=[], videoUrl, name }){
  // images = array de fotos, videoUrl opcional
  const slides = []
  if(images && images.length>0) images.forEach(img=>{ if(img) slides.push({type:'image', url:img}) })
  if(videoUrl) slides.push({type:'video', url:videoUrl})
  // si no hay nada, placeholder
  if(slides.length===0) slides.push({type:'image', url:'/tienda-nica-logo.png'})

  const [current, setCurrent] = useState(0)
  const [muted, setMuted] = useState(true)
  const videoRef = useRef(null)

  return (
    <div style={{position:'relative', background:'#000'}}>
      <div style={{display:'flex', overflow:'hidden', aspectRatio:'1/1', position:'relative'}}>
        {slides.map((s,i)=>(
          <div key={i} style={{minWidth:'100%', display: i===current ? 'block' : 'none', position:'relative'}}>
            {s.type==='image' ? (
              <img src={s.url} alt={name} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
            ) : (
              <div style={{width:'100%', height:'100%', position:'relative', background:'#000'}}>
                <video 
                  ref={videoRef}
                  src={s.url} 
                  autoPlay 
                  loop 
                  muted={muted} 
                  playsInline
                  style={{width:'100%', height:'100%', objectFit:'cover'}}
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

      {/* Dots estilo Temu */}
      <div style={{position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6, background:'rgba(0,0,0,0.35)', padding:'6px 10px', borderRadius:999}}>
        {slides.map((_,i)=>(
          <button 
            key={i} 
            onClick={()=>setCurrent(i)}
            style={{
              width: i===current ? 18 : 6, 
              height:6, 
              borderRadius:999, 
              border:'none', 
              background: i===current ? '#fff' : 'rgba(255,255,255,0.5)',
              transition:'all 0.2s',
              cursor:'pointer'
            }}
          />
        ))}
      </div>

      {/* Contador fotos + video badge */}
      <div style={{position:'absolute', top:12, right:12, display:'flex', gap:6}}>
        <span style={{background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:11, padding:'4px 8px', borderRadius:999}}>{current+1}/{slides.length}</span>
      </div>

      {/* Swipe areas */}
      <button onClick={()=>setCurrent((current-1+slides.length)%slides.length)} style={{position:'absolute', left:0, top:0, bottom:0, width:'20%', background:'transparent', border:'none'}}/>
      <button onClick={()=>setCurrent((current+1)%slides.length)} style={{position:'absolute', right:0, top:0, bottom:0, width:'20%', background:'transparent', border:'none'}}/>
    </div>
  )
}
