import { Inbox, Keyboard, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { QueueRow } from '../../components/backoffice/QueueRow'
import { DecisionSection } from '../../components/college/DecisionSection'
import { ReasonModal } from '../../components/backoffice/ReasonModal'
import { ReservationPanel } from '../../components/backoffice/ReservationPanel'
import { ShortcutsHelp } from '../../components/backoffice/ShortcutsHelp'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Drawer } from '../../components/ui/Drawer'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Input, Select } from '../../components/ui/Field'
import { FilterChips } from '../../components/ui/FilterChips'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { Toast } from '../../components/ui/Toast'
import { useApi } from '../../hooks/useApi'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useQueue } from '../../hooks/useQueue'
import { useQueueCount } from '../../backoffice/useQueueCount'
import { useShortcuts } from '../../hooks/useShortcuts'
import { cx } from '../../lib/cx'
import { decisionEditMode, decisionSavedMessage } from '../../lib/councilDecisions'
import { getErrorMessage } from '../../lib/errors'
import { todayInBrussels } from '../../lib/planning'
import {
  agentActions,
  DEFAULT_QUEUE,
  fetchQueueCounts,
  groupByDay,
  nextInQueue,
  PERIODS,
  queueOf,
  queueRequestKey,
  QUEUES,
  urgencyOf,
} from '../../lib/queue'
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

function isFresh(entry) {
  return Boolean(entry) && Date.now() - entry.at < PREFETCH_MAX_AGE_MS
}

// Donnée préchargée encore fraîche, sinon chargement normal
function cachedOr(cache, key, load) {
  const entry = cache.get(key)
  return isFresh(entry) ? Promise.resolve(entry.data) : load()
}

const SEARCH_DELAY_MS = 300
// Détail préchargé (réservations voisines dans la file) : réutilisé pendant 30 s, vidé après chaque action
const PREFETCH_MAX_AGE_MS = 30_000

