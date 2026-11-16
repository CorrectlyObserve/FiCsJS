import type { Form } from '../types'
import { focusFirstInvalidControl } from './validation'

export const submitForm =
  (event: Event): Form.Submit.Fn =>
  <T extends Form.Values>(
    action: (values: T) => void | Promise<void>,
    { shouldReportValidity = true }: Form.Submit.Options = {}
  ): void => {
    event.preventDefault()

    const { currentTarget }: Event = event
    if (!(currentTarget instanceof HTMLFormElement)) return

    if (!currentTarget[shouldReportValidity ? 'reportValidity' : 'checkValidity']()) {
      if (!shouldReportValidity) focusFirstInvalidControl(currentTarget)
      return
    }

    const values: Form.Values = {}
    for (const [key, value] of new FormData(currentTarget)) {
      const current: Form.Values[string] | undefined = values[key]

      /** @remarks Prevents data loss for repeated form field names. */
      if (current === undefined) values[key] = value
      else if (Array.isArray(current)) current.push(value)
      else values[key] = [current, value]
    }

    action(values as T)
  }
