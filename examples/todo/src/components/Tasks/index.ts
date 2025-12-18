import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { calc, cssVar, flexCenter } from 'ficsjs/style'
import LoadingIcon from '@/components/LoadingIcon'
import Icon from '@/components/materials/Icon'
import Input from '@/components/materials/Input'
import Link from '@/components/Tasks/Link'
import { addTask, completeTask, deleteTask, revertTask } from '@/stores'
import type { Lang, Task } from '@/types'
import { breakpoints } from '@/utils/others'
import { Circle, CircleCheckBig, Plus, Square, SquareCheck, Trash2 } from 'lucide-static'

interface Data {
  heading: string
  value: string
  placeholder: string
  isShown: boolean
  show: string
  hide: string
  texts: string[]
  confirmation: string
  unapplicable: string
}

interface Props {
  lang: Lang
  tasks: Task[]
  taskId: number
  setTasks: (tasks: Task[]) => void
}

const { sm } = breakpoints

export default fics<Data, Props>({
  name: 'tasks',
  children: [LoadingIcon, Icon(), Input()],
  data: () => ({ value: '', placeholder: '', isShown: false, tasks: [] }),
  i18nData: async ({ props: { lang }, i18n }) => ({
    ...(await i18n<Data>({ lang, key: 'tasks' })),
    texts: ((await i18n({ lang, key: ['task', 'texts'] })) as string[]).slice(0, 3)
  }),
  props: [
    {
      descendant: ({ children: { loadingIcon } }) => loadingIcon,
      values: ({ props: { lang } }) => ({ lang })
    },
    {
      descendant: ({ children: { input } }) => input,
      values: ({ data, props: { setTasks } }) => ({
        value: ({ getData }) => getData('value'),
        placeholder: ({ getData }) => getData('placeholder'),
        input: (value: string) => (data.value = value),
        enterKey:
          ({ getData }) =>
          async () => {
            const value = getData('value')

            if (value !== '') {
              setTasks(await addTask(value))
              data.value = ''
            }
          }
      })
    }
  ],
  className: 'tasks',
  html: ({
    children: { loadingIcon, icon, input },
    data,
    props: { tasks, taskId, setTasks },
    template,
    isDeferred
  }) => {
    if (!isDeferred) return template`${loadingIcon}`

    const {
      heading,
      value,
      placeholder,
      isShown,
      show,
      hide,
      texts: [complete, revert, _delete],
      confirmation,
      unapplicable
    } = data

    if (!isShown) tasks = tasks.filter(({ completedAt }) => !completedAt)

    return template`
      <h2>${heading}</h2>
      <div class="menu">
        <div>
          ${input}
          ${icon.setIndividualProps('add', {
            svg: Plus,
            areaLabel: placeholder,
            click: async () => {
              if (value !== '') {
                setTasks(await addTask(value))
                data.value = ''
              }
            }
          })}
        </div>
        <div>
          ${icon.setIndividualProps('check', {
            svg: isShown ? SquareCheck : Square,
            areaLabel: isShown ? hide : show,
            click: () => (data.isShown = !data.isShown)
          })}
          <span role="button" tabindex="0">${isShown ? hide : show}</span>
        </div>
      </div>
      ${
        tasks.length > 0
          ? tasks.map(
              ({ id, title, completedAt }, index) => template`
                <div class="task" key="${index}">
                  <div>
                    ${icon.setIndividualProps(`${id}-${completedAt ? 'check' : 'circle'}`, {
                      svg: completedAt ? CircleCheckBig : Circle,
                      areaLabel: completedAt ? revert : complete,
                      click: async () =>
                        setTasks(await (completedAt ? revertTask(id) : completeTask(id)))
                    })}
                    ${Link({ id, title, completedAt })}
                  </div>
                  ${icon.setIndividualProps(`${id}-delete`, {
                    svg: Trash2,
                    areaLabel: _delete,
                    color: cssVar('red'),
                    click: async () => {
                      if (window.confirm(confirmation)) {
                        setTasks(await deleteTask(id))
                        if (taskId === id) goto('/')
                      }
                    }
                  })}
                </div>
              `
            )
          : template`<p>${unapplicable}</p>`
      }
    `
  },
  css: {
    div: {
      '&.menu': {
        marginBottom: cssVar('xl'),
        div: {
          ...flexCenter('xy'),
          marginBottom: cssVar('md'),
          '&:last-child': { marginBottom: 0 },
          span: { paddingLeft: 0, lineHeight: 1 }
        },
        [`@media (max-width: ${sm})`]: {
          marginBottom: cssVar('md'),
          div: { marginBottom: cssVar('xs') }
        }
      },
      '&.task': {
        ...flexCenter('y'),
        width: sm,
        maxWidth: calc('-', calc(`${cssVar('md')} * 30`), `${cssVar('xl')} * 2`),
        marginInline: 'auto',
        marginBottom: cssVar('xs'),
        '&:last-child': { marginBottom: 0 },
        [`@media (max-width: ${sm})`]: { width: '100%' },
        div: {
          ...flexCenter('y'),
          width: calc('-', calc(`100% - ${cssVar('xl')}`), `${cssVar('xs')} * 2`)
        }
      }
    }
  },
  actions: {
    'div.menu span': {
      click: [({ data }) => (data.isShown = !data.isShown), { blur: true }]
    }
  },
  options: { lazyLoad: true }
})
