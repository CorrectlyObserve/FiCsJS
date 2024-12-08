import { fics } from 'ficsjs'
import i18n from 'ficsjs/i18n'
import { Task } from '@/types'
import { getAllTasks, addTask } from '@/indexedDB'
import loadingIcon from '@/components/presentations/loadingIcon/'
import input from '@/components/presentations/input'
import Svg from '@/components/presentations/svg'
import getPath from '@/utils'
import css from './style.css?inline'

interface Data {
  placeholder: string
  isShown: boolean
  checkbox: string
  tasks: Task[]
  unapplicable: string
}

const addIcon = Svg('add')
const squareIcon = Svg('square')
const checkSquareIcon = Svg('check-square')
const circleIcon = Svg('circle')
const checkIcon = Svg('check')
const trashIcon = Svg('trash')

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
            await addTask(input.getData('value'))
            $setData('tasks', await getAllTasks())
            input.setData('value', '')
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
    },
    {
      descendant: checkIcon,
      values: {
        key: 'click',
        content:
          ({ $setData }) =>
          () =>
            console.log('aa')
      }
    },
    {
      descendant: circleIcon,
      values: {
        key: 'click',
        content:
          ({ $setData }) =>
          () =>
            console.log('bb')
      }
    },
    { descendant: trashIcon, values: { key: 'color', content: () => 'var(--red)' } }
  ],
  html: ({
    $data: { isShown, checkbox, tasks, unapplicable },
    $props: { lang },
    $template,
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
              ({ id, title, completed_at }) =>
                $template`
                  <div class="task" key="${id}">
                    <div>
                      ${completed_at ? checkIcon : circleIcon}
                      <span class="${completed_at ? 'done' : ''}">
                        <a href="${getPath(lang, `todo/${id}`)}">${title}</a>
                      </span>
                    </div>
                    ${trashIcon}
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
      method: ({ $data: { isShown }, $setData }) => {
        $setData('isShown', !isShown)
      },
      options: { blur: true }
    }
  ],
  options: { lazyLoad: true }
})
