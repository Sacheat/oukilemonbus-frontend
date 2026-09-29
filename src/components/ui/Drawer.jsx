import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

// Panneau latéral qui glisse depuis la droite, basé sur <dialog> comme Modal
// (focus piégé et touche Échap gérés par le navigateur ; clic sur le fond pour fermer)
export function Drawer({ open, onClose, title, children }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose() // clic sur le fond (hors du contenu)
      }}
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-lg border-l border-line bg-bg p-0 text-ink shadow-2xl backdrop:bg-black/45 open:animate-drawer-in motion-reduce:open:animate-none"
    >
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-line bg-surface px-5 py-2">
            <h2 id={titleId} className="text-base font-bold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="grid size-11 place-items-center rounded-control text-muted hover:bg-surface-muted hover:text-ink"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      )}
    </dialog>
  )
}
