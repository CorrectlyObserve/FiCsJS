import { fics } from 'ficsjs'
import i18n from 'ficsjs/i18n'
import { goto } from 'ficsjs/router'
import loadingIcon from '@/components/materials/loadingIcon'
import input from '@/components/materials/input'
import textarea from '@/components/materials/textarea'
import button from '@/components/materials/button'
import { completeTask, revertTask, deleteTask, updateTask, getTask } from '@/indexedDB'
import { getPath, getTimestamp } from '@/utils'
import type { Task } from '@/types'

type Datetime = 'createdAt' | 'updatedAt'

interface Data {
  task: Task
  heading: string
  title: string
  description: string
  placeholders: string[]
  datetimes: Record<Datetime, string>
  buttonText: string
  texts: string[]
  confirmation: string
}

const backToTaskList = (lang: string) => goto(getPath(lang, '/todo'))

export default fics<Data, { lang: string; id: number }>({
  name: 'task',
  data: () => ({
    task: {} as Task,
    heading: '',
    title: '',
    description: '',
    placeholders: [],
    datetimes: {} as Record<Datetime, string>,
    buttonText: '',
    texts: [],
    confirmation: ''
  }),
  fetch: async ({ $props: { lang } }) => ({
    ...(await i18n<Data>({ directory: '/i18n', lang, key: 'task' })),
    confirmation: await i18n({ directory: '/i18n', lang, key: ['tasks', 'confirmation'] })
  }),
  props: [
    {
      descendant: input,
      values: [
        { key: 'id', content: () => 'title' },
        {
          key: 'value',
          dataKey: 'task',
          content: ({
            $data: {
              task: { title }
            }
          }) => title
        },
        {
          key: 'placeholder',
          dataKey: 'placeholders',
          content: ({ $data: { placeholders } }) => placeholders[0]
        },
        {
          key: 'input',
          dataKey: 'task',
          content:
            ({ $data: { task }, $setData }) =>
            (title: string) =>
              $setData('task', { ...task, title })
        }
      ]
    },
    {
      descendant: textarea,
      values: [
        { key: 'id', content: () => 'description' },
        {
          key: 'value',
          dataKey: 'task',
          content: ({
            $data: {
              task: { description }
            }
          }) => description
        },
        {
          key: 'placeholder',
          dataKey: 'placeholders',
          content: ({ $data: { placeholders } }) => placeholders[1]
        },
        {
          key: 'input',
          dataKey: 'task',
          content:
            ({ $data: { task }, $setData }) =>
            (description: string) =>
              $setData('task', { ...task, description })
        }
      ]
    },
    {
      descendant: button,
      values: [
        { key: 'buttonText', content: ({ $data: { buttonText } }) => buttonText },
        {
          key: 'click',
          dataKey: 'task',
          content:
            ({
              $data: {
                task: { title, description }
              },
              $props: { id, lang },
              $setData
            }) =>
            async () => {
              await updateTask({ id, title, description })
              $setData('task', await getTask(id))
              backToTaskList(lang)
            }
        }
      ]
    }
  ],
  html: ({
    $data: {
      task,
      heading,
      title,
      description,
      datetimes,
      texts: [complete, revert, ...args]
    },
    $template,
    $isLoaded
  }) => {
    if (!$isLoaded) return $template`${loadingIcon}`

    return $template`
      <h2>${heading}</h2>
      <div class="container">
        <fieldset><label for="title">${title}</label>${input}</fieldset>
        <fieldset><label for="description">${description}</label>${textarea}</fieldset>
        ${Object.entries(datetimes).map(
          ([key, value]) => $template`<p>${value}${getTimestamp(task[key as Datetime])}</p>`
        )}
        ${button}
        <div>
          ${[task.completedAt ? revert : complete, ...args].map(
            text => $template`<span role="button" tabindex="0">${text}</span>`
          )}
        </div>
      </div>
    `
  },
  css: {
    selector: 'div.container',
    style: { width: 'calc(var(--md) * 20)', marginInline: 'auto' },
    nested: [
      {
        selector: 'fieldset',
        style: { display: 'flex', flexDirection: 'column', marginBottom: 'var(--md)', border: 0 },
        nested: { selector: 'label', style: { marginBottom: 'var(--ex-sm)' } }
      },
      {
        selector: 'p',
        style: { marginBottom: 'var(--ex-sm)', textAlign: 'left' },
        nested: { selector: ':last-of-type', style: { marginBottom: 'var(--ex-lg)' } }
      },
      {
        selector: 'div',
        style: { display: 'flex', flexDirection: 'column', marginTop: 'var(--ex-lg)' },
        nested: [
          {
            selector: 'span',
            style: {
              marginInline: 'auto',
              marginBottom: 'var(--ex-lg)',
              textDecoration: 'underline',
              transition: 'var(--transition)'
            },
            nested: [
              {
                selector: ':nth-of-type(2)',
                style: { color: 'var(--red)' },
                nested: { selector: ':focus', style: { opacity: 0.2 } }
              },
              { selector: ':hover', style: { cursor: 'pointer', opacity: 0.5 } }
            ]
          }
        ]
      }
    ]
  },
  actions: [
    {
      handler: 'click',
      selector: 'span:first-of-type',
      method: async ({
        $data: {
          task: { id, completedAt }
        },
        $setData
      }) => {
        completedAt ? await revertTask(id) : await completeTask(id)
        $setData('task', await getTask(id))
      },
      options: { throttle: 500, blur: true }
    },
    {
      handler: 'click',
      selector: 'span:nth-of-type(2)',
      method: async ({
        $data: {
          task: { id },
          confirmation
        },
        $props: { lang }
      }) => {
        if (window.confirm(confirmation)) {
          await deleteTask(id)
          backToTaskList(lang)
        }
      },
      options: { throttle: 500, blur: true }
    },
    {
      handler: 'click',
      selector: 'span:last-of-type',
      method: ({ $props: { lang } }) => backToTaskList(lang),
      options: { throttle: 500, blur: true }
    }
  ],
  hooks: {
    mounted: async ({ $props: { id }, $setData }) => $setData('task', await getTask(id))
  },
  options: { lazyLoad: true }
})
