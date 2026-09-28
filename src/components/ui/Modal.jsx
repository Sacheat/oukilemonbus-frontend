import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

// Fenêtre modale basée sur <dialog> (focus piégé et touche Échap gérés par le navigateur)
export function Modal({ open, onClose, title, children, footer }) {
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
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-card border border-line bg-surface p-0 text-ink backdrop:bg-black/50"
    >
      {open && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-xl font-bold tracking-tight">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="-mt-2 -mr-2 grid size-11 shrink-0 place-items-center rounded-control text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-4">{children}</div>
          {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}
