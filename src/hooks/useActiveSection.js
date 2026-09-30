import { useEffect, useState } from 'react'

// Section visible à l'écran parmi `ids` (éléments de la page), pour mettre en avant l'entrée
// correspondante d'un sommaire : la dernière section dont le haut a passé le tiers de l'écran,
// ou la dernière section une fois en bas de page (elle ne peut pas remonter plus haut).
export function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0])
  const key = ids.join(',')

  useEffect(() => {
    const sectionIds = key.split(',')
    let frame = null

    function update() {
      frame = null
      const elements = sectionIds.map((id) => document.getElementById(id)).filter(Boolean)
      if (elements.length === 0) return
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      if (atBottom) return setActive(elements.at(-1).id)
      const line = window.innerHeight / 3
      const passed = elements.filter((element) => element.getBoundingClientRect().top <= line)
      setActive((passed.at(-1) ?? elements[0]).id)
    }

    // Une mise à jour par image au plus pendant le défilement
    function handleScroll() {
      if (frame === null) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [key])

  return active
}
