import { fics } from 'ficsjs'
import { absoluteCenter, color } from 'ficsjs/style'
import { api, getPhotos, photos } from '@/data/photos'
import type { Photo } from '@/types'

export default () =>
  fics({
    name: 'photos',
    data: () => ({ count: 1, photos, photo: {} as Photo }),
    html: ({
      data: {
        photos,
        photo: { id, author }
      },
      template,
      show
    }) => template`
      <div class="min-h-250 mt-4">
        ${photos.map(
          ({ id }) =>
            template`<img class="clickable mx-auto" src="${api}/id/${id}/200/200.webp?blur" key="${id}" tabindex="0" />`
        )}
      </div>
      <dialog class="rounded-xl" open ${show(!!id)}>
        <button class="clickable block text-white p-3 ml-auto">X</button>
        <p class="text-base text-white mx-4 mb-4 whitespace-nowrap">Created by ${author}</p>
      </dialog>
    `,
    css: {
      dialog: {
        ...absoluteCenter('xy', true),
        background: `${color({ hex: '#282828', rate: 0.5 })}`
      }
    },
    hooks: {
      mounted: async ({ data: { photos, count }, setData, crud }) =>
        await crud<Photo[]>(getPhotos(++count)).then(newPhotos => {
          setData('count', count)
          setData('photos', [...photos, ...newPhotos])
        })
    },
    actions: {
      '.clickable': {
        click: [
          ({
            data: {
              photos,
              photo: { id }
            },
            setData,
            attributes
          }) => {
            const { key }: { key?: string } = attributes
            setData(
              'photo',
              !!id && (key === id || key === undefined)
                ? ({} as Photo)
                : { id: key, author: photos[parseInt(key)].author }
            )
          },
          { throttle: 500, blur: true }
        ]
      }
    }
  })
