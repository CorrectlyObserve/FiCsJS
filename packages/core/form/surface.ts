import { typedEntries } from '../helpers'
import { Form } from '../types'

const formSurface: { [K in keyof Form.Surface]: Form.Surface[K] } = {
  form: null,
  validity: {} as ValidityState,
  validationMessage: '',
  willValidate: false
}

export const formInternals: WeakMap<HTMLElement, ElementInternals> = new WeakMap()

export const defineFormSurface = (prototype: object): void => {
  for (const [key, fallback] of typedEntries(formSurface))
    Object.defineProperty(prototype, key, {
      get(this: HTMLElement): unknown {
        return formInternals.get(this)?.[key] ?? fallback
      }
    })

  for (const key of ['checkValidity', 'reportValidity'] as (keyof Form.Methods)[])
    Object.defineProperty(prototype, key, {
      value: function (this: HTMLElement): boolean {
        /** @remarks Defaults to `true` to prevent controls outside a form from blocking submission. */
        return formInternals.get(this)?.[key]() ?? true
      }
    })
}
