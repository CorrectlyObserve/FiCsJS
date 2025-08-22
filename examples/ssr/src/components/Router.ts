import { ficsRouter } from 'ficsjs/router'
import Tab from '@/components/Tab'
import Chat from '@/components/Chat'
import Logs from '@/components/Logs'
import { CHAT_PAGE } from '@/utils'

export default ficsRouter({
  pathname: CHAT_PAGE,
  children: [Tab, Chat, Logs],
  pages: [
    { path: `${CHAT_PAGE}`, content: ({ children: { chat } }) => chat },
    { path: `${CHAT_PAGE}/logs`, content: ({ children: { logs } }) => logs }
  ]
})
