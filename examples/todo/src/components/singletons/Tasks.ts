import { fics } from 'ficsjs'
import { i18n } from 'ficsjs/i18n'
import { getPersistentState } from 'ficsjs/persistent-state'
import { goto, getParams } from 'ficsjs/router'
import { calc, remToPx, variable } from 'ficsjs/style'
import Icon from '@/components/materials/Icon'
import Input from '@/components/materials/Input'
import { $tasks, addTask, completeTask, deleteTask, revertTask } from '@/store'
import type { Task } from '@/types'
import { breakpoints, getPath } from '@/utils'

interface Data {
  heading: string
  value: string
  placeholder: string
  isShown: boolean
  checkbox: string
  tasks: Task[]
  confirmation: string
  unapplicable: string
}

const input = Input()
const addIcon = Icon('add')
const squareIcon = Icon('square')
const checkSquareIcon = Icon('check-square')
const loadingIcon = Icon('loading')
const trashIcon = Icon('trash')
const { sm, lg } = breakpoints

export default () =>
  fics<Data, { lang: string; click?: (id: number) => void }>({
    name: 'tasks',
    data: () => ({ value: '', placeholder: '', isShown: false, tasks: [] }),
    fetch: ({ props: { lang } }) => i18n({ lang, key: 'tasks' }),
    props: [
      {
        descendant: input,
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
      },
      {
        descendant: addIcon,
        values: ({ setData }) => ({
          click:
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
      },
      {
        descendant: [squareIcon, checkSquareIcon],
        values: ({ setData }) => ({
          click:
            ({ getData }) =>
            () =>
              setData('isShown', !getData('isShown'))
        })
      }
    ],
    html: ({
      data: { heading, isShown, checkbox, tasks, confirmation, unapplicable },
      props: { lang },
      template,
      setData,
      setProps,
      isLoaded
    }) => {
      if (!isLoaded) return template`${loadingIcon}`

      if (!isShown) tasks = tasks.filter(task => !task.completedAt)

      return template`
        <h2>${heading}</h2>
        <div class="menu">
          <div>${input}${addIcon}</div>
          <div>
            ${isShown ? checkSquareIcon : squareIcon}
            <span role="button" tabindex="0">${checkbox}</span>
          </div>
        </div>
        ${
          tasks.length > 0
            ? tasks.map(
                ({ id, title, completedAt }) => template`
                  <div class="task" key="${id}">
                    <div>
                      ${setProps(Icon(completedAt ? 'check' : 'circle'), {
                        click: async () => {
                          setData('tasks', await (completedAt ? revertTask(id) : completeTask(id)))
                        }
                      })}
                      <span class="${completedAt ? 'done' : ''}">
                        <a href="${getPath(lang, (document.documentElement.offsetWidth >= remToPx(lg) ? '/?id=' : '/') + id)}">${title}</a>
                      </span>
                    </div>
                    ${setProps(trashIcon, {
                      color: variable('red'),
                      click: async () => {
                        if (window.confirm(confirmation)) {
                          setData('tasks', await deleteTask(id))
                          if (parseInt(getParams('query').id) === id) goto(getPath(lang, '/'))
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
          marginBottom: variable('xl'),
          div: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: variable('md'),
            '&:last-child': { marginBottom: 0 },
            'f-input': { marginRight: variable('md') }
          },
          [`@media (max-width: ${sm})`]: {
            marginBottom: variable('md'),
            div: { marginBottom: variable('xs'), 'f-input': { marginRight: 0 } }
          }
        },
        '&.task': {
          width: sm,
          maxWidth: calc([calc([variable('md'), 30], '*'), calc([variable('xl'), 2], '*')], '-'),
          display: 'flex',
          alignItems: 'center',
          marginInline: 'auto',
          marginBottom: variable('xs'),
          '&:last-child': { marginBottom: 0 },
          [`@media (max-width: ${sm})`]: { width: '100%' },
          div: {
            width: `${calc(
              [calc(['100%', variable('xl')], '-'), calc([variable('xs'), 2], '*')],
              '-'
            )}`,
            display: 'flex',
            alignItems: 'center',
            span: {
              width: '100%',
              display: 'flex',
              textAlign: 'left',
              marginInline: variable('xs'),
              overflowX: 'hidden',
              transition: `${variable('transition')} allow-discrete`,
              '&.done': { textDecoration: 'line-through' },
              a: {
                width: '100%',
                display: 'inline-block',
                color: 'inherit',
                paddingBlock: variable('xs'),
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
        span: { transition: variable('transition'), '&:hover': { opacity: 0.5 } }
      }
    },
    actions: {
      'div.menu span': {
        click: [({ data: { isShown }, setData }) => setData('isShown', !isShown), { blur: true }]
      }
    },
    hooks: {
      mounted: async ({ setData }) => setData('tasks', await getPersistentState($tasks))
    },
    options: { lazyLoad: true }
  })
