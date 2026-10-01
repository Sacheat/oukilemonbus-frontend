import { Inbox, Keyboard } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getReservationDecision } from '../../api/documents'
import { getAllDrivers } from '../../api/drivers'
import { getAllOrganizations } from '../../api/organizations'
import {
  approveReservation,
  cancelReservation,
  confirmReservation,
  getReservation,
  rejectReservation,
  resolveReservationConflict,
  retryAssignReservation,
} from '../../api/reservations'
import { useAuth } from '../../auth/useAuth'
import { AssignForm } from '../../components/backoffice/AssignForm'
import { CouncilDecisionForm } from '../../components/backoffice/CouncilDecisionForm'
import { QueueRow } from '../../components/backoffice/QueueRow'
import { ReasonModal } from '../../components/backoffice/ReasonModal'
import { ReservationPanel } from '../../components/backoffice/ReservationPanel'
import { ShortcutsHelp } from '../../components/backoffice/ShortcutsHelp'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Drawer } from '../../components/ui/Drawer'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Select } from '../../components/ui/Field'
import { FilterChips } from '../../components/ui/FilterChips'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { useApi } from '../../hooks/useApi'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useShortcuts } from '../../hooks/useShortcuts'
import { cx } from '../../lib/cx'
import { formatDate } from '../../lib/dates'
import { getErrorMessage } from '../../lib/errors'
import { agentActions, DEFAULT_QUEUE, fetchQueue, fetchQueueCounts, nextInQueue, PERIODS, queueOf, QUEUES } from '../../lib/queue'
import { keyLabel, loadShortcutSettings, saveShortcutSettings } from '../../lib/shortcuts'

// Messages après une action (réservation mise à jour → texte du bandeau)
const DONE_MESSAGES = {
  approve: (r) => `« ${r.trip_purpose} » approuvée${r.status === 'confirme' ? ' et confirmée (chauffeur et véhicule affectés)' : ''}.`,
  confirm: (r) => `« ${r.trip_purpose} » confirmée.`,
  retryAssign: (r) => `Affectation relancée pour « ${r.trip_purpose} » : ${r.status_label.toLowerCase()}.`,
  assign: (r) => `Affectation enregistrée pour « ${r.trip_purpose} ».`,
  reject: (r) => `« ${r.trip_purpose} » refusée.`,
  cancel: (r) => `« ${r.trip_purpose} » annulée.`,
}
const API_ACTIONS = { approve: approveReservation, confirm: confirmReservation, retryAssign: retryAssignReservation }

// Chauffeurs (pour leur nom) et organisations (pour le filtre), chargés une fois
function fetchDrivers(signal) {
  return getAllDrivers({ signal })
}
function fetchOrganizations(signal) {
  return getAllOrganizations({ signal })
}

