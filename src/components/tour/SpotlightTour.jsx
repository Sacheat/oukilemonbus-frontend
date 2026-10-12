import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { findTarget } from '../../lib/tours'
import { Button } from '../ui/Button'

const GAP = 12 // entre l'élément éclairé et la bulle
const PADDING = 6 // autour de l'élément éclairé
const MARGIN = 16 // bord de l'écran
const BUBBLE_WIDTH = 360

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function measureTarget(target) {
  return findTarget(target)?.getBoundingClientRect() ?? null
}

function bringIntoView(target) {
  findTarget(target)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' })
}

// Bulle sous l'élément s'il reste la place, sinon au-dessus ; toujours dans l'écran. Élément disparu entre-temps
// (rect null) : bulle centrée, sans éclairage.
function bubblePosition(rect, bubbleHeight) {
  const width = Math.min(BUBBLE_WIDTH, window.innerWidth - 2 * MARGIN)
  if (!rect) return { top: Math.max(MARGIN, (window.innerHeight - bubbleHeight) / 2), left: (window.innerWidth - width) / 2, width }
  const left = Math.min(Math.max(rect.left, MARGIN), window.innerWidth - width - MARGIN)
  const below = rect.bottom + PADDING + GAP
  const fitsBelow = below + bubbleHeight <= window.innerHeight - MARGIN
  const top = fitsBelow ? below : Math.max(MARGIN, rect.top - PADDING - GAP - bubbleHeight)
  return { top, left, width }
}

// Visite sur les vrais éléments de l'interface : voile sombre, élément éclairé, bulle « Suivant ».
// `steps` : étapes dont la cible était affichée au départ ; une cible disparue entre-temps est sautée.
export function SpotlightTour({ steps, onClose }) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState(() => measureTarget(steps[0].target))
  const [bubbleHeight, setBubbleHeight] = useState(160)
  const bubbleRef = useRef(null)
  const primaryRef = useRef(null)
  const titleId = useId()
  const step = steps[index]
  const isLast = index === steps.length - 1

  // Étape suivante (ou précédente) dont l'élément est encore affiché ; fin de la visite s'il n'y en a plus
  function go(direction) {
    let next = index + direction
    while (next >= 0 && next < steps.length && !findTarget(steps[next].target)) next += direction
    if (next >= steps.length) {
      onClose()
      return
    }
    if (next < 0) return
    bringIntoView(steps[next].target)
    setIndex(next)
    setRect(measureTarget(steps[next].target))
  }

  useEffect(() => {
    bringIntoView(steps[0].target)
  }, [steps])

  // Suit l'élément pendant le défilement et au redimensionnement
  useEffect(() => {
    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setRect(measureTarget(step.target)))
    }
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
    }
  }, [step.target])

  // Focus sur « Suivant » à chaque étape
  useEffect(() => {
    primaryRef.current?.focus()
  }, [index])

  useLayoutEffect(() => {
    setBubbleHeight(bubbleRef.current.offsetHeight)
  }, [index])

  // Échap ferme ; Tab reste dans la bulle
  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const buttons = [...bubbleRef.current.querySelectorAll('button')]
    const first = buttons[0]
    const last = buttons.at(-1)
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const position = bubblePosition(rect, bubbleHeight)

  return createPortal(
    <div className="fixed inset-0 z-50" onKeyDown={handleKeyDown}>
      {/* Voile : bloque les clics sur la page pendant la visite */}
      <div className="absolute inset-0" aria-hidden="true" />
      {rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-card outline-2 outline-accent transition-all duration-200 motion-reduce:transition-none"
        style={{
          top: rect.top - PADDING,
          left: rect.left - PADDING,
          width: rect.width + 2 * PADDING,
          height: rect.height + 2 * PADDING,
          boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.55)',
        }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
      )}
      <div
        ref={bubbleRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute rounded-card border border-line bg-surface p-4 text-ink shadow-lift"
        style={position}
      >
        <p className="text-xs text-muted">
          {index + 1} sur {steps.length}
        </p>
        <h2 id={titleId} className="mt-1 text-base font-bold">
          {step.title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {!isLast && (
            <Button variant="link" onClick={onClose} className="mr-auto px-2">
              Quitter
            </Button>
          )}
          {index > 0 && (
            <Button variant="secondary" onClick={() => go(-1)}>
              Précédent
            </Button>
          )}
          <Button ref={primaryRef} onClick={() => go(1)}>
            {isLast ? 'Terminer' : 'Suivant'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
