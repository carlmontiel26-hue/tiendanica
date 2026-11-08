// app/api/geo/route.js
// Devuelve el departamento/municipio desde los headers que Vercel ya te da gratis
// No consume nada de Supabase, es solo lectura de headers

export async function GET(request){
  const city = request.headers.get('x-vercel-ip-city') || request.headers.get('x-vercel-ip-city-encoded') || ''
  const region = request.headers.get('x-vercel-ip-country-region') || ''
  const country = request.headers.get('x-vercel-ip-country') || 'NI'
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || ''

  // Decodificar ciudad si viene encoded
  let decodedCity = city
  try{ decodedCity = decodeURIComponent(city) }catch{}

  // Mapear region a departamento nica si es posible
  const departamentos = ['Managua','Masaya','Granada','León','Chinandega','Carazo','Rivas','Estelí','Matagalpa','Jinotega','Boaco','Chontales','Madriz','Nueva Segovia','Río San Juan','RAAN','RAAS']
  let depto = region
  for(const d of departamentos){
    if(region.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(region.toLowerCase())){
      depto = d
      break
    }
  }

  return Response.json({
    departamento: depto || decodedCity || 'Desconocido',
    municipio: decodedCity || '',
    city: decodedCity,
    region: region,
    country: country,
    ip: ip ? 'hidden' : ''
  })
}
