import { setToken } from './api.js'

const storageKey = 'casa-arrayan-session'

export function loadSession() {
  let session = null
  try {
    session = JSON.parse(localStorage.getItem(storageKey))
  } catch {
    session = null
  }
  if (!session?.token || !session.guest) session = null
  setToken(session?.token)
  return session
}

export function storeSession(session) {
  setToken(session?.token)
  try {
    if (session) localStorage.setItem(storageKey, JSON.stringify(session))
    else localStorage.removeItem(storageKey)
  } catch {
    return
  }
}
