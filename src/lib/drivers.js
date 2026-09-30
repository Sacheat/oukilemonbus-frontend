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

// Nombre de lettres à taper avant de proposer des comptes, et nombre maximum de comptes proposés
export const ACCOUNT_SEARCH_MIN_LENGTH = 2
export const ACCOUNT_SEARCH_LIMIT = 15

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

// « Stéphane » → « stephane » : minuscules et sans accents, pour comparer une recherche
function normalizeText(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// Recherche dans les comptes (le backend ne sait pas chercher dans /users) :
//   si moins de 2 lettres → aucun résultat
//   sinon → comptes dont le prénom, le nom ou l'email contient chaque mot tapé ; les 15 premiers
// Chaque mot est cherché séparément : « ponzo steph » trouve « Stéphane Ponzo ».
export function searchAccounts(accountList, query) {
  if (query.trim().length < ACCOUNT_SEARCH_MIN_LENGTH) return { results: [], total: 0 }
  const words = normalizeText(query.trim()).split(/\s+/)

  const matches = accountList.filter((account) => {
    const searchable = normalizeText(`${account.first_name} ${account.last_name} ${account.email}`)
    return words.every((word) => searchable.includes(word))
  })
  return { results: matches.slice(0, ACCOUNT_SEARCH_LIMIT), total: matches.length }
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
