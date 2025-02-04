import { ficsRouter } from 'ficsjs/router'
import breakpoints from '@/breakpoints'
import tasks from '@/components/singletons/tasks'
import task from '@/components/singletons/task'
import notFound from '@/components/multitons/notFound'
import { calc, color, variable } from 'ficsjs/style'

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
    '.container > f-task': { display: 'none' },
    [`@media (min-width: ${breakpoints.lg})`]: {
      ':host': {
        position: 'relative',
        display: 'block',
        minHeight: variable('min-height'),
        '.container': {
          position: 'absolute',
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          gap: variable('xl'),
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
