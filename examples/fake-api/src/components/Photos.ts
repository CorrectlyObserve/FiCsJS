import { fics } from 'ficsjs'

interface Data {
  count: number
  photos: { id: number; author: string }[]
}

const root = 'https://picsum.photos'
const getPhotos = (page: number) => `${root}/v2/list?page=${page}&limit=10`
const css = await Bun.file('./src/global.css').text()

export default () =>
  fics<Data, {}>({
    name: 'photos',
    data: () => ({ count: 0 }),
    fetch: async ({ data: { count }, crud }) => {
      count++
      const photos = await crud<Record<'id' | 'author' | string, string>[]>(getPhotos(count))

      return {
        count,
        photos: photos.map(({ id, author }) => ({ id: parseInt(id), author }))
      }
    },
    html: ({ data: { photos }, template }) => template`
      <div>
        ${photos.map(({ id, author }) => {
          const popoverId = `popover-${id}`

          return template`
            <img src="${root}/id/${id}/300/300?blur" popovertarget="${popoverId}" />
            <div id="${popoverId}" popover>
              <button popovertarget="${popoverId}" popovertargetaction="hide" aria-hidden="true">X</button>
              <p>Created by ${author}</p>
            </div>
          `
        })}
      </div>
    `,
    css,
    actions: {
      img: { click: ({ event: { target } }) => (target as HTMLImageElement).showPopover() }
    },
    hooks: {}
  })
