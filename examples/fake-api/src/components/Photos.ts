import { fics } from 'ficsjs'
import css from '@/.tailwindcss.txt'

const root = 'https://picsum.photos'
const getPhotos = (page: number) => `${root}/v2/list?page=${page}&limit=10`

export default () =>
  fics<{ count: number; photos: { id: string; author: string }[] }, {}>({
    name: 'photos',
    data: () => ({ count: 0, photos: [] }),
    fetch: async ({ data: { count }, crud }) => {
      count++
      return { count, photos: await crud<Array<{ id: string; author: string }>>(getPhotos(count)) }
    },
    html: ({ data: { photos }, template }) => template`
      ${photos.map(({ id, author }) => {
        const popoverId = `popover-${id}`

        return template`
          <div class="flex bg-blue-500" key="${id}">
            <button popovertarget="${popoverId}"><img src="${root}/id/${id}/300/300?blur" /></button>
            <div id="${popoverId}" popover>
              <button popovertarget="${popoverId}" popovertargetaction="hide" aria-hidden="true">X</button>
              <p>Created by ${author}</p>
            </div>
          </div>
        `
      })}
    `,
    css: typeof window !== 'undefined' ? css : undefined,
    hooks: {
      mounted: async ({ data: { count }, setData, getData, crud }) => {
        setData('count', count++)
        setData('photos', [
          ...getData('photos'),
          ...(await crud<Array<{ id: string; author: string }>>(getPhotos(getData('count'))))
        ])
      }
    }
  })
