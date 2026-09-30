import { Card } from '../ui/Card'
import { ProgressSteps } from '../ui/ProgressSteps'
import { REQUEST_PLAN_STEPS } from '../../lib/organizations'
import { OrganizationAvatar } from './OrganizationAvatar'

// Colonne de droite d'un formulaire de demande (adhésion ou création) : aperçu de la demande en cours
// (pastille, nom, détails renseignés), puis « Ce qui va se passer » en étapes
export function RequestPreview({ title, name, lines = [], empty = 'Rien de renseigné pour l’instant.' }) {
  const details = lines.filter(Boolean)
  return (
    <aside className="grid content-start gap-4 lg:sticky lg:top-6">
      <Card className="p-5">
        <h2 className="text-[17px] font-bold">{title}</h2>
        {name ? (
          <div className="mt-3 flex items-center gap-3">
            <OrganizationAvatar name={name} className="size-10 text-sm" />
            <p className="min-w-0 font-bold break-words">{name}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">{empty}</p>
        )}
        {details.length > 0 && (
          <ul className="mt-3 grid gap-1 text-sm text-muted">
            {details.map((line) => (
              <li key={line} className="break-words">
                {line}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 text-[17px] font-bold">Ce qui va se passer</h2>
        <ProgressSteps steps={REQUEST_PLAN_STEPS} />
      </Card>
    </aside>
  )
}
