import { fics } from 'ficsjs'
import Button from '@/components/materials/Button'
import { $userName } from '@/store'
import type { Message } from '@/types'

export default fics<
  { comment: string },
  { messages: Message[]; sendMessage: ({ userName, comment }: Message) => void }
>({
  name: 'chat',
  children: [Button()],
  data: () => ({ comment: '' }),
  props: {
    descendant: ({ children: { button } }) => button,
    values: ({ props: { sendMessage }, setData }) => ({
      isDisabled: ({ getData }) => getData('comment') === '',
      buttonText: 'Send',
      click:
        ({ getData }) =>
        () => {
          const userName = $userName.get()
          if (userName === '') return

          sendMessage({ userName, comment: getData('comment') })
          setData('comment', '')
        }
    })
  },
  html: ({ children: { button }, data: { comment }, props: { messages }, template }) => template`
    <div>
      <h2 class="text-lg text-white text-center">Chat</h2>
      <div>
        <textarea id="message" class="text-white" placeholder="Please enter your message">${comment}</textarea>
        ${button}
      </div>
      ${messages.map(({ userName, comment }) => template`<p class="text-white mt-2">${userName}: ${comment}</p>`)}
    </div>
  `,
  hooks: {
    created: () => {
      if ($userName.get() !== '') return

      const newUserName = prompt('Please enter your name.')
      newUserName ? $userName.set(newUserName) : (window.location.href = '/')
    }
  },
  actions: {
    textarea: {
      input: ({ setData, event: { currentTarget } }) =>
        setData('comment', (currentTarget as HTMLTextAreaElement).value)
    }
  }
})
