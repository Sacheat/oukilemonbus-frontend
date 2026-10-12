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

// Le compte doit (re)lire la politique : version en vigueur jamais lue, ou nouvelle version
export function mustReadPrivacyPolicy(user) {
  return Boolean(user?.privacy_policy?.must_accept)
}
