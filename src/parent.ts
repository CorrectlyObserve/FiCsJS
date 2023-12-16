import { html, wely } from './packages/core/wely'
import Child2 from './child2'

const child2 = Child2()

let count = child2.getData('count')

const timer = setInterval(() => {
  if (count >= 4) {
    clearInterval(timer)
    console.log('stop')
  }

  child2.setData('count', ++count)

  console.log('continue')
}, 1000)

const Parent = () =>
  wely({
    name: 'parent',
    data: () => ({
      color: 'blue',
      click: (message: string) => console.log(message)
    }),
    props: [
      {
        descendants: child2,
        values: getData => ({ color: getData('color'), click: getData('click') })
      }
    ],
    className: 'test',
    html: ({ props: { propsColor } }: { props: { propsColor: string } }) =>
      html`${child2}
        <p>propsColor: ${propsColor}</p>`
  })

export { child2, Parent }
