import fics from '../packages/core/fics'

const Iframe = () =>
  fics({
    name: 'iframe',
    data: () => ({ value: '' }),
    html: ({ template, bind }) =>
      template`<iframe
          ${bind()}
          allow-presentation
          width="500"
          height="300"
          src="https://www.youtube.com/embed/rbVYinBgnQw"
          title="【使い方動画】面談予約の方法"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        />`
  })

const Content = () =>
  fics({
    name: 'iframe-sample',
    data: () => ({ value: '' }),
    html: ({ data: { value }, template, bind }) =>
      template`<div><input ${bind()} value="${value}" type="text" /><p>value: ${value}</p></div>${Iframe()}`,
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
  })

fics({
  name: 'route',
  data: () => ({ value: '' }),
  html: ({ template, bind }) =>
    template`<audio ${bind()} controls loop>
          <source src="https://qumeru.com/preview/JavaScript/376/sample1/musics/music.mp3" type="audio/mp3">
        </audio>${Content()}`
}).define()
