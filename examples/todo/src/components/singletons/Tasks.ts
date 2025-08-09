import { fics } from 'ficsjs'
import { ficsLink, goto, queryParams } from 'ficsjs/router'
import { calc, cssVar, flexCenter, remToPx } from 'ficsjs/style'
import LoadingIcon from '@/components/LoadingIcon'
import Icon from '@/components/materials/Icon'
import Input from '@/components/materials/Input'
import { $tasks, addTask, completeTask, deleteTask, revertTask } from '@/store'
import type { Task } from '@/types'
import { breakpoints, getPath } from '@/utils'
import { Circle, CircleCheckBig, Plus, Square, SquareCheck, Trash2 } from 'lucide-static'

interface Data {
  heading: string
  value: string
  placeholder: string
  isShown: boolean
  show: string
  hide: string
  tasks: Task[]
  texts: string[]
  confirmation: string
  unapplicable: string
}

const { sm, lg } = breakpoints

export default fics<Data, { lang: string }>({
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
      values: ({ setData }) => ({
        value: ({ getData }) => getData('value'),
        placeholder: ({ getData }) => getData('placeholder'),
        input: (value: string) => setData('value', value),
        enterKey:
          ({ getData }) =>
          async () => {
            const value = getData('value')

            if (value !== '') {
              const tasks: Task[] = await addTask(value)

              setData('tasks', tasks)
              setData('value', '')
            }
          }
      })
    }
  ],
  html: ({
    children: { loadingIcon, icon, input },
    data: {
      heading,
      value,
      placeholder,
      isShown,
      show,
      hide,
      tasks,
      texts,
      confirmation,
      unapplicable
    },
    props: { lang },
    template,
    setData,
    isDeferred
  }) => {
    if (!isDeferred) return template`${loadingIcon}`

    if (!isShown) tasks = tasks.filter(task => !task.completedAt)

    const [complete, revert, _delete] = texts,
      { offsetWidth } = document.documentElement

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
                const tasks: Task[] = await addTask(value)

                setData('tasks', tasks)
                setData('value', '')
              }
            }
          })}
        </div>
        <div>
          ${icon.setIndividualProps('check', {
            svg: isShown ? SquareCheck : Square,
            areaLabel: isShown ? hide : show,
            click: () => setData('isShown', !isShown)
          })}
          <span role="button" tabindex="0">${isShown ? hide : show}</span>
        </div>
      </div>
      ${
        tasks.length > 0
          ? tasks.map(
              ({ id, title, completedAt }) => template`
                <div class="task" key="${id}">
                  <div>
                    ${icon.setIndividualProps(`${id}-${completedAt ? 'check' : 'circle'}`, {
                      svg: completedAt ? CircleCheckBig : Circle,
                      areaLabel: completedAt ? revert : complete,
                      click: async () => {
                        setData('tasks', await (completedAt ? revertTask(id) : completeTask(id)))
                      }
                    })}
                    ${ficsLink({
                      href: getPath(lang, (offsetWidth >= remToPx(lg) ? '/?id=' : '/') + id),
                      content: ({ template }) =>
                        template`<span class="${completedAt ? 'done' : ''}">${title}</span>`
                    })}
                  </div>
                  ${icon.setIndividualProps(`${id}-delete`, {
                    svg: Trash2,
                    areaLabel: _delete,
                    color: cssVar('red'),
                    click: async () => {
                      if (window.confirm(confirmation)) {
                        setData('tasks', await deleteTask(id))
                        if (parseInt(queryParams().id) === id) goto(getPath(lang, '/'))
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
          '&:last-child': { marginBottom: 0 }
        },
        [`@media (max-width: ${sm})`]: {
          marginBottom: cssVar('md'),
          div: { marginBottom: cssVar('xs') }
        }
      },
      '&.task': {
        ...flexCenter('y'),
        width: sm,
        maxWidth: calc([calc([cssVar('md'), 30], '*'), calc([cssVar('xl'), 2], '*')], '-'),
        marginInline: 'auto',
        marginBottom: cssVar('xs'),
        '&:last-child': { marginBottom: 0 },
        [`@media (max-width: ${sm})`]: { width: '100%' },
        div: {
          width: `${calc([calc(['100%', cssVar('xl')], '-'), calc([cssVar('xs'), 2], '*')], '-')}`,
          ...flexCenter('y'),
          span: {
            width: '100%',
            display: 'flex',
            textAlign: 'left',
            marginInline: cssVar('xs'),
            overflowX: 'hidden',
            transition: `${cssVar('transition')} allow-discrete`,
            '&.done': { textDecoration: 'line-through' },
            a: {
              width: '100%',
              display: 'inline-block',
              color: 'inherit',
              paddingBlock: cssVar('xs'),
              lineHeight: 'inherit',
              outline: 'none',
              whiteSpace: 'nowrap',
              overflowX: 'hidden',
              textDecoration: 'none',
              textOverflow: 'ellipsis'
            }
          }
        }
      },
      span: { transition: cssVar('transition'), '&:hover': { opacity: 0.5 } }
    }
  },
  hooks: { mounted: async ({ setData }) => setData('tasks', await $tasks.get()) },
  actions: {
    'div.menu span': {
      click: [({ data: { isShown }, setData }) => setData('isShown', !isShown), { blur: true }]
    }
  },
  options: { lazyLoad: true }
})
