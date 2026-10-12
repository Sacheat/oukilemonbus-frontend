import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { getPrivacyPolicy } from '../api/auth'
import { useAuth } from '../auth/useAuth'
import { Alert } from '../components/ui/Alert'
import { Card } from '../components/ui/Card'
import { useApi } from '../hooks/useApi'
import { PRIVACY_CONTACT, RETENTION_ROWS } from '../lib/privacy'

function fetchPolicy(signal) {
  return getPrivacyPolicy({ signal })
}

const SECTION = 'grid gap-2'
const TITLE = 'text-lg font-bold'
const TEXT = 'text-sm leading-relaxed text-muted'

// Politique de confidentialité (art. 13 RGPD), publique : lien du formulaire d'inscription et du bandeau « à lire ».
// Texte rédigé d'après docs/privacy.md et docs/sous-traitants.md du backend ; la version en vigueur vient de
// GET /privacy-policy. BROUILLON : à faire valider par la commune et son DPO (durées, contact, sous-traitants).
export function PrivacyPolicyPage() {
  const { user } = useAuth()
  const policy = useApi(fetchPolicy)

  return (
    <Card as="article" className="grid gap-7 p-6 sm:p-9">
      <header className="grid gap-2">
        <p className="text-xs font-bold tracking-wide text-link uppercase">OuKiLéMonBus · bus communal de Dinant</p>
        <h1 className="text-[28px] font-extrabold">Politique de confidentialité</h1>
        <p className={TEXT}>
          {policy.data?.version ? `Version du ${policy.data.version}. ` : ''}
          Cette page explique quelles données personnelles l’application utilise, pourquoi, combien de temps, et
          comment exercer vos droits.
        </p>
        <Alert tone="warning">
          Texte provisoire, rédigé avec l’équipe technique : il doit être relu et validé par la commune et son délégué à
          la protection des données (DPO) avant la mise en service.
        </Alert>
      </header>

      <section className={SECTION}>
        <h2 className={TITLE}>Qui est responsable ?</h2>
        <p className={TEXT}>
          La commune de Dinant (service Jeunesse) est responsable des données traitées pour la réservation du bus
          communal. Pour toute question : {PRIVACY_CONTACT}.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={TITLE}>Pourquoi et sur quelle base ?</h2>
        <p className={TEXT}>
          L’application sert à réserver le bus communal, à organiser les trajets et le travail du chauffeur, à préparer
          les décisions du Collège et à répondre aux contrôles (SPF Mobilité). Ces traitements reposent sur la mission
          de service public de la commune (règlement de mise à disposition du bus du 1er avril 2019) : ce n’est pas un
          consentement, et rien n’est bloqué si vous ne relisez pas cette page. Lire la politique sert seulement à vous
          informer.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={TITLE}>Quelles données ?</h2>
        <ul className={`${TEXT} list-disc pl-5`}>
          <li>Votre compte : prénom, nom, adresse e-mail, téléphone (facultatif), mot de passe chiffré, dernière activité.</li>
          <li>Vos organisations et votre rôle (professeur, responsable…), vos demandes d’adhésion et leurs justificatifs.</li>
          <li>
            Vos réservations : dates, lieux, nombre de passagers, motif ; la liste nominative des passagers si vous la
            joignez (carnet de bord).
          </li>
          <li>
            Pour les chauffeurs : permis, missions, comptes rendus, indisponibilités, et la position du téléphone à chaque
            étape d’un trajet ou demande d’aide.
          </li>
          <li>Des journaux techniques : accès aux documents (adresse IP, navigateur), historique des actions.</li>
        </ul>
        <p className={TEXT}>
          Dans les champs libres (motif, remarque), n’écrivez pas d’information médicale ou personnelle : un motif court
          suffit.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={TITLE}>Qui les voit ?</h2>
        <p className={TEXT}>
          Les agents et administrateurs de la commune ; les membres de votre organisation pour ses réservations ; le
          chauffeur pour ses trajets. Certains services techniques reçoivent le strict nécessaire : calcul des
          itinéraires (OpenRouteService, adresses seulement), envoi des e-mails (Brevo), vérification des mots de passe
          compromis (uniquement un fragment chiffré, jamais le mot de passe), hébergement et sauvegardes chiffrées.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={TITLE}>Combien de temps ?</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pr-4 font-bold">
                  Donnée
                </th>
                <th scope="col" className="py-2 font-bold">
                  Conservation
                </th>
              </tr>
            </thead>
            <tbody>
              {RETENTION_ROWS.map(([data, duration]) => (
                <tr key={data} className="border-b border-line align-top">
                  <td className="py-2 pr-4">{data}</td>
                  <td className="py-2 text-muted">{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={TEXT}>
          Les réservations, comptes rendus et documents officiels suivent les règles d’archivage de la commune. Une
          donnée effacée disparaît des sauvegardes chiffrées à leur expiration.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={TITLE}>Vos droits</h2>
        <ul className={`${TEXT} list-disc pl-5`}>
          <li>Accès et portabilité : vous pouvez obtenir une copie de vos données (demandez-la à la commune).</li>
          <li>Rectification : modifiez vos informations dans « Mon compte », ou demandez-le au service.</li>
          <li>
            Effacement : la commune peut anonymiser votre compte, sauf si une réservation ou une mission à venir en
            dépend encore.
          </li>
          <li>
            Réclamation : vous pouvez vous adresser à l’Autorité de protection des données (rue de la Presse 35, 1000
            Bruxelles, autoriteprotectiondonnees.be).
          </li>
        </ul>
        <p className={TEXT}>Pour exercer un droit : {PRIVACY_CONTACT}.</p>
      </section>

      <footer className="flex flex-wrap gap-4 border-t border-line pt-5 text-sm">
        <Link to={user ? '/' : '/connexion'} className="inline-flex items-center gap-1 font-bold text-link hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" /> {user ? 'Retour à l’application' : 'Retour à la connexion'}
        </Link>
        {!user && (
          <Link to="/inscription" className="font-bold text-link hover:underline">
            Créer un compte
          </Link>
        )}
      </footer>
    </Card>
  )
}
