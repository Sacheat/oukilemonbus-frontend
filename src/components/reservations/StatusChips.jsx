import { STATUS_CHIPS, STATUS_DOTS } from '../../lib/trips'
import { FilterChips } from '../ui/FilterChips'

// Filtre par statut en pastilles, avec le nombre de trajets de chaque statut (null : en chargement)
export function StatusChips({ value, counts, onChange }) {
  const chips = STATUS_CHIPS.map((chip) => ({
    value: chip.value,
    label: chip.label,
    count: counts?.[chip.value ?? 'tous'] ?? null,
    dot: chip.value ? STATUS_DOTS[chip.value] : null,
  }))
  return <FilterChips label="Statut" chips={chips} value={value} onChange={onChange} />
}
