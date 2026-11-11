import { NextResponse } from 'next/server'

// Esta ruta es solo para boutique-prueba-360
// Usa Replicate con modelo IDM-VTON - es el mejor para ropa
// Necesitas poner REPLICATE_API_TOKEN en Vercel env vars

export async function POST(req){
  try{
    const formData = await req.formData()
    const personFile = formData.get('person')
    const garmentUrl = formData.get('garment_url') // url de la sudadera en Supabase
    const category = formData.get('category') || 'upper_body' // upper_body, lower_body, dresses

    if(!personFile){
      return NextResponse.json({ error: 'Falta foto persona' }, { status: 400 })
    }

    // Si no tienes token de Replicate, devolvemos modo demo con imagen real generada
    // En producción, aquí llamas a Replicate
    const token = process.env.REPLICATE_API_TOKEN

    if(!token){
      // MODO DEMO: devuelve mensaje para que sepas que falta token
      return NextResponse.json({ 
        demo: true,
        message: 'Pon REPLICATE_API_TOKEN en Vercel para activar IA real. Mientras tanto usa el modo demo.',
        // En demo devolvemos la misma url del producto para no romper
        result_url: garmentUrl
      })
    }

    // Convertir archivo persona a base64
    const bytes = await personFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Person = `data:${personFile.type};base64,${buffer.toString('base64')}`

    // Llamada a Replicate IDM-VTON
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "cuuupid/idm-vton:0513734a33928709e8d532cc14bcaaf2c5634ccf6e58f96446045c1b700a4c6", // IDM-VTON latest
        input: {
          garm_img: garmentUrl,
          human_img: base64Person,
          garment_des: `a black oversized hoodie`,
          category: category,
          crop: false
        }
      })
    })

    const prediction = await response.json()
    
    if(!response.ok){
      return NextResponse.json({ error: prediction.detail || 'Error Replicate' }, { status: 500 })
    }

    // Polling hasta que termine (Replicate es async)
    let result = prediction
    let attempts = 0
    while(result.status !== 'succeeded' && result.status !== 'failed' && attempts < 30){
      await new Promise(r => setTimeout(r, 2000))
      const poll = await fetch(result.urls.get, {
        headers: { 'Authorization': `Token ${token}` }
      })
      result = await poll.json()
      attempts++
    }

    if(result.status === 'failed'){
      return NextResponse.json({ error: 'IA falló: ' + result.error }, { status: 500 })
    }

    return NextResponse.json({ 
      result_url: result.output,
      status: result.status
    })

  }catch(e){
    console.error('try-on error', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
