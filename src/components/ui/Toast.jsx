import { CircleCheck, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cx } from '../../lib/cx'

// Message de succès temporaire, en bas de l'écran : il ne décale pas la page et disparaît après `duration` ms
// (le délai est suspendu tant que la souris est dessus ou que le focus y est). `action` : { label, onClick },
// par exemple « Revoir » ; un clic sur l'action ferme aussi le message. Changer `key` relance le délai.
// `top` : en haut de l'écran, pour ne rien cacher en bas (Ma journée : barre « Aide » et « Annuler cet appui »).
export function Toast({ message, action, onClose, duration = 5000, top = false }) {
  const [paused, setPaused] = useState(false)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (paused) return undefined
    const timer = setTimeout(() => closeRef.current(), duration)
    return () => clearTimeout(timer)
  }, [paused, duration])

  return (
    <div
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cx(
        'fixed inset-x-4 z-40 mx-auto flex max-w-md items-center gap-3 rounded-card border border-line bg-surface py-2 pr-2 pl-4 text-sm shadow-lift sm:inset-x-auto sm:right-6',
        top ? 'top-4 sm:top-6' : 'bottom-4 sm:bottom-6',
      )}
    >
      <CircleCheck className="size-5 shrink-0 text-success" aria-hidden="true" />
      <p className="min-w-0 flex-1 py-1.5">{message}</p>
      {action && (
        <button
          type="button"
          onClick={() => {
            action.onClick()
            onClose()
          }}
          className="min-h-11 shrink-0 rounded-control px-3 font-semibold text-link hover:bg-surface-muted"
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer le message"
        className="grid size-11 shrink-0 place-items-center rounded-control text-muted hover:bg-surface-muted hover:text-ink"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
