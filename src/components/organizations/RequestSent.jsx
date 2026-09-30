import { ArrowRight, CircleCheck, TriangleAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from '../ui/Button'
import { RequestItem } from './RequestItem'

// Écran de fin d'une demande d'adhésion ou de création : bilan (`notice` = { tone, message } de
// sendProofAndNotice : avertissement si le justificatif n'a pas pu être joint), carte de la demande
// avec son suivi, puis retour à « Mes organisations »
export function RequestSent({ kind, request, notice }) {
  const headingRef = useRef(null)
  const Icon = notice.tone === 'warning' ? TriangleAlert : CircleCheck

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="grid max-w-2xl gap-5">
      <div className="flex items-start gap-3">
        <Icon
          className={`mt-0.5 size-7 shrink-0 ${notice.tone === 'warning' ? 'text-warning' : 'text-success'}`}
          aria-hidden="true"
        />
        <div>
          <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold outline-none">
            Votre demande a bien été envoyée
          </h2>
          <p className="mt-0.5 text-muted">{notice.message}</p>
        </div>
      </div>

      <ul>
        <RequestItem kind={kind} request={request} showProof={false} />
      </ul>

      <div className="flex flex-wrap gap-2">
        <Button to="/espace/organisations">
          Mes organisations <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
