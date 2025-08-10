import { fics } from 'ficsjs'
import { dynamicPathParams, goto, queryParams } from 'ficsjs/router'
import { calc, cssVar, flexCenter } from 'ficsjs/style'
import LoadingIcon from '@/components/LoadingIcon'
import Icon from '@/components/materials/Icon'
import Input from '@/components/materials/Input'
import Textarea from '@/components/materials/Textarea'
import Button from '@/components/materials/Button'
import { $tasks, completeTask, deleteTask, getTask, revertTask, updateTask } from '@/store'
import type { Task } from '@/types'
import { breakpoints, convertTimestamp, getPath } from '@/utils'
import { Circle, CircleCheckBig } from 'lucide-static'

type Datetime = 'createdAt' | 'updatedAt'

interface Data {
  heading: string
  task: Task
  title: string
  isError: boolean
  error: string
  placeholders: string[]
  description: string
  buttonText: string
  status: string
  texts: string[]
  datetimes: Record<Datetime, string>
  confirmation: string
}

const backToTaskList = (lang: string) => goto(getPath(lang, '/')),
  { sm } = breakpoints

export default fics<Data, { lang: string }>({
  name: 'task',
  children: [LoadingIcon, Icon(), Input(), Textarea(), Button()],
  className: 'task',
  data: () => ({
    task: {} as Task,
    title: '',
    isError: false,
    error: '',
    placeholders: [],
    description: '',
    buttonText: '',
    texts: [],
    datetimes: {} as Record<Datetime, string>
  }),
  i18nData: async ({ props: { lang }, i18n }) => ({
    ...(await i18n<Data>({ lang, key: 'task' })),
    confirmation: await i18n({ lang, key: ['tasks', 'confirmation'] })
  }),
  props: [
    {
      descendant: ({ children: { loadingIcon } }) => loadingIcon,
      values: ({ props: { lang } }) => ({ lang })
    },
    {
      descendant: ({ children: { icon } }) => icon,
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
      descendant: ({ children: { input } }) => input,
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
      descendant: ({ children: { textarea } }) => textarea,
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
      descendant: ({ children: { button } }) => button,
      values: ({ props: { lang }, setData }) => ({
        isDisabled: ({ getData }) => getData('isError'),
        buttonText: ({ getData }) => getData('buttonText'),
        click:
          ({ getData }) =>
          async () => {
            const { id, title, description, completedAt }: Task = getData('task')

            await updateTask({ id, title, description })
            completedAt ? await completeTask(id) : await revertTask(id)

            const tasks: Task[] = await $tasks.get()
            setData('task', (await getTask(tasks, id))!)
            backToTaskList(lang)
          }
      })
    }
  ],
  html: ({
    children: { loadingIcon, icon, input, textarea, button },
    data: {
      heading,
      task,
      status,
      texts: [complete, revert, _delete, back, close],
      datetimes
    },
    template,
    isDeferred
  }) => {
    if (!isDeferred) return template`${loadingIcon}`

    const label = task.completedAt ? revert : complete

    return template`
      <h2>${heading}</h2>
      <div class="container">
        <fieldset>
          <label>${status}</label>
          <div>
            ${icon.setIndividualProps('icon', {
              svg: task.completedAt ? CircleCheckBig : Circle,
              areaLabel: label
            })}
            <span role="button" tabindex="0">${label}</span>
          </div>
        </fieldset>
        <fieldset>${input}</fieldset>
        <fieldset>${textarea}</fieldset>
        ${Object.entries(datetimes).map(
          ([key, value]) => template`<p>${value}${convertTimestamp(task[key as Datetime])}</p>`
        )}
        ${button}
        <div>
          ${[_delete, isNaN(parseInt(dynamicPathParams().id)) ? close : back].map(
            text => template`<span role="button" tabindex="0">${text}</span>`
          )}
        </div>
      </div>
    `
  },
  css: {
    'div.container': {
      width: sm,
      maxWidth: calc([calc([cssVar('md'), 30], '*'), calc([cssVar('xl'), 2], '*')], '-'),
      marginInline: 'auto',
      [`@media (max-width: ${sm})`]: { width: '100%' },
      fieldset: {
        display: 'flex',
        flexDirection: 'column',
        marginBottom: cssVar('md'),
        border: 0,
        label: { paddingBottom: cssVar('xs') },
        div: { display: 'flex', span: { ...flexCenter('y') } }
      },
      p: {
        marginBottom: cssVar('xs'),
        textAlign: 'left',
        '&:last-of-type': { marginBottom: cssVar('xl') }
      },
      '> div': {
        display: 'flex',
        flexDirection: 'column',
        marginTop: cssVar('md'),
        span: {
          padding: cssVar('md'),
          marginInline: 'auto',
          textDecoration: 'underline',
          transition: cssVar('transition'),
          '&:first-of-type': { color: cssVar('red'), '&:focus': { opacity: 0.2 } },
          '&:hover': { cursor: 'pointer', opacity: 0.5 },
          [`@media (max-width: ${sm})`]: { paddingBlock: cssVar('md') }
        }
      }
    }
  },
  hooks: {
    mounted: async ({ props: { lang }, setData }) => {
      const paramId = parseInt(dynamicPathParams().id),
        queryId = parseInt(queryParams().id)

      if (isNaN(paramId) && isNaN(queryId)) return goto(getPath(lang, '/404'))

      const tasks: Task[] = await $tasks.get(),
        task: Task | undefined = await getTask(tasks, isNaN(paramId) ? queryId : paramId)

      if (!task) return goto(getPath(lang, '/404'))
      setData('task', task)
    },
    updated: { task: async ({ data: { task }, setData }) => setData('isError', task.title === '') }
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
  options: { lazyLoad: true }
})
