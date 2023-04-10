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
  className,
  data,
  html,
  css,
  slot,
  events,
  delegatedEvents
}: Welify<T, U>): string => {
  if (name === '' || name === undefined)
    throw new Error('The name argument is not defined...')
  else {
    const welyName = `w-${toKebabCase(name)}`

    customElements.define(
      welyName,
      class extends WelyElement<U> {
        constructor() {
          super()
          this.name = name

          if (data) this.data = { ...data }

          const converter = convertType(html, this.data || {})

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

          this.classes.push(toKebabCase(name))

          if (className)
            for (const localName of className.split(' '))
              this.classes.push(toKebabCase(localName))

          if (css !== undefined)
            this.css = typeof css === 'string' ? css : [...css]

          this.slotContent = slot
          this.events = { ...events }

          if (delegatedEvents && delegatedEvents.length > 0)
            this.delegatedEvents = [...delegatedEvents]
        }
      }
    )

    return `<${welyName}></${welyName}>`
  }
}

export const mountWely = (parent: string, element: string): void =>
  appendChild(<HTMLElement>document.getElementById(parent), element)

const wely1 = welify({
  name: 'wely',
  data: {
    count: 1,
    message: 'Hello',
    color: 'red',
    back: 'black'
  },
  html: `<p class="hello">Hello</p><div><p class="hello">Child hello</p></div>`,
  css: [
    {
      selector: 'p',
      style: ({ color }) => ({
        color: color,
        fontSize: '14px'
      })
    },
    {
      selector: 'div',
      style: ({ back }) => ({
        background: back
      })
    }
  ],
  events: {
    click: ({ count }: { count: number }) => console.log(count++)
  },
  delegatedEvents: [
    {
      selector: 'div .hello',
      click: ({ message }) => console.log(message)
    }
  ]
})

const wely2 = welify({
  name: 'Wely2',
  data: {
    numbers: [1, 2, 3],
    color: 'green'
  },
  html: ({ numbers }) => ({
    contents: numbers as number[],
    render: (arg: number, index) => `<p class="class-${index}">${arg * 2}</p>`
  }),
  events: {
    click: data => console.log(data.numbers)
  },
  delegatedEvents: [
    {
      selector: 'p',
      click: ({ numbers }, _, index) => console.log(numbers[index])
    }
  ]
})

const wely3 = welify({
  name: 'wely3',
  data: {
    number: 100,
    text: 'AA'
  },
  html: ({ number }) => ({
    branches: [
      {
        judge: number > 100,
        render: `<p>aaa</p>`
      },
      {
        judge: number < 100,
        render: `<p>bbb</p>`
      }
    ],
    fallback: `<slot></slot><p>${number}</p>`
  }),
  slot: `${wely1}`,
  delegatedEvents: [
    {
      selector: 'slot',
      click: ({ number, text }, e, index) => console.log(number, text, e, index)
    }
  ]
})

const wely4 = welify({
  name: 'Wely4',
  data: {
    numbers: [1, 2, 3]
  },
  html: data => ({
    contents: data.numbers as number[],
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
      click: ({ numbers }, e, index) => console.log(numbers[index], e)
    }
  ]
})

mountWely('app', `${wely1}${wely2}${wely3}${wely4}`)
