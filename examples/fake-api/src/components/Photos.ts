import { fics } from 'ficsjs'

interface Data {
  count: number
  photos: { id: number; author: string }[]
}

const css = await Bun.file('@/global.css').text()

export default () =>
  fics<Data, {}>({
    name: 'photos',
    data: () => ({ count: 0 }),
    fetch: async () => {
      return Promise.resolve({ photos: [] })
    },
    html: ({ data: { photos }, template }) => template`
      <div>
        ${photos.map(({ id, author }) => {
          const popoverId = `popover-${id}`

          return template`
            <img src="https://picsum.photos/id/${id}/300/300?blur" popovertarget="${popoverId}" />
            <div id="${popoverId}" popover>
              <button popovertarget="${popoverId}" popovertargetaction="hide" aria-hidden="true">X</button>
              <p>Created by ${author}<p>
            </div>
          `
        })}
      </div>
    `,
    css,
    hooks: {}
  })
