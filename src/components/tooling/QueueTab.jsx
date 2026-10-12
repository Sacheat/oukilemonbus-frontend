import { CheckCircle2, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { deleteFailedJob, deleteFailedJobs, retryAllFailedJobs, retryFailedJob } from '../../api/tooling'
import { useFailedJob, useFailedJobs } from '../../hooks/useFailedJobs'
import { cx } from '../../lib/cx'
import { getErrorMessage } from '../../lib/errors'
import { failedJobsApiParams, QUEUE_FILTERS, readQueueSearch, shortClassName } from '../../lib/tooling'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Drawer } from '../ui/Drawer'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { Field, Input } from '../ui/Field'
import { FilterChips } from '../ui/FilterChips'
import { Loader } from '../ui/Loader'
import { Pagination } from '../ui/Pagination'
import { Toast } from '../ui/Toast'
import { ConfirmModal } from './ConfirmModal'
import { FailedJobDetails } from './FailedJobDetails'
import { FailedJobRow } from './FailedJobRow'

function jobsLabel(count, verb) {
  return `${count} ${count > 1 ? `jobs ${verb}s` : `job ${verb}`}.`
}

// Onglet File d'attente : jobs en échec (souvent des emails non partis), filtrés par file (?queue=), paginés,
// job ouvert dans un panneau (?job=uuid, mis en évidence dans la liste). Relancer un job : direct ; tout relancer et toute suppression : confirmés.
// Après une action : message temporaire avec le nombre renvoyé, liste et badge de l'onglet rechargés (`onChanged`).
export function QueueTab({ onChanged }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = readQueueSearch(searchParams)
  const jobs = useFailedJobs(JSON.stringify(failedJobsApiParams(search)))
  const list = jobs.data?.data
  const total = jobs.data?.meta.total ?? 0
  const opened = useFailedJob(search.openedUuid)
  const [confirm, setConfirm] = useState(null) // { kind: 'delete-one' | 'delete-many' | 'retry-all', job? }
  const [before, setBefore] = useState('')
  const [busy, setBusy] = useState(null) // { uuid, kind } : relance en cours sur une ligne
  const [toast, setToast] = useState(null)
  const [error, setError] = useState(null)

  function update(changes) {
    const next = new URLSearchParams(searchParams)
    for (const [name, value] of Object.entries(changes)) {
      if (value) next.set(name, value)
      else next.delete(name)
    }
    setSearchParams(next)
  }

  function done(message) {
    setConfirm(null)
    setToast((previous) => ({ message, key: (previous?.key ?? 0) + 1 }))
    update({ job: null })
    jobs.reload()
    onChanged()
  }

  async function retryOne(job) {
    setBusy({ uuid: job.uuid, kind: 'retry' })
    setError(null)
    try {
      done(jobsLabel(await retryFailedJob(job.uuid), 'relancé'))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const confirmProps = {
    'delete-one': confirm?.job && {
      title: 'Supprimer le job',
      confirmLabel: 'Supprimer',
      danger: true,
      action: () => deleteFailedJob(confirm.job.uuid),
      onDone: (deleted) => done(jobsLabel(deleted, 'supprimé')),
      body: (
        <p>
          Le job <strong>{shortClassName(confirm.job.job)}</strong> sera supprimé sans être relancé. Cette action est
          définitive.
        </p>
      ),
    },
    'delete-many': {
      title: 'Supprimer des jobs en échec',
      confirmLabel: before ? 'Supprimer ces jobs' : 'Tout supprimer',
      danger: true,
      action: () => deleteFailedJobs(before || null),
      onDone: (deleted) => done(jobsLabel(deleted, 'supprimé')),
      body: (
        <>
          <p>Les jobs supprimés ne seront jamais relancés. Cette action est définitive.</p>
          <Field label="Supprimer les jobs antérieurs au" hint="Laisser vide pour supprimer tous les jobs en échec.">
            {(props) => <Input {...props} type="date" value={before} onChange={(event) => setBefore(event.target.value)} />}
          </Field>
          {!before && <p className="font-semibold">Les {total} jobs en échec seront supprimés.</p>}
        </>
      ),
    },
    'retry-all': {
      title: 'Tout relancer',
      confirmLabel: `Relancer les ${total} jobs`,
      action: retryAllFailedJobs,
      onDone: (retried) => done(jobsLabel(retried, 'relancé')),
      body: (
        <p>
          Les {total} jobs en échec sont remis dans la file d’attente (toutes files confondues). Ceux qui échouent
          encore, par exemple si l’envoi d’emails est toujours en panne, reviendront dans la liste.
        </p>
      ),
    },
  }[confirm?.kind]

  return (
    <div className="grid gap-5">
      {error && <Alert tone="danger">{error}</Alert>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips label="File" chips={QUEUE_FILTERS} value={search.queue} onChange={(value) => update({ queue: value, page: null })} />
        {total > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setConfirm({ kind: 'retry-all' })}>
              <RotateCcw className="size-4" aria-hidden="true" /> Tout relancer
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setBefore('')
                setConfirm({ kind: 'delete-many' })
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" /> Supprimer…
            </Button>
          </div>
        )}
      </div>

      {jobs.error ? (
        <ErrorState error={jobs.error} onRetry={jobs.reload} />
      ) : !list ? (
        <Loader />
      ) : list.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Aucun job en échec">
          {search.queue ? 'Aucun job en échec dans cette file.' : 'Tous les traitements en arrière-plan se sont bien passés.'}
        </EmptyState>
      ) : (
        <>
          <p className="text-sm text-muted" aria-live="polite">
            {total} {total > 1 ? 'jobs en échec' : 'job en échec'}
          </p>
          <ul
            aria-busy={jobs.loading}
            className={cx(
              'divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-soft transition-opacity',
              jobs.loading && 'opacity-60',
            )}
          >
            {list.map((job) => (
              <FailedJobRow
                key={job.uuid}
                job={job}
                busy={busy?.uuid === job.uuid ? busy.kind : null}
                selected={job.uuid === search.openedUuid}
                onOpen={() => update({ job: job.uuid })}
                onRetry={retryOne}
                onDelete={() => setConfirm({ kind: 'delete-one', job })}
              />
            ))}
          </ul>
          <Pagination meta={jobs.data.meta} onPageChange={(page) => update({ page: page > 1 ? String(page) : null })} />
        </>
      )}

      <Drawer open={Boolean(search.openedUuid)} onClose={() => update({ job: null })} title={opened.job ? shortClassName(opened.job.job) : 'Job en échec'}>
        <div className="grid gap-6 p-5">
          {opened.error ? (
            <ErrorState error={opened.error} onRetry={opened.reload} />
          ) : opened.job ? (
            <>
              <FailedJobDetails job={opened.job} />
              <div className="flex flex-wrap gap-2 border-t border-line pt-5">
                <Button onClick={() => retryOne(opened.job)} loading={busy?.uuid === opened.job.uuid}>
                  <RotateCcw className="size-4" aria-hidden="true" /> Relancer
                </Button>
                <Button variant="secondary" onClick={() => setConfirm({ kind: 'delete-one', job: opened.job })}>
                  <Trash2 className="size-4" aria-hidden="true" /> Supprimer
                </Button>
              </div>
            </>
          ) : (
            <Loader />
          )}
        </div>
      </Drawer>

      <ConfirmModal
        open={Boolean(confirmProps)}
        title={confirmProps?.title}
        confirmLabel={confirmProps?.confirmLabel}
        danger={confirmProps?.danger}
        action={confirmProps?.action}
        onClose={() => setConfirm(null)}
        onDone={confirmProps?.onDone}
      >
        {confirmProps?.body}
      </ConfirmModal>

      {toast && <Toast key={toast.key} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}
