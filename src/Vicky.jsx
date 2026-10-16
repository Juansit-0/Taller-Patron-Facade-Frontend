import { useEffect, useRef, useState } from 'react'
import { api } from './api.js'
import { firstName, formatDate, formatMoney, reservationTotal, roomTypes, statusLabels } from './format.js'
import KeyCard from './KeyCard.jsx'
import Invoice from './Invoice.jsx'

const storageKey = 'vicky-conversation'

const suggestions = [
  'Quiero una suite del 20 al 23 de diciembre',
  '¿Qué habitaciones hay disponibles este fin de semana?',
  'Agregar desayuno a mi reserva',
  'Hacer check-in',
]

const statusText = {
  checking: 'Conectando',
  ready: 'Disponible ahora',
  off: 'No disponible',
}

const focusable = 'button:not(:disabled), textarea:not(:disabled), input:not(:disabled), [href], [tabindex="0"]'

function readStoredId() {
  try {
    return sessionStorage.getItem(storageKey)
  } catch {
    return null
  }
}

function storeId(id) {
  try {
    if (id) sessionStorage.setItem(storageKey, id)
    else sessionStorage.removeItem(storageKey)
  } catch {
    return
  }
}

export function keepFocusInside(event, container) {
  if (event.key !== 'Tab') return
  const items = container.querySelectorAll(focusable)
  const first = items[0]
  const last = items[items.length - 1]
  const current = document.activeElement
  if (event.shiftKey && (current === first || current === container)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && current === last) {
    event.preventDefault()
    first.focus()
  }
}

export function Monogram({ small = false }) {
  return (
    <span className={small ? 'vicky-avatar vicky-avatar-small' : 'vicky-avatar'} aria-hidden="true">
      V
    </span>
  )
}

function ReservationCard({ reservation, onOpen }) {
  const [copyState, setCopyState] = useState('')
  const [showInvoice, setShowInvoice] = useState(false)
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(reservation.id)
      setCopyState('done')
    } catch {
      setCopyState('failed')
    }
    setTimeout(() => setCopyState(''), 2400)
  }

  const copyLabel = { '': 'Copiar', done: 'Copiado', failed: 'Cópialo a mano' }[copyState]

  return (
    <article className="vicky-reservation" aria-label={`Reserva de la habitación ${reservation.room.number}`}>
      <div className="vicky-reservation-head">
        <h3>Habitación {reservation.room.number}</h3>
        <span className={`status status-${reservation.status}`}>{statusLabels[reservation.status]}</span>
      </div>
      <p className="vicky-reservation-type">
        {roomTypes[reservation.room.type]}, piso {reservation.room.floor}, a nombre de {reservation.guestName}
      </p>

      <div className="vicky-code-row">
        <span className="vicky-code-label">Código</span>
        <code>{reservation.id}</code>
        <button className="vicky-copy" type="button" onClick={copyId}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8" height="8" rx="1" /><path d="M3 11V3h8" /></svg>
          <span aria-live="polite">{copyLabel}</span>
        </button>
      </div>

      <dl className="vicky-facts">
        <div><dt>Llegada</dt><dd>{formatDate(reservation.checkIn)}</dd></div>
        <div><dt>Salida</dt><dd>{formatDate(reservation.checkOut)}</dd></div>
        <div><dt>Noches</dt><dd>{reservation.nights}</dd></div>
        <div><dt>Temporada</dt><dd>{reservation.season === 'HIGH' ? 'Alta' : 'Baja'}</dd></div>
        <div className="vicky-total">
          <dt>Total acumulado</dt>
          <dd>{formatMoney(reservationTotal(reservation))}</dd>
        </div>
      </dl>

      <div className="vicky-reservation-actions">
        <button className="btn btn-primary" type="button" onClick={() => onOpen(reservation)}>
          Abrir en Mis reservas
        </button>
        {reservation.invoice && (
          <button className="btn btn-gold" type="button" aria-expanded={showInvoice} onClick={() => setShowInvoice(!showInvoice)}>
            {showInvoice ? 'Ocultar factura' : 'Ver factura'}
          </button>
        )}
      </div>

      {reservation.digitalKey && (
        <KeyCard room={reservation.room.number} guest={reservation.guestName} code={reservation.digitalKey} />
      )}
      {showInvoice && reservation.invoice && <Invoice invoice={reservation.invoice} />}
    </article>
  )
}

