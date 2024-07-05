import fics from '../packages/core/fics'

export const Sample = () =>
  fics({
    name: 'sample',
    data: () => ({ value: '' }),
    html: ({ data: { value }, template }) =>
      template`<div><input key="1" value="${value}" value="1" /><p>value is: ${value}</p></div>`,
    css: [{ style: { color: 'white' } }, { selector: 'div', style: { padding: '32px' } }],
    actions: [
      {
        handler: 'input',
        selector: 'input',
        method: ({ setData, event }) => {
          setData('value', (event.target as HTMLInputElement).value)
        }
      }
    ]
  })

export type SvgType = ReturnType<typeof Sample>
