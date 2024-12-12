import { fics } from 'ficsjs'
import i18n from 'ficsjs/i18n'
import { Task } from '@/types'
import { getAllTasks, addTask, completeTask, deleteTask } from '@/indexedDB'
import loadingIcon from '@/components/materials/loadingIcon'
import input from '@/components/materials/input'
import svg from '@/components/materials/svg'
import getPath from '@/utils'
import css from './style.css?inline'

interface Data {
  placeholder: string
  isShown: boolean
  checkbox: string
  tasks: Task[]
  unapplicable: string
}

const addIcon = svg.clone({ icon: 'add' })
const squareIcon = svg.clone({ icon: 'square' })
const checkSquareIcon = svg.clone({ icon: 'check-square' })

export default fics<Data, { lang: string }>({
  name: 'tasks',
  data: () => ({ placeholder: '', isShown: false, checkbox: '', tasks: [], unapplicable: '' }),
  fetch: async ({ $props: { lang } }) => ({
    ...(await i18n({ directory: '/i18n', lang, key: ['tasks'] })),
    tasks: await getAllTasks()
  }),
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
              await addTask(input.getData('value'))
              $setData('tasks', await getAllTasks())
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
              await addTask(value)
              $setData('tasks', await getAllTasks())
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
    $template,
    $setProps,
    $isLoaded
  }) => {
    if (!$isLoaded) return $template`${loadingIcon}`

    return $template`
      <div class="menu">
        <div>${input}${addIcon}</div>
        <div>${isShown ? checkSquareIcon : squareIcon}<span style="opacity:0; width: 0">${isShown ? checkSquareIcon : squareIcon}</span><span>${checkbox}</span></div>
      </div>
      ${
        tasks.length > 0
          ? (isShown ? tasks : tasks.filter(task => !task.completed_at)).map(
              ({ id, title, completed_at }) => $template`
                <div class="task" key="${id}">
                  <div>
                    ${$setProps(svg.clone({ icon: completed_at ? 'check' : 'circle' }), {
                      click: async () => {
                        await completeTask(id)
                        console.log(await getAllTasks())
                      }
                    })}
                    <span class="${completed_at ? 'done' : ''}">
                      <a href="${getPath(lang, `/todo/${id}`)}">${title}</a>
                    </span>
                  </div>
                  ${$setProps(svg.clone({ icon: 'trash' }), {
                    color: 'var(--red)',
                    click: async () => await deleteTask(id)
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
  options: { lazyLoad: true }
})
