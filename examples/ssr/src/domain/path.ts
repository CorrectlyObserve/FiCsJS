export const paths = {
  api: { WS: '/api/ws', LOG: '/api/log', STREAM: '/api/stream' },
  HOME: '/',
  LOGIN: '/login',
  LOGOUT: '/logout',
  BREAK_SESSION: '/break-session',
  ACCOUNT: '/account',
  SCROLL: '/scroll',
  CHAT: '/websocket-sse',
  USERS: '/users',
  NEW_USER: '/users/new'
} as const

export const getUserPath = (id: number): string => `${paths.USERS}/${id}`

export const pages = {
  HOME: { href: paths.HOME, name: 'Top' },
  USERS: { href: paths.USERS, name: 'Users' },
  NEW_USER: { href: paths.NEW_USER, name: 'Add a user' },
  ACCOUNT: { href: paths.ACCOUNT, name: 'Account' },
  CHAT: { href: paths.CHAT, name: 'WebSocket & SSE' },
  ACTIVITIES: { href: `${paths.CHAT}/activities`, name: 'Activities' },
  STREAM: { href: `${paths.CHAT}/stream`, name: 'Stream' },
  SCROLL: { href: paths.SCROLL, name: 'Photos' }
} as const
