import { fics } from 'ficsjs'
import { cssVar } from 'ficsjs/style'
import Icon from '@/components/Icon'
import { API_PATHS, dark } from '@/utils'
import { RefreshCcw } from 'lucide-static'

export default fics({
  name: 'stream',
  children: [Icon()],
  data: () => ({ isAccumulated: false, accumulatedChunk: '', chunks: [] as string[] }),
  props: {
    descendant: ({ children: { icon } }) => icon,
    values: ({ setData }) => ({
      svg: RefreshCcw,
      areaLabel: 'Open the data stream dialog',
      isLarge: true,
      click:
        ({ getData }) =>
        () =>
          setData('isAccumulated', !getData('isAccumulated'))
    })
  },
  html: ({
    children: { icon },
    data: { isAccumulated, accumulatedChunk, chunks },
    template
  }) => template`
    <h2 class="text-lg text-white text-center mb-6">Stream</h2>
    ${
      isAccumulated
        ? template`
          <p class="max-w-full text-white mx-auto break-words">${accumulatedChunk}</p>
        `
        : template`
          <div class="w-fit mx-auto">
            ${chunks.map(chunk => template`<p class="text-white mb-4">${chunk}</p>`)}
          </div>
        `
    }
    <span class="fixed bottom-8 right-4" style="background: ${dark()}">${icon}</span>
  `,
  css: {
    ':host': {
      '> p': { width: cssVar('chat-width'), lineHeight: 2 },
      'div p:last-child': { 'margin-bottom': '0' }
    }
  },
  hooks: {
    updated: {
      isAccumulated: ({ data: { isAccumulated }, setData, getData, crud }) => {
        if (isAccumulated) {
          let buffer = ''

          void crud(API_PATHS.stream, {
            onChunk: (chunked: string) => {
              buffer += chunked

              const blocks = buffer.split('\n\n')
              buffer = blocks.pop() || ''

              for (const block of blocks) {
                if (block.trim() === '') continue

                let event: string | undefined, data: string | undefined

                for (const line of block.split('\n'))
                  if (line.startsWith('event:')) {
                    const index = line.indexOf('data:')
                    event = line.slice('event:'.length, index > -1 ? index : undefined).trim()
                  } else if (line.startsWith('data:')) data = line.slice('data:'.length).trim()

                if (data)
                  try {
                    const { chunk } = JSON.parse(data) as { chunk?: string; index: number }
                    if (chunk) setData('accumulatedChunk', `${getData('accumulatedChunk')}${chunk}`)
                  } catch {}

                if (event === 'complete')
                  setData('accumulatedChunk', `${getData('accumulatedChunk')}...`)
              }
            }
          })
        } else setData('accumulatedChunk', '')
      }
    }
  },
  options: {
    ssr: false,
    sse: {
      path: API_PATHS.stream,
      onmessage: ({ data: { chunks }, setData, event: { data } }) => {
        try {
          const { chunk, index } = JSON.parse(data) as { chunk: string; index: number }
          setData('chunks', [...chunks, `chunk[${index}]: ${chunk}`])
        } catch {
          setData('chunks', [...chunks, `message: ${data}`])
        }
      },
      actions: { complete: ({ close }) => close() }
    }
  }
})
