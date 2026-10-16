const baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/hotel`

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(baseUrl + path, { headers: { 'Content-Type': 'application/json' }, ...options })
  } catch {
    throw new Error('No pudimos conectar con el servidor. Verifica que el backend esté en ejecución.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message || `La solicitud falló (código ${response.status}).`)
  return data
}

const withId = (id) => encodeURIComponent(id.trim())

export const api = {
  availability: (checkIn, checkOut, type) =>
    request(`/availability?${new URLSearchParams({ checkIn, checkOut, ...(type && { type }) })}`),
  reserve: (body) => request('/reserve', { method: 'POST', body: JSON.stringify(body) }),
  addService: (id, serviceType) =>
    request(`/services/${withId(id)}`, { method: 'POST', body: JSON.stringify({ serviceType }) }),
  checkIn: (id) => request(`/checkin/${withId(id)}`, { method: 'PUT' }),
  checkOut: (id) => request(`/checkout/${withId(id)}`, { method: 'PUT' }),
  reservation: (id) => request(`/reservation/${withId(id)}`),
}
