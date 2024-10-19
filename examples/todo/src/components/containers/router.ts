import { i18n } from 'ficsjs'
import { ficsRouter, goto } from 'ficsjs/router'
import topPage from '@/components/presentations/topPage'
import todoPost from '@/components/presentations/todoPost'
import todoList from '@/components/presentations/todoList'
import todoDetail from '@/components/presentations/todoDetail'
import notFound from '@/components/presentations/notFound'
import button from '@/components/presentations/button'

export default async (lang: string) => {
  const error404 = await i18n({ directory: '/i18n', lang, key: ['notFound', '404'] })
  const btnText = await i18n({ directory: '/i18n', lang, key: ['notFound', 'back'] })

  return ficsRouter({
    pages: [
      { path: ['/', `/${lang}`], content: () => topPage },
      {
        path: ['/todo', `/${lang}/todo`],
        content: ({ $template }) => $template`${todoPost}${todoList}`
      },
      { path: ['/todo/:id', `/${lang}/todo/:id`], content: () => todoDetail }
    ],
    notFound: { content: () => notFound },
    data: () => ({ tasks: [] }),
    inheritances: [
      {
        descendant: todoPost,
        props: ({ $getData }) => ({
          length: $getData('tasks')!.length,
          keydown: (value: string) => console.log(value)
        })
      },
      { descendant: todoList, props: ({ $getData }) => ({ tasks: $getData('tasks') }) },
      { descendant: notFound, props: () => ({ error404 }) },
      {
        descendant: button,
        props: () => ({ btnText, click: () => goto(`/${lang === 'en' ? '' : lang}`) })
      }
    ]
  })
}
