import type { DataProps, Form } from '../types'
import { setFormAnchor } from './validation'

const warnedForms: WeakSet<HTMLFormElement> = new WeakSet()

export const syncForm = <D extends object, P>({
  element,
  anchor,
  options,
  dataProps,
  internals
}: {
  options: Form.Options<D, P>
  dataProps: DataProps.Payload<D, P, true>
  internals: ElementInternals
} & Parameters<typeof setFormAnchor>[0]): void => {
  setFormAnchor({ element, anchor })

  const value: ReturnType<typeof options.value> = options.value(dataProps)
  internals.setFormValue(value)

  if (!options.validate) return

  const { form }: ElementInternals = internals
  if (form && !form.noValidate && !warnedForms.has(form)) {
    warnedForms.add(form)
    console.warn(
      `Native validation takes precedence, as the <form> around <${element.localName}> is missing "novalidate"...`
    )
  }

  const customError: string | null = options.validate(dataProps)

  internals.ariaInvalid = customError === null ? 'false' : 'true'
  internals.setValidity(
    customError === null ? {} : { customError: true },
    customError ?? undefined,
    anchor instanceof HTMLElement ? anchor : undefined
  )
}
