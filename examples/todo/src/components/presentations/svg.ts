import { fics } from 'ficsjs'

interface Props {
  icon: string
  click: () => void
  isLarge?: boolean
  isAlert?: boolean
}

export default fics<{}, Props>({
  name: 'svg',
  html: ({ $template }) => $template`<button />`,
  css: [
    { style: { display: 'flex' } },
    {
      selector: 'button',
      style: ({ $props: { icon, isLarge, isAlert } }) => {
        const size = `var(--${isLarge ? 'lg' : 'md'})`

        return {
          width: size,
          height: size,
          maskImage: `url("/icons/${icon}.svg")`,
          background: isAlert ? 'var(--red)' : '#fff'
        }
      }
    }
  ],
  actions: [
    { handler: 'click', method: ({ $props: { click } }) => click(), options: { blur: true } }
  ]
})
