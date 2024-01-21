import fics from '../packages/core/fics'
import cssUrl from './../styles/style.css?inline'

export const Child = (message: string = 'Hello') =>
  fics({
    name: 'child',
    data: () => ({
      count: 1,
      fontSize: 16,
      message,
      back: 'black',
      arr: [1, 2, 3],
      obj: { key: 'value' },
      countedNum: (count: number) => count * 3
    }),
    reflections: { count: count => console.log('count', count) },
    isOnlyCsr: true,
    className: ({ back }) => back,
    props: {} as { color: string; click: (message: string) => void },
    html: ({ data: { message, count, countedNum }, html }, { color }) => html`<div>
        <p class="hello" style="display: inline">${message}</p>
      </div>
      <p>${color}</p>
      <p>${countedNum(count)}</p>`,
    css: [
      cssUrl,
      {
        selector: 'p',
        style: ({ fontSize }) => ({ fontSize: `${fontSize}px`, cursor: 'pointer' })
      }
    ],
    actions: [
      {
        handler: 'click',
        method: ({ data: { obj, arr }, setData }) => {
          setData('obj', { ...obj })
          setData('arr', [...arr])
        }
      },
      {
        selector: 'div',
        handler: 'click',
        method: ({ data: { message } }, { click }) => click(message)
      }
    ]
  })

export type ChildType = ReturnType<typeof Child>
