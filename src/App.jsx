import { useCallback, useEffect, useRef, useState } from 'react'
import Booking from './Booking.jsx'
import Manage from './Manage.jsx'
import Vicky from './Vicky.jsx'
import Auth from './Auth.jsx'
import Profile, { AccountMenu } from './Account.jsx'
import { api, onUnauthorized } from './api.js'
import { loadSession, storeSession } from './session.js'
import { firstName } from './format.js'

export default function App() {
  const [session, setSession] = useState(loadSession)
  const [view, setView] = useState('booking')
  const [reservation, setReservation] = useState(null)
  const [justBooked, setJustBooked] = useState(false)
  const [toast, setToast] = useState(null)
  const [vickyOpen, setVickyOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const pendingRef = useRef(null)

  const notify = useCallback((message, tone = 'error') => setToast({ message, tone, key: Date.now() }), [])

  const changeSession = useCallback((next) => {
    storeSession(next)
    setSession(next)
    if (!next) setReservation(null)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    onUnauthorized(() => {
      changeSession(null)
      setVickyOpen(false)
      setAuthOpen(true)
      notify('Tu sesión expiró, inicia sesión de nuevo.')
    })
  }, [changeSession, notify])

  useEffect(() => {
    const stored = loadSession()
    if (!stored) return
    api
      .me()
      .then((guest) => changeSession({ ...stored, guest }))
      .catch(() => changeSession(null))
  }, [changeSession])

  const goTo = (next) => {
    setView(next)
    window.scrollTo({ top: 0 })
  }

  const requireLogin = (after) => {
    pendingRef.current = after
    setAuthOpen(true)
  }

  const closeAuth = () => {
    pendingRef.current = null
    setAuthOpen(false)
  }

  const handleAuthenticated = (next) => {
    if (next.guest.id !== session?.guest.id) setReservation(null)
    changeSession(next)
    setAuthOpen(false)
    notify(`Bienvenido, ${firstName(next.guest.fullName)}`, 'success')
    const after = pendingRef.current
    pendingRef.current = null
    if (after) requestAnimationFrame(after)
  }

  const logout = () => {
    api.logout().catch(() => null)
    changeSession(null)
    setVickyOpen(false)
    goTo('booking')
    notify('Cerraste sesión. Te esperamos pronto.', 'success')
  }

  const openReservations = () => {
    setReservation(null)
    setJustBooked(false)
    goTo('reservations')
  }

  const handleReserved = (created) => {
    setReservation(created)
    setJustBooked(true)
    goTo('reservations')
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
    goTo('reservations')
  }

  const loginForVicky = () => {
    setVickyOpen(false)
    requestAnimationFrame(() => requireLogin(() => setVickyOpen(true)))
  }

  const page = session ? view : 'booking'
  const guest = session?.guest

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
        <div className="header-actions">
          <nav aria-label="Principal">
            <button className="nav-link" aria-current={page === 'booking' ? 'page' : undefined} onClick={() => goTo('booking')}>
              Reservar
            </button>
            <button
              className="nav-link"
              aria-current={page === 'reservations' ? 'page' : undefined}
              onClick={() => (guest ? openReservations() : requireLogin(openReservations))}
            >
              Mis reservas
            </button>
          </nav>
          {guest ? (
            <AccountMenu guest={guest} onNavigate={(next) => (next === 'reservations' ? openReservations() : goTo(next))} onLogout={logout} />
          ) : (
            <button className="btn btn-primary btn-login" type="button" onClick={() => requireLogin(null)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.2-4 4.2-6 8-6s6.8 2 8 6" /></svg>
              Iniciar sesión
            </button>
          )}
        </div>
      </header>

      <main id="main">
        <div hidden={page !== 'booking'}>
          <Booking
            notify={notify}
            guest={guest}
            onReserved={handleReserved}
            onAskVicky={() => setVickyOpen(true)}
            onRequireLogin={() => requireLogin(null)}
            onEditProfile={() => goTo('profile')}
          />
        </div>
        {page === 'reservations' && (
          <Manage
            key={guest.id}
            notify={notify}
            reservation={reservation}
            setReservation={setReservation}
            justBooked={justBooked}
            clearJustBooked={() => setJustBooked(false)}
            onBook={bookManually}
            onAskVicky={() => setVickyOpen(true)}
          />
        )}
        {page === 'profile' && (
          <Profile key={guest.id} guest={guest} notify={notify} onSaved={(updated) => changeSession({ ...session, guest: updated })} />
        )}
      </main>

      <footer className="site-footer">
        <p className="footer-name">Casa Arrayán</p>
        <p>Carrera 1 # 18-40, Taganga, Santa Marta. Recepción abierta las 24 horas.</p>
        <p className="footer-credit">Fotografías de Unsplash.</p>
      </footer>

      <Auth open={authOpen} onClose={closeAuth} onAuthenticated={handleAuthenticated} />

      <Vicky
        open={vickyOpen}
        guest={guest}
        onOpen={() => setVickyOpen(true)}
        onClose={() => setVickyOpen(false)}
        onLogin={loginForVicky}
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
