import { NEW_DRIVER } from '../../lib/drivers'
import { getErrorMessage } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { DetailList } from '../ui/DetailList'
import { Loader } from '../ui/Loader'
import { DriverCreateForm } from './DriverCreateForm'
import { DriverForm } from './DriverForm'
import { DriverStatusControl } from './DriverStatusControl'
import { LicenceBadge } from './LicenceBadge'

// Contenu du panneau latéral selon ?chauffeur= :
// ajout, compte + permis + activité, chargement ou chauffeur introuvable.
// `opened` : { item, loading, error } de useOpenedItem (page affichée, sinon GET /drivers/{id})
export function DriverDrawerContent({ driverParam, opened, canCreate, onSaved, onStatusChanged }) {
  if (driverParam === NEW_DRIVER) {
    if (!canCreate) return <Alert tone="danger">Vous n'avez pas le droit d'ajouter un chauffeur.</Alert>
    return <DriverCreateForm onSaved={onSaved} />
  }

  if (opened.loading) return <Loader />

  const openedDriver = opened.item
  if (!openedDriver) {
    if (opened.error && opened.error.response?.status !== 404) {
      return <Alert tone="danger">{getErrorMessage(opened.error)}</Alert>
    }
    return <Alert tone="warning">Ce chauffeur est introuvable.</Alert>
  }

  return (
    <>
      <section>
        <h3 className="font-bold">Compte</h3>
        <DetailList
          items={[
            ['Nom', openedDriver.user?.full_name],
            ['Email', openedDriver.user?.email],
            openedDriver.user?.phone && ['Téléphone', openedDriver.user.phone],
          ]}
        />
      </section>

      <section className="grid gap-3 border-t border-line pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold">Permis</h3>
          <LicenceBadge driver={openedDriver} />
        </div>
        <DriverForm key={openedDriver.id} driver={openedDriver} onSaved={onSaved} />
      </section>

      <DriverStatusControl driver={openedDriver} onChanged={onStatusChanged} />
    </>
  )
}
