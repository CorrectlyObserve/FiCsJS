import { escapeRegExp } from '../../../core/helpers'

const uses = (code: string, id: string): boolean =>
  new RegExp(`\\b${escapeRegExp(id)}\\b`).test(code)