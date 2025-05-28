import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { absoluteCenter, color } from 'ficsjs/style'
import Icon from '@/components/Icon'
import Skeleton from '@/components/Skeleton'
import { api, getPhotos } from '@/data/photos'
import type { Photo } from '@/types'
import { X } from 'lucide-static'

const icon = Icon()
const skelton = Skeleton()

export default () =>
  fics({
    name: 'photos',
    data: () => ({ count: 0, photos: [] as Photo[], photo: {} as Photo, isLoading: false }),
    deferredData: async ({ data: { count }, crud }) =>
      await crud<Photo[]>(getPhotos(++count)).then(photos => ({ count, photos })),
    props: [{ descendant: icon, values: () => ({ icon: X }) }],
    className: 'min-h-200',
    html: ({
      data: {
        photos,
        photo: { id, author },
        isLoading
      },
      template,
      show,
      isBrowser,
      isDeferred
    }) => {
      const skeletons = template`${[...Array(5)].map(_ => template`${Skeleton()}`)}`

      if (!isBrowser || !isDeferred) return skeletons

      return template`
        <div class="images">
          ${photos.map(
            ({ id, author, isLoaded }) => template`
              <div class="relative h-50" key="${id}-container">
                ${skelton}
                <img
                  class="clickable mx-auto"
                  src="${api}/id/${id}/200/200.webp?blur"
                  alt="the image created by ${author}"
                  key="${id}"
                  tabindex="0"
                  ${show(isLoaded)}
                />
              </div>
            `
          )}
          ${isLoading ? skeletons : ''}
        </div>
        <dialog class="rounded-xl" open ${show(!!id)}>
          <button class="clickable block text-white ml-auto">${icon}</button>
          <p class="text-base text-white mx-4 mb-4 whitespace-nowrap">Created by ${author}</p>
        </dialog>
      `
    },
    css: {
      img: { ...absoluteCenter('x'), top: 0 },
      dialog: {
        ...absoluteCenter('xy', 'fixed'),
        background: `${color({ hex: '#282828', rate: 0.5 })}`
      }
    },
    actions: {
      img: {
        load: [
          ({ data: { photos }, setData, attributes: { key } }) =>
            setData(
              'photos',
              photos.map(photo => {
                if (photo.id === key) photo.isLoaded = true
                return photo
              })
            ),
          { once: true }
        ]
      },
      '.clickable': {
        click: [
          ({
            data: {
              photos,
              photo: { id }
            },
            setData,
            attributes: { key }
          }) =>
            setData(
              'photo',
              !!id && (key === id || key === undefined)
                ? ({} as Photo)
                : { id: key, author: photos[parseInt(key)]?.author, isLoaded: false }
            ),
          { throttle: 500, blur: true }
        ]
      }
    },
    scroll: {
      area: 'div.images',
      rootMargin: '200px 0px 0px 0px',
      trigger: ({ data: { photos } }) => photos.length > 0,
      method: async ({ data: { photos, count }, setData, crud }) =>
        await crud<Photo[]>(getPhotos(++count), { key: 'isLoading' }).then(newPhotos => {
          setData('count', count)
          setData('photos', [...photos, ...newPhotos])
          goto(`/scroll?page=${count}`, { reload: false })
        })
    }
  })
