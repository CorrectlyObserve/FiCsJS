import { ficsRouter, queryParams } from 'ficsjs/router'
import { calc, color, cssVar, flexCenter, remToPx } from 'ficsjs/style'
import Tasks from '@/components/singletons/Tasks'
import Task from '@/components/singletons/Task'
import NotFound from '@/components/multitons/NotFound'
import { breakpoints } from '@/utils'

const xs = calc([cssVar('xs'), -1], '*')

export default ficsRouter({
  children: [Tasks, Task, NotFound],
  props: {
    descendant: ({ children: { tasks, task, notFound } }) => [tasks, task, notFound],
    values: ({}) => ({ lang: ({ getData }) => getData('lang') })
  },
  pages: [
    {
      path: '/',
      content: ({ children: { tasks, task }, template }) => {
        const queryId = parseInt(queryParams().id)

        if (isNaN(queryId)) return tasks

        return document.documentElement.clientWidth < remToPx(breakpoints.lg)
          ? task
          : template`<div class="container">${tasks}${task}</div>`
      }
    },
    { path: '/:id', content: ({ children: { task } }) => task }
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
            boxShadow: `${xs} 0px ${cssVar('xs')} ${xs} ${color({ hex: '--black', rate: 0.5, isOpacity: false })}`
          }
        }
      }
    }
  }
})
