import { i18n } from 'ficsjs'
import { ficsRouter, goto } from 'ficsjs/router'
import TopPage from '@/components/presentations/topPage'
import TodoApp from '@/components/todoApp'
import TodoDetail from '@/components/todoDetail'
import notFound from '@/components/presentations/notFound'
import button from '@/components/presentations/button'

export default async (lang: string) => {
  const error404 = await i18n({ directory: '/i18n', lang, key: ['notFound', '404'] })
  const btnText = await i18n({ directory: '/i18n', lang, key: ['notFound', 'back'] })

  return ficsRouter({
    pages: [
      { path: ['/', `/${lang}`], content: () => TopPage() },
      { path: ['/todo', `/${lang}/todo`], content: () => TodoApp() },
      { path: ['/todo/:id', `/${lang}/todo/:id`], content: () => TodoDetail() }
    ],
    notFound: { content: () => notFound },
    inheritances: [
      { descendant: notFound, props: () => ({ error404 }) },
      {
        descendant: button,
        props: () => ({ btnText, click: () => goto(`/${lang === 'en' ? '' : lang}`) })
      }
    ]
  })
}
