import i18n from 'ficsjs/i18n'
import { ficsRouter, goto } from 'ficsjs/router'
import topPage from '@/components/presentations/topPage'
import todoPost from '@/components/presentations/todoPost'
import todoList from '@/components/presentations/todoList'
import taskDetail from '@/components/presentations/taskDetail'
import notFound from '@/components/presentations/notFound'
import type { Task } from '@/types'

export default async (lang: string) => {
  const topPageTexts = await i18n<JSON>({ directory: '/i18n', lang, keys: 'topPage' })
  const notFoundTexts = await i18n<JSON>({ directory: '/i18n', lang, keys: 'notFound' })

  return ficsRouter<{ tasks: Task[] }>({
    pages: [
      { paths: ['/', `/${lang}`], content: () => topPage },
      {
        paths: ['/todo', `/${lang}/todo`],
        content: ({ $template }) => $template`${todoPost}${todoList}`
      },
      { paths: ['/todo/:id', `/${lang}/todo/:id`], content: () => taskDetail }
    ],
    notFound: { content: () => notFound },
    data: () => ({ tasks: [{ title: 's', description: '', created_at: 0, updated_at: 0 }] }),
    props: [
      {
        descendants: todoPost,
        values: ({ $getData }) => ({
          length: $getData('tasks')!.length,
          addNewTask: (value: string) => console.log(value)
        })
      },
      { descendants: todoList, values: ({ $getData }) => ({ tasks: $getData('tasks') }) },
      { descendants: topPage, values: () => ({ ...topPageTexts }) },
      {
        descendants: notFound,
        values: () => ({ ...notFoundTexts, click: () => goto(`/${lang === 'en' ? '' : lang}`) })
      }
    ]
  })
}