// Espace gestion : file de traitement des réservations. Liste compacte filtrée (?file, ?periode, ?organisation, ?q),
// 15 par page avec « Charger plus », et détail à côté (?reservation=id ; panneau glissant sur mobile), actions de l'agent, passage automatique à la
// suivante et raccourcis clavier configurables (« ? »).
export function ReservationsQueuePage() {
  const { can } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const queue = queueOf(searchParams.get('file') ?? DEFAULT_QUEUE)
  const period = searchParams.get('periode') ?? 'a-venir'
  const organizationId = searchParams.get('organisation') ?? ''
  const search = searchParams.get('q') ?? ''
  const selectedId = Number(searchParams.get('reservation')) || null

  const [settings, setSettings] = useState(loadShortcutSettings)
  const [dialog, setDialog] = useState(null) // 'reject' | 'cancel' | 'assign' | 'help'
  const [busy, setBusy] = useState(null)
  const [resolving, setResolving] = useState(null)
  const [notice, setNotice] = useState(null)
  const [actionError, setActionError] = useState(null)

  // Texte tapé dans la recherche, reporté dans l'URL (?q=) 300 ms après la dernière frappe
  const [searchInput, setSearchInput] = useState(search)
  const searchTimer = useRef(null)

  const filters = useMemo(() => ({ period, organizationId, search }), [period, organizationId, search])
  const fetchCounts = useCallback((signal) => fetchQueueCounts(filters, { signal }), [filters])
  // Détails et décisions déjà chargés à l'avance (J / K instantanés) : { 'r:12' | 'd:12' → { data, at } }
  const [prefetched] = useState(() => new Map())
  const { refreshCount: refreshPendingCount } = useQueueCount()

  const fetchDetail = useCallback(
    (signal) => (selectedId ? cachedOr(prefetched, `r:${selectedId}`, () => getReservation(selectedId, { signal })) : Promise.resolve(null)),
    [selectedId, prefetched],
  )
  const list = useQueue(queueRequestKey(queue, filters))
  const counts = useApi(fetchCounts)
  const detail = useApi(fetchDetail)
  const items = useMemo(() => list.data?.items ?? [], [list.data])
  // Détail chargé, sinon la ligne de la liste le temps du chargement
  const reservation = detail.data?.id === selectedId ? detail.data : items.find((item) => item.id === selectedId) ?? null

  // Décision du Collège : seulement pour une validation manuelle (CPAS, ASBL, externes) ; écoles et personnel
  // communal n'en ont jamais, inutile de la demander
  const selectedManual = reservation?.approval_type === 'manuel'
  const fetchDecision = useCallback(
    (signal) =>
      selectedId && selectedManual
        ? cachedOr(prefetched, `d:${selectedId}`, () => getReservationDecision(selectedId, { signal }))
        : Promise.resolve(null),
    [selectedId, selectedManual, prefetched],
  )
  const decision = useApi(fetchDecision)
  const drivers = useApi(fetchDrivers)
  const organizations = useApi(fetchOrganizations)
  const wide = useMediaQuery('(min-width: 1024px)')
  // Décision du Collège de la réservation ouverte (undefined tant qu'elle n'est pas chargée)
  const currentDecision = decision.loading || decision.error ? undefined : decision.data
  const today = todayInBrussels()
  const actions = reservation ? agentActions(reservation, can, currentDecision, today) : {}

  // Forme fonctionnelle : un appel différé (recherche) part de l'URL du moment, pas de celle de sa création
  function update(changes) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        Object.entries(changes).forEach(([name, value]) => (value ? next.set(name, value) : next.delete(name)))
        return next
      },
      { replace: true },
    )
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
    showNotice(DONE_MESSAGES[name](updated), settings.autoNext ? updated.id : null)
    if (settings.autoNext) select(nextInQueue(items, updated.id))
    refreshAll()
  }

  // Les données ont changé côté backend : préchargements oubliés, tout est relu (badge du menu compris)
  function refreshAll() {
    prefetched.clear()
    list.reload()
    counts.reload()
    detail.reload()
    decision.reload()
    refreshPendingCount()
  }

  // Message de succès temporaire ; `reviewId` : réservation qu'on vient de quitter (lien « Revoir »)
  function showNotice(message, reviewId = null) {
    setNotice({ id: crypto.randomUUID(), message, reviewId })
  }

  async function runAction(name) {
    if (!reservation || !actions[name] || busy) return
    if (name === 'assign' || name === 'reject' || name === 'cancel' || name === 'council') {
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

  // Décision du Collège enregistrée. Un refus refuse aussi la réservation (côté backend) : file et compteurs rechargés.
  function handleDecisionSaved(saved) {
    setDialog(null)
    setActionError(null)
    showNotice(decisionSavedMessage(saved))
    refreshAll()
  }

  // Recherche : l'URL suit la saisie 300 ms après la dernière frappe (pas une requête par lettre).
  // La réservation ouverte reste ouverte (son détail est chargé par son numéro) : une ouverture au clavier
  // pendant le délai n'est pas annulée par la mise à jour différée.
  function changeSearch(value) {
    setSearchInput(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => update({ q: value.trim() }), SEARCH_DELAY_MS)
  }
  useEffect(() => () => clearTimeout(searchTimer.current), [])

  async function handleResolve(conflict) {
    setResolving(conflict.id)
    setActionError(null)
    try {
      await resolveReservationConflict(reservation.id, conflict.id)
      showNotice(`Conflit « ${conflict.type_label} » marqué comme résolu.`)
      refreshAll()
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

  // Préchargement des voisines de la réservation ouverte (suivante et précédente) : J / K s'ouvrent sans attendre.
  // Une erreur est ignorée : la réservation sera simplement chargée à l'ouverture.
  useEffect(() => {
    if (!selectedId) return
    const index = items.findIndex((item) => item.id === selectedId)
    if (index === -1) return
    for (const neighbour of [items[index + 1], items[index - 1]].filter(Boolean)) {
      const loads = [[`r:${neighbour.id}`, () => getReservation(neighbour.id)]]
      if (neighbour.approval_type === 'manuel') loads.push([`d:${neighbour.id}`, () => getReservationDecision(neighbour.id)])
      for (const [key, load] of loads) {
        if (isFresh(prefetched.get(key))) continue
        load()
          .then((data) => prefetched.set(key, { data, at: Date.now() }))
          .catch(() => {})
      }
    }
  }, [selectedId, items, prefetched])

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
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Rechercher une réservation"
              placeholder="Motif, organisation, demandeur, n°"
              value={searchInput}
              onChange={(event) => changeSearch(event.target.value)}
              className="py-2 pl-9 text-sm"
            />
          </div>
        </div>
      </div>

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
            <EmptyState icon={Inbox} title={queue.value === DEFAULT_QUEUE && !search ? 'Rien à traiter' : 'Aucune réservation'}>
              {queue.value === DEFAULT_QUEUE && !search
                ? 'Toutes les demandes de cette période sont traitées.'
                : 'Aucune réservation ne correspond à ces filtres.'}
            </EmptyState>
          ) : (
            <>
              <p className="mb-2 text-sm text-muted">
                {list.data.total} réservation{list.data.total > 1 ? 's' : ''}
                {items.length < list.data.total && ` (${items.length} affichées)`} · {keyLabel(settings.keys.next)} / {keyLabel(settings.keys.previous)} pour
                naviguer
              </p>
              {/* Un groupe par jour, en-tête collé en haut de l'écran pendant le défilement (pas d'overflow-hidden
                  sur le cadre : il empêcherait l'en-tête de coller) */}
              <div data-queue className={cx('rounded-card border border-line bg-surface', list.loading && 'opacity-60')}>
                {groupByDay(items, today).map((group, index) => (
                  <section key={group.day} aria-labelledby={`jour-${group.day}`} className={cx(index > 0 && 'border-t border-line')}>
                    <h3
                      id={`jour-${group.day}`}
                      className={cx(
                        'sticky top-0 z-10 flex items-baseline justify-between gap-2 border-b border-line bg-surface-muted/95 px-4 py-1.5 backdrop-blur-sm',
                        index === 0 && 'rounded-t-card',
                      )}
                    >
                      <span className="text-xs font-extrabold tracking-[.08em] uppercase">{group.label}</span>
                      <span className="text-xs text-muted">
                        {group.items.length} réservation{group.items.length > 1 ? 's' : ''}
                      </span>
                    </h3>
                    <ul className="divide-y divide-line">
                      {group.items.map((item) => (
                        <QueueRow
                          key={item.id}
                          reservation={item}
                          to={hrefFor(item.id)}
                          selected={item.id === selectedId}
                          urgency={urgencyOf(item, today)}
                        />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
              {list.canLoadMore && (
                <div className="mt-3 flex justify-center">
                  <Button variant="secondary" onClick={list.loadMore} loading={list.loading}>
                    Charger plus
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Grand écran : détail à côté de la liste, collé en haut de l'écran pendant le défilement, sur toute sa
            hauteur. Les actions sont en haut du panneau : visibles même quand le bas dépasse de l'écran */}
        <aside
          aria-label="Détail de la réservation"
          className="sticky top-4 hidden h-[calc(100dvh-2rem)] min-h-[28rem] overflow-hidden rounded-card border border-line bg-surface shadow-soft lg:block"
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
              <DecisionSection
                reservation={reservation}
                decision={currentDecision ?? null}
                editMode={decisionEditMode(reservation, currentDecision ?? null, today)}
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
      {notice && (
        <Toast
          key={notice.id}
          message={notice.message}
          action={notice.reviewId ? { label: 'Revoir', onClick: () => select(notice.reviewId) } : undefined}
          onClose={() => setNotice(null)}
        />
      )}
      <ShortcutsHelp open={dialog === 'help'} onClose={() => setDialog(null)} settings={settings} onChange={changeSettings} />
    </>
  )
}
