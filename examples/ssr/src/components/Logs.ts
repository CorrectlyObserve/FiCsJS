import { fics } from 'ficsjs'

export default () =>
  fics<{ logs: string[] }, {}>({
    name: 'logs',
    data: () => ({ logs: [] }),
    html: ({ data: { logs }, template }) => template`
      ${logs.map(log => template`<p class="text-white">${log}</p>`)}
    `,
    sse: {
      path: '/sse',
      onopen: ({ setData }) => setData('logs', ['The server is connected.']),
      actions: {
        'time-update': ({ data: { logs }, setData, event: { data } }) =>
          setData('logs', [...logs, data])
      }
    }
  })
