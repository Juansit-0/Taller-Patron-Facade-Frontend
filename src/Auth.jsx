import { useEffect, useRef, useState } from 'react'
import { api } from './api.js'
import { keepFocusInside } from './Vicky.jsx'

const emptyForm = { fullName: '', email: '', phone: '', documentId: '', password: '' }

const registerFields = [
  { name: 'fullName', label: 'Nombre completo', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'Correo electrónico', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Teléfono', type: 'tel', autoComplete: 'tel' },
  { name: 'documentId', label: 'Documento de identidad', type: 'text', autoComplete: 'off' },
]

const loginFields = registerFields.filter((field) => field.name === 'email')

export function profileErrors(form) {
  const errors = {}
  if (form.fullName.trim().length < 3) errors.fullName = 'Escribe tu nombre y apellido.'
  if (form.phone.replace(/\D/g, '').length < 7) errors.phone = 'Escribe un teléfono de al menos 7 dígitos.'
  if (!form.documentId.trim()) errors.documentId = 'Escribe tu número de documento.'
  return errors
}

function validate(form, mode) {
  const errors = mode === 'register' ? profileErrors(form) : {}
  if (mode === 'register' && form.password.length < 6) errors.password = 'La contraseña necesita al menos 6 caracteres.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Escribe un correo válido, por ejemplo ana@correo.com.'
  if (mode === 'login' && !form.password) errors.password = 'Escribe tu contraseña.'
  return errors
}

export default function Auth({ open, onClose, onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(emptyForm)
  const [touched, setTouched] = useState(false)
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)
  const returnRef = useRef(null)
  const firstFieldRef = useRef(null)

  useEffect(() => {
    if (!open) {
      returnRef.current?.focus()
      return
    }
    returnRef.current = document.activeElement
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => firstFieldRef.current?.focus())
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const errors = touched ? validate(form, mode) : {}
  const fields = mode === 'register' ? registerFields : loginFields

  const switchMode = (next) => {
    setMode(next)
    setTouched(false)
    setServerError('')
  }

  const handleTabKey = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const next = mode === 'login' ? 'register' : 'login'
    switchMode(next)
    document.getElementById(`auth-tab-${next}`)?.focus()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    keepFocusInside(event, panelRef.current)
  }

  const submit = async (event) => {
    event.preventDefault()
    setTouched(true)
    setServerError('')
    const found = validate(form, mode)
    const firstInvalid = Object.keys(found)[0]
    if (firstInvalid) {
      document.getElementById(`auth-${firstInvalid}`)?.focus()
      return
    }
    setLoading(true)
    try {
      const body =
        mode === 'register'
          ? { ...form, fullName: form.fullName.trim(), email: form.email.trim() }
          : { email: form.email.trim(), password: form.password }
      const session = await (mode === 'register' ? api.register(body) : api.login(body))
      setForm(emptyForm)
      setTouched(false)
      setShowPassword(false)
      onAuthenticated(session)
    } catch (error) {
      setServerError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fieldProps = (name) => ({
    id: `auth-${name}`,
    name,
    value: form[name],
    onChange: (event) => setForm({ ...form, [name]: event.target.value }),
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `auth-${name}-error` : undefined,
  })

  const title = mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'

  return (
    <div className="auth-layer">
      <div className="vicky-backdrop" onClick={onClose} aria-hidden="true" />
      <section
        ref={panelRef}
        className="auth-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="auth-photo" aria-hidden="true">
          <p>Regístrate una vez y reserva tus próximas noches frente al mar con un solo clic.</p>
        </div>

        <div className="auth-body">
          <button className="vicky-close auth-close" type="button" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>

          <div className="auth-tabs" role="tablist" aria-label="Acceso a tu cuenta">
            {[
              ['login', 'Iniciar sesión'],
              ['register', 'Crear cuenta'],
            ].map(([value, label]) => (
              <button
                key={value}
                id={`auth-tab-${value}`}
                className="auth-tab"
                type="button"
                role="tab"
                aria-selected={mode === value}
                aria-controls="auth-form"
                tabIndex={mode === value ? 0 : -1}
                onClick={() => switchMode(value)}
                onKeyDown={handleTabKey}
              >
                {label}
              </button>
            ))}
          </div>

          <form id="auth-form" className="auth-form" role="tabpanel" aria-labelledby={`auth-tab-${mode}`} onSubmit={submit} noValidate>
            <h2 id="auth-title">{title}</h2>
            <p className="auth-lead">
              {mode === 'login'
                ? 'Entra con tu correo para reservar, ver tus estadías y hablar con Vicky.'
                : 'Guardamos tus datos para que no tengas que escribirlos en cada reserva.'}
            </p>

            {fields.map((field, index) => (
              <div className="field" key={field.name}>
                <label htmlFor={`auth-${field.name}`}>{field.label}</label>
                <input
                  {...fieldProps(field.name)}
                  ref={index === 0 ? firstFieldRef : undefined}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  required
                />
                {errors[field.name] && <p id={`auth-${field.name}-error`} className="field-error">{errors[field.name]}</p>}
              </div>
            ))}

            <div className="field">
              <label htmlFor="auth-password">Contraseña</label>
              <div className="password-row">
                <input
                  {...fieldProps('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={mode === 'register' ? 6 : undefined}
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  aria-pressed={showPassword}
                  aria-controls="auth-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                    {showPassword && <path d="M4 4l16 16" />}
                  </svg>
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {errors.password ? (
                <p id="auth-password-error" className="field-error">{errors.password}</p>
              ) : (
                mode === 'register' && <p className="field-hint">Mínimo 6 caracteres.</p>
              )}
            </div>

            {serverError && <p className="auth-error" role="alert">{serverError}</p>}

            <button className="btn btn-primary" type="submit" aria-busy={loading} disabled={loading}>
              {mode === 'login' ? (loading ? 'Entrando' : 'Iniciar sesión') : loading ? 'Creando tu cuenta' : 'Crear cuenta'}
            </button>

            <p className="auth-switch">
              {mode === 'login' ? '¿Primera vez en Casa Arrayán?' : '¿Ya tienes cuenta?'}{' '}
              <button className="text-link" type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Crea tu cuenta' : 'Inicia sesión'}
              </button>
            </p>
          </form>
        </div>
      </section>
    </div>
  )
}
