import { fics } from 'ficsjs'
import button from '@/components/presentations/button'

interface Props {
  error404: string
  btnText: string
  click: () => void
}

export default fics<{}, Props>({
  name: 'not-found',
  inheritances: {
    descendants: button,
    props: ({ $props: { btnText, click } }) => ({ btnText, click })
  },
  html: ({ $props: { error404 }, $template }) => $template`<h2>404 ${error404}</h2>${button}`
})
