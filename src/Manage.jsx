import { useState } from 'react'
import { api } from './api.js'
import { formatDate, formatMoney, roomTypes, services, statusLabels } from './format.js'
import KeyCard from './KeyCard.jsx'
import Invoice from './Invoice.jsx'

export default function Manage({ notify, reservation, setReservation, justBooked, clearJustBooked }) {
  const [searchId, setSearchId] = useState(reservation?.id ?? '')
  const [loading, setLoading] = useState('')
  const [copied, setCopied] = useState(false)

  const run = async (name, action, success) => {
    setLoading(name)
    try {
      setReservation(await action())
      if (success) notify(success, 'success')
    } catch (error) {
      notify(error.message)
    } finally {
      setLoading('')
    }
  }

  const findReservation = (event) => {
    event.preventDefault()
    if (!searchId.trim()) return notify('Escribe el código de tu reserva para buscarla.')
    clearJustBooked()
    run('find', () => api.reservation(searchId))
  }

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(reservation.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      notify('No pudimos copiar el código. Selecciónalo y cópialo manualmente.')
    }
  }

  const servicesTotal = reservation?.services?.reduce((sum, service) => sum + Number(service.cost), 0) ?? 0
  const closed = reservation?.status === 'CHECKED_OUT'

  return (
    <div className="manage">
      {justBooked && reservation && (
        <section className="confirmation reveal" aria-labelledby="confirmation-title">
          <h1 id="confirmation-title">Tu reserva está confirmada</h1>
          <p>Guarda este código. Lo necesitas para consultar tu reserva, agregar servicios y hacer el check-in.</p>
          <div className="code-row">
            <code className="reservation-code">{reservation.id}</code>
            <button className="btn btn-gold" onClick={copyId}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8" height="8" rx="1" /><path d="M3 11V3h8" /></svg>
              {copied ? 'Código copiado' : 'Copiar código'}
            </button>
          </div>
        </section>
      )}

      <section className="section lookup" aria-labelledby="lookup-title">
        {justBooked ? <h2 id="lookup-title">Buscar otra reserva</h2> : <h1 id="lookup-title">Mi reserva</h1>}
        <form className="lookup-form" onSubmit={findReservation}>
          <div className="field">
            <label htmlFor="reservationId">Código de la reserva</label>
            <input id="reservationId" value={searchId} onChange={(event) => setSearchId(event.target.value)} autoComplete="off" spellCheck="false" />
          </div>
          <button className="btn btn-primary" type="submit" aria-busy={loading === 'find'} disabled={loading === 'find'}>
            {loading === 'find' ? 'Buscando' : 'Buscar reserva'}
          </button>
        </form>
      </section>

      {reservation && (
        <section className="section ledger" aria-labelledby="ledger-title">
          <div className="ledger-main reveal">
            <div className="ledger-head">
              <h2 id="ledger-title">{reservation.guestName}</h2>
              <span className={`status status-${reservation.status}`}>{statusLabels[reservation.status]}</span>
            </div>
            <dl className="facts">
              <div><dt>Habitación</dt><dd>{reservation.room.number}, {roomTypes[reservation.room.type]}, piso {reservation.room.floor}</dd></div>
              <div><dt>Llegada</dt><dd>{formatDate(reservation.checkIn)}</dd></div>
              <div><dt>Salida</dt><dd>{formatDate(reservation.checkOut)}</dd></div>
              <div><dt>Noches</dt><dd>{reservation.nights}</dd></div>
              <div><dt>Temporada</dt><dd>{reservation.season === 'HIGH' ? 'Alta' : 'Baja'}, {formatMoney(reservation.nightlyRate)} por noche</dd></div>
              <div><dt>Correo</dt><dd>{reservation.guestEmail}</dd></div>
            </dl>

            <h3>Cuenta de la estadía</h3>
            <dl className="price-list">
              <div><dt>Habitación</dt><dd>{formatMoney(reservation.roomTotal)}</dd></div>
              {reservation.services.map((service, index) => (
                <div key={index}><dt>{services[service.type]?.label ?? service.type}</dt><dd>{formatMoney(service.cost)}</dd></div>
              ))}
              <div className="price-total"><dt>Total acumulado</dt><dd>{formatMoney(Number(reservation.roomTotal) + servicesTotal)}</dd></div>
            </dl>
          </div>

          <aside className="ledger-side reveal" style={{ '--delay': '120ms' }} aria-label="Acciones de la reserva">
            <h3>Agregar servicios</h3>
            <div className="service-list">
              {Object.entries(services).map(([type, service]) => (
                <button
                  key={type}
                  className="service-btn"
                  disabled={closed || Boolean(loading)}
                  aria-busy={loading === type}
                  onClick={() => run(type, () => api.addService(reservation.id, type), `${service.label} agregado a tu cuenta.`)}
                >
                  <span>{service.label}</span>
                  <small>{service.detail}</small>
                </button>
              ))}
            </div>
            {closed && <p className="note">La estadía terminó. Ya no se pueden agregar servicios.</p>}

            {reservation.status === 'CONFIRMED' && (
              <button className="btn btn-primary btn-wide" aria-busy={loading === 'checkin'} disabled={Boolean(loading)}
                onClick={() => run('checkin', () => api.checkIn(reservation.id), 'Check-in realizado. Tu llave digital está lista.')}>
                {loading === 'checkin' ? 'Registrando llegada' : 'Hacer check-in'}
              </button>
            )}
            {reservation.status === 'CHECKED_IN' && (
              <button className="btn btn-primary btn-wide" aria-busy={loading === 'checkout'} disabled={Boolean(loading)}
                onClick={() => run('checkout', () => api.checkOut(reservation.id), 'Check-out realizado. Tu factura está lista.')}>
                {loading === 'checkout' ? 'Cerrando estadía' : 'Hacer check-out'}
              </button>
            )}
          </aside>
        </section>
      )}

      {reservation?.digitalKey && reservation.status === 'CHECKED_IN' && (
        <KeyCard room={reservation.room.number} guest={reservation.guestName} code={reservation.digitalKey} />
      )}

      {reservation?.invoice && <Invoice invoice={reservation.invoice} />}
    </div>
  )
}
