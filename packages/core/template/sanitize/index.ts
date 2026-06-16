import { constants } from '../../constants'
import { isBlankString } from '../../helpers'
import type { Template } from '../../types'
import { escape } from '../escape'
import { error } from './error'
import { normalizeAttrFragment } from './normalizer'
import { getTemplateContexts } from './parser'
import { hasSymbol, isQuote } from './validator'

const {
  symbols: { SANITIZED, UNSAFE_HTML }
} = constants

export const sanitize = <T>({
  strings,
  variables,
  name,
  isFiCsElement
}: Template.Sanitized<T>): (T | string)[] => {
  const converted: (T | string)[] = [],
    processValue = (variable: unknown, context: Template.Context): void => {
      if (variable === null || variable === undefined) return

      if (hasSymbol(variable, SANITIZED)) {
        if (context !== 'text') throw error(name, context)

        const sanitized: Template.Variable<T> = variable[SANITIZED] as Template.Variable<T>

        if (Array.isArray(sanitized) && sanitized.length > 0) converted.push(...sanitized)
        else if (typeof sanitized === 'string' && sanitized !== '') converted.push(sanitized)

        return
      }

      if (hasSymbol(variable, UNSAFE_HTML)) {
        if (context !== 'text') throw error(name, context)

        const unsafeHtml: string = variable[UNSAFE_HTML] as string
        if (unsafeHtml !== '') converted.push(unsafeHtml)

        return
      }

      if (isFiCsElement(variable)) {
        if (context !== 'text') throw error(name, context)
        converted.push(variable)
        return
      }

      if (Array.isArray(variable)) {
        for (const child of variable) processValue(child, context)
        return
      }

      /* @remarks Prohibits other invalid types */
      if (
        typeof variable === 'object' ||
        typeof variable === 'function' ||
        typeof variable === 'symbol'
      )
        throw error(name, variable)

      if (typeof variable === 'boolean' && context === 'tag') {
        if (!variable) return
        throw error(name, variable)
      }

      const stringified: string = variable.toString(),
        fragment: string =
          context === 'tag'
            ? normalizeAttrFragment(stringified, name)
            : escape(stringified, context === 'text' ? 'text-content' : 'attr')

      if (!isBlankString(fragment)) converted.push(fragment)
    },
    contexts: Template.Context[] = getTemplateContexts(strings)

  for (let index = 0; index < variables.length; index++) {
    const context: Template.Context = contexts[index],
      template: string = strings[index]

    if (isQuote(context)) {
      const { length }: { length: number } = converted
      processValue(variables[index], context)

      const processedTemplate: string = converted.length === length ? template.trimEnd() : template
      if (processedTemplate !== '') converted.splice(length, 0, processedTemplate)
    } else {
      if (template !== '') converted.push(template)
      processValue(variables[index], context)
    }
  }

  const trailing: string = strings[strings.length - 1]
  if (trailing !== '') converted.push(trailing)

  return converted
}
