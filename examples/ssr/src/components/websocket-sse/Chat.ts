import { fics } from 'ficsjs'
import { calc, cssVar, flexCenter } from 'ficsjs/style'
import Button from '@/components/Button'
import { $userName } from '@/store'
import type { Message } from '@/types'
import { white } from '@/utils'

const MARGIN_BOTTOM = '2rem' as const

export default fics<
  { comment: string },
  { messages: Message[]; sendMessage: (message: Message) => void }
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
      <div class="w-10.75 h-full block mx-auto">
        ${messages.map(
          ({ userName, comment }, index) => template`
            <div class="w-full" key="${index}">
              <p class="text-white mb-2">${userName}</p>
              <p class="text-white px-3 py-2 mb-4 rounded-lg whitespace-pre-line">${comment}</p>
            </div>
          `
        )}
      </div>
      <div class="fixed right-0 gap-4 w-full bg-dark px-4 mt-6">
        <textarea id="message" class="w-full max-w-xl text-white p-3 border rounded-lg resize-none transition duration-200 ease-out cursor-text outline-none" placeholder="Please enter your message" rows="3">${comment}</textarea>
        ${button}
      </div>
    </div>
  `,
  css: {
    div: {
      '[key] p:last-child': { background: white(0.1) },
      '.fixed': {
        ...flexCenter('xy'),
        bottom: calc(`${cssVar('footer-height')} + ${MARGIN_BOTTOM}`),
        textarea: {
          '&:hover': { opacity: 0.5 },
          '&:focus': { background: white(0.05), opacity: 1 }
        }
      }
    }
  },
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