// Espace gestion : file de traitement des réservations. Liste compacte filtrée (?file, ?periode, ?organisation)
// et détail à côté (?reservation=id ; panneau glissant sur mobile), actions de l'agent, passage automatique à la
// suivante et raccourcis clavier configurables (« ? »).
export function ReservationsQueuePage() {
  const { can } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const queue = queueOf(searchParams.get('file') ?? DEFAULT_QUEUE)
  const period = searchParams.get('periode') ?? 'a-venir'
  const organizationId = searchParams.get('organisation') ?? ''
  const selectedId = Number(searchParams.get('reservation')) || null

  const [settings, setSettings] = useState(loadShortcutSettings)
  const [dialog, setDialog] = useState(null) // 'reject' | 'cancel' | 'assign' | 'help'
  const [busy, setBusy] = useState(null)
  const [resolving, setResolving] = useState(null)
  const [notice, setNotice] = useState(null)
  const [actionError, setActionError] = useState(null)

  const filters = useMemo(() => ({ period, organizationId }), [period, organizationId])
  const fetchList = useCallback((signal) => fetchQueue(queue, filters, { signal }), [queue, filters])
  const fetchCounts = useCallback((signal) => fetchQueueCounts(filters, { signal }), [filters])
  const fetchDetail = useCallback((signal) => (selectedId ? getReservation(selectedId, { signal }) : Promise.resolve(null)), [selectedId])
  const list = useApi(fetchList)
  const counts = useApi(fetchCounts)
  const detail = useApi(fetchDetail)
  const fetchDecision = useCallback((signal) => (selectedId ? getReservationDecision(selectedId, { signal }) : Promise.resolve(null)), [selectedId])
  const decision = useApi(fetchDecision)
  const drivers = useApi(fetchDrivers)
  const organizations = useApi(fetchOrganizations)
  const wide = useMediaQuery('(min-width: 1024px)')

  const items = list.data?.items ?? []
  // Détail chargé, sinon la ligne de la liste le temps du chargement
  const reservation = detail.data?.id === selectedId ? detail.data : items.find((item) => item.id === selectedId) ?? null
  // Décision du Collège de la réservation ouverte (undefined tant qu'elle n'est pas chargée)
  const currentDecision = decision.loading || decision.error ? undefined : decision.data
  const actions = reservation ? agentActions(reservation, can, currentDecision) : {}
  // Motif proposé à l'ouverture de « Refuser » (après une décision défavorable du Collège)
  const [rejectReason, setRejectReason] = useState('')

  function update(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([name, value]) => (value ? next.set(name, value) : next.delete(name)))
    setSearchParams(next, { replace: true })
  }

  function select(id) {
    setActionError(null)
    update({ reservation: id ? String(id) : null })
  }

  function hrefFor(id) {
    const next = new URLSearchParams(searchParams)
    next.set('reservation', String(id))
    return `?${next}`
  }

  function driverName(id) {
    const driver = drivers.data?.find((item) => item.id === id)
    return driver?.user?.full_name ?? `Chauffeur n° ${id}`
  }

  function changeSettings(next) {
    setSettings(next)
    saveShortcutSettings(next)
  }

  // Après une action : message, rechargements, puis réservation suivante (si le réglage est actif)
  function handleDone(name, updated) {
    setDialog(null)
    setActionError(null)
    setNotice(DONE_MESSAGES[name](updated))
    if (settings.autoNext) select(nextInQueue(items, updated.id))
    list.reload()
    counts.reload()
    detail.reload()
    decision.reload()
  }

  async function runAction(name) {
    if (!reservation || !actions[name] || busy) return
    if (name === 'assign' || name === 'reject' || name === 'cancel' || name === 'council') {
      if (name === 'reject') setRejectReason('')
      setDialog(name)
      return
    }
    setBusy(name)
    setActionError(null)
    try {
      handleDone(name, await API_ACTIONS[name](reservation.id))
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setBusy(null)
    }
  }

  // Décision du Collège enregistrée : défavorable, on propose aussitôt le refus avec un motif prérempli
  function handleDecisionSaved(saved) {
    setDialog(null)
    decision.reload()
    detail.reload()
    const label = { approuve: 'favorable', refuse: 'défavorable', en_attente: 'en attente' }[saved.decision_status]
    setNotice(`Décision du Collège enregistrée (${label}) pour « ${reservation.trip_purpose} ».`)
    if (saved.decision_status === 'refuse' && actions.reject) {
      const date = saved.decision_date ? ` du ${formatDate(saved.decision_date, { day: 'numeric', month: 'long', year: 'numeric' })}` : ''
      const reference = saved.decision_reference ? ` (réf. ${saved.decision_reference})` : ''
      setRejectReason(`Décision défavorable du Collège${date}${reference}.`)
      setDialog('reject')
    }
  }

  async function handleResolve(conflict) {
    setResolving(conflict.id)
    setActionError(null)
    try {
      await resolveReservationConflict(reservation.id, conflict.id)
      setNotice(`Conflit « ${conflict.type_label} » marqué comme résolu.`)
      detail.reload()
      list.reload()
      counts.reload()
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setResolving(null)
    }
  }

  function move(step) {
    if (items.length === 0) return
    const index = items.findIndex((item) => item.id === selectedId)
    const target = index === -1 ? items[0] : items[Math.min(items.length - 1, Math.max(0, index + step))]
    select(target.id)
  }

  useShortcuts(settings.keys, {
    next: () => move(1),
    previous: () => move(-1),
    approve: () => runAction('approve'),
    reject: () => runAction('reject'),
    assign: () => runAction('assign'),
    confirm: () => runAction('confirm'),
    council: () => runAction('council'),
    help: () => setDialog('help'),
    close: () => selectedId && select(null),
  })

  // La ligne ouverte reste visible quand on navigue au clavier
  useEffect(() => {
    document.querySelector('[data-queue] [aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  const chips = QUEUES.map((item) => ({ value: item.value, label: item.label, dot: item.dot, count: counts.data?.[item.value] ?? null }))
  const panelProps = reservation && {
    reservation,
    decision: currentDecision,
    actions,
    onAction: runAction,
    busy,
    keys: settings.keys,
    driverName,
    onResolve: handleResolve,
    resolving,
  }

  return (
    <>
      <PageHeader
        eyebrow="Gestion"
        title="Réservations"
        description="Validez, affectez et suivez les demandes de trajet."
        actions={
          <Button variant="secondary" onClick={() => setDialog('help')}>
            <Keyboard className="size-4" aria-hidden="true" /> Raccourcis
            <kbd aria-hidden="true" className="rounded border border-line-strong px-1 text-xs">
              {keyLabel(settings.keys.help)}
            </kbd>
          </Button>
        }
        className="pb-4"
      />

      <div className="grid gap-3">
        <FilterChips label="File" chips={chips} value={queue.value} onChange={(value) => update({ file: value, reservation: null })} />
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Période" className="flex rounded-control border border-line-strong bg-surface p-1">
            {PERIODS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={period === option.value}
                onClick={() => update({ periode: option.value === 'a-venir' ? null : option.value, reservation: null })}
                className={cx(
                  'min-h-9 rounded-md px-3 text-sm font-semibold',
                  period === option.value ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Select
            aria-label="Organisation"
            value={organizationId}
            onChange={(event) => update({ organisation: event.target.value, reservation: null })}
            className="max-w-xs py-2 text-sm"
          >
            <option value="">Toutes les organisations</option>
            {organizations.data?.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {notice && (
        <Alert tone="success" className="mt-4">
          {notice}
        </Alert>
      )}
      {actionError && (
        <Alert tone="danger" className="mt-4">
          {actionError}
        </Alert>
      )}

      <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)]">
        <section aria-label="File des réservations" aria-busy={list.loading} className="min-w-0">
          {list.error ? (
            <ErrorState error={list.error} onRetry={list.reload} />
          ) : !list.data ? (
            <div role="status" className="grid gap-px overflow-hidden rounded-card border border-line">
              <span className="sr-only">Chargement de la file…</span>
              {[0, 1, 2, 3, 4].map((index) => (
                <Skeleton key={index} className="h-15 rounded-none" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={Inbox} title={queue.value === DEFAULT_QUEUE ? 'Rien à traiter' : 'Aucune réservation'}>
              {queue.value === DEFAULT_QUEUE ? 'Toutes les demandes de cette période sont traitées.' : 'Aucune réservation ne correspond à ces filtres.'}
            </EmptyState>
          ) : (
            <>
              <p className="mb-2 text-sm text-muted">
                {items.length} réservation{items.length > 1 ? 's' : ''} · {keyLabel(settings.keys.next)} / {keyLabel(settings.keys.previous)} pour
                naviguer
              </p>
              <ul
                data-queue
                className={cx('divide-y divide-line overflow-hidden rounded-card border border-line bg-surface', list.loading && 'opacity-60')}
              >
                {items.map((item) => (
                  <QueueRow key={item.id} reservation={item} to={hrefFor(item.id)} selected={item.id === selectedId} />
                ))}
              </ul>
              {list.data.capped && (
                <p className="mt-2 text-xs text-muted">Affichage limité aux 150 premières réservations de chaque statut.</p>
              )}
            </>
          )}
        </section>

        {/* Grand écran : détail à côté de la liste, qui reste visible ; sa hauteur tient dans l'écran sous les
            filtres pour que les actions soient visibles sans défiler */}
        <aside
          aria-label="Détail de la réservation"
          className="sticky top-4 hidden h-[calc(100dvh-22rem)] min-h-[28rem] overflow-hidden rounded-card border border-line bg-surface shadow-soft lg:block"
        >
          {panelProps ? (
            <ReservationPanel {...panelProps} onClose={() => select(null)} />
          ) : (
            <div className="grid h-full place-content-center p-6 text-center text-sm text-muted">
              <p className="font-semibold text-ink">Aucune réservation ouverte</p>
              <p className="mt-1">
                Choisissez-en une dans la liste, ou appuyez sur {keyLabel(settings.keys.next)} pour ouvrir la première.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile et tablette : détail dans un panneau glissant (ouvert seulement sous 1024 px : c'est une
          fenêtre modale, qui rendrait la page inutilisable si elle s'ouvrait cachée en grand écran) */}
      <Drawer open={!wide && Boolean(panelProps)} onClose={() => select(null)} title={reservation ? `Réservation n° ${reservation.id}` : ''}>
        {panelProps && <ReservationPanel {...panelProps} />}
      </Drawer>

      {reservation && (
        <>
          <ReasonModal
            open={dialog === 'reject'}
            onClose={() => setDialog(null)}
            title="Refuser la réservation"
            intro={`« ${reservation.trip_purpose} » : le demandeur recevra ce motif.`}
            label="Motif du refus"
            initialReason={rejectReason}
            submitLabel="Refuser"
            action={(reason) => rejectReservation(reservation.id, reason)}
            onDone={(updated) => handleDone('reject', updated)}
          />
          <ReasonModal
            open={dialog === 'cancel'}
            onClose={() => setDialog(null)}
            title="Annuler la réservation"
            intro={`« ${reservation.trip_purpose} » : l’annulation est définitive et le demandeur recevra ce motif.`}
            label="Motif de l’annulation"
            submitLabel="Annuler la réservation"
            action={(reason, key) => cancelReservation(reservation.id, reason, key)}
            onDone={(updated) => handleDone('cancel', updated)}
          />
          <Modal open={dialog === 'council'} onClose={() => setDialog(null)} title="Décision du Collège">
            {dialog === 'council' && (
              <CouncilDecisionForm
                reservation={reservation}
                decision={currentDecision ?? null}
                onCancel={() => setDialog(null)}
                onSaved={handleDecisionSaved}
              />
            )}
          </Modal>
          <Modal open={dialog === 'assign'} onClose={() => setDialog(null)} title="Affecter un chauffeur et un véhicule">
            {dialog === 'assign' && (
              <AssignForm reservation={reservation} onCancel={() => setDialog(null)} onDone={(updated) => handleDone('assign', updated)} />
            )}
          </Modal>
        </>
      )}
      <ShortcutsHelp open={dialog === 'help'} onClose={() => setDialog(null)} settings={settings} onChange={changeSettings} />
    </>
  )
}
