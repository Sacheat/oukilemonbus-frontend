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
// `privacy_policy_accepted` : la case « J'ai lu la politique de confidentialité » (obligatoire, 422 sinon)
export async function register({ first_name, last_name, email, phone, password, password_confirmation, privacy_policy_accepted }) {
  await csrf()
  const { data } = await api.post('/auth/register', {
    first_name,
    last_name,
    email,
    phone: phone || null,
    password,
    password_confirmation,
    privacy_policy_accepted: Boolean(privacy_policy_accepted),
  })
  return data.data
}

// Politique de confidentialité en vigueur (public) : { version, url }
export async function getPrivacyPolicy({ signal } = {}) {
  const { data } = await api.get('/privacy-policy', { signal })
  return data.data ?? data
}

// Le compte connecté a lu la version en vigueur (422 sur `version` si la page est périmée)
export async function acceptPrivacyPolicy(version) {
  const { data } = await api.post('/auth/me/privacy-policy', { version })
  return data.data ?? data
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

// Tutoriel de première connexion (`usager`, `agent`, `chauffeur`) : renvoie les tutoriels vus { [tour]: date }
export async function markTourSeen(tour) {
  const { data } = await api.patch(`/auth/me/tours/${tour}`)
  return data.data.tours_seen
}

// « Revoir le tutoriel » : il sera proposé à la prochaine visite de l'espace
export async function resetTour(tour) {
  const { data } = await api.delete(`/auth/me/tours/${tour}`)
  return data.data.tours_seen
}
