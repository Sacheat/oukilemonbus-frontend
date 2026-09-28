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

// Crée le compte (rôle user), ouvre la session et envoie l'email de vérification
export async function register({ first_name, last_name, email, phone, password, password_confirmation }) {
  await csrf()
  const { data } = await api.post('/auth/register', {
    first_name,
    last_name,
    email,
    phone: phone || null,
    password,
    password_confirmation,
  })
  return data.data
}

export async function resendVerificationEmail() {
  const { data } = await api.post('/email/verify/resend')
  return data.message
}

// Paramètres recopiés tels quels depuis le lien de l'email ({FRONTEND_URL}/verify-email?id=…&hash=…)
export async function verifyEmail({ id, hash, expires, signature }, { signal } = {}) {
  const { data } = await api.get(`/email/verify/${id}/${hash}`, { params: { expires, signature }, signal })
  return data.message
}

// Réponse identique que l'adresse existe ou non
export async function forgotPassword(email) {
  await csrf()
  const { data } = await api.post('/auth/forgot-password', { email })
  return data.message
}

// Ferme toutes les sessions de l'utilisateur : il doit se reconnecter
export async function resetPassword({ token, email, password, password_confirmation }) {
  await csrf()
  const { data } = await api.post('/auth/reset-password', { token, email, password, password_confirmation })
  return data.message
}
