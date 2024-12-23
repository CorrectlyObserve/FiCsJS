import { fics } from 'ficsjs'

interface Data {
  icon: string
  isLoadingIcon: (icon: string) => boolean
}

interface Props {
  color?: string
  click: () => void
}

export default fics<Data, Props>({
  name: 'svg',
  data: () => ({ icon: '', isLoadingIcon: (icon: string) => icon === 'loading' }),
  html: ({ $data: { icon, isLoadingIcon }, $template }) =>
    $template`<button class="${isLoadingIcon(icon) ? 'loading' : ''}"><span /></button>`,
  css: {
    selector: 'button',
    style: { background: 'none', padding: 'var(--ex-sm)' },
    nested: {
      selector: 'span',
      style: ({ $data: { icon, isLoadingIcon }, $props: { color } }) => {
        const size = `calc(var(--lg) * ${isLoadingIcon(icon) ? 2 : 1.5})`
        const loadingCss = { marginInline: 'auto', animation: 'loading 1.5s infinite linear' }

        return {
          width: size,
          height: size,
          display: 'block',
          maskImage: `url("/icons/${icon}.svg")`,
          background: color ?? '#fff',
          ...(isLoadingIcon(icon) ? loadingCss : {})
        }
      }
    }
  },
  actions: [
    {
      handler: 'click',
      method: ({ $props: { click } }) => {
        if (click) click()
      },
      options: { throttle: 500, blur: true }
    }
  ]
})
