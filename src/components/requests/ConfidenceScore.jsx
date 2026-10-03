import { CircleCheck, TriangleAlert } from 'lucide-react'
import { cx } from '../../lib/cx'
import { CONFIDENCE_LEVEL_TONES, roleAlreadyHeldWarning } from '../../lib/requests'
import { Alert } from '../ui/Alert'

const TONES = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-neutral-soft text-neutral',
}

// Note de confiance d'une demande (`confidence_note`, 0–100) en pastille, colorée selon le niveau du backend
// (`confidence_level`, neutre sans niveau). `decided` : demande traitée, la note est celle de la décision (figée).
// Avec `details`, les raisons (ce qui rassure) et les alertes (ce qui demande une vérification) du backend ; pour une
// demande traitée, elles sont recalculées aujourd'hui et peuvent ne plus correspondre à la note. Demande en attente :
// l'avertissement « Rôle déjà tenu » est sorti de la liste et mis en évidence dans un encadré.
export function ConfidenceScore({ score, level, levelLabel, decided = false, details }) {
  const pill = (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold tabular-nums',
        TONES[CONFIDENCE_LEVEL_TONES[level] ?? 'neutral'],
      )}
    >
      {decided ? 'Note à la décision' : 'Confiance'} {score ?? '–'}/100
      {levelLabel && <span className="font-semibold">· {levelLabel}</span>}
    </span>
  )
  if (!details) return pill

  const roleHeld = decided ? null : roleAlreadyHeldWarning(details.warnings)
  const warnings = details.warnings?.filter((warning) => warning !== roleHeld) ?? []

  return (
    <div className="grid gap-3">
      <div>{pill}</div>
      {roleHeld && (
        <Alert tone="warning" title="L’approbation ajouterait un second responsable">
          {roleHeld}
        </Alert>
      )}
      {decided && (warnings.length > 0 || details.reasons?.length > 0) && (
        <p className="text-sm text-muted">Critères recalculés aujourd’hui, à titre indicatif.</p>
      )}
      {warnings.length > 0 && (
        <ul className="grid gap-1.5 text-sm">
          {warnings.map((warning) => (
            <li key={warning} className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
              <span>
                <span className="sr-only">À vérifier : </span>
                {warning}
              </span>
            </li>
          ))}
        </ul>
      )}
      {details.reasons?.length > 0 && (
        <ul className="grid gap-1.5 text-sm text-muted">
          {details.reasons.map((reason) => (
            <li key={reason} className="flex items-start gap-2">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              {reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
