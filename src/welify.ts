import { appendChild, convertType, toKebabCase } from './libs/utils'
import { Each, EachIf, If, Welify } from './libs/welifyTypes'
import { WelyElement } from './libs/welyElement'

/*
技術仕様
1. 引数のオブジェクトのDataの中をデータバインディング
2. emitとpropsの血縁関係に依存した状態管理
3. 多言語翻訳（今後の話）
4. 状態管理（今後の話）
5. ルーティング（今後の話）
6. PWA（今後の話）
7. svgによるグラフ作成（今後の話）
8. Vueでいうwatch的な機能（今後の話）
*/

export const welify = <T, U>({
  name,
  descendants,
  className,
  data,
  html,
  css,
  slot,
  events,
  delegatedEvents
}: Welify<T, U>): WelyElement<U> => {
  if (name === '' || name === undefined)
    throw new Error('The name argument is not defined...')
  else {
    const kebabName = toKebabCase(name)
    const welyName = `w-${kebabName}`

    customElements.define(
      welyName,
      class extends WelyElement<U> {
        constructor() {
          super()
          this.name = kebabName

          if (descendants) this.descendants = [...descendants]
          if (data) this.data = { ...data }

          const converter = convertType(html, { data: { ...this.data } } || {})

          if (typeof (<string>converter) === 'string')
            this.html = <string>converter
          else {
            const ifHtml = <If>converter
            const eachHtml = <Each<T>>converter
            const eachIfHtml = <EachIf<T>>converter

            if ('contents' in eachIfHtml && 'branches' in eachIfHtml) {
              this.isEach = true

              let html: string = ''

              html += eachIfHtml.contents
                .map((content, index) => {
                  for (const branch of eachIfHtml.branches)
                    if (branch.judge(content))
                      return branch.render(content, index)

                  if (eachIfHtml.fallback)
                    return eachIfHtml.fallback(content, index)

                  return ''
                })
                .join('')

              this.html = html
            } else if ('contents' in eachHtml) {
              this.isEach = true

              this.html = eachHtml.contents.reduce(
                (prev: string, self: T, index: number): string =>
                  prev + eachHtml.render(self, index),
                ''
              )
            } else if ('branches' in ifHtml) {
              let html: string = ''

              for (const branch of ifHtml.branches)
                if (branch.judge) {
                  html = branch.render
                  break
                }

              if (html === '' && ifHtml.fallback) html = ifHtml.fallback

              this.html = html
            }
          }

          this.classes.push(kebabName)

          if (className)
            for (const localName of className.split(' '))
              this.classes.push(toKebabCase(localName))

          if (css !== undefined)
            this.css = typeof css === 'string' ? css : [...css]

          if (slot) this.slotContent = Array.isArray(slot) ? [...slot] : slot

          this.events = { ...events }

          if (delegatedEvents && delegatedEvents.length > 0)
            this.delegatedEvents = [...delegatedEvents]
        }
      }
    )

    return new (customElements.get(welyName) as { new (): WelyElement<U> })()
  }
}

const wely1 = welify({
  name: 'wely',
  data: {
    count: 1,
    message: 'Hello',
    color: 'red',
    back: 'black',
    _childMessage: 'Child hello'
  },
  html: ({ data }) =>
    `<p class="hello">${data.message}</p><div><p class="hello">${data._childMessage}</p></div>`,
  css: [
    {
      selector: 'p',
      style: ({ data: { color } }) => ({
        color: color,
        fontSize: '14px'
      })
    },
    {
      selector: 'div',
      style: ({ data: { back } }) => ({
        background: back
      })
    }
  ],
  events: {
    click: ({ data: { count } }) => console.log(count++)
  },
  delegatedEvents: [
    {
      selector: 'div .hello',
      click: ({ data: { message } }) => console.log(message)
    }
  ]
})

const wely2 = welify({
  name: 'Wely2',
  data: {
    numbers: [1, 2, 3],
    color: 'green'
  },
  html: ({ data: { numbers } }) => ({
    contents: numbers as number[],
    render: (arg: number, index) => `<p class="class-${index}">${arg * 2}</p>`
  }),
  events: {
    click: ({ data: { numbers } }) => console.log(numbers)
  },
  delegatedEvents: [
    {
      selector: 'p',
      click: ({ data: { numbers } }, _, index) => console.log(numbers[index])
    }
  ]
})

const wely3 = welify({
  name: 'wely3',
  data: {
    number: 100,
    text: 'AA',
    count: 1,
    message: 'Hello',
    color: 'red',
    back: 'black',
    _childMessage: 'Child hello'
  },
  html: ({ data: { number } }) => ({
    branches: [
      {
        judge: number >= 100,
        render: wely1.outerHTML
      },
      {
        judge: number < 100,
        render: `<p>bbb</p>`
      }
    ],
    fallback: `<slot></slot><p>${number}</p>`
  }),
  slot: [wely1, wely2],
  delegatedEvents: [
    {
      selector: 'slot',
      click: ({ data: { number, text } }, e, index) =>
        console.log(number, text, e, index)
    }
  ]
})

const wely4 = welify({
  name: 'Wely4',
  data: {
    numbers: [1, 2, 3]
  },
  html: ({ data: { numbers } }) => ({
    contents: numbers as number[],
    branches: [
      {
        judge: (arg: number) => arg === 100,
        render: (arg: number, index) =>
          `<p class="class-${index}">${arg * 2}</p>`
      },
      {
        judge: (arg: number) => typeof arg !== 'number',
        render: (arg: number, index) => `<p class="class-${index}">${arg}</p>`
      }
    ],
    fallback: (arg: number) => `<p class="class-z">${arg * 10}</p>`
  }),
  delegatedEvents: [
    {
      selector: '.class-z',
      click: ({ data: { numbers } }, e, index) => console.log(numbers[index], e)
    }
  ]
})

export const mountWely = (parent: string, elements: string | HTMLElement[]) => {
  appendChild(<HTMLElement>document.getElementById(parent), elements)

  console.log(wely1.closest(`#${wely3.welyId}`), 'aaa')
}

mountWely('app', [wely3, wely4])
