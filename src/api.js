const baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api`

let token = null
let handleUnauthorized = () => {}

export const setToken = (value) => {
  token = value || null
}

export const onUnauthorized = (callback) => {
  handleUnauthorized = callback
}

async function request(path, options = {}) {
  const sentToken = token
  const headers = { 'Content-Type': 'application/json', ...(sentToken && { Authorization: `Bearer ${sentToken}` }) }
  let response
  try {
    response = await fetch(baseUrl + path, { ...options, headers })
  } catch {
    throw new Error('No pudimos conectar con el servidor. Verifica que el backend esté en ejecución.')
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (response.status === 401 && sentToken && sentToken === token) {
    handleUnauthorized()
    throw new Error('Tu sesión expiró, inicia sesión de nuevo.')
  }
  if (!response.ok) throw new Error(data?.message || `La solicitud falló (código ${response.status}).`)
  return data
}

const withId = (id) => encodeURIComponent(id.trim())

const send = (method, path, body) => request(path, { method, ...(body && { body: JSON.stringify(body) }) })

export const api = {
  register: (body) => send('POST', '/auth/register', body),
  login: (body) => send('POST', '/auth/login', body),
  logout: () => send('POST', '/auth/logout'),
  me: () => request('/auth/me'),
  updateMe: (body) => send('PUT', '/auth/me', body),
  availability: (checkIn, checkOut, type) =>
    request(`/hotel/availability?${new URLSearchParams({ checkIn, checkOut, ...(type && { type }) })}`),
  reserve: (body) => send('POST', '/hotel/reserve', body),
  myReservations: () => request('/hotel/my-reservations'),
  addService: (id, serviceType) => send('POST', `/hotel/services/${withId(id)}`, { serviceType }),
  checkIn: (id) => send('PUT', `/hotel/checkin/${withId(id)}`),
  checkOut: (id) => send('PUT', `/hotel/checkout/${withId(id)}`),
  reservation: (id) => request(`/hotel/reservation/${withId(id)}`),
  assistantStatus: () => request('/hotel/assistant/status'),
  assistantChat: (conversationId, message) => send('POST', '/hotel/assistant/chat', { conversationId, message }),
}
