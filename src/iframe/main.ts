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

type IframeType = ReturnType<typeof Iframe>

const Video = () =>
  fics({
    name: 'video',
    data: () => ({ value: '' }),
    html: ({ template, bind }) =>
      template`<video ${bind()} width="500" src="https://b-risk.jp/wp/wp-content/uploads/2021/08/mp4_embedding.mp4" controls loop autoplay muted playsinline></video>`
  })

type VideoType = ReturnType<typeof Video>

const Content = (iframe: IframeType, video: VideoType) =>
  fics({
    name: 'iframe-sample',
    data: () => ({ value: '' }),
    html: ({ data: { value }, template, bind }) =>
      template`<div><input ${bind()} value="${value}" type="text" /><p>value: ${value}</p></div>${iframe}${video}`,
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

type ContentType = ReturnType<typeof Content>

const Route = (content: ContentType) =>
  fics({
    name: 'route',
    data: () => ({ value: '' }),
    html: ({ data: { value }, template, bind }) =>
      template`<div><input ${bind()} value="${value}" type="text" /><p>value: ${value}</p></div>
    <audio ${bind()} controls loop>
          <source src="https://qumeru.com/preview/JavaScript/376/sample1/musics/music.mp3" type="audio/mp3">
        </audio>${content}`,
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

Route(Content(Iframe(), Video())).define()
