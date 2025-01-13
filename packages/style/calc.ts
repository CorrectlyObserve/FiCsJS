export default (values: (string | number)[], operator: '+' | '-' | '*' | '/'): string =>
  `calc(${values.join(` ${operator} `)})`
