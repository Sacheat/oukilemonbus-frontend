import { BadgeAlert, Bus, CalendarOff, CheckCircle2, ChevronRight, IdCard } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { formatDate } from '../../lib/dates'
import { countLabel, licenceAlert } from '../../lib/dashboard'

// Une alerte : icône, texte, et lien vers la page où la traiter si `to` est donné
function AlertRow({ icon: Icon, tone, children, to }) {
  const content = (
    <>
      <span className={cx('grid size-8 shrink-0 place-items-center rounded-lg', tone)}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">{children}</span>
      {to && <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden="true" />}
    </>
  )
  const rowClass = 'flex min-h-11 items-center gap-3 px-5 py-2.5 text-sm'
  return (
    <li>
      {to ? (
        <Link to={to} className={cx(rowClass, 'transition hover:bg-surface-muted')}>
          {content}
        </Link>
      ) : (
        <div className={rowClass}>{content}</div>
      )}
    </li>
  )
}

// Alertes flotte de GET /dashboard (fleet_alerts) : indisponibilités du jour, véhicules désactivés,
// permis expirés ou qui expirent dans les 30 jours. Seuls les chiffres non nuls sont affichés.
// `links` : chemins des pages Indisponibilités, Véhicules et Chauffeurs, null sans la permission.
export function FleetAlerts({ alerts, links }) {
  const {
    vehicles_unavailable_today: vehiclesUnavailable,
    drivers_unavailable_today: driversUnavailable,
    inactive_vehicles: inactiveVehicles,
    licences_expiring_30_days: licences,
  } = alerts
  const nothing = !vehiclesUnavailable && !driversUnavailable && !inactiveVehicles && licences.length === 0

  if (nothing) {
    return (
      <p className="flex items-center gap-2 px-5 py-6 text-sm text-muted">
        <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
        Rien à signaler sur la flotte.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-line">
      {vehiclesUnavailable > 0 && (
        <AlertRow icon={CalendarOff} tone="bg-warning-soft text-warning" to={links.unavailabilities}>
          <strong>{vehiclesUnavailable}</strong>{' '}
          {countLabel(vehiclesUnavailable, ['véhicule indisponible', 'véhicules indisponibles'])} aujourd’hui
        </AlertRow>
      )}
      {driversUnavailable > 0 && (
        <AlertRow icon={CalendarOff} tone="bg-warning-soft text-warning" to={links.unavailabilities}>
          <strong>{driversUnavailable}</strong>{' '}
          {countLabel(driversUnavailable, ['chauffeur indisponible', 'chauffeurs indisponibles'])} aujourd’hui
        </AlertRow>
      )}
      {inactiveVehicles > 0 && (
        <AlertRow icon={Bus} tone="bg-neutral-soft text-neutral" to={links.vehicles}>
          <strong>{inactiveVehicles}</strong> {countLabel(inactiveVehicles, ['véhicule désactivé', 'véhicules désactivés'])}
        </AlertRow>
      )}
      {licences.map((licence) => {
        const { expired, days } = licenceAlert(licence.licence_expiry_date)
        const date = formatDate(licence.licence_expiry_date, { day: 'numeric', month: 'long', year: 'numeric' })
        return (
          <AlertRow
            key={licence.driver_id}
            icon={expired ? BadgeAlert : IdCard}
            tone={expired ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning'}
            to={links.drivers}
          >
            <span className="block font-semibold break-words">{licence.full_name ?? 'Chauffeur'}</span>
            <span className="block text-muted">
              {expired
                ? `Permis expiré depuis le ${date}`
                : days === 0
                  ? 'Permis qui expire aujourd’hui'
                  : `Permis qui expire le ${date} (dans ${days} ${countLabel(days, ['jour', 'jours'])})`}
            </span>
          </AlertRow>
        )
      })}
    </ul>
  )
}
