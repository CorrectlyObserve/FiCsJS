import { fics } from 'ficsjs'
import button from '@/components/presentations/button'

interface Props {
  title: string
  btnText: string
  click: () => void
}

export default fics<{}, Props>({
  name: 'not-found',
  inheritances: {
    descendants: button,
    props: ({ $props: { btnText, click } }) => ({ btnText, click })
  },
  html: ({ $props: { title }, $template }) => $template`<h2>404 ${title}</h2>${button}`
})
