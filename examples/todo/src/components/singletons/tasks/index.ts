import { fics } from 'ficsjs'
import { variable } from 'ficsjs/css'
import i18n from 'ficsjs/i18n'
import { loadingIcon, svgIcon } from '@/components/materials/svgIcon'
import input from '@/components/materials/input'
import { addTask, completeTask, deleteTask, getAllTasks, revertTask } from '@/indexedDB'
import type { Task } from '@/types'
import { getPath } from '@/utils'
import css from './style.css?inline'

interface Data {
  heading: string
  value: string
  placeholder: string
  isShown: boolean
  checkbox: string
  confirmation: string
  tasks: Task[]
  unapplicable: string
}

const addIcon = svgIcon.extend({ icon: 'add' })
const squareIcon = svgIcon.extend({ icon: 'square' })
const checkSquareIcon = svgIcon.extend({ icon: 'check-square' })

export default fics<Data, { lang: string }>({
  name: 'tasks',
  data: () => ({ value: '', placeholder: '', isShown: false, tasks: [] }),
  fetch: ({ props: { lang } }) => i18n({ directory: '/i18n', lang, key: ['tasks'] }),
  props: [
    {
      descendant: input,
      values: ({ setData, getData }) => ({
        value: getData('value'),
        placeholder: getData('placeholder'),
        input: (value: string) => setData('value', value),
        enterKey: async () => {
          setData('tasks', await addTask(getData('value')))
          setData('value', '')
        }
      })
    },
    {
      descendant: addIcon,
      values: ({ setData, getData }) => ({
        click: async () => {
          const value = getData('value')

          if (value !== '') {
            setData('tasks', await addTask(value))
            setData('value', '')
          }
        }
      })
    },
    {
      descendant: [squareIcon, checkSquareIcon],
      values: ({ setData, getData }) => ({ click: () => setData('isShown', !getData('isShown')) })
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
                  ${setProps(svgIcon.extend({ icon: completedAt ? 'check' : 'circle' }), {
                    click: async () => {
                      setData('tasks', await (completedAt ? revertTask(id) : completeTask(id)))
                    }
                  })}
                  <span class="${completedAt ? 'done' : ''}">
                    <a href="${getPath(lang, `/todo/${id}`)}">${title}</a>
                  </span>
                </div>
                ${setProps(svgIcon.extend({ icon: 'trash' }), {
                  color: variable('red'),
                  click: async () => {
                    if (window.confirm(confirmation)) setData('tasks', await deleteTask(id))
                  }
                })}
              </div>
            `
            )
          : template`<p>${unapplicable}</p>`
      }
    `
  },
  css,
  actions: {
    '.menu span': {
      click: [({ data: { isShown }, setData }) => setData('isShown', !isShown), { blur: true }]
    }
  },
  hooks: { mounted: async ({ setData }) => setData('tasks', await getAllTasks()) },
  options: { lazyLoad: true }
})
