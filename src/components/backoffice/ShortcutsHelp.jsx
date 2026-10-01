import { useState } from 'react'
import { cx } from '../../lib/cx'
import { DEFAULT_SETTINGS, eventKey, keyLabel, RESERVED_KEYS, SHORTCUT_ACTIONS } from '../../lib/shortcuts'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Switch } from '../ui/Switch'

// Aide des raccourcis clavier (touche « ? ») : liste des actions et de leurs touches, modifiables une à une
// (« Modifier » puis la nouvelle touche), passage automatique à la suivante, retour aux réglages par défaut.
// `settings` : { keys, autoNext } ; `onChange(settings)` enregistre les nouveaux réglages.
export function ShortcutsHelp({ open, onClose, settings, onChange }) {
  return (
    <Modal open={open} onClose={onClose} title="Raccourcis clavier">
      {open && <ShortcutsEditor settings={settings} onChange={onChange} onClose={onClose} />}
    </Modal>
  )
}

function ShortcutsEditor({ settings, onChange, onClose }) {
  const [capturing, setCapturing] = useState(null) // action dont on attend la nouvelle touche
  const [error, setError] = useState(null)

  function handleCapture(event, actionId) {
    if (event.key === 'Escape') {
      // Annule la saisie sans fermer la fenêtre
      event.preventDefault()
      setCapturing(null)
      return
    }
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return
    event.preventDefault()
    const key = eventKey(event)
    if (RESERVED_KEYS.includes(key) || key.length !== 1) {
      setError(`La touche ${keyLabel(key)} est réservée : choisissez une lettre, un chiffre ou un signe.`)
      return
    }
    const owner = SHORTCUT_ACTIONS.find((action) => action.id !== actionId && settings.keys[action.id] === key)
    if (owner) {
      setError(`La touche ${keyLabel(key)} est déjà utilisée pour « ${owner.label} ».`)
      return
    }
    setError(null)
    setCapturing(null)
    onChange({ ...settings, keys: { ...settings.keys, [actionId]: key } })
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted">
        Utilisables dans la file des réservations, en dehors des champs de saisie. Les flèches ↑ et ↓ marchent toujours.
      </p>
      <ul className="divide-y divide-line rounded-card border border-line">
        {SHORTCUT_ACTIONS.map((action) => (
          <li key={action.id} className="flex items-center justify-between gap-3 px-3.5 py-1.5 text-sm">
            <span>{action.label}</span>
            <span className="flex items-center gap-2">
              <kbd className="min-w-7 rounded border border-line-strong bg-surface-muted px-1.5 text-center font-sans font-bold">
                {keyLabel(action.key === null ? action.extra : settings.keys[action.id])}
              </kbd>
              {action.key === null ? (
                <span className="min-h-11 px-3 leading-11 text-muted">Fixe</span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setCapturing(capturing === action.id ? null : action.id)
                  }}
                  onKeyDown={capturing === action.id ? (event) => handleCapture(event, action.id) : undefined}
                  aria-label={
                    capturing === action.id ? `Appuyez sur la nouvelle touche pour « ${action.label} »` : `Modifier la touche : ${action.label}`
                  }
                  className={cx(
                    'min-h-11 rounded-control px-3 font-semibold',
                    capturing === action.id ? 'bg-primary text-on-primary' : 'text-link hover:bg-soft',
                  )}
                >
                  {capturing === action.id ? 'Appuyez sur une touche…' : 'Modifier'}
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <Switch
        label="Après une action, passer à la réservation suivante"
        checked={settings.autoNext}
        onChange={(event) => onChange({ ...settings, autoNext: event.target.checked })}
      />
      <div className="flex flex-wrap justify-between gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setError(null)
            setCapturing(null)
            onChange(DEFAULT_SETTINGS)
          }}
        >
          Réglages par défaut
        </Button>
        <Button onClick={onClose}>Fermer</Button>
      </div>
    </div>
  )
}
