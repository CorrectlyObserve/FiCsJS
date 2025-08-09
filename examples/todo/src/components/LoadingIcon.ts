import { fics } from 'ficsjs'
import Icon from '@/components/materials/Icon'
import { Loader } from 'lucide-static'

export default fics<{}, { lang: string }>({
  name: 'loading-icon',
  children: [Icon()],
  props: {
    descendant: ({ children: { icon } }) => icon,
    values: ({ props: { lang } }) => ({
      svg: Loader,
      areaLabel: { en: 'Loading...', ja: '読み込み中' }[lang],
      isLoadingIcon: true
    })
  },
  html: ({ children: { icon }, template }) => template`${icon}`
})
