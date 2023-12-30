import { fics, html } from './packages/core/wely'
import { ChildType } from './child'

export const Parent = (child: ChildType) => {
  let count = child.getData('count')

  const timer = setInterval(() => {
    if (count >= 4) {
      clearInterval(timer)
      console.log('stop')
    }

    child.setData('count', ++count)

    console.log('continue')
  }, 1000)

  return fics({
    name: 'parent',
    data: () => ({
      color: 'blue',
      click: (message: string) => console.log(message)
    }),
    props: [
      {
        descendants: child,
        values: getData => ({ color: getData('color'), click: getData('click') })
      }
    ],
    className: 'test',
    html: ({ props: { propsColor } }: { props: { propsColor: string } }) =>
      html`${child}
        <p>propsColor: ${propsColor}</p>`
  })
}

export type ParentType = ReturnType<typeof Parent>
