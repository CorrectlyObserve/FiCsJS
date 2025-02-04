import { ficsRouter } from 'ficsjs/router'
import { calc, color, variable } from 'ficsjs/style'
import tasks from '@/components/singletons/tasks'
import task from '@/components/singletons/task'
import notFound from '@/components/multitons/notFound'
import { breakpoints } from '@/utils'

const xs = calc([variable('xs'), -1], '*')

export default ficsRouter({
  pages: [
    {
      path: '/',
      content: ({ template }) => {
        const { id }: { id: number | undefined } = task.getData('task')
        console.log(id)
        return template`<div class="container">${tasks}${!id ? task : ''}</div>`
      }
    },
    { path: '/:id', content: () => task }
  ],
  notFound: { content: () => notFound },
  props: [
    {
      descendant: [tasks, task, notFound],
      values: () => ({ lang: ({ getData }) => getData('lang') })
    }
  ],
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
        height: '100%',
        'f-task': { display: 'none' },
        [`@container (width >= ${breakpoints.lg})`]: {
          'f-task': {
            display: 'block',
            paddingLeft: variable('xl'),
            boxShadow: `${xs} 0px ${variable('xs')} ${xs} ${color({ hex: '--black', rate: 0.5, isOpacity: false })}`
          }
        }
      }
    }
  }
})
