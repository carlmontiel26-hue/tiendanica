'use client'
import { useState } from 'react'

export function KitBanner({ store }) {
  const domain = "tiendanica.store"
  const storeUrl = `https://${domain}/${store.slug}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(storeUrl)}`
  const [downloading, setDownloading] = useState(null)

  const downloadBanner = async (format) => {
    setDownloading(format)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    let W, H
    if(format==='story'){ W=1080; H=1920 }
    else if(format==='post'){ W=1080; H=1080 }
    else { W=1920; H=1080 }

    canvas.width = W
    canvas.height = H

    // Fondo verde TiendaNica
    ctx.fillStyle = '#00D084'
    ctx.fillRect(0,0,W,H)

    // Cargar imagenes
    const loadImg = (src) => new Promise((res,rej)=>{
      const img = new Image()
      img.crossOrigin='anonymous'
      img.onload=()=>res(img)
      img.onerror=()=>res(null)
      img.src=src
    })

    const coverImg = store.cover_image ? await loadImg(store.cover_image) : null
    const qrImg = await loadImg(qrUrl)

    // Card blanca redondeada
    const cardPad = format==='wide' ? 80 : 40
    const cardX = cardPad
    const cardY = format==='story' ? (coverImg? 820 : 200) : (format==='post'? 80 : 60)
    const cardW = W - cardPad*2
    const cardH = H - cardY - cardPad - (format==='story'? 120 : 60)

    // Dibujar cover arriba si es story/post
    if(format==='story' && coverImg){
      // cover rect top
      const ch = 740
      ctx.save()
      const r=40
      ctx.beginPath()
      ctx.roundRect(40,40,W-80,ch,r)
      ctx.clip()
      // contain
      const scale = Math.max((W-80)/coverImg.width, ch/coverImg.height)
      const cw = coverImg.width*scale
      const ch2 = coverImg.height*scale
      ctx.drawImage(coverImg, 40 + (W-80 - cw)/2, 40 + (ch - ch2)/2, cw, ch2)
      ctx.restore()
    }

    // White card
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardW, cardH, 48)
    ctx.fill()

    // Logo text TiendaNica
    ctx.fillStyle = '#111'
    ctx.font = `bold ${format==='wide'? 36:32}px Inter, sans-serif`
    ctx.fillText('TiendaNica', cardX+40, cardY+70)
    // green dot for Nica
    ctx.fillStyle = '#00D084'
    ctx.fillRect(cardX+175, cardY+45, 10,10)

    // Store name
    ctx.fillStyle = '#000'
    ctx.font = `900 ${format==='wide'? 56:48}px Inter, sans-serif`
    const name = store.name || 'Mi Pulpería'
    // truncate
    ctx.fillText(name.slice(0,24), cardX+40, cardY+140)

    ctx.fillStyle = '#6b7280'
    ctx.font = `${format==='wide'? 24:22}px Inter, sans-serif`
    ctx.fillText('La pulpería del barrio, ahora online', cardX+40, cardY+180)

    // QR
    if(qrImg){
      const qrSize = format==='story'? 460 : format==='post'? 380 : 320
      const qx = cardX + (cardW - qrSize)/2
      const qy = cardY + (format==='wide'? 210 : 230)
      // border
      ctx.fillStyle='#000'
      ctx.beginPath()
      ctx.roundRect(qx-10, qy-10, qrSize+20, qrSize+20, 24)
      ctx.fill()
      ctx.fillStyle='#fff'
      ctx.beginPath()
      ctx.roundRect(qx-6, qy-6, qrSize+12, qrSize+12, 20)
      ctx.fill()
      ctx.drawImage(qrImg, qx, qy, qrSize, qrSize)

      // Escanea aqui
      ctx.fillStyle='#6b7280'
      ctx.font=`600 ${format==='wide'?22:20}px Inter, sans-serif`
      ctx.textAlign='center'
      ctx.fillText('Escanea aquí', cardX+cardW/2, qy+qrSize+40)
      ctx.textAlign='left'

      // Black pill WhatsApp
      const pillY = qy+qrSize+80
      const pillH = format==='wide'? 64:72
      const pillW = cardW - 80
      ctx.fillStyle='#000'
      ctx.beginPath()
      ctx.roundRect(cardX+40, pillY, pillW, pillH, 36)
      ctx.fill()
      ctx.fillStyle='#fff'
      ctx.font=`bold ${format==='wide'?20:18}px Inter, sans-serif`
      ctx.textAlign='center'
      ctx.fillText(`Pedir por WhatsApp +${store.whatsapp}`, cardX+cardW/2, pillY+pillH/2+6)
      ctx.textAlign='left'
    }

    // footer url
    ctx.fillStyle='#fff'
    ctx.font=`600 22px Inter, sans-serif`
    ctx.textAlign='center'
    ctx.fillText(`${domain}/${store.slug}`, W/2, H-40)
    ctx.textAlign='left'

    // download
    const link = document.createElement('a')
    link.download = `${store.slug}-${format}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setDownloading(null)
  }

  return (
    <div className="bg-white border rounded-[24px] p-6 mt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-lg">🎨 Kit Publicidad - Nuevo</h2>
        <span className="text-[10px] bg-[#00D084] text-black px-3 py-1 rounded-full font-bold">VERDE OFICIAL</span>
      </div>
      <p className="text-xs text-gray-500 mt-2">Fondo verde + foto real de tu tienda. Sin tocar QR ni links actuales.</p>

      <div className="mt-5 grid md:grid-cols-3 gap-4">
        <div className="border rounded-2xl p-3 bg-[#fafaf9]">
          <div className="aspect-[9/16] bg-[#00D084] rounded-xl overflow-hidden relative flex flex-col items-center justify-between p-3">
            {store.cover_image && <img src={store.cover_image} className="w-full h-[38%] object-cover rounded-lg"/>}
            <div className="bg-white w-full rounded-xl p-2 text-center flex-1 mt-2 flex flex-col justify-center">
              <p className="font-black text-[10px]">{store.name}</p>
              <img src={qrUrl} className="w-20 h-20 mx-auto my-1 border-2 border-black rounded-lg"/>
              <p className="text-[7px] bg-black text-white rounded-full py-1">WhatsApp</p>
            </div>
          </div>
          <p className="font-bold text-xs mt-2">Historia / Estado</p>
          <p className="text-[10px] text-gray-400">9:16 - TikTok, Reels, WhatsApp Estado</p>
          <button onClick={()=>downloadBanner('story')} disabled={!!downloading} className="mt-2 w-full bg-black text-white text-xs py-2 rounded-full font-bold">
            {downloading==='story'?'Generando...':'Descargar PNG'}
          </button>
        </div>

        <div className="border rounded-2xl p-3 bg-[#fafaf9]">
          <div className="aspect-square bg-[#00D084] rounded-xl overflow-hidden relative flex items-center justify-center p-4">
            <div className="bg-white w-full rounded-xl p-3 text-center">
              <p className="font-black text-[11px]">{store.name}</p>
              <img src={qrUrl} className="w-24 h-24 mx-auto my-2 border-2 border-black rounded-lg"/>
              <p className="text-[7px] bg-black text-white rounded-full py-1">Pedir por WhatsApp</p>
            </div>
          </div>
          <p className="font-bold text-xs mt-2">Post Cuadrado</p>
          <p className="text-[10px] text-gray-400">1:1 - Facebook, Instagram Feed</p>
          <button onClick={()=>downloadBanner('post')} disabled={!!downloading} className="mt-2 w-full bg-black text-white text-xs py-2 rounded-full font-bold">
            {downloading==='post'?'Generando...':'Descargar PNG'}
          </button>
        </div>

        <div className="border rounded-2xl p-3 bg-[#fafaf9]">
          <div className="aspect-[16/9] bg-[#00D084] rounded-xl overflow-hidden relative flex items-center justify-center p-3">
            <div className="bg-white w-full rounded-xl p-2 flex items-center gap-2">
              {store.cover_image && <img src={store.cover_image} className="w-16 h-12 object-cover rounded-lg"/>}
              <div className="flex-1 text-center">
                <p className="font-black text-[9px]">{store.name}</p>
                <img src={qrUrl} className="w-12 h-12 mx-auto border border-black rounded"/>
              </div>
            </div>
          </div>
          <p className="font-bold text-xs mt-2">Portada / Banner</p>
          <p className="text-[10px] text-gray-400">16:9 - Facebook Portada, WhatsApp Business</p>
          <button onClick={()=>downloadBanner('wide')} disabled={!!downloading} className="mt-2 w-full bg-black text-white text-xs py-2 rounded-full font-bold">
            {downloading==='wide'?'Generando...':'Descargar PNG'}
          </button>
        </div>
      </div>

      <div className="mt-4 bg-black text-white rounded-xl p-3 flex justify-between items-center">
        <p className="text-[11px]">Link oficial: <b>tiendanica.store/{store.slug}</b></p>
        <a href={`https://${domain}/${store.slug}`} target="_blank" className="text-[11px] bg-white text-black px-3 py-1 rounded-full font-bold">Abrir</a>
      </div>
    </div>
  )
}
