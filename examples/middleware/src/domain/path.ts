export const HOME_PATH = '/' as const

export const LOGIN_PATH = '/login' as const
export const LOGOUT_PATH = '/logout' as const
export const BREAK_SESSION_PATH = '/break-session' as const

export const USERS_PATH = '/users' as const
export const NEW_USER_PATH = `${USERS_PATH}/new` as const

export const userPath = (id: number): string => `${USERS_PATH}/${id}`
