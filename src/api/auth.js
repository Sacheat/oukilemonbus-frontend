import { api, csrf } from './client'

export async function login({ email, password, remember }) {
  await csrf()
  const { data } = await api.post('/auth/login', { email, password, remember })
  return data.data
}

export async function logout() {
  await api.post('/auth/logout')
}

// Utilisateur connecté avec roles, permissions et organizations (+ membership)
export async function fetchMe({ signal } = {}) {
  const { data } = await api.get('/auth/me', { signal })
  return data.data
}
