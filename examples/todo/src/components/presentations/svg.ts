import { fics } from 'ficsjs'

interface Svg {
  icon: string
  click: () => void
  isLarge?: boolean
  isAlert?: boolean
}

export default ({ icon, click, isLarge, isAlert }: Svg) => {
  const size = `var(--${isLarge ? 'lg' : 'md'})`
  const color = isAlert ? 'var(--red)' : '#fff'

  return fics({
    name: 'svg',
    isImmutable: true,
    html: ({ $template }) => $template`<button />`,
    css: [
      { style: { display: 'flex' } },
      {
        selector: 'button',
        style: {
          width: size,
          height: size,
          maskImage: `url("/icons/${icon}.svg")`,
          background: color
        }
      }
    ],
    actions: [
      {
        handler: 'click',
        method: ({ $event: { target } }) => {
          click()
          ;(target as HTMLButtonElement).blur()
        }
      }
    ]
  })
}
