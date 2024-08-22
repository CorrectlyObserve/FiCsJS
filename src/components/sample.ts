import fics from '../packages/core/fics'

export const Sample = () =>
  fics({
    name: 'sample',
    data: () => ({ value: '' }),
    html: ({ $data: { value }, $template, $html, $show }) =>
      $template`
        ${[1, 2, 3].map(num => `<p>${num}</p>`)}
        <p style="display: block;" ${$show(value !== '')}>value: ${value}</p>
        ${$html(`<p>${value}</p>`)}
        <input key="1" type="text" value="${value}" />
        ${value !== '' ? $template`<input type="text" value="${value}" />` : ''}
      `,
    css: [{ style: { color: 'white' } }],
    actions: [
      {
        handler: 'input',
        selector: 'input',
        method: ({ $setData, $event }) => {
          $setData('value', ($event.target as HTMLInputElement).value)
        }
      }
    ]
  })

export type SampleType = ReturnType<typeof Sample>
