import { fics, type FiCs } from 'ficsjs'
import { color, flex, space } from 'ficsjs/style'
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
  switchStatus: () => void
  remove: () => void
}

const props: FiCs.Props<{}, Props> = {
  descendants: ({ children: { link } }) => link,
  values: ({ props: { task, statuses, isQueryParam } }) => ({
    href: createTaskPath({ id: task.id, isQueryParam }),
    text: task.title,
    isStruckThrough: !!task.completedAt,
    textForScreenReaders: statuses[task.completedAt ? 'completed' : 'uncompleted']
  })
}

const html: FiCs.Html<{}, Props> = ({
  children: { icon, link },
  props: { task, texts, switchStatus, remove },
  template
}) => template`
  ${icon.setIndividualProps('status', {
    svg: task.completedAt ? CircleCheckBig : Circle,
    ariaLabel: texts[task.completedAt ? 'revert' : 'complete'],
    click: switchStatus
  })}
  ${link}
  ${icon.setIndividualProps('delete', {
    svg: Trash2,
    ariaLabel: texts.remove,
    color: color('danger-text'),
    click: remove
  })}
`

const css: FiCs.Css<{}, Props> =
  `:host { ${flex({ center: 'y', gap: space('xs') })}; flex: 1; min-width: 0; }`

export default fics<{}, Props>({ name: 'row', children: [Icon(), Link()], props, html, css })
