import { Css, Each, EachIf, Events, Html, If, Inheritances, Slot, Wely } from '@/libs/types'
// import { convertHtml } from '@/utils'

export const wely = <T, D, P>({
  name,
  className,
  dependencies,
  inheritances,
  data,
  html,
  css,
  slot,
  events
}: Wely<T, D, P>) =>
  new WelyClass({
    name,
    className,
    dependencies,
    inheritances,
    data,
    html,
    css,
    slot,
    events
  })

export class WelyClass<T, D, P> {
  readonly #name: string = ''
  readonly #class: string = ''
  readonly #dependencies: WelyClass<T, D, P>[] = []
  readonly #inheritances: Inheritances<D, P> = []
  readonly #data: D = <D>{}
  readonly #html: Html<string | Each<T> | EachIf<T> | If, D, P>[] = []
  readonly #css: Css<D, P> = []
  readonly #slot: Slot<D, P>[] = []
  readonly #events: Events<D, P> = []

  #inheritedSet: Set<WelyClass<T, D, P>> = new Set()
  #props: P = <P>{}

  constructor({
    name,
    className,
    dependencies,
    inheritances,
    data,
    html,
    css,
    slot,
    events
  }: Wely<T, D, P>) {
    this.#name = name

    if (className) this.#class = className

    if (dependencies)
      this.#dependencies = Array.isArray(dependencies) ? [...dependencies] : [dependencies]

    if (inheritances && inheritances.length > 0) this.#inheritances = [...inheritances]

    if (data) this.#data = { ...data() }

    this.#html = [html]

    if (css && css.length > 0) this.#css = [...css]
    if (slot) this.#slot = [slot]
    if (events && events.length > 0) this.#events = [...events]
  }

  #generate(): Generator<number> {
    const generate = function* (): Generator<number> {
      let n = 1

      while (true) {
        yield n
        n++
      }
    }

    return generate()
  }

  #convertName(): string {
    const upperCase = new RegExp(/[A-Z]/g)
    const body = this.#name.slice(1)

    const name =
      this.#name.slice(0, 1).toLowerCase() +
      (upperCase.test(body) ? body.replace(upperCase, str => `-${str.toLowerCase()}`) : body)

    return `w-${name}`
  }

  #define(): void {
    const name = this.#convertName()

    if (!customElements.get(name))
      customElements.define(
        name,
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
          }
        }
      )
  }

  overwrite(partialData: () => Partial<D>): WelyClass<T, D, P> {
    return new WelyClass<T, D, P>({
      name: `${this.#name}${this.#generate().next().value + 1}`,
      className: this.#class,
      dependencies: this.#dependencies,
      inheritances: this.#inheritances,
      data: () => <D>{ ...this.#data, ...partialData() },
      html: this.#html[0],
      css: this.#css,
      slot: this.#slot.length > 0 ? this.#slot[0] : undefined,
      events: this.#events
    })
  }

  render(): HTMLElement {
    this.#define()
    const wely = document.createElement(this.#convertName())

    if (this.#class !== '')
      wely.setAttribute(
        'class',
        this.#class.split(' ').reduce((prev, current) => `${prev} ${current}`, this.#name)
      )
    else wely.classList.add(this.#name)

    wely.shadowRoot!.textContent = (<any>this.#data).message

    return wely
  }

  mount(base: HTMLElement): void {
    base.appendChild(this.render())
  }
}
