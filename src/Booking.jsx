import { useRef, useState } from 'react'
import { Monogram } from './Vicky.jsx'
import { api } from './api.js'
import { Avatar } from './Account.jsx'
import { formatDate, formatMoney, isHighSeason, roomImages, roomTypes, today } from './format.js'

function validateDates(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 'Elige la fecha de llegada y la de salida.'
  if (checkIn < today()) return 'La fecha de llegada no puede estar en el pasado.'
  if (checkOut <= checkIn) return 'La salida debe ser al menos un día después de la llegada.'
  return ''
}

export default function Booking({ notify, guest, onReserved, onAskVicky, onRequireLogin, onEditProfile }) {
  const [search, setSearch] = useState({ checkIn: '', checkOut: '', type: '' })
  const [searched, setSearched] = useState(null)
  const [rooms, setRooms] = useState(null)
  const [dateError, setDateError] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState('')
  const roomsRef = useRef(null)
  const stayRef = useRef(null)
  const checkInRef = useRef(null)

  const updateSearch = (event) => setSearch({ ...search, [event.target.name]: event.target.value })

  const findRooms = async (event) => {
    event.preventDefault()
    const error = validateDates(search.checkIn, search.checkOut)
    setDateError(error)
    if (error) return
    setLoading('search')
    try {
      const result = await api.availability(search.checkIn, search.checkOut, search.type)
      setRooms(result)
      setSearched({ ...search })
      setSelected(null)
      requestAnimationFrame(() => roomsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (error) {
      notify(error.message)
    } finally {
      setLoading('')
    }
  }

  const chooseRoom = (room) => {
    setSelected(room)
    requestAnimationFrame(() => stayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const reserve = async () => {
    if (!guest) return onRequireLogin()
    setLoading('reserve')
    try {
      const created = await api.reserve({ roomNumber: selected.number, checkIn: searched.checkIn, checkOut: searched.checkOut })
      setSelected(null)
      setRooms(null)
      onReserved(created)
    } catch (error) {
      notify(error.message)
    } finally {
      setLoading('')
    }
  }

  const freeCount = rooms?.filter((room) => room.available).length ?? 0
  const season = selected && (selected.season ?? (isHighSeason(searched.checkIn) ? 'HIGH' : 'LOW'))

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-media" role="img" aria-label="Piscina y terrazas de madera de un hotel frente al mar" />
        <div className="hero-content">
          <h1 id="hero-title" className="reveal">Una casa para quedarse despacio</h1>
          <p className="hero-lead reveal" style={{ '--delay': '120ms' }}>
            Hotel boutique frente al mar en Taganga, con piscina, terrazas de madera y desayuno al sol. Elige tus fechas y
            te mostramos qué habitaciones te esperan.
          </p>
          <div className="booking-choice reveal" style={{ '--delay': '200ms' }} role="group" aria-label="Elige cómo reservar">
            <button className="choice choice-self" type="button" onClick={() => checkInRef.current?.focus()}>
              <span className="choice-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="1.5" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>
              </span>
              <span className="choice-text">
                <strong>Reservar yo mismo</strong>
                <small>Elige fechas y habitación en el formulario</small>
              </span>
            </button>
            <button className="choice choice-vicky" type="button" onClick={onAskVicky}>
              <Monogram />
              <span className="choice-text">
                <strong>Que lo haga Vicky</strong>
                <small>Escríbele y ella reserva por ti</small>
              </span>
            </button>
          </div>
        </div>

        <form className="search reveal" style={{ '--delay': '320ms' }} onSubmit={findRooms} noValidate>
          <div className="field">
            <label htmlFor="checkIn">Llegada</label>
            <input id="checkIn" ref={checkInRef} name="checkIn" type="date" min={today()} value={search.checkIn} onChange={updateSearch}
              aria-invalid={Boolean(dateError)} aria-describedby={dateError ? 'date-error' : undefined} required />
          </div>
          <div className="field">
            <label htmlFor="checkOut">Salida</label>
            <input id="checkOut" name="checkOut" type="date" min={search.checkIn || today()} value={search.checkOut}
              onChange={updateSearch} aria-invalid={Boolean(dateError)} aria-describedby={dateError ? 'date-error' : undefined} required />
          </div>
          <div className="field">
            <label htmlFor="type">Tipo de habitación</label>
            <select id="type" name="type" value={search.type} onChange={updateSearch}>
              <option value="">Todas</option>
              {Object.entries(roomTypes).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" type="submit" aria-busy={loading === 'search'} disabled={loading === 'search'}>
            {loading === 'search' ? 'Consultando' : 'Ver disponibilidad'}
          </button>
          {dateError && <p id="date-error" className="field-error search-error" role="alert">{dateError}</p>}
        </form>
      </section>

      {rooms && (
        <section className="section rooms" ref={roomsRef} aria-labelledby="rooms-title">
          <div className="section-head">
            <h2 id="rooms-title">Habitaciones para tu estadía</h2>
            <p>
              {rooms.length === 0
                ? 'No encontramos habitaciones con ese filtro. Prueba con otro tipo o con otras fechas.'
                : `${freeCount} de ${rooms.length} disponibles del ${formatDate(searched.checkIn)} al ${formatDate(searched.checkOut)}.`}
            </p>
          </div>
          <ul className="room-grid">
            {rooms.map((room, index) => (
              <li key={room.number} className="reveal" style={{ '--delay': `${index * 70}ms` }}>
                <button
                  className="room-card"
                  data-type={room.type}
                  aria-pressed={selected?.number === room.number}
                  disabled={!room.available}
                  onClick={() => chooseRoom(room)}
                >
                  <span className="room-media" style={{ '--image': `url(${roomImages[room.type]})` }} />
                  <span className="room-body">
                    <span className="room-top">
                      <span className="room-number">Habitación {room.number}</span>
                      <span className={`badge ${room.available ? 'badge-free' : 'badge-busy'}`}>
                        {room.available ? 'Disponible' : 'Ocupada'}
                      </span>
                    </span>
                    <span className="room-meta">{roomTypes[room.type]}, piso {room.floor}</span>
                    <span className="room-price">
                      {formatMoney(room.basePrice)} <small>por noche, tarifa base</small>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {selected && (
        <section className="section stay" ref={stayRef} aria-labelledby="stay-title">
          <div className="stay-summary reveal">
            <h2 id="stay-title">Habitación {selected.number}</h2>
            <p className="stay-type">{roomTypes[selected.type]} en el piso {selected.floor}</p>
            <dl className="price-list">
              <div><dt>Tarifa base por noche</dt><dd>{formatMoney(selected.basePrice)}</dd></div>
              <div>
                <dt>Temporada</dt>
                <dd>{season === 'HIGH' ? 'Temporada alta, tarifa x1,5' : 'Temporada baja'}</dd>
              </div>
              <div><dt>Noches</dt><dd>{selected.nights}</dd></div>
              <div className="price-total"><dt>Total de la habitación</dt><dd>{formatMoney(selected.totalPrice)}</dd></div>
            </dl>
            <p className="note">
              Del {formatDate(searched.checkIn)} al {formatDate(searched.checkOut)}. La temporada alta va en diciembre,
              enero, junio y julio.
            </p>
          </div>

          <div className="guest-form reveal" style={{ '--delay': '120ms' }}>
            <h3>{guest ? 'Todo listo para confirmar' : 'Un paso antes de reservar'}</h3>
            {guest ? (
              <div className="booker">
                <Avatar name={guest.fullName} />
                <p>
                  Reservando como <strong>{guest.fullName}</strong>
                  <span>{guest.email}</span>
                </p>
                <button className="text-link" type="button" onClick={onEditProfile}>Editar perfil</button>
              </div>
            ) : (
              <p className="booker-note">
                Inicia sesión o crea tu cuenta. Usamos tus datos guardados, así que la reserva queda lista con un clic.
              </p>
            )}
            <button className="btn btn-primary" type="button" aria-busy={loading === 'reserve'} disabled={loading === 'reserve'} onClick={reserve}>
              {guest ? (loading === 'reserve' ? 'Confirmando' : 'Confirmar reserva') : 'Inicia sesión para reservar'}
            </button>
          </div>
        </section>
      )}
    </>
  )
}
