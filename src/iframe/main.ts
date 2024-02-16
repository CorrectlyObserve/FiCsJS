import fics from '../packages/core/fics'

fics({
  name: 'iframe',
  data: () => ({ value: '' }),
  html: ({ data: { value }, template, bind }) =>
    template`<div><input ${bind()} value="${value}" type="text" /><p>value: ${value}</p></div>
    <iframe ${bind()} width="500" height="300" src="https://www.youtube.com/embed/lpFM0kVnhpw" title="2024 Toyota Venza Overview | Toyota" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`,
  css: [
    { selector: 'div', style: { padding: '32px', textAlign: 'center' } },
    { selector: 'p', style: { color: '#fff' } }
  ],
  actions: [
    {
      selector: 'input',
      handler: 'input',
      method: ({ setData, event }) => setData('value', (event.target as HTMLInputElement).value)
    }
  ]
}).define()
