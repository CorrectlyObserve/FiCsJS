import fics from '../packages/core/fics'

const Iframe = () =>
  fics({
    name: 'iframe',
    html: ({ template }) =>
      template`<iframe
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
    html: ({ template }) =>
      template`<video width="500" src="https://b-risk.jp/wp/wp-content/uploads/2021/08/mp4_embedding.mp4" controls loop autoplay muted playsinline></video>`
  })

type VideoType = ReturnType<typeof Video>

const Content = (iframe: IframeType, video: VideoType) =>
  fics({
    name: 'iframe-sample2',
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

const Content2 = () =>
  fics({
    name: 'iframe-sample',
    html: ({ template }) =>
      template`<iframe
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

type ContentType2 = ReturnType<typeof Content2>

const Route = (content: ContentType, iframe: ContentType2) =>
  fics({
    name: 'route',
    data: () => ({ value: '' }),
    html: ({ data: { value }, template, bind }) =>
      template`<div><p>Route</p><input ${bind()} value="${value}" type="text" /><p>value: ${value}</p></div>
    <audio ${bind()} controls loop>
          <source src="https://qumeru.com/preview/JavaScript/376/sample1/musics/music.mp3" type="audio/mp3">
        </audio>${content}${iframe}`,
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

Route(Content(Iframe(), Video()), Content2()).define()
