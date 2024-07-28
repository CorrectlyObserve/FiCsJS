import fics from '../packages/core/fics'

export const Sample = () =>
  fics({
    name: 'sample',
    data: () => ({ value: '' }),
    html: ({ data: { value }, template }) =>
      template`
        ${value !== '' ? template`<p>${value}</p>` : ''}
        <input type="text" value="${value}" />
        ${value !== '' ? template`<input id="1"  type="text" value="${value}" />` : ''}
      `,
    css: [{ style: { color: 'white' } }],
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
