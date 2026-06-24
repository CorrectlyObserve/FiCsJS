import { isBrowser } from './../core/helpers/browser'

if (isBrowser()) throw new Error('Please import only its types on the client...')

/** @remarks ensures as an ES module */
export {}
