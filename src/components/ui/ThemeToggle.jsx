import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { cx } from '../../lib/cx'

const OPTIONS = [
  { value: 'system', label: 'Thème du système', icon: Monitor },
  { value: 'light', label: 'Thème clair', icon: Sun },
  { value: 'dark', label: 'Thème sombre', icon: Moon },
]

// Un clic passe au thème suivant : système → clair → sombre
export function ThemeToggle({ className }) {
  const { preference, setPreference } = useTheme()
  const index = OPTIONS.findIndex((option) => option.value === preference)
  const current = OPTIONS[index]
  const next = OPTIONS[(index + 1) % OPTIONS.length]
  const Icon = current.icon

  return (
    <button
      type="button"
      onClick={() => setPreference(next.value)}
      title={`${current.label} (cliquer pour : ${next.label.toLowerCase()})`}
      aria-label={`${current.label}. Passer au ${next.label.toLowerCase()}`}
      className={cx('grid size-11 place-items-center rounded-control hover:bg-black/5 dark:hover:bg-white/10', className)}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  )
}
