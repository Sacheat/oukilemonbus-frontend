import { getUsers } from '../api/users'
import { toApiDate } from './dates'

// Valeur de ?chauffeur= pour ouvrir le formulaire d'ajout
export const NEW_DRIVER = 'nouveau'

// Délai à partir duquel on prévient que le permis expire bientôt
export const LICENCE_WARNING_DAYS = 30

// Chauffeur de la liste dont l'id correspond à ?chauffeur= (l'URL donne une chaîne)
export function findDriver(driverList, driverParam) {
  return driverList?.find((driver) => String(driver.id) === driverParam)
}

// Chauffeurs actifs d'abord ; le tri est stable, l'ordre du backend est gardé dans chaque groupe
export function sortActiveFirst(driverList) {
  return [...driverList].sort((first, second) => Number(second.is_active) - Number(first.is_active))
}

function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// Date minimale du champ d'expiration : le backend exige une date après aujourd'hui
export function tomorrowApiDate(today = new Date()) {
  return toApiDate(addDays(today, 1))
}

// État du permis. Les dates "AAAA-MM-JJ" se comparent directement comme des chaînes.
//   si expiration <= aujourd'hui          → 'expired'
//   sinon si expiration <= aujourd'hui+30 → 'expiring'
//   sinon                                 → 'valid'
export function getLicenceStatus(driver, today = new Date()) {
  const expiryDate = driver.licence_expiry_date
  if (expiryDate <= toApiDate(today)) return 'expired'
  if (expiryDate <= toApiDate(addDays(today, LICENCE_WARNING_DAYS))) return 'expiring'
  return 'valid'
}

// Nombre de lettres à taper avant de chercher, nombre maximum de comptes proposés,
// et nombre maximum de pages lues pour remplir la liste
export const ACCOUNT_SEARCH_MIN_LENGTH = 2
export const ACCOUNT_SEARCH_LIMIT = 15
const ACCOUNT_SEARCH_MAX_PAGES = 3

// Comptes qui peuvent devenir chauffeurs : tout compte actif sans profil chauffeur, quel que soit son rôle
// (un agent peut aussi conduire une camionnette qu'il loue). Triés par nom de famille puis prénom.
export function getEligibleAccounts(userList, driverList) {
  const driverUserIds = new Set(driverList.map((driver) => driver.user_id))
  return userList
    .filter((user) => user.active && !driverUserIds.has(user.id))
    .sort(
      (first, second) =>
        first.last_name.localeCompare(second.last_name, 'fr') || first.first_name.localeCompare(second.first_name, 'fr'),
    )
}

// Recherche des comptes proposables, côté backend (GET /users?search=, 15 comptes par page).
// Le backend renvoie aussi des comptes inactifs ou déjà chauffeurs : on les retire (getEligibleAccounts).
// Une page peut donc donner moins de 15 propositions ; on lit la suivante :
//   tant qu'on a moins de 15 propositions ET qu'il reste des pages ET qu'on en a lu moins de 3 → page suivante
// `hasMore` : d'autres comptes pourraient correspondre (plus de 15 trouvés, ou pages non lues).
export async function searchEligibleAccounts(query, driverList, { signal } = {}) {
  const foundAccounts = []
  let page = 1
  let lastPage
  do {
    const result = await getUsers({ search: query, page }, { signal })
    foundAccounts.push(...getEligibleAccounts(result.data, driverList))
    lastPage = result.meta.last_page
    page += 1
  } while (foundAccounts.length < ACCOUNT_SEARCH_LIMIT && page <= lastPage && page <= ACCOUNT_SEARCH_MAX_PAGES)

  const sortedAccounts = getEligibleAccounts(foundAccounts, driverList) // tri par nom sur l'ensemble des pages
  return {
    accounts: sortedAccounts.slice(0, ACCOUNT_SEARCH_LIMIT),
    hasMore: sortedAccounts.length > ACCOUNT_SEARCH_LIMIT || page <= lastPage,
  }
}

// Valeurs de départ du formulaire : vides pour un ajout, celles du chauffeur pour une modification
export function driverFormValues(driver) {
  return {
    user_id: '',
    licence_number: driver?.licence_number ?? '',
    licence_expiry_date: driver?.licence_expiry_date ?? '',
  }
}

// Champs du permis modifiés par rapport au chauffeur (le PATCH accepte des champs partiels).
// Utile si le permis est déjà expiré : changer seulement le numéro ne renvoie pas l'ancienne date.
export function changedLicenceFields(driver, values) {
  const changes = {}
  if (values.licence_number !== driver.licence_number) changes.licence_number = values.licence_number
  if (values.licence_expiry_date !== driver.licence_expiry_date) changes.licence_expiry_date = values.licence_expiry_date
  return changes
}
