export const paths = {
  api: { WS: '/api/ws', LOG: '/api/log', STREAM: '/api/stream' },
  HOME: '/',
  LOGIN: '/login',
  LOGOUT: '/logout',
  BREAK_SESSION: '/break-session',
  ACCOUNT: '/account',
  SCROLL: '/scroll',
  WS_SSE: '/websocket-sse',
  USERS: '/users',
  NEW_USER: '/users/new'
} as const

export const getUserPath = (id: number): string => `${paths.USERS}/${id}`

export const pages = {
  HOME: { href: paths.HOME, name: 'Home' },
  USERS: { href: paths.USERS, name: 'Users' },
  NEW_USER: { href: paths.NEW_USER, name: 'Add a user' },
  ACCOUNT: { href: paths.ACCOUNT, name: 'Account' },
  WS_SSE: { href: paths.WS_SSE, name: 'WebSocket & SSE' },
  CHAT: { href: paths.WS_SSE, name: 'Chat' },
  ACTIVITIES: { href: `${paths.WS_SSE}/activities`, name: 'Activities' },
  STREAM: { href: `${paths.WS_SSE}/stream`, name: 'Stream' },
  SCROLL: { href: paths.SCROLL, name: 'Infinite & virtual scroll' }
} as const
