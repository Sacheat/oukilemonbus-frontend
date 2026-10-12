import { formatDate } from './dates'

// Calendrier de la commune (onglet « Calendrier » de Communes). Les jours fériés légaux belges sont calculés par le
// backend pour toute année ; la commune ajoute deux sortes de périodes :
//   fermeture          → aucune réservation possible ces jours-là
//   vacances_scolaires → les séries des écoles sautent ces jours (une réservation ponctuelle reste possible)
export const CALENDAR_KINDS = [
  {
    value: 'fermeture',
    label: 'Fermetures de la commune',
    singular: 'Fermeture',
    help: 'Aucune réservation possible ces jours-là (pont, fête locale…). Les jours fériés légaux sont déjà comptés.',
    empty: 'Aucune fermeture propre à la commune cette année.',
  },
  {
    value: 'vacances_scolaires',
    label: 'Vacances scolaires',
    singular: 'Vacances scolaires',
    help: 'Les séries récurrentes des écoles sautent ces jours. Une réservation ponctuelle reste possible.',
    empty: 'Aucune période de vacances scolaires encodée pour cette année.',
  },
]

export function calendarKind(value) {
  return CALENDAR_KINDS.find((kind) => kind.value === value) ?? CALENDAR_KINDS[0]
}

// Années proposées : l'année en cours et les deux suivantes (les réservations se prennent jusqu'à un an à l'avance)
export function calendarYears(currentYear) {
  return [currentYear, currentYear + 1, currentYear + 2]
}

const DAY = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }

// « le lundi 20 septembre 2027 » ou « du lundi 20 décembre 2027 au vendredi 31 décembre 2027 »
export function periodText({ start_date: start, end_date: end }) {
  if (start === end) return `le ${formatDate(start, DAY)}`
  return `du ${formatDate(start, DAY)} au ${formatDate(end, DAY)}`
}

// La période touche-t-elle cette année ? (même règle que la liste du backend : des vacances de Noël comptent sur les deux)
export function touchesYear({ start_date: start, end_date: end }, year) {
  return start <= `${year}-12-31` && end >= `${year}-01-01`
}

// Périodes d'une sorte, dans l'ordre du calendrier
export function periodsOfKind(periods, kind) {
  return periods.filter((period) => period.kind === kind).sort((a, b) => a.start_date.localeCompare(b.start_date))
}

// Valeurs du formulaire : nouvelle période (un seul jour par défaut) ou période existante
export function periodFormValues(period, kind) {
  return {
    kind: period?.kind ?? kind,
    label: period?.label ?? '',
    start_date: period?.start_date ?? '',
    end_date: period?.end_date ?? '',
  }
}

// Champs envoyés : tout pour un ajout, seulement les champs modifiés pour une modification. Fin vide = même jour.
export function periodPayload(period, values) {
  const next = {
    kind: values.kind,
    label: values.label.trim(),
    start_date: values.start_date,
    end_date: values.end_date || values.start_date,
  }
  if (!period) return next
  return Object.fromEntries(Object.entries(next).filter(([field, value]) => value !== period[field]))
}
