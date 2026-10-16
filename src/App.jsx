import { useCallback, useEffect, useState } from 'react'
import Booking from './Booking.jsx'
import Manage from './Manage.jsx'
import Vicky from './Vicky.jsx'

export default function App() {
  const [view, setView] = useState('booking')
  const [reservation, setReservation] = useState(null)
  const [justBooked, setJustBooked] = useState(false)
  const [toast, setToast] = useState(null)
  const [vickyOpen, setVickyOpen] = useState(false)

  const notify = useCallback((message, tone = 'error') => setToast({ message, tone, key: Date.now() }), [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  const goTo = (next) => {
    setView(next)
    window.scrollTo({ top: 0 })
  }

  const handleReserved = (created) => {
    setReservation(created)
    setJustBooked(true)
    goTo('manage')
  }

  const bookManually = () => {
    setVickyOpen(false)
    goTo('booking')
    requestAnimationFrame(() => document.getElementById('checkIn')?.focus())
  }

  const showReservation = (found) => {
    setReservation(found)
    setJustBooked(false)
    setVickyOpen(false)
    goTo('manage')
  }

  return (
    <>
      <a className="skip-link" href="#main">Saltar al contenido</a>
      <header className="site-header">
        <button className="wordmark" onClick={() => goTo('booking')}>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 4c-6 6-8.5 10.5-8.5 15a8.5 8.5 0 0 0 17 0C24.5 14.5 22 10 16 4zm0 5v19" />
          </svg>
          <span>Casa Arrayán</span>
        </button>
        <nav aria-label="Principal">
          <button className="nav-link" aria-current={view === 'booking' ? 'page' : undefined} onClick={() => goTo('booking')}>
            Reservar
          </button>
          <button className="nav-link" aria-current={view === 'manage' ? 'page' : undefined} onClick={() => goTo('manage')}>
            Mi reserva
          </button>
        </nav>
      </header>

      <main id="main">
        {view === 'booking' ? (
          <Booking notify={notify} onReserved={handleReserved} onAskVicky={() => setVickyOpen(true)} />
        ) : (
          <Manage
            notify={notify}
            reservation={reservation}
            setReservation={setReservation}
            justBooked={justBooked}
            clearJustBooked={() => setJustBooked(false)}
          />
        )}
      </main>

      <footer className="site-footer">
        <p className="footer-name">Casa Arrayán</p>
        <p>Carrera 1 # 18-40, Taganga, Santa Marta. Recepción abierta las 24 horas.</p>
        <p className="footer-credit">Fotografías de Unsplash.</p>
      </footer>

      <Vicky
        open={vickyOpen}
        onOpen={() => setVickyOpen(true)}
        onClose={() => setVickyOpen(false)}
        onBookManually={bookManually}
        onShowReservation={showReservation}
      />

      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div key={toast.key} className={`toast toast-${toast.tone}`}>
            <p>{toast.message}</p>
            <button className="toast-close" onClick={() => setToast(null)} aria-label="Cerrar aviso">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </button>
          </div>
        )}
      </div>
    </>
  )
}
