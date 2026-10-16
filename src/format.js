const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' })

export const formatMoney = (value) => money.format(Number(value) || 0)

export function formatDate(value, withTime = false) {
  if (!value) return ''
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value)
  return date.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime && { hour: '2-digit', minute: '2-digit' }),
  })
}

export const today = () => new Date().toLocaleDateString('en-CA')

export const isHighSeason = (isoDate) => [0, 5, 6, 11].includes(Number(isoDate.slice(5, 7)) - 1)

export const roomTypes = { SINGLE: 'Sencilla', DOUBLE: 'Doble', SUITE: 'Suite' }

export const roomImages = {
  SINGLE: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
  DOUBLE: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80',
  SUITE: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
}

export const statusLabels = { CONFIRMED: 'Confirmada', CHECKED_IN: 'Hospedado', CHECKED_OUT: 'Finalizada' }

export const services = {
  SPA: { label: 'Spa', detail: '$50 por sesión' },
  BREAKFAST: { label: 'Desayuno', detail: '$15 por noche' },
  TRANSFER: { label: 'Traslado', detail: '$30 aeropuerto' },
}
