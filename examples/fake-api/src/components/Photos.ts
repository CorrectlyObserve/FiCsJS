import { fics } from 'ficsjs'
import css from '@/.tailwindcss.txt'

interface Photo {
  id: string
  author: string
}

const root = 'https://picsum.photos'
const getPhotos = (page: number) => `${root}/v2/list?page=${page}&limit=10`

export default () =>
  fics<{ count: number; photos: Photo[] }, {}>({
    name: 'photos',
    data: () => ({ count: 0, photos: [] }),
    fetch: async ({ data: { count }, crud }) => {
      count++
      return { count, photos: await crud<Array<Photo>>(getPhotos(count)) }
    },
    html: ({ data: { photos }, template }) => template`
      ${photos.map(
        ({ id, author }) => template`
          <div key="${id}">
            <button popovertarget="${id}"><img src="${root}/id/${id}/300/300?blur" /></button>
            <div id="${id}" popover>
              <button popovertarget="${id}" popovertargetaction="hide" aria-hidden="true">X</button>
              <p>Created by ${author}</p>
            </div>
          </div>
        `
      )}
    `,
    css: typeof window !== 'undefined' ? css : undefined,
    hooks: {
      mounted: async ({ data: { count }, setData, getData, crud }) => {
        setData('count', count++)
        setData('photos', [
          ...getData('photos'),
          ...(await crud<Array<Photo>>(getPhotos(getData('count'))))
        ])
      }
    }
  })
