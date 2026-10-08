import { QUEUE_GROUPS, QUEUES } from '../../lib/queue'
import { FilterChips } from '../ui/FilterChips'
import { Select } from '../ui/Field'

// Files d'un groupe, dans l'ordre d'affichage
function queuesOf(group) {
  return QUEUES.filter((queue) => queue.group === group.value)
}

// Files de la page Réservations en deux groupes nommés : « À faire » (le travail de l'agent), puis « Suivi »
// (consultation). `value` : file affichée ; `counts` : compteurs par file (undefined pendant le chargement) ;
// `onChange(file)`. Petit écran : une liste déroulante (groupes en optgroup) qui dit toujours la file affichée et
// garde la liste près du haut ; à partir de 640 px : les pastilles.
export function QueueTabs({ value, counts, onChange }) {
  const countText = (queue) => (counts?.[queue.value] == null ? '' : ` (${counts[queue.value]})`)

  return (
    <>
      <Select
        aria-label="File"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="py-2 text-sm font-semibold sm:hidden"
      >
        {QUEUE_GROUPS.map((group) => (
          <optgroup key={group.value} label={group.label}>
            {queuesOf(group).map((queue) => (
              <option key={queue.value} value={queue.value}>
                {queue.label}
                {countText(queue)}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
      <div className="hidden flex-wrap items-start gap-x-6 gap-y-3 sm:flex">
        {QUEUE_GROUPS.map((group) => (
          <div key={group.value} className="grid gap-1.5">
            <p className="text-[11px] font-extrabold tracking-[.12em] text-muted uppercase">{group.label}</p>
            <FilterChips
              label={group.label}
              chips={queuesOf(group).map((queue) => ({
                value: queue.value,
                label: queue.label,
                dot: queue.dot,
                count: counts?.[queue.value] ?? null,
              }))}
              value={value}
              onChange={onChange}
            />
          </div>
        ))}
      </div>
    </>
  )
}
