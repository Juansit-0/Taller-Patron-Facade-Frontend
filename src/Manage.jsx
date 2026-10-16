import { useEffect, useState } from 'react'
import { api } from './api.js'
import { formatDate, formatMoney, reservationTotal, roomImages, roomTypes, services, statusLabels } from './format.js'
import KeyCard from './KeyCard.jsx'
import Invoice from './Invoice.jsx'

function ReservationList({ onOpen, onBook, onAskVicky }) {
  const [list, setList] = useState(null)
  const [failed, setFailed] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setFailed('')
    api
      .myReservations()
      .then((result) => active && setList(result ?? []))
      .catch((error) => active && setFailed(error.message))
    return () => {
      active = false
    }
  }, [attempt])

  return (
    <section className="section lookup" aria-labelledby="mine-title" aria-busy={!list && !failed}>
      <div className="section-head">
        <h1 id="mine-title">Mis reservas</h1>
        <p>
          {list?.length
            ? `Tienes ${list.length} ${list.length === 1 ? 'reserva' : 'reservas'}. Abre una para agregar servicios, hacer el check-in o ver tu factura.`
            : 'Aquí aparecen todas las estadías que reserves con tu cuenta, por ti o con Vicky.'}
        </p>
      </div>

      {failed && (
        <div className="empty-state" role="alert">
          <h2>No pudimos cargar tus reservas</h2>
          <p>{failed}</p>
          <button className="btn btn-primary" type="button" onClick={() => setAttempt(attempt + 1)}>Intentar de nuevo</button>
        </div>
      )}

      {!list && !failed && (
        <ul className="stay-list" aria-label="Cargando tus reservas">
          {[0, 1, 2].map((index) => <li key={index} className="stay-card stay-card-loading" />)}
        </ul>
      )}

      {list?.length === 0 && (
        <div className="empty-state">
          <h2>Tu primera estadía te espera</h2>
          <p>Elige tus fechas y reserva en un clic, o cuéntale a Vicky qué necesitas y ella lo hace por ti.</p>
          <div className="empty-actions">
            <button className="btn btn-primary" type="button" onClick={onBook}>Reservar una habitación</button>
            <button className="btn btn-gold" type="button" onClick={onAskVicky}>Pedírselo a Vicky</button>
          </div>
        </div>
      )}

      {list?.length > 0 && (
        <ul className="stay-list">
          {list.map((reservation, index) => (
            <li key={reservation.id} className="reveal" style={{ '--delay': `${index * 60}ms` }}>
              <button className="stay-card" type="button" onClick={() => onOpen(reservation)}>
                <span className="stay-card-media" style={{ '--image': `url(${roomImages[reservation.room.type]})` }} />
                <span className="stay-card-body">
                  <span className="room-top">
                    <span className="room-number">Habitación {reservation.room.number}</span>
                    <span className={`status status-${reservation.status}`}>{statusLabels[reservation.status]}</span>
                  </span>
                  <span className="room-meta">
                    {roomTypes[reservation.room.type]}, {reservation.nights} {reservation.nights === 1 ? 'noche' : 'noches'}
                  </span>
                  <span className="stay-card-dates">
                    {formatDate(reservation.checkIn)} al {formatDate(reservation.checkOut)}
                  </span>
                  <span className="stay-card-foot">
                    <span>
                      {reservation.services?.length
                        ? `${reservation.services.length} ${reservation.services.length === 1 ? 'servicio' : 'servicios'}`
                        : 'Sin servicios'}
                    </span>
                    <strong>{formatMoney(reservationTotal(reservation))}</strong>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function Manage({ notify, reservation, setReservation, justBooked, clearJustBooked, onBook, onAskVicky }) {
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

  const backToList = () => {
    clearJustBooked()
    setReservation(null)
    window.scrollTo({ top: 0 })
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

  if (!reservation) {
    return (
      <div className="manage">
        <ReservationList onOpen={(found) => { setReservation(found); window.scrollTo({ top: 0 }) }} onBook={onBook} onAskVicky={onAskVicky} />
      </div>
    )
  }

  const closed = reservation.status === 'CHECKED_OUT'

  return (
    <div className="manage">
      <div className="back-row">
        <button className="text-link back-link" type="button" onClick={backToList}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>
          Todas mis reservas
        </button>
      </div>

      {justBooked && (
        <section className="confirmation reveal" aria-labelledby="confirmation-title">
          <h1 id="confirmation-title">Tu reserva está confirmada</h1>
          <p>Ya la tienes en Mis reservas. Si te la piden en recepción, este es el código.</p>
          <div className="code-row">
            <code className="reservation-code">{reservation.id}</code>
            <button className="btn btn-gold" onClick={copyId}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8" height="8" rx="1" /><path d="M3 11V3h8" /></svg>
              {copied ? 'Código copiado' : 'Copiar código'}
            </button>
          </div>
        </section>
      )}

      <section className="section ledger" aria-labelledby="ledger-title">
        <div className="ledger-main reveal">
          <div className="ledger-head">
            {justBooked ? (
              <h2 id="ledger-title">Habitación {reservation.room.number}</h2>
            ) : (
              <h1 id="ledger-title">Habitación {reservation.room.number}</h1>
            )}
            <span className={`status status-${reservation.status}`}>{statusLabels[reservation.status]}</span>
          </div>
          <dl className="facts">
            <div><dt>Habitación</dt><dd>{reservation.room.number}, {roomTypes[reservation.room.type]}, piso {reservation.room.floor}</dd></div>
            <div><dt>Llegada</dt><dd>{formatDate(reservation.checkIn)}</dd></div>
            <div><dt>Salida</dt><dd>{formatDate(reservation.checkOut)}</dd></div>
            <div><dt>Noches</dt><dd>{reservation.nights}</dd></div>
            <div><dt>Temporada</dt><dd>{reservation.season === 'HIGH' ? 'Alta' : 'Baja'}, {formatMoney(reservation.nightlyRate)} por noche</dd></div>
            <div><dt>Huésped</dt><dd>{reservation.guestName}</dd></div>
          </dl>

          <h3>Cuenta de la estadía</h3>
          <dl className="price-list">
            <div><dt>Habitación</dt><dd>{formatMoney(reservation.roomTotal)}</dd></div>
            {reservation.services.map((service, index) => (
              <div key={index}><dt>{services[service.type]?.label ?? service.type}</dt><dd>{formatMoney(service.cost)}</dd></div>
            ))}
            <div className="price-total"><dt>Total acumulado</dt><dd>{formatMoney(reservationTotal(reservation))}</dd></div>
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

      {reservation.digitalKey && reservation.status === 'CHECKED_IN' && (
        <KeyCard room={reservation.room.number} guest={reservation.guestName} code={reservation.digitalKey} />
      )}

      {reservation.invoice && <Invoice invoice={reservation.invoice} />}
    </div>
  )
}
