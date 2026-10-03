import { formatDateTime } from '../../lib/dates'
import { exceptionParts, shortClassName } from '../../lib/tooling'
import { DetailList } from '../ui/DetailList'

// Détail d'un job en échec : contexte, exception (résumé lisible, trace complète repliable), payload expurgé
export function FailedJobDetails({ job }) {
  const exception = exceptionParts(job.exception_summary)
  return (
    <>
      <DetailList
        items={[
          ['Job', <span key="job" className="break-all" title={job.job}>{shortClassName(job.job)}</span>],
          ['Classe complète', <code key="class" className="text-xs break-all">{job.job}</code>],
          ['File', job.queue],
          ['Connexion', job.connection],
          ['Échoué le', formatDateTime(job.failed_at)],
          ['Identifiant', <code key="uuid" className="text-xs break-all">{job.uuid}</code>],
        ]}
      />
      <section className="grid gap-2 border-t border-line pt-5">
        <h3 className="font-bold">Erreur</h3>
        {exception.type && <p className="text-sm font-semibold text-danger">{exception.type}</p>}
        <p className="text-sm break-words">{exception.message}</p>
        <details>
          <summary className="min-h-11 cursor-pointer pt-2 text-sm font-semibold text-link">Trace complète</summary>
          <pre className="mt-2 max-h-96 overflow-auto rounded-control bg-surface-muted p-3 text-xs whitespace-pre-wrap">{job.exception}</pre>
        </details>
      </section>
      <details className="border-t border-line pt-5">
        <summary className="min-h-11 cursor-pointer text-sm font-semibold text-link">Contenu du job (données sensibles masquées)</summary>
        <pre className="mt-2 max-h-96 overflow-auto rounded-control bg-surface-muted p-3 text-xs">{JSON.stringify(job.payload, null, 2)}</pre>
      </details>
    </>
  )
}
