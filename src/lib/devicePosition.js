// Position du téléphone au moment d'un appui (Départ, Arrivée, Aide), au format attendu par le backend :
//   partage autorisé et position reçue → { state: 'envoyee', latitude, longitude, accuracy_m, captured_at }
//   partage refusé                     → { state: 'refusee' }
//   GPS muet, délai dépassé, pas de GPS → { state: 'indisponible' }
// La promesse ne rejette jamais : l'appui est enregistré même sans position (le règlement interne demande le partage,
// l'application en garde la trace).
const POSITION_TIMEOUT_MS = 8000

export function readDevicePosition({ timeout = POSITION_TIMEOUT_MS } = {}) {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve({ state: 'indisponible' })

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          state: 'envoyee',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy_m: Math.round(position.coords.accuracy),
          captured_at: new Date(position.timestamp).toISOString(),
        }),
      (error) => resolve({ state: error.code === error.PERMISSION_DENIED ? 'refusee' : 'indisponible' }),
      { enableHighAccuracy: true, timeout, maximumAge: 30_000 },
    )
  })
}

// État de l'autorisation sans rien demander : 'granted' | 'denied' | 'prompt' | 'unknown' (navigateur sans Permissions API)
export async function positionPermission() {
  try {
    const status = await navigator.permissions?.query({ name: 'geolocation' })
    return status?.state ?? 'unknown'
  } catch {
    return 'unknown'
  }
}
