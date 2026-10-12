// Politique de confidentialité : contenu repris des durées du backend (docs/privacy.md, config/privacy.php,
// config/uploads.php). À faire valider par la commune et son DPO ; à tenir à jour si une durée change.

export const PRIVACY_CONTACT = 'service Jeunesse de la commune de Dinant, service.jeunesse@dinant.be'

// [donnée, durée] — valeurs par défaut du backend
export const RETENTION_ROWS = [
  ['Compte sans activité', '3 ans après la dernière connexion (prévenu par e-mail 30 jours avant), puis anonymisé'],
  ['Position du téléphone du chauffeur (étapes, demandes d’aide)', '90 jours'],
  ['Liste nominative des passagers', 'jusqu’au 31 décembre de la 3e année qui suit le trajet'],
  ['Journal d’accès aux documents (adresse IP, navigateur)', '1 an'],
  ['Historique des actions (audit)', '3 ans'],
  ['Justificatif non rattaché à une demande', '7 jours'],
  ['Sauvegardes chiffrées', '14 jours'],
]

// Consigne sous les champs libres (docs/privacy.md du backend) : l'API ne peut pas détecter une donnée de santé
export const SENSITIVE_TEXT_HINT = 'Pas d’information médicale ni personnelle : un motif court suffit (ex. « absent », « congé »).'
// Version courte, pour un champ dont l'aide donne déjà ses propres exemples
export const SENSITIVE_TEXT_SHORT = 'Pas d’information médicale ni personnelle.'

// Aide d'un champ libre : son aide suivie de la consigne courte, sinon la consigne complète
export function withSensitiveHint(hint) {
  return hint ? `${hint} ${SENSITIVE_TEXT_SHORT}` : SENSITIVE_TEXT_HINT
}

// Nom du fichier de l'export, comme celui du backend
export function personalDataFileName(userId) {
  return `donnees-personnelles-${userId}.json`
}

// Compte anonymisé (RGPD) : irréversible, plus aucune modification possible
export function isAnonymized(user) {
  return Boolean(user?.anonymized_at)
}

// Le compte doit (re)lire la politique : version en vigueur jamais lue, ou nouvelle version
export function mustReadPrivacyPolicy(user) {
  return Boolean(user?.privacy_policy?.must_accept)
}
