import { useState } from 'react'
import { cx } from '../../lib/cx'
import { MIN_VISIBLE_SPOTS } from '../../lib/tours'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

// Cartes d'accueil d'un tutoriel. `onClose` à la fin, sur « Passer » ou Échap. « Me montrer l'interface » sur la
// dernière carte si `findSpotlightSteps()` (appelé en y arrivant : la page a eu le temps de se charger) renvoie
// au moins MIN_VISIBLE_SPOTS étapes ; `onSpotlight(étapes)` enchaîne alors sur la visite.
export function WelcomeTour({ cards, onClose, findSpotlightSteps, onSpotlight }) {
  const [index, setIndex] = useState(0)
  const [spotlightSteps, setSpotlightSteps] = useState([])
  const card = cards[index]
  const isLast = index === cards.length - 1
  const Icon = card.icon

  function goTo(next) {
    setIndex(next)
    if (next === cards.length - 1 && findSpotlightSteps) setSpotlightSteps(findSpotlightSteps())
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={card.title}
      footer={
        <>
          {!isLast && (
            <Button variant="link" onClick={onClose} className="mr-auto px-2">
              Passer
            </Button>
          )}
          {index > 0 && (
            <Button variant="secondary" onClick={() => goTo(index - 1)}>
              Précédent
            </Button>
          )}
          {!isLast && <Button onClick={() => goTo(index + 1)}>Suivant</Button>}
          {isLast && spotlightSteps.length >= MIN_VISIBLE_SPOTS && (
            <Button variant="secondary" onClick={() => onSpotlight(spotlightSteps)}>
              Me montrer l’interface
            </Button>
          )}
          {isLast && <Button onClick={onClose}>C’est parti</Button>}
        </>
      }
    >
      <div className="grid gap-5">
        <span className="grid size-14 place-items-center rounded-card bg-info-soft text-info">
          <Icon className="size-7" aria-hidden="true" />
        </span>
        <p className="text-base leading-relaxed text-muted" aria-live="polite">
          {card.text}
        </p>
        <div className="flex items-center gap-3">
          <ol className="flex gap-1.5" aria-label="Progression">
            {cards.map((item, position) => (
              <li
                key={item.title}
                aria-current={position === index ? 'step' : undefined}
                className={cx('h-2 rounded-full transition-all', position === index ? 'w-6 bg-primary' : 'w-2 bg-line-strong')}
              >
                <span className="sr-only">{item.title}</span>
              </li>
            ))}
          </ol>
          <span className="text-xs text-muted">
            {index + 1} sur {cards.length}
          </span>
        </div>
      </div>
    </Modal>
  )
}
