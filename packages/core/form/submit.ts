import type { Form } from '../types'
import { focusFirstInvalidControl } from './validation'

export const submitForm =
  (event: Event): Form.Submit =>
  <T extends Form.Values>({ shouldReportValidity = true }: Form.Submit.Options = {}): T | null => {
    event.preventDefault()

    const { currentTarget }: Event = event
    if (!(currentTarget instanceof HTMLFormElement)) return null

    if (!currentTarget[shouldReportValidity ? 'reportValidity' : 'checkValidity']()) {
      if (!shouldReportValidity) focusFirstInvalidControl(currentTarget)
      return null
    }

    const values: Form.Values = {}
    for (const [key, value] of new FormData(currentTarget)) {
      const current: Form.Values[string] | undefined = values[key]

      /** @remarks Prevents data loss for repeated form field names. */
      if (current === undefined) values[key] = value
      else if (Array.isArray(current)) current.push(value)
      else values[key] = [current, value]
    }

    return values as T
  }
