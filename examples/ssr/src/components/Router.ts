import { ficsRouter } from 'ficsjs/router'
import Tab from '@/components/Tab'
import Talk from '@/components/Talk'
import Logs from '@/components/Logs'

export default ficsRouter({
  pathname: '/chat',
  children: [Tab, Talk, Logs],
  pages: [
    { path: '/chat', content: ({ children: { talk } }) => talk },
    { path: '/chat/logs', content: ({ children: { logs } }) => logs }
  ]
})
