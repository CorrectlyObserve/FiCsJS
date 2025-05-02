import { fics } from 'ficsjs'
import { absoluteCenter, flexCenter } from 'ficsjs/style'
import { api, getPhotos, photos } from '@/data/photos'
import type { Photo } from '@/types'

export default () =>
  fics({
    name: 'photos',
    data: () => ({ count: 1, photos }),
    className: 'pt-4',
    html: ({ data: { photos }, template }) => template`
      ${photos.map(
        ({ id, author }) => template`
          <div key="${id}">
            <button class="clickable" popovertarget="${id}">
              <img src="${api}/id/${id}/200/200.webp?blur" />
            </button>
            <div id="${id}" class="rounded-xl" popover>
              <button class="clickable block p-3 ml-auto" popovertarget="${id}" popovertargetaction="hide" aria-hidden="true">X</button>
              <p class="text-dark mx-4 mb-4 whitespace-nowrap">Created by ${author}</p>
            </div>
          </div>
        `
      )}
    `,
    css: { div: { '&[key]': { ...flexCenter('x') }, '&[popover]': { ...absoluteCenter() } } },
    hooks: {
      mounted: async ({ data: { photos, count }, setData, crud }) =>
        await crud<Photo[]>(getPhotos(++count)).then(newPhotos => {
          setData('count', count)
          setData('photos', [...photos, ...newPhotos])
        })
    }
  })