export default function Vicky({ open, guest, onOpen, onClose, onLogin, onBookManually, onShowReservation }) {
  const [status, setStatus] = useState('checking')
  const [conversationId, setConversationId] = useState(readStoredId)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [waiting, setWaiting] = useState(false)
  const panelRef = useRef(null)
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const returnRef = useRef(null)
  const guestRef = useRef(guest?.id)

  useEffect(() => {
    if (guestRef.current === guest?.id) return
    guestRef.current = guest?.id
    setConversationId(null)
    storeId(null)
    setMessages([])
    setDraft('')
  }, [guest?.id])

  useEffect(() => {
    if (!open) {
      returnRef.current?.focus()
      return
    }
    if (!panelRef.current.contains(document.activeElement)) returnRef.current = document.activeElement
    panelRef.current.focus()
    document.body.style.overflow = 'hidden'
    let active = true
    setStatus('checking')
    api
      .assistantStatus()
      .then((result) => {
        if (!active) return
        setStatus(result?.enabled ? 'ready' : 'off')
        if (result?.enabled && guestRef.current) requestAnimationFrame(() => inputRef.current?.focus())
      })
      .catch(() => active && setStatus('off'))
    return () => {
      active = false
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages, waiting, status])

  const leaveTo = (action) => {
    returnRef.current = null
    action()
  }

  const send = async (text) => {
    const message = text.trim()
    if (!message || waiting || !canChat) return
    setMessages((list) => [...list, { role: 'user', text: message }])
    setDraft('')
    setWaiting(true)
    try {
      const result = await api.assistantChat(conversationId, message)
      setConversationId(result.conversationId)
      storeId(result.conversationId)
      setMessages((list) => [...list, { role: 'vicky', text: result.reply, reservation: result.reservation }])
    } catch (error) {
      setMessages((list) => [...list, { role: 'error', text: error.message }])
    } finally {
      setWaiting(false)
    }
  }

  const restart = () => {
    setConversationId(null)
    storeId(null)
    setMessages([])
    setDraft('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    keepFocusInside(event, panelRef.current)
  }

  const handleInputKey = (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    send(draft)
  }

  const lastReservation = messages.findLastIndex((message) => message.reservation)
  const lastMessage = messages.at(-1)
  const announcement = waiting ? 'Vicky está escribiendo' : lastMessage && lastMessage.role !== 'user' ? lastMessage.text : ''
  const unavailable = status === 'off'
  const canChat = status === 'ready' && Boolean(guest)

  return (
    <>
      <button className="vicky-launcher" type="button" onClick={onOpen} hidden={open}>
        <Monogram small />
        Hablar con Vicky
      </button>

      {open && (
        <div className="vicky-layer">
          <div className="vicky-backdrop" onClick={onClose} aria-hidden="true" />
          <section
            ref={panelRef}
            className="vicky-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vicky-title"
            aria-describedby="vicky-subtitle"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
          >
            <header className="vicky-header">
              <div className="vicky-identity">
                <Monogram />
                <div>
                  <h2 id="vicky-title">Vicky</h2>
                  <p id="vicky-subtitle">Concierge virtual de Casa Arrayán</p>
                </div>
                <button className="vicky-close" type="button" onClick={onClose} aria-label="Cerrar conversación con Vicky">
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                </button>
              </div>
              <div className="vicky-bar">
                <span className="vicky-state">
                  <span className={`vicky-dot vicky-dot-${status}`} aria-hidden="true" />
                  {statusText[status]}
                </span>
                <button className="vicky-restart" type="button" onClick={restart} disabled={waiting || (!messages.length && !conversationId)}>
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.5-3.6M3 2.5v2.5h2.5" /></svg>
                  Nueva conversación
                </button>
              </div>
            </header>

            <div className="vicky-messages" ref={listRef}>
              <div className="vicky-bubble from-vicky vicky-welcome">
                <p className="vicky-greeting">{guest ? `Hola, ${firstName(guest.fullName)}, soy Vicky.` : 'Hola, soy Vicky.'}</p>
                <p>
                  Puedo consultar la disponibilidad, hacer tu reserva, agregar spa, desayuno o traslado, y ayudarte con
                  el check-in y el check-out. Cuéntame qué necesitas.
                </p>
              </div>

              {unavailable && (
                <div className="vicky-bubble from-vicky vicky-notice" role="status">
                  <p>Vicky no está disponible en este momento. Puedes reservar tú mismo.</p>
                  <button className="btn btn-primary" type="button" onClick={() => leaveTo(onBookManually)}>
                    Reservar yo mismo
                  </button>
                </div>
              )}

              {!unavailable && !guest && (
                <div className="vicky-bubble from-vicky vicky-notice" role="status">
                  <p>Inicia sesión para que Vicky reserve por ti. Así ya sabe tu nombre y tus datos, y no tienes que repetirlos.</p>
                  <button className="btn btn-primary" type="button" onClick={onLogin}>
                    Iniciar sesión
                  </button>
                </div>
              )}

              {!unavailable && guest && messages.length === 0 && (
                <ul className="vicky-suggestions" aria-label="Sugerencias">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion}>
                      <button className="vicky-chip" type="button" disabled={!canChat} onClick={() => send(suggestion)}>
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {messages.map((message, index) => (
                <div key={index} className="vicky-entry">
                  <p className={`vicky-bubble ${message.role === 'user' ? 'from-user' : 'from-vicky'} ${message.role === 'error' ? 'is-error' : ''}`}>
                    {message.role === 'error' && (
                      <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" /><path d="M8 5v3.5M8 11h0" /></svg>
                    )}
                    {message.text}
                  </p>
                  {index === lastReservation && (
                    <ReservationCard reservation={message.reservation} onOpen={(reservation) => leaveTo(() => onShowReservation(reservation))} />
                  )}
                </div>
              ))}

              {waiting && (
                <div className="vicky-bubble from-vicky vicky-typing" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>

            <p className="visually-hidden" aria-live="polite">{announcement}</p>

            <form
              className="vicky-composer"
              onSubmit={(event) => {
                event.preventDefault()
                send(draft)
              }}
            >
              <label htmlFor="vicky-input" className="visually-hidden">Mensaje para Vicky</label>
              <textarea
                id="vicky-input"
                ref={inputRef}
                rows={1}
                value={draft}
                placeholder={unavailable ? 'Vicky no está disponible' : guest ? 'Escribe tu mensaje' : 'Inicia sesión para escribirle'}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleInputKey}
                disabled={!canChat}
                readOnly={waiting}
                aria-describedby="vicky-hint"
              />
              <button
                className="btn btn-primary vicky-send"
                type="submit"
                disabled={waiting || !canChat || !draft.trim()}
                aria-busy={waiting}
                aria-label={waiting ? 'Vicky está respondiendo' : 'Enviar mensaje'}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" /></svg>
              </button>
              <p id="vicky-hint" className="vicky-hint">Enter envía el mensaje. Shift y Enter agregan una línea.</p>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
