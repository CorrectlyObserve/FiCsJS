import { Template } from '../../types'
import consts from '../constants'

export default (name: string, type: 'name' | 'unquoted' | Template.Context | unknown) => {
  switch (type) {
    case 'name':
    case 'unquoted':
      return new Error(
        `The attribute fragment in ${name} is ${type === 'name' ? 'invalid' : 'not properly closed'}...`
      )

    case 'text':
    case 'tag':
    case consts.char.DOUBLE_QUOTE:
    case consts.char.SINGLE_QUOTE:
      return new Error(
        `HTML content cannot be interpolated into an ${type === 'tag' ? 'element tag' : 'attribute value'} in the ${name}...`
      )

    default:
      const _type: string = type === null ? 'null' : Array.isArray(type) ? 'array' : typeof type
      return new Error(`The "${_type}" interpolation is not supported in the ${name}...`)
  }
}
