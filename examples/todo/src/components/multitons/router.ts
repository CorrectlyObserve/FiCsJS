import { ficsRouter, getParams } from 'ficsjs/router'
import { calc, color, remToPx, variable } from 'ficsjs/style'
import Tasks from '@/components/singletons/tasks'
import Task from '@/components/singletons/task'
import NotFound from '@/components/multitons/notFound'
import { breakpoints } from '@/utils'

const tasks = Tasks()
const task = Task()
const notFound = NotFound()
const xs = calc([variable('xs'), -1], '*')

export default () =>
  ficsRouter({
    props: [
      {
        descendant: [tasks, task, notFound],
        values: () => ({ lang: ({ getData }) => getData('lang') })
      }
    ],
    pages: [
      {
        path: '/',
        content: ({ template }) => {
          const queryId = parseInt(getParams('query').id)

          if (isNaN(queryId)) return tasks

          return document.documentElement.clientWidth < remToPx(breakpoints.lg)
            ? task
            : template`<div class="container">${tasks}${task}</div>`
        }
      },
      { path: '/:id', content: () => task }
    ],
    notFound: { content: () => notFound },
    css: {
      ':host': {
        position: 'relative',
        display: 'block',
        minHeight: variable('min-height'),
        'div.container': {
          position: 'absolute',
          containerType: 'inline-size',
          display: 'flex',
          justifyContent: 'center',
          gap: variable('xl'),
          width: '100%',
          [`@container (width >= ${breakpoints.lg})`]: {
            'f-task': {
              paddingLeft: variable('xl'),
              boxShadow: `${xs} 0px ${variable('xs')} ${xs} ${color({ hex: '--black', rate: 0.5, isOpacity: false })}`
            }
          }
        }
      }
    }
  })
