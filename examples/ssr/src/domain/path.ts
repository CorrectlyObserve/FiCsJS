export const paths = {
  api: { WS: '/api/ws', LOG: '/api/log', STREAM: '/api/stream' },
  HOME: '/',
  LOGIN: '/login',
  LOGOUT: '/logout',
  BREAK_SESSION: '/break-session',
  USER: '/user',
  NEW_USER: '/user/new',
  ACCOUNT: '/account',
  SCROLL: '/scroll',
  WS_SSE: '/websocket-sse'
} as const

export const getUserPath = (id: number): string => `${paths.USER}/${id}`

export const pages = {
  USERS: { href: paths.HOME, name: 'Users' },
  NEW_USER: { href: paths.NEW_USER, name: 'Add a user' },
  ACCOUNT: { href: paths.ACCOUNT, name: 'Account' },
  WS_SSE: { href: paths.WS_SSE, name: 'WebSocket & SSE' },
  CHAT: { href: paths.WS_SSE, name: 'Chat' },
  ACTIVITIES: { href: `${paths.WS_SSE}/activities`, name: 'Activities' },
  STREAM: { href: `${paths.WS_SSE}/stream`, name: 'Stream' },
  SCROLL: { href: paths.SCROLL, name: 'Infinite & virtual scroll' }
} as const
