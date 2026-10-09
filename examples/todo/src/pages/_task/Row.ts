import { fics, type FiCs } from 'ficsjs'
import { cssVar, flexCenter, size } from 'ficsjs/style'
import Icon from '@/components/Icon'
import Link from '@/components/Link'
import { createTaskPath } from '@/domain/path'
import type { Task } from '@/domain/task'
import { Circle, CircleCheckBig, Trash2 } from 'lucide-static'

interface Props {
  task: Task
  texts: { complete: string; revert: string; remove: string }
  statuses: { completed: string; uncompleted: string }
  isQueryParam: boolean
  toggle: () => void
  remove: () => void
}

const props: FiCs.Props<{}, Props> = {
  descendants: ({ children: { link } }) => link,
  values: ({ props: { task, statuses, isQueryParam } }) => ({
    href: createTaskPath({ id: task.id, isQueryParam }),
    title: task.title,
    isDone: !!task.completedAt,
    status: statuses[task.completedAt ? 'completed' : 'uncompleted']
  })
}

const html: FiCs.Html<{}, Props> = ({
  children: { icon, link },
  props: { task, texts, toggle, remove },
  template
}) => template`
  ${icon.setIndividualProps('status', {
    svg: task.completedAt ? CircleCheckBig : Circle,
    ariaLabel: task.completedAt ? texts.revert : texts.complete,
    click: toggle
  })}
  ${link}
  ${icon.setIndividualProps('delete', {
    svg: Trash2,
    ariaLabel: texts.remove,
    color: cssVar('red'),
    click: remove
  })}
`

const css: FiCs.Css<{}, Props> = `:host { ${flexCenter('y')}; gap: ${size(1)}; flex: 1; min-width: 0; }`

export default fics<{}, Props>({ name: 'row', children: [Icon(), Link()], props, html, css })
