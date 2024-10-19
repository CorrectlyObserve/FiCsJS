import { fics } from 'ficsjs'
import button from '@/components/presentations/button'

export default fics<{}, { error404: string }>({
  name: 'not-found',
  html: ({ $props: {error404}, $template }) => $template`<h2>404 ${error404}</h2>${button}`
})
