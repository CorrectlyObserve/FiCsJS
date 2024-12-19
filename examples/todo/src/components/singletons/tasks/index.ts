import { fics } from 'ficsjs'
import i18n from 'ficsjs/i18n'
import loadingIcon from '@/components/materials/loadingIcon'
import input from '@/components/materials/input'
import icon from '@/components/materials/icon'
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

const addIcon = icon.extend({ icon: 'add' })
const squareIcon = icon.extend({ icon: 'square' })
const checkSquareIcon = icon.extend({ icon: 'check-square' })

export default fics<Data, { lang: string }>({
  name: 'tasks',
  data: () => ({
    heading: '',
    value: '',
    placeholder: '',
    isShown: false,
    checkbox: '',
    tasks: [],
    confirmation: '',
    unapplicable: ''
  }),
  fetch: ({ $props: { lang } }) => i18n({ directory: '/i18n', lang, key: ['tasks'] }),
  props: [
    {
      descendant: input,
      values: [
        { key: 'value', content: ({ $data: { value } }) => value },
        { key: 'placeholder', content: ({ $data: { placeholder } }) => placeholder },
        {
          key: 'input',
          content:
            ({ $setData }) =>
            (value: string) =>
              $setData('value', value)
        },
        {
          key: 'enterKey',
          dataKey: 'value',
          content:
            ({ $data: { value }, $setData }) =>
            async () => {
              $setData('tasks', await addTask(value))
              $setData('value', '')
            }
        }
      ]
    },
    {
      descendant: addIcon,
      values: {
        key: 'click',
        dataKey: 'value',
        content:
          ({ $data: { value }, $setData }) =>
          async () => {
            if (value !== '') {
              $setData('tasks', await addTask(value))
              $setData('value', '')
            }
          }
      }
    },
    {
      descendant: [squareIcon, checkSquareIcon],
      values: {
        key: 'click',
        dataKey: 'isShown',
        content:
          ({ $data: { isShown }, $setData }) =>
          () =>
            $setData('isShown', !isShown)
      }
    }
  ],
  html: ({
    $data: { heading, isShown, checkbox, tasks, confirmation, unapplicable },
    $props: { lang },
    $setData,
    $template,
    $setProps,
    $isLoaded
  }) => {
    if (!$isLoaded) return $template`${loadingIcon}`

    return $template`
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
          ? (isShown ? tasks : tasks.filter(task => !task.completedAt)).map(
              ({ id, title, completedAt }) => $template`
                <div class="task" key="${id}">
                  <div>
                    ${$setProps(icon.extend({ icon: completedAt ? 'check' : 'circle' }), {
                      click: async () => {
                        $setData('tasks', await (completedAt ? revertTask(id) : completeTask(id)))
                        $setData('isShown', !completedAt)
                      }
                    })}
                    <span class="${completedAt ? 'done' : ''}">
                      <a href="${getPath(lang, `/todo/${id}`)}">${title}</a>
                    </span>
                  </div>
                  ${$setProps(icon.extend({ icon: 'trash' }), {
                    color: 'var(--red)',
                    click: async () => {
                      if (window.confirm(confirmation)) $setData('tasks', await deleteTask(id))
                    }
                  })}
                </div>
              `
            )
          : $template`<p>${unapplicable}</p>`
      }
    `
  },
  css,
  actions: [
    {
      handler: 'click',
      selector: '.menu span',
      method: ({ $data: { isShown }, $setData }) => $setData('isShown', !isShown),
      options: { blur: true }
    }
  ],
  hooks: { mounted: async ({ $setData }) => $setData('tasks', await getAllTasks()) },
  options: { lazyLoad: true }
})
