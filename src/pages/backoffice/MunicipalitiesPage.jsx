import { MapPinOff } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { getAllMunicipalities } from '../../api/municipalities'
import { useAuth } from '../../auth/useAuth'
import { hasRole } from '../../auth/permissions'
import { DriverJourneyPanel } from '../../components/municipalities/DriverJourneyPanel'
import { LocalitiesPanel } from '../../components/municipalities/LocalitiesPanel'
import { MunicipalitySettings } from '../../components/municipalities/MunicipalitySettings'
import { MunicipalitySummary } from '../../components/municipalities/MunicipalitySummary'
import { OnCallContactPanel } from '../../components/municipalities/OnCallContactPanel'
import { OtherMunicipalities } from '../../components/municipalities/OtherMunicipalities'
import { WeeklyPlanningPanel } from '../../components/municipalities/WeeklyPlanningPanel'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageTabs } from '../../components/ui/PageTabs'
import { useApi } from '../../hooks/useApi'
import { activeMunicipalityOf, municipalityTabs, readMunicipalityTab } from '../../lib/municipalities'

function fetchMunicipalities(signal) {
  return getAllMunicipalities({ signal })
}

// Communes (agent et admin, municipalities.manage), en onglets (?onglet=) sous un résumé de la commune active :
// règles appliquées aux réservations (dépôt, distances, avec la carte de la zone de prise en charge), localités, et
// pour l'admin l'espace chauffeur (contact de garde, navigation, délai), le planning hebdomadaire (envoi automatique,
// responsable) et les autres communes (ajout, activation). Après chaque succès : liste rechargée et message dans le
// panneau concerné (`notice` : { tab, panel, message }), effacé au changement d'onglet (onglets ou tuiles du résumé).
export function MunicipalitiesPage() {
  const { user } = useAuth()
  const isAdmin = hasRole(user, 'admin')
  const municipalities = useApi(fetchMunicipalities)
  const [searchParams, setSearchParams] = useSearchParams()
  const [notice, setNotice] = useState(null)
  const list = municipalities.data
  const active = activeMunicipalityOf(list)
  const others = list?.filter((municipality) => !municipality.is_active) ?? []
  const tabs = municipalityTabs({ isAdmin, hasActive: Boolean(active) })
  const tab = readMunicipalityTab(searchParams, tabs)
  if (notice && notice.tab !== tab) setNotice(null) // autre onglet : le message ne le concerne plus

  function changeTab(value) {
    setSearchParams(value === tabs[0]?.value ? {} : { onglet: value })
  }

  function finish(panel, message) {
    municipalities.reload()
    setNotice({ tab, panel, message })
  }

  const noticeOf = (panel) => (notice?.panel === panel ? notice.message : null)
  const tabOptions = tabs.map((option) => ({
    ...option,
    count: option.value === 'communes' ? others.length : option.value === 'localites' ? active?.localities?.length : undefined,
  }))
  const versionKey = active ? `${active.id}-${active.updated_at}` : ''

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Communes"
        description="Dépôt du bus, distances maximales et localités de la commune où la plateforme est utilisée."
      />

      {municipalities.error && !list ? (
        <ErrorState error={municipalities.error} onRetry={municipalities.reload} />
      ) : !list ? (
        <Loader />
      ) : (
        <>
          {active ? (
            <MunicipalitySummary municipality={active} isAdmin={isAdmin} />
          ) : (
            <EmptyState icon={MapPinOff} title="Aucune commune active">
              {isAdmin
                ? 'Les réservations utilisent les valeurs par défaut. Activez une commune ci-dessous.'
                : 'Les réservations utilisent les valeurs par défaut. Un administrateur doit activer une commune.'}
            </EmptyState>
          )}

          {tabs.length > 1 && <PageTabs label="Réglages de la commune" options={tabOptions} value={tab} onChange={changeTab} />}

          {tab === 'regles' && (
            <MunicipalitySettings
              key={versionKey}
              municipality={active}
              notice={noticeOf('regles')}
              onSaved={(saved) => finish('regles', `Règles de ${saved.name} enregistrées.`)}
            />
          )}
          {tab === 'localites' && (
            <LocalitiesPanel municipality={active} notice={noticeOf('localites')} onChanged={(message) => finish('localites', message)} />
          )}
          {tab === 'chauffeurs' && (
            <div className="grid gap-6">
              <OnCallContactPanel
                key={`garde-${versionKey}`}
                municipality={active}
                notice={noticeOf('garde')}
                onSaved={(saved) => finish('garde', `Contact de garde de ${saved.name} enregistré.`)}
              />
              <DriverJourneyPanel
                key={`chauffeur-${versionKey}`}
                municipality={active}
                notice={noticeOf('chauffeur')}
                onSaved={(saved) => finish('chauffeur', `Réglages de l’espace chauffeur de ${saved.name} enregistrés.`)}
              />
            </div>
          )}
          {tab === 'planning' && (
            <WeeklyPlanningPanel
              key={`planning-${versionKey}`}
              municipality={active}
              notice={noticeOf('planning')}
              onSaved={(saved) => finish('planning', `Planning hebdomadaire de ${saved.name} enregistré.`)}
            />
          )}
          {tab === 'communes' && (
            <OtherMunicipalities
              others={others}
              current={active}
              notice={noticeOf('communes')}
              onChanged={(message) => finish('communes', message)}
            />
          )}
        </>
      )}
    </div>
  )
}
