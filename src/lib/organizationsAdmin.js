import { ORGANIZATION_TYPE_LABELS } from './labels'

// Page Organisations de /gestion : d'abord l'ensemble (liste filtrée et triée par le backend), puis une organisation
// ouverte dans un panneau (?organisation=id|nouvelle).

export const NEW_ORGANIZATION = 'nouvelle'

export const ORGANIZATION_TYPES = Object.entries(ORGANIZATION_TYPE_LABELS).map(([value, label]) => ({ value, label }))

// Tri de la liste (?tri=) : nom par défaut
export const ORGANIZATION_SORTS = [
  { value: 'nom', label: 'Nom' },
  { value: 'quota', label: 'Plus proches du quota' },
  { value: 'activite', label: 'Plus de réservations à venir' },
]

// Lit l'URL : ?q=, ?type=, ?bannies=oui|non, ?tri=, ?page=, ?organisation=
export function readOrganizationSearch(searchParams) {
  const type = searchParams.get('type')
  const banned = searchParams.get('bannies')
  const sort = searchParams.get('tri')
  return {
    q: searchParams.get('q') ?? '',
    type: ORGANIZATION_TYPE_LABELS[type] ? type : '',
    banned: banned === 'oui' || banned === 'non' ? banned : '',
    sort: ORGANIZATION_SORTS.some((option) => option.value === sort) ? sort : 'nom',
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    opened: searchParams.get('organisation'),
  }
}

// Paramètres de GET /organizations
export function organizationListParams({ q, type, banned, sort, page }) {
  return {
    ...(q.trim() && { q: q.trim() }),
    ...(type && { type }),
    ...(banned && { banned: banned === 'oui' ? 1 : 0 }),
    ...(sort !== 'nom' && { sort }),
    page,
  }
}

// Ce que les règles d'un type impliquent, en phrases courtes (règles venues du backend : config/reservations.php)
export function rulesSentences(rules, quotaLimit = null) {
  if (!rules) return []
  return [
    rules.priority ? 'Prioritaire sur le planning' : null,
    rules.auto_approve ? 'Réservations approuvées automatiquement' : 'Réservations validées par un agent',
    rules.council_required ? 'Décision du Collège communal requise' : null,
    rules.quota_exempt ? 'Sans quota annuel' : `Quota annuel${quotaLimit != null ? ` : ${quotaLimit} réservation${quotaLimit > 1 ? 's' : ''}` : ''}`,
    rules.recurrences_allowed ? 'Réservations récurrentes possibles' : null,
  ].filter(Boolean)
}

// Effet d'un changement de type, pour la confirmation : règles qui changent (« avant → après »)
export function typeChangeEffects(fromRules, toRules) {
  if (!fromRules || !toRules) return []
  const effects = []
  if (fromRules.council_required !== toRules.council_required) {
    effects.push(toRules.council_required ? 'ses demandes passeront par le Collège communal' : 'ses demandes ne passeront plus par le Collège')
  }
  if (fromRules.quota_exempt !== toRules.quota_exempt) {
    effects.push(toRules.quota_exempt ? 'elle n’aura plus de quota annuel' : 'elle aura un quota annuel de réservations')
  }
  if (fromRules.auto_approve !== toRules.auto_approve) {
    effects.push(toRules.auto_approve ? 'ses réservations seront approuvées automatiquement' : 'ses réservations devront être validées par un agent')
  }
  if (fromRules.priority !== toRules.priority) {
    effects.push(toRules.priority ? 'elle deviendra prioritaire sur le planning' : 'elle ne sera plus prioritaire')
  }
  if (fromRules.recurrences_allowed !== toRules.recurrences_allowed) {
    effects.push(toRules.recurrences_allowed ? 'elle pourra créer des réservations récurrentes' : 'elle ne pourra plus créer de réservations récurrentes')
  }
  return effects
}

// Valeurs du formulaire (texte pour les champs, quota en texte pour le NumberStepper)
export function organizationFormValues(organization) {
  return {
    name: organization?.name ?? '',
    type: organization?.type ?? '',
    official_email: organization?.official_email ?? '',
    phone_contact: organization?.phone_contact ?? '',
    name_contact: organization?.name_contact ?? '',
    annual_quota: String(organization?.annual_quota ?? 5),
  }
}

// Corps envoyé : création → tout ; modification → seulement les champs changés (null si vidé)
export function organizationPayload(values, location, organization = null) {
  const body = {
    name: values.name.trim(),
    type: values.type,
    official_email: values.official_email.trim() || null,
    phone_contact: values.phone_contact.trim() || null,
    name_contact: values.name_contact.trim() || null,
    location_id: location?.id ?? null,
    annual_quota: Number(values.annual_quota),
  }
  if (!organization) return body
  const current = { ...organizationPayload(organizationFormValues(organization), organization.location), location_id: organization.location_id ?? null }
  return Object.fromEntries(Object.entries(body).filter(([field, value]) => value !== current[field]))
}

// Lien vers la file des réservations filtrée sur l'organisation (page Réservations : ?organisation=, ses files en
// pastilles restent disponibles : à traiter, confirmées…)
export function organizationReservationsPath(organizationId) {
  return `/gestion/reservations?organisation=${organizationId}`
}
