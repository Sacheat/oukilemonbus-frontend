import { FilePlus2, FileText, Search } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getDocument } from '../../api/documents'
import { useAuth } from '../../auth/useAuth'
import { DocumentDrawerContent } from '../../components/documents/admin/DocumentDrawerContent'
import { GenerateRouteSheetModal } from '../../components/documents/admin/GenerateRouteSheetModal'
import { DocumentAdminRow } from '../../components/documents/admin/DocumentAdminRow'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Drawer } from '../../components/ui/Drawer'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Field, Input } from '../../components/ui/Field'
import { FilterChips } from '../../components/ui/FilterChips'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { useApi } from '../../hooks/useApi'
import { useDocumentCounts, useDocuments } from '../../hooks/useDocuments'
import { DOCUMENT_TYPE_LABELS } from '../../lib/labels'
import { groupByMonth } from '../../lib/documents'
import {
  activePeriod,
  ADMIN_DOCUMENT_CHIPS,
  documentsApiParams,
  documentsCountParams,
  documentsPeriodProblem,
  periodShortcuts,
  readDocumentsSearch,
  routeSheetNotice,
} from '../../lib/documentsAdmin'

const SEARCH_DELAY_MS = 300

// Documents officiels (agent et admin) : liste paginée filtrée par le backend (type en pastilles ?type=, recherche ?q=,
// période ?du= & ?au=), document ouvert dans un panneau (?document=id), génération de feuilles de route (fenêtre).
// Les justificatifs n'y figurent pas. Après une génération : liste rechargée et message en haut de la page.
export function DocumentsPage() {
  const { can } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { search, type, from, to, page, openedId } = readDocumentsSearch(searchParams)
  const [notice, setNotice] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [searchInput, setSearchInput] = useState(search)
  const [customPeriod, setCustomPeriod] = useState(false) // « Autre période » choisi, dates pas encore saisies
  const searchTimer = useRef(null)
  const periodChoice = activePeriod({ from, to, custom: customPeriod })
  const canGenerate = can('documents.generate')

  const periodProblem = documentsPeriodProblem({ from, to })
  // Période ignorée tant que le début dépasse la fin
  const period = periodProblem ? { from: null, to: null } : { from, to }
  // Paramètres de la liste sous forme de texte : ne recharger que si l'un d'eux change
  const requestKey = JSON.stringify(documentsApiParams({ search, type, ...period, page }))
  const documents = useDocuments(requestKey)
  // Compteurs des pastilles : même recherche et même période, sans le type ni la page
  const counts = useDocumentCounts(JSON.stringify(documentsCountParams({ search, ...period })))
  const documentList = documents.data?.data // undefined tant que rien n'est reçu
  // `meta` absent tant que le backend ne pagine pas : on compte alors la liste reçue
  const total = documents.data?.meta?.total ?? documentList?.length

  // Document ouvert : toujours relu par son id (avec sa réservation et son auteur)
  const fetchOpened = useCallback((signal) => (openedId ? getDocument(openedId, { signal }) : Promise.resolve(null)), [openedId])
  const fetched = useApi(fetchOpened)
  const fetchedDocument = fetched.data && String(fetched.data.id) === openedId ? fetched.data : null
  const listed = documentList?.find((doc) => String(doc.id) === openedId) ?? null
  const opened = { document: fetchedDocument ?? listed, loading: fetched.loading, error: listed ? null : fetched.error, reload: fetched.reload }

  function updateSearch(changes) {
    const next = new URLSearchParams(searchParams)
    for (const [name, value] of Object.entries(changes)) {
      if (value) next.set(name, value)
      else next.delete(name)
    }
    setSearchParams(next)
  }

  // Recherche : l'URL suit la saisie 300 ms après la dernière frappe ; retour à la première page
  function changeSearch(value) {
    setSearchInput(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => updateSearch({ q: value.trim(), page: null }), SEARCH_DELAY_MS)
  }
  useEffect(() => () => clearTimeout(searchTimer.current), [])

  // Raccourci : dates posées dans l'URL ; « Autre période » : champs libres ; sinon dates retirées
  function choosePeriod(value) {
    const shortcut = periodShortcuts().find((item) => item.value === value)
    setCustomPeriod(value === 'autre')
    updateSearch({ du: shortcut?.from ?? null, au: shortcut?.to ?? null, page: null })
  }

  function reloadAll() {
    documents.reload()
    counts.reload()
  }

  function handleGenerated(document) {
    setGenerating(false)
    reloadAll()
    setNotice(routeSheetNotice(document))
    updateSearch({ document: String(document.id) })
  }

  function handleRegenerated() {
    reloadAll()
    fetched.reload()
  }

  const filtered = Boolean(search || type || from || to)
  const generateButton = canGenerate && (
    <Button
      onClick={() => {
        setNotice(null)
        setGenerating(true)
      }}
    >
      <FilePlus2 className="size-4" aria-hidden="true" />
      Générer une feuille de route
    </Button>
  )

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Gestion"
        title="Documents"
        description="Délibérations du Collège, feuilles de route, plannings et attestations."
        actions={generateButton}
      />

      {notice && <Alert tone="success">{notice}</Alert>}

      <div className="grid gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Rechercher un document"
              placeholder="Nom du fichier, motif ou numéro"
              value={searchInput}
              onChange={(event) => changeSearch(event.target.value)}
              className="py-2 pl-9 text-sm"
            />
          </div>
        </div>
        <FilterChips
          label="Période de création"
          chips={[
            { value: null, label: 'Toutes les dates' },
            ...periodShortcuts().map(({ value, label }) => ({ value, label })),
            { value: 'autre', label: 'Autre période' },
          ]}
          value={periodChoice}
          onChange={choosePeriod}
        />
        {periodChoice === 'autre' && (
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Du" className="font-semibold">
              {(props) => (
                <Input {...props} type="date" max={to ?? undefined} value={from ?? ''} onChange={(event) => updateSearch({ du: event.target.value, page: null })} className="py-2 text-sm" />
              )}
            </Field>
            <Field label="Au" className="font-semibold">
              {(props) => (
                <Input {...props} type="date" min={from ?? undefined} value={to ?? ''} onChange={(event) => updateSearch({ au: event.target.value, page: null })} className="py-2 text-sm" />
              )}
            </Field>
          </div>
        )}
        {periodProblem && <Alert tone="warning">{periodProblem}</Alert>}
        <FilterChips
          label="Type de document"
          chips={ADMIN_DOCUMENT_CHIPS.map((chip) => ({ ...chip, count: counts.data ? counts.data[chip.value ?? 'all'] : null }))}
          value={type}
          onChange={(value) => updateSearch({ type: value, page: null })}
        />
      </div>

      {documents.error ? (
        <ErrorState error={documents.error} onRetry={documents.reload} />
      ) : !documentList ? (
        <Loader />
      ) : documentList.length === 0 ? (
        <EmptyState icon={FileText} title={filtered ? 'Aucun document trouvé' : 'Aucun document'}>
          {filtered ? 'Modifiez la recherche ou les filtres.' : 'Les documents générés par l’application apparaîtront ici.'}
        </EmptyState>
      ) : (
        <>
          <p className="text-sm text-muted" aria-live="polite">
            {total} {total > 1 ? 'documents' : 'document'}
          </p>
          <div aria-busy={documents.loading} className="grid gap-6">
            {groupByMonth(documentList).map((group) => (
              <section key={group.key} aria-labelledby={`mois-${group.key}`}>
                <h2 id={`mois-${group.key}`} className="mb-2.5 text-sm font-extrabold tracking-[.1em] text-muted uppercase">
                  {group.label} <span className="font-semibold tracking-normal normal-case">· {group.items.length}</span>
                </h2>
                <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-soft">
                  {group.items.map((doc) => (
                    <DocumentAdminRow
                      key={doc.id}
                      document={doc}
                      selected={String(doc.id) === openedId}
                      onOpen={() => {
                        setNotice(null)
                        updateSearch({ document: String(doc.id) })
                      }}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <Pagination meta={documents.data.meta} onPageChange={(nextPage) => updateSearch({ page: nextPage > 1 ? String(nextPage) : null })} />
        </>
      )}

      <Drawer
        open={Boolean(openedId)}
        onClose={() => updateSearch({ document: null })}
        title={opened.document ? (DOCUMENT_TYPE_LABELS[opened.document.document_type] ?? 'Document') : 'Document'}
      >
        <div className="grid gap-6 p-5">
          {openedId && <DocumentDrawerContent opened={opened} canGenerate={canGenerate} onRegenerated={handleRegenerated} />}
        </div>
      </Drawer>

      <GenerateRouteSheetModal open={generating} onClose={() => setGenerating(false)} onGenerated={handleGenerated} />
    </div>
  )
}
