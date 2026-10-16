import { useEffect, useRef, useState } from 'react'
import { api } from './api.js'
import { profileErrors } from './Auth.jsx'
import { firstName, formatDate, initials } from './format.js'

export function Avatar({ name }) {
  return (
    <span className="guest-avatar" aria-hidden="true">
      {initials(name)}
    </span>
  )
}

export function AccountMenu({ guest, onNavigate, onLogout }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])

  const choose = (action) => {
    setOpen(false)
    action()
  }

  const handleKeyDown = (event) => {
    if (event.key !== 'Escape' || !open) return
    event.stopPropagation()
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <div
      className="account"
      ref={rootRef}
      onKeyDown={handleKeyDown}
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setOpen(false)}
    >
      <button
        ref={buttonRef}
        className="account-button"
        type="button"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen(!open)}
      >
        <Avatar name={guest.fullName} />
        <span className="account-name">{firstName(guest.fullName)}</span>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg>
        <span className="visually-hidden">, menú de tu cuenta</span>
      </button>
      {open && (
        <ul id="account-menu" className="account-menu">
          <li className="account-who">
            <strong>{guest.fullName}</strong>
            <span>{guest.email}</span>
          </li>
          <li><button type="button" onClick={() => choose(() => onNavigate('reservations'))}>Mis reservas</button></li>
          <li><button type="button" onClick={() => choose(() => onNavigate('profile'))}>Mi perfil</button></li>
          <li><button type="button" onClick={() => choose(onLogout)}>Cerrar sesión</button></li>
        </ul>
      )}
    </div>
  )
}

export default function Profile({ guest, notify, onSaved }) {
  const [form, setForm] = useState({ fullName: guest.fullName, phone: guest.phone ?? '', documentId: guest.documentId ?? '' })
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)

  const errors = touched ? profileErrors(form) : {}

  const save = async (event) => {
    event.preventDefault()
    setTouched(true)
    const firstInvalid = Object.keys(profileErrors(form))[0]
    if (firstInvalid) return document.getElementById(`profile-${firstInvalid}`)?.focus()
    setLoading(true)
    try {
      onSaved(await api.updateMe({ ...form, fullName: form.fullName.trim() }))
      notify('Guardamos los cambios de tu perfil.', 'success')
    } catch (error) {
      notify(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: 'fullName', label: 'Nombre completo', type: 'text', autoComplete: 'name' },
    { name: 'phone', label: 'Teléfono', type: 'tel', autoComplete: 'tel' },
    { name: 'documentId', label: 'Documento de identidad', type: 'text', autoComplete: 'off' },
  ]

  return (
    <section className="section profile" aria-labelledby="profile-title">
      <div className="profile-intro reveal">
        <Avatar name={guest.fullName} />
        <h1 id="profile-title">Mi perfil</h1>
        <p>Estos datos van en cada reserva que hagas, en tu llave digital y en la factura.</p>
        {guest.createdAt && <p className="note">Huésped desde el {formatDate(guest.createdAt)}.</p>}
      </div>
      <form className="guest-form reveal" style={{ '--delay': '120ms' }} onSubmit={save} noValidate>
        <div className="field">
          <label htmlFor="profile-email">Correo electrónico</label>
          <input id="profile-email" type="email" value={guest.email} readOnly aria-describedby="profile-email-hint" />
          <p id="profile-email-hint" className="field-hint">Es tu usuario para iniciar sesión y no se puede cambiar.</p>
        </div>
        {fields.map((field) => (
          <div className="field" key={field.name}>
            <label htmlFor={`profile-${field.name}`}>{field.label}</label>
            <input
              id={`profile-${field.name}`}
              type={field.type}
              autoComplete={field.autoComplete}
              value={form[field.name]}
              onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
              aria-invalid={Boolean(errors[field.name])}
              aria-describedby={errors[field.name] ? `profile-${field.name}-error` : undefined}
              required
            />
            {errors[field.name] && <p id={`profile-${field.name}-error`} className="field-error">{errors[field.name]}</p>}
          </div>
        ))}
        <button className="btn btn-primary" type="submit" aria-busy={loading} disabled={loading}>
          {loading ? 'Guardando' : 'Guardar cambios'}
        </button>
      </form>
    </section>
  )
}
