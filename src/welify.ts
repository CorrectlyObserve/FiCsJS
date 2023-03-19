import { Each, EachIf, If,  } from './libs/Types'
import { getChildNodes, toKebabCase } from './libs/utils'
import { Element } from './libs/Element'

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

export const  = <T, U>(arg: <T, U>): void => {
  if (arg.name === '' || arg.name === undefined)
    throw new Error('The name argument is not defined...')
  else {
    const Name = `w-${toKebabCase(arg.name)}`

    customElements.define(
      Name,
      class extends Element<U> {
        constructor() {
          super()
          this.name = arg.name
          this.data = { ...arg.data }

          const convert = <T>() =>
            typeof arg.html === 'function'
              ? <T>arg.html(this.data)
              : <T>arg.html

          if (typeof (<string>convert()) === 'string') {
            this.html = <string>convert()
          } else {
            const ifHtml = <If>convert()
            const eachHtml = <Each<T>>convert()
            const eachIfHtml = <EachIf<T>>convert()

            if ('contents' in eachIfHtml && 'branches' in eachIfHtml) {
              let html: string = ''

              eachIfHtml.contents.forEach((content) => {
                let value: string = ''

                for (const branch of eachIfHtml.branches)
                  if (branch.judge(content)) {
                    value = branch.render(content)
                    break
                  }

                if (value === '' && eachIfHtml.fallback)
                  value = eachIfHtml.fallback(content)

                html += value
              })

              this.html = html
            } else if ('contents' in eachHtml) {
              this.html = eachHtml.contents.reduce(
                (prev: string, self: T): string =>
                  prev + (eachHtml.render(self) || ''),
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

          this.classes.push(Name)

          if (arg.className)
            for (const className of arg.className.split(' '))
              this.classes.push(toKebabCase(className))

          this.css = arg.css
          this.slotContent = arg.slot
          this.events = { ...arg.events }
        }
      }
    )
  }
}

export const mount = (parent: string, element: string): void => {
  for (const child of getChildNodes(element))
    document.getElementById(parent)?.appendChild(child.cloneNode(true))
}

({
  name: '',
  data: {
    message: 'Hello',
  },
  html: `<p>Hello</p>`,
  events: {
    click: (data) => {
      console.log(data.numbers)
    },
  },
})

({
  name: '2',
  data: {
    numbers: [1, 2, 3],
  },
  html: {
    contents: [1, 2, 3],
    render: (arg: number) => `<p>${arg * 2}</p>`,
  },
})

({
  name: '3',
  data: {
    number: 100,
  },
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
})

({
  name: '4',
  data: {
    numbers: [1, 2, 3],
  },
  html: (data) => {
    return {
      contents: data.numbers,
      branches: [
        {
          judge: (arg: number) => arg % 2 !== 0,
          render: (arg: number) => `<p>${arg * 2}</p>`,
        },
        {
          judge: (arg: number) => typeof arg === 'number',
          render: (arg: number) => `<p>${arg}</p>`,
        },
      ],
      fallback: (arg: number) => `<p>${arg * 10}</p>`,
    }
  },
})

mount('app', '<w-></w-><w-2></w-2>')
