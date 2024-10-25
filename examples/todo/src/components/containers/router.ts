import i18n from 'ficsjs/i18n'
import { ficsRouter, goto } from 'ficsjs/router'
import topPage from '@/components/presentations/topPage'
import todoPost from '@/components/presentations/todoPost'
import todoList from '@/components/presentations/todoList'
import taskDetail from '@/components/presentations/taskDetail'
import notFound from '@/components/presentations/notFound'

export default async (lang: string) => {
  const error404 = await i18n<string>({ directory: '/i18n', lang, key: ['notFound', '404'] })
  const btnText = await i18n<string>({ directory: '/i18n', lang, key: ['notFound', 'back'] })

  return ficsRouter({
    pages: [
      { path: ['/', `/${lang}`], content: () => topPage },
      {
        path: ['/todo', `/${lang}/todo`],
        content: ({ $template }) => $template`${todoPost}${todoList}`
      },
      { path: ['/todo/:id', `/${lang}/todo/:id`], content: () => taskDetail }
    ],
    notFound: { content: () => notFound },
    data: () => ({ tasks: [] }),
    inheritances: [
      {
        descendants: todoPost,
        props: ({ $getData }) => ({
          length: $getData('tasks')!.length,
          addNewTask: (value: string) => console.log(value)
        })
      },
      { descendants: todoList, props: ({ $getData }) => ({ tasks: $getData('tasks') }) },
      {
        descendants: notFound,
        props: () => ({ error404, btnText, click: () => goto(`/${lang === 'en' ? '' : lang}`) })
      }
    ]
  })
}
