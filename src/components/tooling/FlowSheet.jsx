import { DetailList } from '../ui/DetailList'

// « Classe::méthode » d'un objet { class, method } de la fiche, ou le texte tel quel
function classMethod(value) {
  if (!value) return null
  if (typeof value === 'string') return value || null
  return [value.class, value.method].filter(Boolean).join('::') || null
}

function codeList(items) {
  return (
    <span className="flex flex-wrap gap-1">
      {items.map((item) => (
        <code key={item} className="rounded bg-surface-muted px-1.5 py-0.5 text-xs font-normal">
          {item}
        </code>
      ))}
    </span>
  )
}

// Fiche d'un flow métier de l'Inspector : objectif, route, contrôleur, requête, service, services liés, tables
// touchées et effets. Les champs absents sont ignorés (le résumé d'une entrée de liste n'a que titre et catégorie).
export function FlowSheet({ flowKey, flow }) {
  const internal = flow.service?.internal_methods ?? []
  const controller = classMethod(flow.api_controller)
  const validation = classMethod(flow.request)
  const service = classMethod(flow.service)
  return (
    <section className="grid gap-2 border-t border-line pt-5">
      <h3 className="font-bold">
        Flow métier : {flow.title}
        {flow.category && <span className="font-normal text-muted"> · {flow.category}</span>}
      </h3>
      {flow.goal && <p className="text-sm">{flow.goal}</p>}
      <DetailList
        items={[
          flowKey && ['Clé', <code key="key" className="text-xs">{flowKey}</code>],
          flow.route?.api && ['Route', <code key="route" className="text-xs break-all">{flow.route.api}</code>],
          controller && ['Contrôleur', controller],
          validation && ['Validation', validation],
          service && ['Service', service],
          internal.length > 0 && ['Étapes internes', codeList(internal)],
          flow.related_services?.length > 0 && ['Services liés', codeList(flow.related_services)],
          flow.tables?.length > 0 && ['Tables', codeList(flow.tables)],
        ]}
      />
      {flow.effects?.length > 0 && (
        <ul className="mt-2 grid list-disc gap-1 pl-5 text-sm">
          {flow.effects.map((effect) => (
            <li key={effect}>{effect}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
