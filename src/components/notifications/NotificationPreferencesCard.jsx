import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { getNotificationPreferences, updateNotificationPreferences } from '../../api/notifications'
import { useAuth } from '../../auth/useAuth'
import { useApi } from '../../hooks/useApi'
import { useForm } from '../../hooks/useForm'
import { categoryLabel, DIGEST_OPTIONS, HOURS, notificationCategories } from '../../lib/notifications'
import { OPT_IN_OPTIONS, optInChoice, optInValue } from '../../lib/weeklyPlanning'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ChoicePills } from '../ui/ChoicePills'
import { Select } from '../ui/Field'
import { ErrorState } from '../ui/ErrorState'
import { Skeleton } from '../ui/Skeleton'
import { Switch } from '../ui/Switch'

function fetchPreferences(signal) {
  return getNotificationPreferences({ signal })
}

// Préférences de notification (carte de /compte, ancre #notifications) :
// catégories du rôle en interrupteurs (application, e-mail), envoi des e-mails en pastilles, heures silencieuses ;
// agents et admins : qui reçoit le planning hebdomadaire (automatique, toujours, jamais)
export function NotificationPreferencesCard() {
  const preferences = useApi(fetchPreferences)
  const location = useLocation()
  const ref = useRef(null)

  // Arrivée depuis « Réglages » de la page des notifications
  useEffect(() => {
    if (location.hash === '#notifications' && preferences.data) ref.current?.scrollIntoView({ block: 'start' })
  }, [location.hash, preferences.data])

  return (
    <Card as="section" id="notifications" ref={ref} aria-labelledby="notifications-title" className="scroll-mt-6">
      <h2 id="notifications-title" className="text-[17px] font-bold">
        Notifications
      </h2>
      {preferences.error ? (
        <ErrorState error={preferences.error} onRetry={preferences.reload} className="mt-4" />
      ) : !preferences.data ? (
        <Skeleton className="mt-4 h-48 rounded-card" />
      ) : (
        <PreferencesForm initial={preferences.data} />
      )}
    </Card>
  )
}

function toFormValues(preferences) {
  return {
    ...preferences,
    quiet_enabled: preferences.quiet_hours_start !== null && preferences.quiet_hours_end !== null,
    quiet_hours_start: preferences.quiet_hours_start === null ? '22' : String(preferences.quiet_hours_start),
    quiet_hours_end: preferences.quiet_hours_end === null ? '7' : String(preferences.quiet_hours_end),
    weekly_planning_choice: optInChoice(preferences.weekly_planning_opt_in),
  }
}

function PreferencesForm({ initial }) {
  const { user } = useAuth()
  const categories = notificationCategories(user)
  const form = useForm(toFormValues(initial))
  const [saved, setSaved] = useState(false)
  const { values } = form

  const receivesWeeklyPlanning = categories.includes('weekly_planning')
  const toPayload = useCallback(
    (current) => ({
      ...(receivesWeeklyPlanning ? { weekly_planning_opt_in: optInValue(current.weekly_planning_choice) } : {}),
      ...Object.fromEntries(
        categories.flatMap((category) => [
          [`notify_${category}_in_app`, Boolean(current[`notify_${category}_in_app`])],
          [`notify_${category}_email`, Boolean(current[`notify_${category}_email`])],
        ]),
      ),
      digest_frequency: current.digest_frequency,
      quiet_hours_start: current.quiet_enabled ? Number(current.quiet_hours_start) : null,
      quiet_hours_end: current.quiet_enabled ? Number(current.quiet_hours_end) : null,
    }),
    [categories, receivesWeeklyPlanning],
  )

  async function handleSubmit(event) {
    event.preventDefault()
    setSaved(false)
    const result = await form.submit((current) => updateNotificationPreferences(toPayload(current)))
    if (result.ok) {
      form.setValues(toFormValues(result.data))
      setSaved(true)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 grid gap-5">
      {saved && <Alert tone="success">Vos préférences de notification ont été enregistrées.</Alert>}
      {form.error && <Alert tone="danger">{form.error}</Alert>}

      <ul className="divide-y divide-line rounded-card border border-line">
        {categories.map((category) => {
          const label = categoryLabel(category, user)
          return (
            <li key={category} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
              <span className="font-semibold">{label}</span>
              <span className="flex flex-wrap gap-x-5">
                <Switch
                  label="Application"
                  aria-label={`${label} : dans l’application`}
                  checked={Boolean(values[`notify_${category}_in_app`])}
                  onChange={form.handle(`notify_${category}_in_app`)}
                />
                <Switch
                  label="E-mail"
                  aria-label={`${label} : par e-mail`}
                  checked={Boolean(values[`notify_${category}_email`])}
                  onChange={form.handle(`notify_${category}_email`)}
                />
              </span>
            </li>
          )
        })}
      </ul>

      {receivesWeeklyPlanning && (
        <ChoicePills
          legend="Planning hebdomadaire : le recevoir"
          options={OPT_IN_OPTIONS}
          value={values.weekly_planning_choice}
          onChange={(value) => form.setValues((current) => ({ ...current, weekly_planning_choice: value }))}
          hint="Automatique : vous le recevez si vous êtes le responsable du planning, ou si aucun responsable n’est désigné. « Toujours » pour le recevoir quand même (remplacement, absence du responsable)."
          error={form.errors.weekly_planning_opt_in}
        />
      )}

      <ChoicePills
        legend="Envoi des e-mails"
        options={DIGEST_OPTIONS}
        value={values.digest_frequency}
        onChange={(value) => form.setValues((current) => ({ ...current, digest_frequency: value }))}
        hint="Les annulations de dernière minute partent toujours tout de suite."
        error={form.errors.digest_frequency}
      />

      <fieldset className="grid gap-2">
        <legend className="text-sm font-bold">Heures silencieuses</legend>
        <Switch
          label="Regrouper les e-mails reçus pendant ces heures"
          checked={values.quiet_enabled}
          onChange={form.handle('quiet_enabled')}
        />
        {values.quiet_enabled && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label className="flex items-center gap-2">
              De
              <Select value={values.quiet_hours_start} onChange={form.handle('quiet_hours_start')} className="w-28">
                {HOURS.map((hour) => (
                  <option key={hour.value} value={hour.value}>
                    {hour.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex items-center gap-2">
              à
              <Select value={values.quiet_hours_end} onChange={form.handle('quiet_hours_end')} className="w-28">
                {HOURS.map((hour) => (
                  <option key={hour.value} value={hour.value}>
                    {hour.label}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        )}
        {(form.errors.quiet_hours_start || form.errors.quiet_hours_end) && (
          <p className="text-xs font-semibold whitespace-pre-line text-danger">
            {form.errors.quiet_hours_start ?? form.errors.quiet_hours_end}
          </p>
        )}
      </fieldset>

      <div>
        <Button type="submit" loading={form.submitting}>
          Enregistrer les préférences
        </Button>
      </div>
    </form>
  )
}
