import { fics } from 'ficsjs'
import i18n from 'ficsjs/i18n'
import loadingIcon from '@/components/materials/loadingIcon'
import input from '@/components/materials/input'
import svg from '@/components/materials/svg'
import { addTask, completeTask, deleteTask, getAllTasks } from '@/indexedDB'
import { Task } from '@/types'
import getPath from '@/utils'
import css from './style.css?inline'

interface Data {
  placeholder: string
  isShown: boolean
  checkbox: string
  tasks: Task[]
  unapplicable: string
}

const addIcon = svg.extend({ icon: 'add' })
const squareIcon = svg.extend({ icon: 'square' })
const checkSquareIcon = svg.extend({ icon: 'check-square' })

export default fics<Data, { lang: string }>({
  name: 'tasks',
  data: () => ({ placeholder: '', isShown: false, checkbox: '', tasks: [], unapplicable: '' }),
  fetch: ({ $props: { lang } }) => i18n({ directory: '/i18n', lang, key: ['tasks'] }),
  props: [
    {
      descendant: input,
      values: [
        { key: 'placeholder', content: ({ $data: { placeholder } }) => placeholder },
        {
          key: 'enter',
          content:
            ({ $setData }) =>
            async () => {
              $setData('tasks', await addTask(input.getData('value')))
              input.setData('value', '')
            }
        }
      ]
    },
    {
      descendant: addIcon,
      values: {
        key: 'click',
        content:
          ({ $setData }) =>
          async () => {
            const value = input.getData('value')

            if (value !== '') {
              $setData('tasks', await addTask(value))
              input.setData('value', '')
            }
          }
      }
    },
    {
      descendant: [squareIcon, checkSquareIcon],
      values: {
        key: 'click',
        content:
          ({ $setData, $getData }) =>
          () =>
            $setData('isShown', !$getData('isShown'))
      }
    }
  ],
  html: ({
    $data: { isShown, checkbox, tasks, unapplicable },
    $props: { lang },
    $setData,
    $template,
    $setProps,
    $isLoaded
  }) => {
    if (!$isLoaded) return $template`${loadingIcon}`

    return $template`
      <div class="menu">
        <div>${input}${addIcon}</div>
        <div>${isShown ? checkSquareIcon : squareIcon}<span>${checkbox}</span></div>
      </div>
      ${
        tasks.length > 0
          ? (isShown ? tasks : tasks.filter(task => !task.completed_at)).map(
              ({ id, title, completed_at }) => $template`
                <div class="task" key="${id}">
                  <div>
                    ${$setProps(svg.extend({ icon: completed_at ? 'check' : 'circle' }), {
                      click: async () => {
                        $setData('tasks', await completeTask(id))
                        $setData('isShown', true)
                      }
                    })}
                    <span class="${completed_at ? 'done' : ''}">
                      <a href="${getPath(lang, `/todo/${id}`)}">${title}</a>
                    </span>
                  </div>
                  ${$setProps(svg.extend({ icon: 'trash' }), {
                    color: 'var(--red)',
                    click: async () => $setData('tasks', await deleteTask(id))
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
