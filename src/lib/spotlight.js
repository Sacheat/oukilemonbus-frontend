// Position du curseur dans l'élément survolé, pour la classe CSS `spotlight` (voir index.css).
// Variables CSS posées directement sur l'élément : aucun nouveau rendu React.
// À brancher sur onPointerMove ; ignoré pour le tactile et le stylet.
export function trackSpotlight(event) {
  if (event.pointerType !== 'mouse') return
  const element = event.currentTarget
  const rect = element.getBoundingClientRect()
  element.style.setProperty('--spot-x', `${event.clientX - rect.left}px`)
  element.style.setProperty('--spot-y', `${event.clientY - rect.top}px`)
}
