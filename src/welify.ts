import { Each, EachIf, If, Welify } from './libs/welifyTypes'
import { convertType, getChildNodes, toKebabCase } from './libs/utils'
import { WelyElement } from './libs/welyElement'

/*
技術仕様
1. 引数のオブジェクトのDataの中をデータバインディング
2. data: { value: $value } とやるとpropsになる
3. CSS in JSを実現（https://vanilla-extract.style/）
4. emitとpropsの血縁関係に依存した状態管理
5. Eventsをコンポーネントの全体ではなく、一部に適用できるようにする
6. 多言語翻訳（今後の話）
7. 状態管理（今後の話）
8. ルーティング（今後の話）
9. PWA（今後の話）
10. svgによるグラフ作成（今後の話）
11. Vueでいうwatch的な機能（今後の話）
*/

export const welify = <T, U>({
  name,
  className,
  data,
  html,
  css,
  slot,
  events,
  delegatedEvents,
}: Welify<T, U>): void => {
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
          this.data = { ...data }

          const converter = convertType(html, this.data)

          if (typeof (<string>converter) === 'string')
            this.html = <string>converter
          else {
            const ifHtml = <If>converter
            const eachHtml = <Each<T>>converter
            const eachIfHtml = <EachIf<T>>converter

            if ('contents' in eachIfHtml && 'branches' in eachIfHtml) {
              let html: string = ''

              eachIfHtml.contents.forEach((content, index) => {
                let value: string = ''

                for (const branch of eachIfHtml.branches)
                  if (branch.judge(content)) {
                    value = branch.render(content, index)
                    break
                  }

                if (value === '' && eachIfHtml.fallback)
                  value = eachIfHtml.fallback(content, index)

                html += value
              })

              this.html = html
            } else if ('contents' in eachHtml)
              this.html = eachHtml.contents.reduce(
                (prev: string, self: T, index: number): string =>
                  prev + eachHtml.render(self, index),
                ''
              )
            else if ('branches' in ifHtml) {
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

          this.classes.push(welyName)

          if (className)
            for (const name of className.split(' '))
              this.classes.push(toKebabCase(name))

          this.css = css
          this.slotContent = slot
          this.events = { ...events }

          if (delegatedEvents && delegatedEvents.length > 0)
            this.delegatedEvents = [...delegatedEvents]
        }
      }
    )
  }
}

export const mountWely = (parent: string, element: string): void => {
  for (const child of getChildNodes(element))
    document.getElementById(parent)?.appendChild(child.cloneNode(true))
}

welify({
  name: 'wely',
  data: { message: 'Hello' },
  html: `<p class="hello">Hello</p><div><p class="hello">Child hello</p></div>`,
  events: {
    click: ({ message }) => console.log('Parent ' + message),
  },
  delegatedEvents: [
    {
      selector: '.hello',
      click: ({ message }) => console.log(message),
    },
  ],
})

welify({
  name: 'Wely2',
  data: { numbers: [1, 2, 3] },
  html: ({ numbers }) => {
    return {
      contents: numbers,
      render: (arg: number, index) =>
        `<p class="class-${index}">${arg * 2}</p>`,
      click: (arg: number) => console.log(arg),
    }
  },
  events: {
    click: (data) => console.log(data.numbers),
  },
  delegatedEvents: [
    {
      selector: '.class-2',
      click: ({ numbers }) => console.log(numbers),
    },
  ],
})

welify({
  name: 'wely3',
  data: { number: 100 },
  html: (data) => {
    return {
      branches: [
        {
          judge: data.number > 100,
          render: `<p>aaa</p>`,
        },
        {
          judge: data.number < 100,
          render: `<p>bbb</p>`,
        },
      ],
      fallback: `<slot></slot><p>${data.number}</p>`,
    }
  },
  slot: `<p>DDD</p>`,
  delegatedEvents: [
    {
      selector: 'slot',
      click: ({ number }) => console.log(number),
    },
  ],
})

welify({
  name: 'Wely4',
  data: { numbers: [1, 2, 3] },
  html: (data) => {
    return {
      contents: data.numbers,
      branches: [
        {
          judge: (arg: number) => arg % 2 !== 0,
          render: (arg: number, index) =>
            `<p class="class-${index}">${arg * 2}</p>`,
        },
        {
          judge: (arg: number) => typeof arg === 'number',
          render: (arg: number, index) =>
            `<p class="class-${index}">${arg}</p>`,
        },
      ],
      fallback: (arg: number, index) =>
        `<p class="class-${index}">${arg * 10}</p>`,
    }
  },
  delegatedEvents: [
    {
      selector: '.class-2',
      click: ({ numbers }) => console.log(numbers),
    },
  ],
})

mountWely(
  'app',
  '<w-wely></w-wely><w-wely2></w-wely2><w-wely3></w-wely3><w-wely4></w-wely4>'
)
