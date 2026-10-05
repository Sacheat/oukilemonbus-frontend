import { Building2, Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getOrganizationsPage, getOrganizationTypes } from '../../api/organizations'
import { useAuth } from '../../auth/useAuth'
import { OrganizationForm } from '../../components/organizationsAdmin/OrganizationForm'
import { OrganizationPanel } from '../../components/organizationsAdmin/OrganizationPanel'
import { OrganizationRow } from '../../components/organizationsAdmin/OrganizationRow'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Drawer } from '../../components/ui/Drawer'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Field, Input, Select } from '../../components/ui/Field'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { useApi } from '../../hooks/useApi'
import {
  NEW_ORGANIZATION,
  organizationListParams,
  ORGANIZATION_SORTS,
  ORGANIZATION_TYPES,
  readOrganizationSearch,
} from '../../lib/organizationsAdmin'

const SEARCH_DELAY_MS = 300

// Défini hors du composant : fetcher stable (catalogue des types et de leurs règles, chargé une fois)
function fetchTypes(signal) {
  return getOrganizationTypes({ signal })
}

// Organisations (agents et admins) : d'abord l'ensemble, filtré, trié et paginé par le backend (recherche, type,
// bannies, tri par nom, quota ou activité), puis une organisation ouverte dans un panneau (?organisation=id) pour
// travailler dessus, ou « Nouvelle organisation » (?organisation=nouvelle). Tout l'état est dans l'URL.
export function OrganizationsManagementPage() {
  const { can } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = readOrganizationSearch(searchParams)
  const [searchInput, setSearchInput] = useState(search.q)
  const searchTimer = useRef(null)
  const [notice, setNotice] = useState(null)
  const types = useApi(fetchTypes)

  const listKey = JSON.stringify(organizationListParams(search))
  const fetchList = useCallback((signal) => getOrganizationsPage(JSON.parse(listKey), { signal }), [listKey])
  const organizations = useApi(fetchList)
  const list = organizations.loading ? undefined : organizations.data?.data

  function update(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([name, value]) => {
      if (value) next.set(name, value)
      else next.delete(name)
    })
    setSearchParams(next)
  }

  function changeSearch(value) {
    setSearchInput(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => update({ q: value.trim(), page: null }), SEARCH_DELAY_MS)
  }
  useEffect(() => () => clearTimeout(searchTimer.current), [])

  // Lien vers une organisation, en gardant les filtres de la liste
  function openPath(id) {
    const next = new URLSearchParams(searchParams)
    next.set('organisation', String(id))
    return `?${next}`
  }

  function handleChanged(_organization, message) {
    organizations.reload()
    setNotice(message)
  }

  function handleCreated(created) {
    organizations.reload()
    setNotice(`« ${created.name} » créée.`)
    update({ organisation: String(created.id) })
  }

  const opened = search.opened
  const openedName = list?.find((item) => String(item.id) === opened)?.name

  let content
  if (organizations.error && !list) content = <ErrorState error={organizations.error} onRetry={organizations.reload} />
  else if (!list) content = <Loader />
  else if (list.length === 0) content = <EmptyState icon={Building2} title="Aucune organisation ne correspond" />
  else {
    content = (
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <ul className="divide-y divide-line">
          {list.map((organization) => (
            <OrganizationRow key={organization.id} organization={organization} to={openPath(organization.id)} />
          ))}
        </ul>
        <div className="border-t border-line p-4 empty:hidden">
          <Pagination meta={organizations.data.meta} onPageChange={(value) => update({ page: value > 1 ? String(value) : null })} />
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Gestion"
        title="Organisations"
        description="Écoles, associations et services qui réservent le bus : coordonnées, quota, membres et accès au service."
        actions={
          can('organizations.create') && (
            <Button onClick={() => update({ organisation: NEW_ORGANIZATION })}>
              <Plus className="size-4" aria-hidden="true" /> Nouvelle organisation
            </Button>
          )
        }
      />

      {notice && <Alert tone="success">{notice}</Alert>}

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Rechercher" className="min-w-60 flex-1">
          {(props) => (
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <Input
                {...props}
                type="search"
                className="pl-9"
                placeholder="Nom, e-mail ou contact"
                value={searchInput}
                onChange={(event) => changeSearch(event.target.value)}
              />
            </div>
          )}
        </Field>
        <Field label="Type">
          {(props) => (
            <Select {...props} value={search.type} onChange={(event) => update({ type: event.target.value, page: null })}>
              <option value="">Tous les types</option>
              {ORGANIZATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Accès">
          {(props) => (
            <Select {...props} value={search.banned} onChange={(event) => update({ bannies: event.target.value, page: null })}>
              <option value="">Toutes</option>
              <option value="non">Actives</option>
              <option value="oui">Bannies</option>
            </Select>
          )}
        </Field>
        <Field label="Trier par">
          {(props) => (
            <Select {...props} value={search.sort} onChange={(event) => update({ tri: event.target.value === 'nom' ? null : event.target.value, page: null })}>
              {ORGANIZATION_SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      {content}

      <Drawer
        open={Boolean(opened)}
        onClose={() => update({ organisation: null })}
        title={opened === NEW_ORGANIZATION ? 'Nouvelle organisation' : (openedName ?? 'Organisation')}
      >
        <div className="p-5">
          {opened === NEW_ORGANIZATION ? (
            can('organizations.create') ? (
              <OrganizationForm types={types.data ?? []} onSaved={handleCreated} onCancel={() => update({ organisation: null })} />
            ) : (
              <Alert tone="danger">Vous n’avez pas le droit de créer une organisation.</Alert>
            )
          ) : (
            opened && (
              <OrganizationPanel
                key={opened}
                organizationId={opened}
                types={types.data ?? []}
                canBan={can('organizations.ban')}
                onChanged={handleChanged}
              />
            )
          )}
        </div>
      </Drawer>
    </div>
  )
}
