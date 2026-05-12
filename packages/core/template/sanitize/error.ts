import type { Template } from '../../types'
import { constants } from '../constants'

export const error = (name: string, type: 'name' | 'unquoted' | Template.Context | unknown) => {
  switch (type) {
    case 'name':
    case 'unquoted':
      return new Error(
        `The attribute fragment in ${name} is ${type === 'name' ? 'invalid' : 'not properly closed'}...`
      )

    case 'text':
    case 'tag':
    case constants.char.DOUBLE_QUOTE:
    case constants.char.SINGLE_QUOTE:
      return new Error(
        `HTML content cannot be interpolated into an ${type === 'tag' ? 'element tag' : 'attribute value'} in the ${name}...`
      )

    default: {
      const _type: string = type === null ? 'null' : Array.isArray(type) ? 'array' : typeof type
      return new Error(`The "${_type}" interpolation is not supported in the ${name}...`)
    }
  }
}
