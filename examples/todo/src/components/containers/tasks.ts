import { fics } from 'ficsjs'
import i18n from 'ficsjs/i18n'
import { Task } from '@/types'
import { getAllTasks, addTask } from '@/indexedDB'
import loadingIcon from '@/components/presentations/loadingIcon/'
import input from '@/components/presentations/input'
import Svg from '@/components/presentations/svg'

interface Data {
  placeholder: string
  tasks: Task[]
  unapplicable: string
}

const addIcon = Svg()

export default fics<Data, { lang: string }>({
  name: 'tasks',
  data: () => ({ placeholder: '', tasks: [], unapplicable: '' }),
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
      values: [
        { key: 'icon', content: () => 'add' },
        { key: 'padding', content: () => 'var(--ex-sm)' },
        {
          key: 'click',
          content:
            ({ $setData }) =>
            async () => {
              await addTask(input.getData('value'))
              $setData('tasks', await getAllTasks())
              input.setData('value', '')
            }
        }
      ]
    }
  ],
  html: ({ $data: { tasks, unapplicable }, $template, $isLoaded }) => {
    if (!$isLoaded) return $template`${loadingIcon}`

    return $template`
      <div class="menu">${input}${addIcon}</div>
      ${
        tasks.length > 0
          ? tasks.map(({ id, title }) => $template`<p key="${id}">${title}</p>`)
          : $template`<p>${unapplicable}</p>`
      }
    `
  },
  css: {
    selector: 'div.menu',
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 'var(--ex-lg)'
    },
    nested: { selector: 'f-input', style: { marginRight: 'var(--md)' } }
  },
  options: { lazyLoad: true }
})
