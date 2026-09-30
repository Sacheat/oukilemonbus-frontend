import { CircleCheck, CircleX, Landmark, TriangleAlert } from 'lucide-react'
import { cx } from '../../../lib/cx'

const TONES = {
  success: { box: 'border-success/30 bg-success-soft', badge: 'bg-success text-on-primary', icon: CircleCheck },
  info: { box: 'border-info/30 bg-info-soft', badge: 'bg-info text-on-primary', icon: Landmark },
  warning: { box: 'border-warning-line bg-warning-soft', badge: 'bg-warning text-on-primary', icon: TriangleAlert },
  danger: { box: 'border-danger/30 bg-danger-soft', badge: 'bg-danger text-on-danger', icon: CircleX },
}

// Ce que deviendra la demande à l'envoi, d'après le preview (le backend crée la réservation avec son
// `status`) : bloquée, en conflit, approuvée automatiquement ou examinée par la commune (en attente)
function decision(result, mode) {
  const send = mode === 'edit' ? 'l’enregistrement' : 'l’envoi'
  if (!result.is_allowed) {
    return {
      tone: 'danger',
      title: mode === 'edit' ? 'Ces changements ne peuvent pas être enregistrés' : 'Cette demande ne peut pas être envoyée en l’état',
      text: 'Modifiez le trajet ou les horaires : la vérification sera relancée.',
    }
  }
  if (result.status === 'en_conflit') {
    return {
      tone: 'warning',
      title: `En conflit dès ${send}`,
      text: 'La demande sera enregistrée, mais la commune devra régler les points ci-dessous avant de la valider.',
    }
  }
  if (result.status === 'approuve') {
    return {
      tone: 'success',
      title: `Approuvée dès ${send}`,
      text: 'Le créneau du bus vous est réservé ; le chauffeur et le véhicule sont ensuite affectés.',
    }
  }
  return {
    tone: 'info',
    title: 'Examinée par la commune',
    text:
      result.warnings?.length > 0
        ? 'Ces horaires demandent une dérogation : la demande sera soumise à la décision du Collège. Vous serez averti de la décision.'
        : 'La demande sera examinée par la commune et soumise à la décision du Collège. Vous serez averti de la décision.',
  }
}

// Bandeau mis en avant en tête de la vérification
export function DecisionBanner({ result, mode = 'create' }) {
  const { tone, title, text } = decision(result, mode)
  const { box, badge, icon: Icon } = TONES[tone]

  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cx('flex items-start gap-4 rounded-card border p-5', box)}>
      <span aria-hidden="true" className={cx('grid size-11 shrink-0 place-items-center rounded-full', badge)}>
        <Icon className="size-5.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-extrabold tracking-[.13em] text-muted uppercase">Après {mode === 'edit' ? 'l’enregistrement' : 'l’envoi'}</p>
        <p className="mt-0.5 text-lg leading-snug font-bold">{title}</p>
        <p className="mt-1 text-sm">{text}</p>
      </div>
    </div>
  )
}
