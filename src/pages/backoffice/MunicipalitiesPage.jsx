import { MapPinOff } from 'lucide-react'
import { useState } from 'react'
import { getAllMunicipalities } from '../../api/municipalities'
import { useAuth } from '../../auth/useAuth'
import { hasRole } from '../../auth/permissions'
import { LocalitiesPanel } from '../../components/municipalities/LocalitiesPanel'
import { MunicipalitySettings } from '../../components/municipalities/MunicipalitySettings'
import { OnCallContactPanel } from '../../components/municipalities/OnCallContactPanel'
import { OtherMunicipalities } from '../../components/municipalities/OtherMunicipalities'
import { Alert } from '../../components/ui/Alert'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { useApi } from '../../hooks/useApi'
import { activeMunicipalityOf } from '../../lib/municipalities'

function fetchMunicipalities(signal) {
  return getAllMunicipalities({ signal })
}

// Communes (agent et admin, municipalities.manage) : règles de la commune active appliquées aux réservations
// (dépôt, distances, avec la carte de la zone de prise en charge), ses localités, et pour l'admin le contact de garde
// (demandes d'aide des chauffeurs) et les autres communes (ajout, activation). Après chaque succès : liste rechargée et message en haut de la page.
export function MunicipalitiesPage() {
  const { user } = useAuth()
  const isAdmin = hasRole(user, 'admin')
  const municipalities = useApi(fetchMunicipalities)
  const [notice, setNotice] = useState(null)
  const list = municipalities.data
  const active = activeMunicipalityOf(list)
  const others = list?.filter((municipality) => !municipality.is_active) ?? []

  function finish(message) {
    municipalities.reload()
    setNotice(message)
  }

  function handleSettingsSaved(saved) {
    if (saved) finish(`Règles de ${saved.name} enregistrées.`)
    else setNotice('Aucune modification à enregistrer.')
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Administration"
        title="Communes"
        description="Dépôt du bus, distances maximales et localités de la commune où la plateforme est utilisée."
      />

      {notice && <Alert tone="success">{notice}</Alert>}

      {municipalities.error && !list ? (
        <ErrorState error={municipalities.error} onRetry={municipalities.reload} />
      ) : !list ? (
        <Loader />
      ) : (
        <>
          {active ? (
            <>
              <MunicipalitySettings key={`${active.id}-${active.updated_at}`} municipality={active} onSaved={handleSettingsSaved} />
              <LocalitiesPanel municipality={active} onChanged={finish} />
              {isAdmin && (
                <OnCallContactPanel
                  key={`garde-${active.id}-${active.updated_at}`}
                  municipality={active}
                  onSaved={(saved) => finish(`Contact de garde de ${saved.name} enregistré.`)}
                />
              )}
            </>
          ) : (
            <EmptyState icon={MapPinOff} title="Aucune commune active">
              {isAdmin
                ? 'Les réservations utilisent les valeurs par défaut. Activez une commune ci-dessous.'
                : 'Les réservations utilisent les valeurs par défaut. Un administrateur doit activer une commune.'}
            </EmptyState>
          )}
          {isAdmin && <OtherMunicipalities others={others} current={active} onChanged={finish} />}
        </>
      )}
    </div>
  )
}
