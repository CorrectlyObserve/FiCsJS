import { fics, type FiCs } from 'ficsjs'
import { cssVar, fill, flex, radius, space } from 'ficsjs/style'
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
    descendants: ({ children: { Textarea } }) => Textarea,
    values: ({ data }) => ({
      id: 'message',
      label: 'Message',
      placeholder: 'Message',
      hint: 'Press the Shift + Enter keys to send.',
      isSrOnly: true,
      input: (value: string) => (data.comment = value)
    })
  },
  {
    descendants: ({ children: { Button } }) => Button,
    values: ({ data: { comment } }) => ({ text: 'Send', isDisabled: comment.trim() === '' })
  }
]

const html: FiCs.Html<Data, Props> = ({
  children: { Textarea, Button },
  props: { userName: currentUserName, messages },
  template,
  attributes: {
    a11y: { liveLog, srOnly }
  }
}) => template`
  <section>
    <h3>Chat</h3>
    <div ${liveLog} tabindex="0" aria-label="Messages">
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
    <form novalidate>${Textarea}${Button}</form>
  </section>
`

const css: FiCs.Css<Data, Props> = ({ a11y: { liveLog } }) => `
  :host {
    ${flex()}; flex-grow: 1;

    section {
      ${flex({ direction: 'column', gap: space('md') })};
      flex-grow: 1;

      div${liveLog}, form { width: min(100%, ${cssVar('max-width')}); }

      div${liveLog} {
        --name-height-with-gap: calc(1lh + ${space('sm')});
        --one-line-message-height: calc(1lh + ${space('sm')} * 2);
        
        ${flex({ direction: 'column', gap: space('md') })}
        position: relative;
        contain: size;
        flex-grow: 1;
        min-height: calc(${cssVar('name-height-with-gap')} + ${cssVar('one-line-message-height')});
        overflow-y: auto;
        overscroll-behavior: contain;

        > div {
          ${flex({ direction: 'column', gap: space('sm') })};
          width: ${cssVar('min-width')};

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
        margin-top: ${space('md')};

        > :first-child { flex: 999 1 0; }
      }
    }
  }
`

const actions: FiCs.Actions<Data, Props> = {
  form: {
    submit: ({ event: { currentTarget }, props: { userName, sendMessage }, submitForm }) => {
      submitForm(
        async ({ message }: { message: string }) => {
          if (userName === '' || message.trim() === '') return

          sendMessage({ userName, comment: message })
          ;(currentTarget as HTMLFormElement).reset()
        },
        { shouldReportValidity: false }
      )
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
