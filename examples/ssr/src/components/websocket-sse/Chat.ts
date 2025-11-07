import { fics } from 'ficsjs'
import { calc, cssVar, flexCenter } from 'ficsjs/style'
import Button from '@/components/Button'
import { $userName } from '@/store'
import type { Message } from '@/types'
import { white } from '@/utils'

const LINK_HEIGHT = '3.75rem' as const, // (3rem (height) + 12px (margin bottom)) / 16
  TAB_HEIGHT = '4.625rem' as const, // (50px (height) + 24px (margin bottom)) / 16
  H2_HEIGHT = '37.33px' as const,
  H2_MARGIN_BOTTOM = '1.5rem' as const,
  FIXED_AREA_HEIGHT = '7.5rem' as const, // 1.5rem * 3 (textarea) + 0.75rem * 2 (padding) + 1.5rem (margin top)
  MAIN_MARGIN_BOTTOM = '2rem' as const,
  BODY_HEIGHT =
    `calc(${LINK_HEIGHT} + ${TAB_HEIGHT} + ${H2_HEIGHT} + ${H2_MARGIN_BOTTOM} + ${FIXED_AREA_HEIGHT} + ${MAIN_MARGIN_BOTTOM})` as const

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
  html: ({ children: { button }, data: { comment }, props: { messages }, template }) => {
    const currentUserName = $userName.get()

    return template`
      <h2 class="text-lg text-white text-center mb-6">Chat</h2>
      <div class="w-full block mx-auto overflow-y-auto">
        ${messages.map(
          ({ userName, comment }, index) => template`
            <div class="w-full mb-4 ${userName === currentUserName ? 'flex justify-end' : ''}" key="${index}">
              <div>
                <p class="text-white mb-2">${userName}</p>
                <p class="text-white px-3 py-2 rounded-lg whitespace-pre-line">${comment}</p>
              </div>
            </div>
          `
        )}
      </div>
      <div class="fixed right-0 gap-4 w-full bg-dark px-4 mt-6">
        <textarea id="message" class="w-full max-w-xl text-white p-3 border rounded-lg resize-none transition duration-200 ease-out cursor-text outline-none" placeholder="Please enter your message" rows="3">${comment}</textarea>
        ${button}
      </div>
    `
  },
  css: {
    div: {
      '&.block': {
        maxHeight: calc(
          `100vh - ${cssVar('header-height')} - ${BODY_HEIGHT} - ${cssVar('footer-height')}`
        ),
        maxWidth: cssVar('chat-width'),
        'div[key]': {
          '&:last-child': { marginBottom: '0' },
          div: { width: '20rem', 'p:last-child': { background: white(0.1) } }
        }
      },
      '&.fixed': {
        ...flexCenter('xy'),
        bottom: calc(`${cssVar('footer-height')} + ${MAIN_MARGIN_BOTTOM}`),
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
        setData('comment', (currentTarget as HTMLTextAreaElement).value),
      keydown: ({ getData, props: { sendMessage }, setData, event }) => {
        const keyboardEvent = event as KeyboardEvent

        if (keyboardEvent.shiftKey && keyboardEvent.key === 'Enter') {
          keyboardEvent.preventDefault()

          const userName = $userName.get()
          const comment = getData('comment')

          if (userName === '' || comment === '') return

          sendMessage({ userName, comment })
          setData('comment', '')
        }
      }
    }
  }
})
