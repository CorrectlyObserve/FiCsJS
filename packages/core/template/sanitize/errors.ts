export default {
  attr: (name: string, type: 'name-error' | 'unquoted-error') =>
    new Error(
      `The attribute fragment in ${name} is ${type === 'name-error' ? 'invalid' : 'not properly closed'}...`
    )
} as const
