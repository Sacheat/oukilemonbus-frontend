import { Gavel } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useQueueCount } from '../../backoffice/useQueueCount'
import { CollegeDecisionRow } from '../../components/college/CollegeDecisionRow'
import { CollegeDrawerContent } from '../../components/college/CollegeDrawerContent'
import { CollegeReservationRow } from '../../components/college/CollegeReservationRow'
import { Alert } from '../../components/ui/Alert'
import { Drawer } from '../../components/ui/Drawer'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { useApi } from '../../hooks/useApi'
import { useCollegeList } from '../../hooks/useCollegeList'
import { cx } from '../../lib/cx'
import {
  COLLEGE_TABS,
  DEFAULT_TAB,
  decisionSavedMessage,
  decisionsWithTripDate,
  fetchCollegeCounts,
  readCollegeSearch,
} from '../../lib/councilDecisions'
import { todayInBrussels } from '../../lib/planning'
import { groupByDay, urgencyOf } from '../../lib/queue'

const EMPTY_TITLES = {
  'a-decider': 'Aucune réservation en attente du Collège',
  approuvees: 'Aucune décision approuvée',
  refusees: 'Aucune décision refusée',
}

// Décisions du Collège (CPAS, ASBL, externes) : réservations à décider et décisions prises, en onglets avec leur nombre
// (?onglet=, ?page=), en lignes compactes groupées par jour de trajet (urgence et état du Collège pour « À décider »).
// ?reservation=id ouvre le panneau : résumé, encodage de la décision, délibération ; après une décision favorable, le
// panneau reste ouvert pour approuver la réservation.
export function CollegePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [notice, setNotice] = useState(null)
  const { tab, page, openedReservationId } = readCollegeSearch(searchParams)
  const list = useCollegeList(tab, page)
  const counts = useApi(fetchCollegeCounts)
  // Compteurs du menu (Collège à décider, réservations à traiter), relus après une décision ou une approbation
  const { refreshCount } = useQueueCount()
  const items = list.data?.data
  const today = todayInBrussels()
  const groups = items ? groupByDay(tab === 'a-decider' ? items : decisionsWithTripDate(items), today) : []

  function updateSearch(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([name, value]) => {
      if (value) next.set(name, value)
      else next.delete(name)
    })
    setSearchParams(next)
  }

  function openReservation(reservationId) {
    setNotice(null)
    updateSearch({ reservation: String(reservationId) })
  }

  // Après un enregistrement : liste et nombres rechargés, message selon la décision. Décision favorable : le panneau
  // reste ouvert (approuver la réservation) ; sinon il se ferme.
  function handleSaved(savedDecision) {
    if (savedDecision.decision_status !== 'approuve') updateSearch({ reservation: null })
    list.reload()
    counts.reload()
    refreshCount()
    setNotice(decisionSavedMessage(savedDecision))
  }

  // Réservation approuvée depuis le panneau : panneau fermé, message avec son nouveau statut
  function handleApproved(reservation) {
    updateSearch({ reservation: null })
    list.reload()
    counts.reload()
    refreshCount()
    setNotice(`« ${reservation.trip_purpose} » approuvée. Statut : ${reservation.status_label}.`)
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Gestion"
        title="Décisions du Collège"
        description="Réservations des CPAS, ASBL et externes : le Collège décide, puis un agent approuve. Pour une école ou le personnel communal, une décision facultative (dérogation horaire) s’encode depuis la file Réservations."
      />

      {notice && <Alert tone="success">{notice}</Alert>}

      <SegmentedControl
        label="Onglets"
        options={COLLEGE_TABS.map((option) => ({ value: option.value, label: option.label, count: counts.data?.[option.value] ?? null }))}
        value={tab}
        onChange={(value) => updateSearch({ onglet: value === DEFAULT_TAB ? null : value, page: null })}
        className="w-fit"
      />

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : !items ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState icon={Gavel} title={EMPTY_TITLES[tab]} />
      ) : (
        <>
          {/* Un groupe par jour de trajet, en-tête collé en haut pendant le défilement (comme la file Réservations) */}
          {/* min-w-0 : les lignes tronquées ne doivent pas élargir la grille de la page (débordement sur mobile) */}
          <div className={cx('min-w-0 rounded-card border border-line bg-surface', list.loading && 'opacity-60')}>
            {groups.map((group, index) => (
              <section key={group.day} aria-labelledby={`college-${group.day}`} className={cx(index > 0 && 'border-t border-line')}>
                <h2
                  id={`college-${group.day}`}
                  className={cx(
                    'sticky top-0 z-10 flex items-baseline justify-between gap-2 border-b border-line bg-surface-muted/95 px-4 py-1.5 backdrop-blur-sm',
                    index === 0 && 'rounded-t-card',
                  )}
                >
                  <span className="text-xs font-extrabold tracking-[.08em] uppercase">{group.label}</span>
                  <span className="text-xs text-muted">
                    {group.items.length} {tab === 'a-decider' ? 'réservation' : 'décision'}
                    {group.items.length > 1 ? 's' : ''}
                  </span>
                </h2>
                <ul className="divide-y divide-line">
                  {group.items.map((item) =>
                    tab === 'a-decider' ? (
                      <CollegeReservationRow
                        key={item.id}
                        reservation={item}
                        onOpen={openReservation}
                        selected={String(item.id) === openedReservationId}
                        urgency={urgencyOf(item, today)}
                      />
                    ) : (
                      <CollegeDecisionRow key={item.id} decision={item} onOpen={openReservation} />
                    ),
                  )}
                </ul>
              </section>
            ))}
          </div>
          <Pagination meta={list.data.meta} onPageChange={(nextPage) => updateSearch({ page: nextPage > 1 ? String(nextPage) : null })} />
        </>
      )}

      <Drawer
        open={Boolean(openedReservationId)}
        onClose={() => updateSearch({ reservation: null })}
        title={openedReservationId ? `Réservation n° ${openedReservationId}` : 'Réservation'}
      >
        <div className="p-5">
          {openedReservationId && (
            <CollegeDrawerContent reservationId={openedReservationId} onSaved={handleSaved} onApproved={handleApproved} />
          )}
        </div>
      </Drawer>
    </div>
  )
}
