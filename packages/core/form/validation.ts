const formAnchors: WeakMap<Element, HTMLElement> = new WeakMap()

export const focusFirstInvalidControl = (form: HTMLFormElement): void => {
  for (const element of form.elements) {
    const { validity }: { validity?: ValidityState } = element as { validity?: ValidityState }

    if (validity && !validity.valid) {
      const target: Element | HTMLElement = formAnchors.get(element) ?? element
      if (target instanceof HTMLElement) target.focus()
      return
    }
  }
}

export const setFormAnchor = ({
  element,
  anchor
}: {
  element: HTMLElement
  anchor: Element | null
}): void => {
  anchor instanceof HTMLElement ? formAnchors.set(element, anchor) : formAnchors.delete(element)
}
