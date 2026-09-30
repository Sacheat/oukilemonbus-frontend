import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { getNotificationPreferences, updateNotificationPreferences } from '../../api/notifications'
import { useAuth } from '../../auth/useAuth'
import { useApi } from '../../hooks/useApi'
import { useForm } from '../../hooks/useForm'
import { categoryLabel, DIGEST_OPTIONS, HOURS, notificationCategories } from '../../lib/notifications'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Checkbox, Field, Select } from '../ui/Field'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'

function fetchPreferences(signal) {
  return getNotificationPreferences({ signal })
}

// Préférences de notification (carte de /compte, ancre #notifications) :
// catégories du rôle dans l'application et par e-mail, résumé et heures silencieuses
export function NotificationPreferencesCard() {
  const preferences = useApi(fetchPreferences)
  const location = useLocation()
  const ref = useRef(null)

  // Arrivée depuis « Réglages » de la page des notifications
  useEffect(() => {
    if (location.hash === '#notifications' && preferences.data) ref.current?.scrollIntoView({ block: 'start' })
  }, [location.hash, preferences.data])

  return (
    <Card as="section" id="notifications" ref={ref} aria-labelledby="notifications-title" className="scroll-mt-4 lg:col-span-2">
      <h2 id="notifications-title" className="text-[17px] font-bold">
        Notifications
      </h2>
      {preferences.error ? (
        <ErrorState error={preferences.error} onRetry={preferences.reload} className="mt-4" />
      ) : !preferences.data ? (
        <Loader />
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
  }
}

function PreferencesForm({ initial }) {
  const { user } = useAuth()
  const categories = notificationCategories(user)
  const form = useForm(toFormValues(initial))
  const [saved, setSaved] = useState(false)
  const { values } = form

  const toPayload = useCallback(
    (current) => ({
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
    [categories],
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[26rem] text-sm">
          <caption className="sr-only">Notifications par catégorie</caption>
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th scope="col" className="py-2 pr-3 font-semibold">
                Catégorie
              </th>
              <th scope="col" className="w-36 px-3 py-2 text-center font-semibold">
                Dans l’application
              </th>
              <th scope="col" className="w-36 px-3 py-2 text-center font-semibold">
                Par e-mail
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const label = categoryLabel(category, user)
              return (
                <tr key={category} className="border-b border-line last:border-0">
                  <th scope="row" className="py-1 pr-3 text-left font-semibold">
                    {label}
                  </th>
                  <td className="px-3 py-1 text-center">
                    <Checkbox
                      aria-label={`${label} : dans l’application`}
                      checked={Boolean(values[`notify_${category}_in_app`])}
                      onChange={form.handle(`notify_${category}_in_app`)}
                      className="justify-center"
                    />
                  </td>
                  <td className="px-3 py-1 text-center">
                    <Checkbox
                      aria-label={`${label} : par e-mail`}
                      checked={Boolean(values[`notify_${category}_email`])}
                      onChange={form.handle(`notify_${category}_email`)}
                      className="justify-center"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4.5 sm:grid-cols-2">
        <Field
          label="Envoi des e-mails"
          hint="Les annulations de dernière minute partent toujours tout de suite."
          error={form.errors.digest_frequency}
        >
          {(props) => (
            <Select {...props} value={values.digest_frequency} onChange={form.handle('digest_frequency')}>
              {DIGEST_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-bold">Heures silencieuses</legend>
          <Checkbox
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
      </div>

      <div>
        <Button type="submit" loading={form.submitting}>
          Enregistrer les préférences
        </Button>
      </div>
    </form>
  )
}
