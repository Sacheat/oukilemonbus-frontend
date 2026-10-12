import { CalendarDays, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { deleteCalendarPeriod, getCalendarPeriods } from '../../api/municipalityCalendar'
import { useAuth } from '../../auth/useAuth'
import { useApi } from '../../hooks/useApi'
import { formatDate } from '../../lib/dates'
import { CALENDAR_KINDS, calendarYears, periodsOfKind, periodText, touchesYear } from '../../lib/municipalityCalendar'
import { todayApiDate } from '../../lib/reservations'
import { ConfirmModal } from '../tooling/ConfirmModal'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { ChoicePills } from '../ui/ChoicePills'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'
import { Panel } from '../ui/Panel'
import { CalendarPeriodModal } from './CalendarPeriodModal'
import { CalendarPeriodRow } from './CalendarPeriodRow'

// Onglet « Calendrier » de Communes, pour une année :
//   jours fériés légaux (calculés par le backend, lecture seule) → aucune réservation ces jours-là
//   fermetures de la commune → idem, encodées ici (pont, fête locale)
//   vacances scolaires → sautées par les séries des écoles, une réservation ponctuelle reste possible
// Ajout et modification dans une fenêtre, suppression confirmée ; message après chaque succès.
export function CalendarPanel({ municipality }) {
  const { can } = useAuth()
  const canManage = can('municipalities.manage')
  const currentYear = Number(todayApiDate().slice(0, 4))
  const [year, setYear] = useState(currentYear)
  const [editing, setEditing] = useState(null) // { kind, period? }
  const [deleting, setDeleting] = useState(null)
  const [notice, setNotice] = useState(null)

  const fetchCalendar = useCallback((signal) => getCalendarPeriods(municipality.id, year, { signal }), [municipality.id, year])
  const calendar = useApi(fetchCalendar)
  const periods = calendar.data?.data ?? []
  const holidays = calendar.data?.meta?.public_holidays ?? []

  function done(message) {
    setEditing(null)
    setDeleting(null)
    setNotice(message)
    calendar.reload()
  }

  return (
    <div className="grid gap-6">
      <ChoicePills
        legend="Année"
        options={calendarYears(currentYear).map((value) => ({ value: String(value), label: String(value) }))}
        value={String(year)}
        onChange={(value) => {
          setNotice(null)
          setYear(Number(value))
        }}
      />
      {notice && <Alert tone="success">{notice}</Alert>}

      {calendar.error ? (
        <ErrorState error={calendar.error} onRetry={calendar.reload} />
      ) : !calendar.data ? (
        <Loader />
      ) : (
        <>
          <Panel title={`Jours fériés légaux ${year}`}>
            <p className="px-5 pt-4 text-sm text-muted">
              Calculés automatiquement chaque année (Pâques, Ascension et Pentecôte changent de date) : aucune réservation
              n’est possible ces jours-là.
            </p>
            <ul className="grid gap-x-6 gap-y-1 px-5 py-4 text-sm sm:grid-cols-2">
              {holidays.map((holiday) => (
                <li key={holiday.date} className="flex gap-2">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                  <span>
                    <span className="font-semibold">{holiday.label}</span>
                    <span className="text-muted"> · {formatDate(holiday.date)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          {CALENDAR_KINDS.map((kind) => {
            const rows = periodsOfKind(periods, kind.value)
            return (
              <Panel
                key={kind.value}
                title={`${kind.label} ${year}`}
                action={
                  canManage && (
                    <Button variant="secondary" className="text-sm" onClick={() => setEditing({ kind: kind.value })}>
                      <Plus className="size-4" aria-hidden="true" />
                      Ajouter
                    </Button>
                  )
                }
              >
                <p className="px-5 pt-4 text-sm text-muted">{kind.help}</p>
                {rows.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-muted">{kind.empty}</p>
                ) : (
                  <ul className="mt-2 divide-y divide-line">
                    {rows.map((period) => (
                      <CalendarPeriodRow
                        key={period.id}
                        period={period}
                        canManage={canManage}
                        onEdit={() => setEditing({ kind: period.kind, period })}
                        onDelete={() => setDeleting(period)}
                      />
                    ))}
                  </ul>
                )}
              </Panel>
            )
          })}
        </>
      )}

      <CalendarPeriodModal
        open={Boolean(editing)}
        municipalityId={municipality.id}
        kind={editing?.kind}
        period={editing?.period}
        onClose={() => setEditing(null)}
        onSaved={(saved) => {
          // Période hors de l'année affichée (ex. congé de détente 2027 ajouté en regardant 2026) : on montre son année
          if (!touchesYear(saved, year)) setYear(Number(saved.start_date.slice(0, 4)))
          done(`« ${saved.label} » enregistré ${periodText(saved)}.`)
        }}
      />
      <ConfirmModal
        open={Boolean(deleting)}
        title="Supprimer cette période ?"
        confirmLabel="Supprimer"
        danger
        action={() => deleteCalendarPeriod(deleting.id)}
        onClose={() => setDeleting(null)}
        onDone={() => done(`« ${deleting.label} » supprimé.`)}
      >
        {deleting && (
          <p>
            « {deleting.label} » ({periodText(deleting)}) sera retiré du calendrier. Les réservations et séries déjà
            créées ne changent pas.
          </p>
        )}
      </ConfirmModal>
    </div>
  )
}
