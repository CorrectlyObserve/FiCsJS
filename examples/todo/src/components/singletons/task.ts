import { fics } from 'ficsjs'
import { i18n } from 'ficsjs/i18n'
import { getParams, goto } from 'ficsjs/router'
import { calc, variable } from 'ficsjs/style'
import breakpoints from '@/breakpoints'
import { loadingIcon, svgIcon } from '@/components/materials/svgIcon'
import input from '@/components/materials/input'
import textarea from '@/components/materials/textarea'
import button from '@/components/materials/button'
import { completeTask, revertTask, deleteTask, updateTask, getTask } from '@/indexedDB'
import { getPath, getTimestamp } from '@/utils'
import type { Task } from '@/types'

type Datetime = 'createdAt' | 'updatedAt'

interface Data {
  task: Task
  title: string
  isError: boolean
  error: string
  placeholders: string[]
  description: string
  buttonText: string
  heading: string
  status: string
  texts: string[]
  datetimes: Record<Datetime, string>
  confirmation: string
}

const checkIcon = svgIcon.extend({ icon: 'check' })
const circleIcon = svgIcon.extend({ icon: 'circle' })
const backToTaskList = (lang: string) => goto(getPath(lang, '/'))

export default fics<Data, { lang: string }>({
  name: 'task',
  data: () => ({
    task: {} as Task,
    title: '',
    isError: false,
    error: '',
    placeholders: [],
    description: '',
    buttonText: '',
    texts: []
  }),
  fetch: async ({ props: { lang } }) => ({
    ...(await i18n<Data>({ directory: '/i18n', lang, key: 'task' })),
    confirmation: await i18n({ lang, key: ['tasks', 'confirmation'] })
  }),
  props: [
    {
      descendant: [checkIcon, circleIcon],
      values: ({ setData }) => ({
        click:
          ({ getData }) =>
          () => {
            const task: Task = getData('task')
            setData('task', { ...task, completedAt: task.completedAt ? undefined : Date.now() })
          }
      })
    },
    {
      descendant: input,
      values: ({ setData }) => ({
        id: 'title',
        label: ({ getData }) => getData('title'),
        isError: ({ getData }) => getData('isError'),
        error: ({ getData }) => getData('error'),
        value: ({ getData }) => getData('task').title,
        placeholder: ({ getData }) => getData('placeholders')[0],
        input:
          ({ getData }) =>
          (title: string) =>
            setData('task', { ...getData('task'), title })
      })
    },
    {
      descendant: textarea,
      values: ({ setData }) => ({
        id: 'description',
        label: ({ getData }) => getData('description'),
        placeholder: ({ getData }) => getData('placeholders')[1],
        value: ({ getData }) => getData('task').description,
        input:
          ({ getData }) =>
          (description: string) =>
            setData('task', { ...getData('task'), description })
      })
    },
    {
      descendant: button,
      values: ({ props: { lang }, setData }) => ({
        buttonText: ({ getData }) => getData('buttonText'),
        isDisabled: ({ getData }) => getData('isError'),
        click:
          ({ getData }) =>
          async () => {
            const { id, title, description, completedAt }: Task = getData('task')

            await updateTask({ id, title, description })
            completedAt ? await completeTask(id) : await revertTask(id)

            setData('task', await getTask(id))
            backToTaskList(lang)
          }
      })
    }
  ],
  html: ({
    data: {
      task,
      heading,
      status,
      texts: [complete, revert, ...args],
      datetimes
    },
    template,
    isLoaded
  }) => {
    if (!isLoaded) return template`${loadingIcon}`

    return template`
      <h2>${heading}</h2>
      <div class="container">
        <fieldset>
          <label>${status}</label>
          <div>
            ${task.completedAt ? checkIcon : circleIcon}
            <span role="button" tabindex="0">${task.completedAt ? revert : complete}</span>
          </div>
        </fieldset>
        <fieldset>${input}</fieldset><fieldset>${textarea}</fieldset>
        ${Object.entries(datetimes).map(
          ([key, value]) => template`<p>${value}${getTimestamp(task[key as Datetime])}</p>`
        )}
        ${button}
        <div>${args.map(text => template`<span role="button" tabindex="0">${text}</span>`)}</div>
      </div>
    `
  },
  css: {
    'div.container': {
      width: breakpoints.sm,
      maxWidth: calc([calc([variable('md'), 30], '*'), calc([variable('xl'), 2], '*')], '-'),
      marginInline: 'auto',
      [`@media (max-width: ${breakpoints.sm})`]: { width: '100%' },
      fieldset: {
        display: 'flex',
        flexDirection: 'column',
        marginBottom: variable('md'),
        border: 0,
        label: { paddingBottom: variable('xs') },
        div: { display: 'flex', span: { display: 'flex', alignItems: 'center' } }
      },
      p: {
        marginBottom: variable('xs'),
        textAlign: 'left',
        '&:last-of-type': { marginBottom: variable('xl') }
      },
      '> div': {
        display: 'flex',
        flexDirection: 'column',
        marginTop: variable('md'),
        span: {
          padding: variable('md'),
          marginInline: 'auto',
          textDecoration: 'underline',
          transition: variable('transition'),
          '&:first-of-type': { color: variable('red'), '&:focus': { opacity: 0.2 } },
          '&:hover': { cursor: 'pointer', opacity: 0.5 },
          [`@media (max-width: ${breakpoints.sm})`]: { paddingBlock: variable('md') }
        }
      }
    }
  },
  actions: {
    'fieldset label, fieldset span': {
      click: [
        ({ data: { task }, setData }) =>
          setData('task', { ...task, completedAt: task.completedAt ? undefined : Date.now() }),
        { throttle: 500, blur: true }
      ]
    },
    'div.container > div span:first-of-type': {
      click: [
        async ({
          data: {
            task: { id },
            confirmation
          },
          props: { lang }
        }) => {
          if (window.confirm(confirmation)) {
            await deleteTask(id)
            backToTaskList(lang)
          }
        },
        { throttle: 500, blur: true }
      ]
    },
    'div.container > div span:last-of-type': {
      click: [({ props: { lang } }) => backToTaskList(lang), { throttle: 500, blur: true }]
    }
  },
  hooks: {
    mounted: async ({ props: { lang }, setData }) =>
      setData(
        'task',
        await getTask(Number(getParams('path').id), () => goto(getPath(lang, `/404`)))
      ),
    updated: {
      task: async ({ datum, setData }) => setData('isError', datum.title === '')
    }
  },
  options: { lazyLoad: true }
})
