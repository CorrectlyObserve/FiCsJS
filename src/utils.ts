export const convertHtml = (
  templates: TemplateStringsArray,
  ...elements: (HTMLElement | unknown)[]
): DocumentFragment => {
  let html: string = ''

  const generate = function* (): Generator<number> {
    let n = 1

    while (true) {
      yield n
      n++
    }
  }
  const generatedId = generate().next().value

  templates.forEach((template, index) => {
    html += template

    if (index !== templates.length - 1)
      html +=
        elements[index] instanceof HTMLElement
          ? `<w-var id="placeholder-id${generatedId}-${index}"></w-var>`
          : elements[index]
  })

  const dom = new DOMParser().parseFromString(html, 'text/html').body
  const fragment = new DocumentFragment()

  while (dom.firstChild) fragment.appendChild(dom.firstChild)

  elements.forEach((element, index) => {
    if (element instanceof HTMLElement) {
      const placeholder = fragment.getElementById(`placeholder-id${generatedId}-${index}`)

      if (placeholder) placeholder.replaceWith(element)
      else throw Error(`The element with an applicable id is not found...`)
    }
  })

  return fragment
}

export const toKebabCase = (str: string): string => {
  const newStr = str.slice(1)
  let body = newStr
  const upperCase = new RegExp(/[A-Z]/g)

  if (upperCase.test(newStr)) body = newStr.replace(upperCase, val => `-${val.toLowerCase()}`)

  return str[0].toLowerCase() + body
}
