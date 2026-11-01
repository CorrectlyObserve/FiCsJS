import { fics, type FiCs } from 'ficsjs'
import { cssVar, fill, flex, radius, size, space } from 'ficsjs/style'
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
  children: { textarea, button },
  props: { userName: currentUserName, messages },
  template,
  attributes: {
    a11y: { liveLog, srOnly }
  }
}) => template`
  <section>
    <h3>Chat</h3>
    <div ${liveLog}>
      ${messages.map(({ userName, comment }, index) => {
        const isMine = userName === currentUserName

        return template`
          <div key="${index}" style="align-self: flex-${isMine ? 'end' : 'start'}">
            ${isMine && template`<span ${srOnly}>Your message</span>`}
            <p>${userName}</p><p>${comment}</p>
          </div>
        `
      })}
    </div>
    <form novalidate>${textarea}${button}</form>
  </section>
`

const css: FiCs.Css<Data, Props> = ({ a11y: { liveLog } }) => `
  :host {
    ${flex()}; flex-grow: 1;

    section {
      ${flex({ gap: space('md') })}; flex-grow: 1;

      div${liveLog}, form { width: min(100%, ${cssVar('max-width')}); }

      div${liveLog} {
        ${flex({ direction: 'column', gap: space('md') })}
        flex-grow: 1;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;

        > div {
          ${flex({ direction: 'column', gap: space('sm') })};
          width: ${size(80)};

          > p:last-child {
            ${fill('bg-raised')};
            ${radius('sm')};
            padding-block: ${space('sm')};
            padding-inline: ${space('md')};
            white-space: pre-line;
          }
        }
      }

      form {
        ${flex({ direction: 'row', gap: space('md') })};

        > :first-child { flex: 999 1 0; }
      }
    }
  }
`

const actions: FiCs.Actions<Data, Props> = {
  form: {
    submit: ({ event: { currentTarget }, props: { userName, sendMessage }, submitForm }) => {
      const value: { message: string } | null | void = submitForm({ shouldReportValidity: false })
      if (!value || userName === '' || value.message.trim() === '') return

      sendMessage({ userName, comment: value.message })
      ;(currentTarget as HTMLFormElement).reset()
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
  options: { ssr: false, form: { value: () => null } }
})
