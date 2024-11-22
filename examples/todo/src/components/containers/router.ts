import i18n from 'ficsjs/i18n'
import { ficsRouter } from 'ficsjs/router'
import { getState } from 'ficsjs/state'
import topPage from '@/components/presentations/topPage'
import tasks from '@/components/containers/tasks'
import taskDetail from '@/components/containers/taskDetail'
import notFound from '@/components/presentations/notFound2'
import { lang } from '@/store'

export default async () => {
  const _lang = getState<string>(lang)
  const texts = await i18n<JSON>({ directory: '/i18n', lang: _lang, key: 'topPage' })

  return ficsRouter({
    pages: [
      { paths: ['/', `/${_lang}`], content: () => topPage },
      { paths: ['/todo', `/${_lang}/todo`], content: () => tasks },
      { paths: ['/todo/:id', `/${_lang}/todo/:id`], content: () => taskDetail }
    ],
    notFound: { content: () => notFound },
    props: [
      { descendant: [topPage, notFound], values: () => ({ lang: _lang }) },
      { descendant: topPage, values: () => ({ ...texts }) }
    ]
  })
}
