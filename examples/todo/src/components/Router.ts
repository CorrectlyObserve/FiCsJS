import { ficsRouter, queries } from 'ficsjs/router'
import { calc, cssVar, flexCenter, oklch, remToPx } from 'ficsjs/style'
import Tasks from '@/components/Tasks'
import Task from '@/components/Task'
import NotFound from '@/components/NotFound'
import type { Lang } from '@/types'
import { breakpoints } from '@/utils'

const xs = calc(`${cssVar('xs')} * -1`)

export default ficsRouter<{ lang: Lang; pathname: string }>({
  children: [Tasks, Task, NotFound],
  data: () => ({ lang: 'en' }),
  props: {
    descendant: ({ children: { tasks, task, notFound } }) => [tasks, task, notFound],
    values: ({}) => ({ lang: ({ getData }) => getData('lang') })
  },
  pages: [
    { path: '/', redirect: '/en' },
    {
      path: '/:lang',
      content: ({ children: { tasks, task }, template }) => {
        const queryId = parseInt(queries().id)

        if (isNaN(queryId)) return tasks

        return document.documentElement.clientWidth < remToPx(breakpoints.lg)
          ? task
          : template`<div class="container">${tasks}${task}</div>`
      }
    },
    { path: '/:lang/:id', content: ({ children: { task } }) => task }
  ],
  notFound: { content: ({ children: { notFound } }) => notFound },
  css: {
    ':host': {
      position: 'relative',
      minHeight: cssVar('min-height'),
      'div.container': {
        ...flexCenter('x'),
        position: 'absolute',
        containerType: 'inline-size',
        gap: cssVar('xl'),
        width: '100%',
        [`@container (width >= ${breakpoints.lg})`]: {
          '.task': {
            paddingLeft: cssVar('xl'),
            boxShadow: `${xs} 0px ${cssVar('xs')} ${xs} ${oklch(cssVar('black'), { darker: 0.3 })}`
          }
        }
      }
    }
  }
})
