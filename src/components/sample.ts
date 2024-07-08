import fics from '../packages/core/fics'
import importJson from '../packages/core/i18n'

const json = await importJson({ langs: ['ja'], directory: '.' })

export const Sample = () =>
  fics({
    name: 'sample',
    data: () => ({ value: '' }),
    html: ({ data: { value }, template, i18n }) =>
      template`
        <p>${i18n({ json, lang: 'ja', keys: ['apple', 'banana'] })}</p>
        ${value !== '' ? template`<p>${'value' + value}</p>` : ''}
        <input key="1" value="${value}" />
        ${value !== '' ? template`<input value="${value}" />` : ''}
      `,
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
