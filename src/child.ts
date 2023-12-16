import { html, wely } from './packages/core/wely'
import cssUrl from './styles/style.css?inline'

const Child = (message: string = 'Hello') =>
  wely({
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
    isOnlyCsr: true,
    className: ({ data: { back } }) => back,
    html: ({
      data: { message, count, countedNum },
      props: { color }
    }: {
      data: { message: string; count: number; countedNum: (count: number) => number }
      props: { color: string; click: (message: string) => void }
    }) => html`<div><p class="hello" style="display: inline">${message}</p></div>
      <p>${color}</p>
      <p>${countedNum(count)}</p>`,
    css: [
      cssUrl,
      {
        selector: 'p',
        style: ({ data: { fontSize } }) => ({ fontSize: `${fontSize}px`, cursor: 'pointer' })
      }
    ],
    events: [
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
        method: ({ data: { message }, props: { click } }) => click(message)
      }
    ],
    reflections: {
      count: count => console.log('count', count)
    }
  })

export default Child
