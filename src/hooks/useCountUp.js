import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 700

// Nombre qui monte de 0 (ou de la valeur précédente) à `target` en 0,7 s.
// Saut direct à la valeur si l'utilisateur a demandé à réduire les animations.
export function useCountUp(target) {
  const [value, setValue] = useState(0)
  const current = useRef(0)

  useEffect(() => {
    if (target == null) return undefined
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const from = current.current
    const start = performance.now()
    let frame

    function step(now) {
      const progress = reduce ? 1 : Math.min((now - start) / DURATION_MS, 1)
      const next = Math.round(from + (target - from) * (1 - (1 - progress) ** 3))
      current.current = next
      setValue(next)
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return target == null ? null : value
}
