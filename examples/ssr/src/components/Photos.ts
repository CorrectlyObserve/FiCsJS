import { fics } from 'ficsjs'
import { absoluteCenter, color } from 'ficsjs/style'
import Icon from '@/components/Icon'
import Skelton from '@/components/Skelton'
import { api, getPhotos } from '@/data/photos'
import type { Photo } from '@/types'
import { X } from 'lucide-static'

const icon = Icon()
const skelton = Skelton()

export default () =>
  fics({
    name: 'photos',
    data: () => ({ count: 0, photos: [] as Photo[], photo: {} as Photo, isLoading: false }),
    props: [{ descendant: icon, values: () => ({ icon: X }) }],
    className: 'min-h-200 mt-4',
    html: ({
      data: {
        photos,
        photo: { id, author },
        isLoading
      },
      template,
      show,
      isBrowser
    }) => {
      if (!isBrowser || isLoading) return template`${[...Array(5)].map(_ => template`${skelton}`)}`
      return template`
          ${photos.map(
            ({ id, author }) => template`
              <img
                class="clickable mx-auto"
                src="${api}/id/${id}/200/200.webp?blur"
                alt="the image created by ${author}"
                key="${id}"
                tabindex="0"
              />
            `
          )}
          <dialog class="rounded-xl" open ${show(!!id)}>
            <button class="clickable block text-white ml-auto">${icon}</button>
            <p class="text-base text-white mx-4 mb-4 whitespace-nowrap">Created by ${author}</p>
          </dialog>
        `
    },
    css: {
      dialog: {
        ...absoluteCenter('xy', true),
        background: `${color({ hex: '#282828', rate: 0.5 })}`
      }
    },
    hooks: {
      created: async ({ data: { photos, count }, setData, crud }) =>
        await crud<Photo[]>(getPhotos(++count), { key: 'isLoading' }).then(newPhotos => {
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
                : { id: key, author: photos[parseInt(key)]?.author }
            )
          },
          { throttle: 500, blur: true }
        ]
      }
    }
  })
