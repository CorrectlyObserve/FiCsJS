import { fics, type FiCs } from 'ficsjs'
import { cssVar, flexCenter } from 'ficsjs/style'
import Button from '@/components/Button'
import Textarea from '@/components/Textarea'
import type { Message } from '@/domain/message'

interface Data {
  comment: string
}

interface Props {
  userName: string
  messages: readonly Message[]
  sendMessage: (message: Message) => void
}

const props: FiCs.Props<Data, Props> = [
  {
    descendants: ({ children: { textarea } }) => textarea,
    values: ({ data }) => ({
      id: 'message',
      label: 'Message',
      placeholder: 'Please enter your message',
      hint: 'Press the Shift + Enter keys to send.',
      isSrOnly: true,
      input: (value: string) => (data.comment = value)
    })
  },
  {
    descendants: ({ children: { button } }) => button,
    values: ({ data: { comment } }) => ({ text: 'Send', isDisabled: comment.trim() === '' })
  }
]

const html: FiCs.Html<Data, Props> = ({
  children: { button },
  data: { comment },
  props: { messages },
  template
}) => {
  const currentUserName = $userName.get()

  return template`
    <h2 class="text-lg text-white text-center mb-6">Chat</h2>
    <div
      class="w-full block mx-auto overflow-y-auto"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      ${messages.map(
        ({ userName, comment }, index) => template`
          <div class="w-full mb-4 ${userName === currentUserName ? 'flex justify-end' : ''}" key="${index}">
            <div ${userName === currentUserName ? 'aria-label="Your message"' : ''}>
              <p class="text-white mb-2">${userName}</p>
              <p class="text-white px-3 py-2 rounded-lg whitespace-pre-line">${comment}</p>
            </div>
          </div>
        `
      )}
    </div>
    <div class="input-field gap-4 w-full bg-dark px-4 mt-6">
      <label class="sr-only" for="message">Message</label>
      <div class="w-full max-w-xl gap-4">
        <textarea
          id="message"
          aria-describedby="message-help"
          class="w-full text-white p-3 border rounded-lg resize-none transition duration-200 ease-out cursor-text outline-none"
          placeholder="Please enter your message"
          rows="3"
        >${comment}</textarea>
        ${button}
      </div>
      <p id="message-help" class="text-sm text-white">Press the Shift + Enter keys to send.</p>
    </div>
  `
}

const css: FiCs.Css<Data, Props> = {
  ':host': {
    ...flexCenter('y', { direction: 'column' }),
    flexGrow: 1,
    minHeight: 0
  },
  div: {
    '&[role="log"]': {
      flexGrow: 1,
      width: '100%',
      maxWidth: cssVar('chat-width'),
      minHeight: 0,
      'div[key]': {
        '&:last-child': { marginBlockEnd: '0' },
        div: { width: '20rem', 'p:last-child': { background: white(0.1) } }
      }
    },
    '&.input-field': {
      ...flexCenter('y', { direction: 'column' }),
      div: {
        ...flexCenter('y'),
        textarea: {
          '&:hover': { background: white(0.1) },
          '&:focus-visible': { outline: `${cssVar('outline')} solid ${cssVar('color-pink')}` }
        }
      }
    }
  }
}

const hooks: FiCs.Hooks<Data, Props> = {
  created: () => {
    if ($userName.get() !== '') return

    const newUserName = prompt('Please enter your name.')
    newUserName ? $userName.set(newUserName) : (window.location.href = '/')
  }
}

const actions: FiCs.Actions<Data, Props> = {
  form: {
    submit: ({ event, props: { userName, sendMessage }, submitForm }) => {
      const value: { message: string } | null | void = submitForm({ shouldReportValidity: false })
      if (!value || userName === '' || value.message.trim() === '') return

      sendMessage({ userName, comment: value.message })
      ;(event.currentTarget as HTMLFormElement).reset()
    }
  }
}

export default fics<Data, Props>({
  name: 'chat',
  children: [Textarea(), Button()],
  data: () => ({ comment: '' }),
  props,
  html,
  css,
  actions,
  options: { form: { value: () => null } }
})
