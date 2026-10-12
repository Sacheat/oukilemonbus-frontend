import { Plus, Search, UserCog } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getUserWithRoles } from '../../api/users'
import { useAuth } from '../../auth/useAuth'
import { UserDrawerContent } from '../../components/users/UserDrawerContent'
import { UserRow } from '../../components/users/UserRow'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Drawer } from '../../components/ui/Drawer'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Input, Select } from '../../components/ui/Field'
import { FilterChips } from '../../components/ui/FilterChips'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { useApi } from '../../hooks/useApi'
import { useRoleCounts } from '../../hooks/useRoleCounts'
import { useUsers } from '../../hooks/useUsers'
import { cx } from '../../lib/cx'
import { findUser, isSelf, NEW_USER, readUsersSearch, ROLE_FILTERS, STATUS_FILTERS, usersApiParams } from '../../lib/users'

const SEARCH_DELAY_MS = 300

// Administration des comptes (admin) : liste paginée filtrée par le backend (recherche ?q=, ?role=, ?statut=),
// compte ouvert dans un panneau (?utilisateur=id), création (?utilisateur=nouveau). Après la création ou
// l'enregistrement des informations ou des rôles : le panneau reste ouvert sur le compte relu, avec un message, et la
// liste se recharge derrière. Désactiver, réactiver ou anonymiser : panneau fermé et message en haut de la page.
// Compteurs des pastilles : `meta.role_counts` de la liste (repli : un appel par rôle si le backend ne le renvoie pas).
export function UsersPage() {
  const { user: currentUser, can, refresh } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { search, role, status, page, openedParam } = readUsersSearch(searchParams)
  const [notice, setNotice] = useState(null)
  const [panelNotice, setPanelNotice] = useState(null) // { id, message } : affiché dans le panneau de ce compte
  const [searchInput, setSearchInput] = useState(search)
  const searchTimer = useRef(null)

  // Paramètres de la liste sous forme de texte : ne recharger que si l'un d'eux change
  const requestKey = JSON.stringify(usersApiParams({ search, role, status, page }))
  const users = useUsers(requestKey)
  const userList = users.data?.data // undefined tant que rien n'est reçu
  // Compteurs des pastilles (même recherche et même statut, sans le rôle) : renvoyés avec la liste ; repli sur un appel
  // par rôle seulement si la liste reçue ne les contient pas
  const listCounts = users.data?.meta?.role_counts
  const fallbackKey = users.data && !listCounts ? JSON.stringify(usersApiParams({ search, role: null, status, page: 1 })) : null
  const roleCounts = useRoleCounts(fallbackKey)
  const counts = listCounts ?? roleCounts.data

  // Compte ouvert : toujours relu par son id (rôles, organisations et profil chauffeur, absents de la liste) ;
  // en attendant, la ligne de la liste s'affiche si le compte y est (lien direct ou autre page : chargement)
  const openedId = openedParam && openedParam !== NEW_USER ? openedParam : null
  const fetchOpened = useCallback(
    (signal) => (openedId ? getUserWithRoles(openedId, { signal }) : Promise.resolve(null)),
    [openedId],
  )
  const fetched = useApi(fetchOpened)
  const fetchedUser = fetched.data && String(fetched.data.id) === openedId ? fetched.data : null
  const openedUser = fetchedUser ?? findUser(userList, openedParam) ?? null
  const opened = { user: openedUser, loading: fetched.loading, error: openedUser ? null : fetched.error, reload: fetched.reload }

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

  function openDrawer(userParam) {
    setNotice(null)
    updateSearch({ utilisateur: userParam })
  }

  function closeDrawer() {
    setPanelNotice(null)
    updateSearch({ utilisateur: null })
  }

  // Après un succès : panneau fermé, liste rechargée, message en haut de la page.
  // Son propre compte : la session est relue (nom, rôles et permissions du menu).
  function finishAction(message, savedUser) {
    closeDrawer()
    users.reload()
    roleCounts.reload()
    setNotice(message)
    if (savedUser && isSelf(savedUser, currentUser)) refresh()
  }

  function handleCreated(createdUser) {
    setPanelNotice({
      id: createdUser.id,
      message: `Compte créé : ${createdUser.full_name}. Transmettez le mot de passe provisoire à la personne, puis ajustez ses rôles ci-dessous.`,
    })
    users.reload()
    roleCounts.reload()
    updateSearch({ utilisateur: String(createdUser.id) })
  }

  // Informations ou rôles enregistrés : le panneau reste ouvert sur le compte relu (organisations et profil chauffeur
  // compris), la liste et les compteurs se rechargent derrière
  function handleSaved(savedUser, message) {
    setPanelNotice({ id: savedUser.id, message })
    fetched.reload()
    users.reload()
    roleCounts.reload()
    if (isSelf(savedUser, currentUser)) refresh()
  }

  function handleStatusChanged(updatedUser) {
    finishAction(
      updatedUser.active ? `Compte réactivé : ${updatedUser.full_name}.` : `Compte désactivé : ${updatedUser.full_name}.`,
      updatedUser,
    )
  }

  // Anonymisation : le nom a déjà disparu du compte renvoyé, le message reprend celui affiché avant
  function handleAnonymized(anonymizedUser) {
    finishAction(`Compte de ${openedUser?.full_name ?? anonymizedUser.full_name} anonymisé.`, anonymizedUser)
  }

  const filtered = Boolean(search || role || status)
  const roleChips = ROLE_FILTERS.map((filter) => ({ ...filter, count: counts ? (counts[filter.value ?? 'all'] ?? null) : null }))
  const addButton = can('users.create') && (
    <Button onClick={() => openDrawer(NEW_USER)}>
      <Plus className="size-4" aria-hidden="true" />
      Créer un compte
    </Button>
  )

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        description="Rôles, informations et accès des comptes."
        actions={addButton}
      />

      {notice && <Alert tone="success">{notice}</Alert>}

      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Rechercher un compte"
              placeholder="Prénom, nom ou email"
              value={searchInput}
              onChange={(event) => changeSearch(event.target.value)}
              className="py-2 pl-9 text-sm"
            />
          </div>
          <Select
            aria-label="Statut des comptes"
            value={status ?? ''}
            onChange={(event) => updateSearch({ statut: event.target.value, page: null })}
            className="py-2 text-sm sm:max-w-xs"
          >
            {STATUS_FILTERS.map((filter) => (
              <option key={filter.label} value={filter.value ?? ''}>
                {filter.label}
              </option>
            ))}
          </Select>
        </div>
        <Select
          aria-label="Rôle"
          value={role ?? ''}
          onChange={(event) => updateSearch({ role: event.target.value, page: null })}
          className="py-2 text-sm font-semibold sm:hidden"
        >
          {roleChips.map((chip) => (
            <option key={chip.label} value={chip.value ?? ''}>
              {chip.label}
              {chip.count == null ? '' : ` (${chip.count})`}
            </option>
          ))}
        </Select>
        <div className="hidden sm:block">
          <FilterChips label="Rôle" chips={roleChips} value={role} onChange={(value) => updateSearch({ role: value, page: null })} />
        </div>
      </div>

      {users.error ? (
        <ErrorState error={users.error} onRetry={users.reload} />
      ) : !userList ? (
        <Loader />
      ) : userList.length === 0 ? (
        <EmptyState icon={UserCog} title={filtered ? 'Aucun compte trouvé' : 'Aucun compte'}>
          {filtered ? 'Modifiez la recherche ou les filtres.' : 'Les comptes apparaissent ici après leur inscription.'}
        </EmptyState>
      ) : (
        <>
          <p className="text-sm text-muted" aria-live="polite">
            {users.data.meta.total} {users.data.meta.total > 1 ? 'comptes' : 'compte'}
          </p>
          <ul
            aria-busy={users.loading}
            className={cx(
              'divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-soft transition-opacity',
              users.loading && 'opacity-60',
            )}
          >
            {userList.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                selected={String(user.id) === openedParam}
                onOpen={() => openDrawer(String(user.id))}
              />
            ))}
          </ul>
          <Pagination meta={users.data.meta} onPageChange={(nextPage) => updateSearch({ page: nextPage > 1 ? String(nextPage) : null })} />
        </>
      )}

      <Drawer
        open={Boolean(openedParam)}
        onClose={closeDrawer}
        title={openedParam === NEW_USER ? 'Créer un compte' : (openedUser?.full_name ?? 'Compte')}
      >
        <div className="grid gap-6 p-5">
          <UserDrawerContent
            userParam={openedParam}
            opened={opened}
            self={Boolean(openedUser) && isSelf(openedUser, currentUser)}
            notice={panelNotice && openedUser && panelNotice.id === openedUser.id ? panelNotice.message : null}
            canSeeDrivers={can('drivers.update')}
            canSeeOrganizations={can('organizations.update')}
            canSendResetLink={can('users.send-password-reset')}
            canUseTools={can('tooling.access')}
            canExportData={can('users.export-data')}
            canAnonymize={can('users.anonymize')}
            onCreated={handleCreated}
            onInfoSaved={(savedUser) => handleSaved(savedUser, 'Informations enregistrées.')}
            onRolesSaved={(savedUser) => handleSaved(savedUser, 'Rôles enregistrés.')}
            onStatusChanged={handleStatusChanged}
            onAnonymized={handleAnonymized}
          />
        </div>
      </Drawer>
    </div>
  )
}
