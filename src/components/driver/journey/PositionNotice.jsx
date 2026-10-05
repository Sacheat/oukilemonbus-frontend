import { useEffect, useState } from 'react'
import { positionPermission } from '../../../lib/devicePosition'
import { Alert } from '../../ui/Alert'

// Rappel du règlement si le téléphone refuse de partager la position : les boutons fonctionnent quand même, mais
// chaque étape est enregistrée « position refusée » (les agents le voient). Rien si l'autorisation est donnée ou
// pas encore demandée (le navigateur la demandera au premier appui).
export function PositionNotice() {
  const [permission, setPermission] = useState('unknown')

  useEffect(() => {
    let active = true
    positionPermission().then((state) => {
      if (active) setPermission(state)
    })
    return () => {
      active = false
    }
  }, [])

  if (permission !== 'denied') return null

  return (
    <Alert tone="warning" title="Partage de position désactivé">
      Le règlement du service demande le partage de la position pendant les trajets. Autorisez-le dans les réglages du
      téléphone (navigateur, puis « Position »). En attendant, vos étapes sont enregistrées sans position.
    </Alert>
  )
}
