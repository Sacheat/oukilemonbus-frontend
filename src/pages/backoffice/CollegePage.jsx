import { Gavel } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
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
import { useCollegeList } from '../../hooks/useCollegeList'
import { cx } from '../../lib/cx'
import { COLLEGE_TABS, DEFAULT_TAB, decisionSavedMessage, readCollegeSearch } from '../../lib/councilDecisions'

const EMPTY_TITLES = {
  'a-decider': 'Aucune réservation en attente du Collège',
  approuvees: 'Aucune décision approuvée',
  refusees: 'Aucune décision refusée',
}

// Décisions du Collège (CPAS, ASBL, externes) : réservations à décider et décisions prises, en onglets
// (?onglet=, ?page=). ?reservation=id ouvre le panneau : résumé, encodage de la décision, délibération.
export function CollegePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [notice, setNotice] = useState(null)
  const { tab, page, openedReservationId } = readCollegeSearch(searchParams)
  const list = useCollegeList(tab, page)
  const items = list.data?.data

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

  // Après un enregistrement : panneau fermé, liste rechargée, message selon la décision
  function handleSaved(savedDecision) {
    updateSearch({ reservation: null })
    list.reload()
    setNotice(decisionSavedMessage(savedDecision))
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Gestion"
        title="Décisions du Collège"
        description="Réservations des CPAS, ASBL et externes : le Collège doit approuver avant l'approbation par un agent."
      />

      {notice && <Alert tone="success">{notice}</Alert>}

      <div role="group" aria-label="Onglets" className="flex w-fit flex-wrap rounded-control border border-line-strong bg-surface p-1">
        {COLLEGE_TABS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={tab === option.value}
            onClick={() => updateSearch({ onglet: option.value === DEFAULT_TAB ? null : option.value, page: null })}
            className={cx(
              'min-h-11 rounded-md px-3 text-sm font-semibold',
              tab === option.value ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
            {tab === option.value && list.data?.meta && ` (${list.data.meta.total})`}
          </button>
        ))}
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : !items ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState icon={Gavel} title={EMPTY_TITLES[tab]} />
      ) : (
        <>
          <ul className="grid gap-3">
            {items.map((item) => (
              <li key={item.id}>
                {tab === 'a-decider' ? (
                  <CollegeReservationRow reservation={item} onOpen={openReservation} />
                ) : (
                  <CollegeDecisionRow decision={item} onOpen={openReservation} />
                )}
              </li>
            ))}
          </ul>
          <Pagination meta={list.data.meta} onPageChange={(nextPage) => updateSearch({ page: nextPage > 1 ? String(nextPage) : null })} />
        </>
      )}

      <Drawer
        open={Boolean(openedReservationId)}
        onClose={() => updateSearch({ reservation: null })}
        title={openedReservationId ? `Réservation n° ${openedReservationId}` : 'Réservation'}
      >
        <div className="p-5">
          {openedReservationId && <CollegeDrawerContent reservationId={openedReservationId} onSaved={handleSaved} />}
        </div>
      </Drawer>
    </div>
  )
}
