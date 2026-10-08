import { BadgeAlert, Bus, CalendarOff, ChevronRight, IdCard, Users } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { countLabel } from '../../lib/dashboard'
import { formatDate } from '../../lib/dates'

const ICONS = { passengers: Users, unavailable: CalendarOff, vehicle: Bus, licence: IdCard, 'licence-expired': BadgeAlert }

const TONES = {
  neutral: 'bg-neutral-soft text-neutral',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
}

// Texte sous un permis : expiré, expire aujourd'hui, ou dans combien de jours
function licenceText({ expiryDate, expired, days }) {
  const date = formatDate(expiryDate, { day: 'numeric', month: 'long', year: 'numeric' })
  if (expired) return `Permis expiré depuis le ${date}`
  if (days === 0) return 'Permis qui expire aujourd’hui'
  return `Permis qui expire le ${date} (dans ${days} ${countLabel(days, ['jour', 'jours'])})`
}

// Section « À surveiller » : ce qui ne demande pas d'action tout de suite (passagers que le demandeur doit confirmer,
// flotte : indisponibilités du jour, véhicules désactivés, permis). Lignes compactes, plus discrètes que « À faire » ;
// chacune ouvre la page où agir si l'agent y a accès. `items` : watchItems() ; rien n'est affiché si la liste est vide.
export function WatchList({ items }) {
  if (items.length === 0) return null

  return (
    <section aria-labelledby="watch-title">
      <h2 id="watch-title" className="mb-3 text-base font-bold">
        À surveiller
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = ICONS[item.kind]
          const content = (
            <>
              <span className={cx('grid size-8 shrink-0 place-items-center rounded-lg', TONES[item.tone])}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold break-words">{item.title}</span>
                {item.kind.startsWith('licence') ? (
                  <span className="block text-muted">{licenceText(item)}</span>
                ) : (
                  item.detail && <span className="block text-muted">{item.detail}</span>
                )}
              </span>
              {item.to && <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden="true" />}
            </>
          )
          const rowClass = 'flex min-h-11 items-center gap-3 rounded-card border border-line bg-surface px-4 py-2.5 text-sm'
          return (
            <li key={item.key}>
              {item.to ? (
                <Link to={item.to} className={cx(rowClass, 'transition hover:bg-surface-muted')}>
                  {content}
                </Link>
              ) : (
                <div className={rowClass}>{content}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
