import { fics } from 'ficsjs'
import { fadeInOut } from 'ficsjs/animation'
import { goto, queries } from 'ficsjs/router'
import { absoluteCenter } from 'ficsjs/style'
import Icon from '@/components/Icon'
import { api, getPhotos, UNIT_LENGTH } from '@/data/photos'
import Skeleton from '@/pages/scroll/_components/Skeleton'
import type { Photo } from '@/types'
import { dark } from '@/utils'
import { CircleX } from 'lucide-static'

const PHOTO_SIZE = 200

export default fics({
  name: 'photos',
  children: [Icon(), Skeleton],
  data: () => ({ page: 0, photos: [] as Photo[], photoId: '', author: '' }),
  deferredData: async ({ data: { page }, crud }) =>
    await crud<Photo[]>(getPhotos(++page)).then(photos => ({ page, photos })),
  props: {
    descendant: ({ children: { icon } }) => icon,
    values: ({ setData }) => ({
      svg: CircleX,
      areaLabel: 'Close the dialog',
      click: () => setData('photoId', '')
    })
  },
  className: 'min-h-200',
  html: ({
    children: { icon, skeleton },
    data: { photos, photoId, author },
    template,
    show,
    apiStatuses: { isLoading },
    isBrowser,
    isDeferred,
    virtualScroll
  }) => {
    const skeletons = template`${[...Array(UNIT_LENGTH)].map(_ => template`${skeleton}`)}`

    if (!isBrowser || !isDeferred) return skeletons

    return template`
      <div class="photos">
        ${virtualScroll(
          photos,
          ({ id, author, isLoaded }) => template`
            <div class="relative h-50" key="${id}-container">
              ${skeleton}
              <img
                class="clickable mx-auto"
                src="${api}/id/${id}/${PHOTO_SIZE}/${PHOTO_SIZE}.webp?blur"
                alt="the image created by ${author}"
                key="${id}"
                tabindex="0"
                ${show(isLoaded)}
              />
            </div>
          `
        )}
      </div>
      ${isLoading ? skeletons : ''}
      <dialog class="w-3xs rounded-xl" open ${show(photoId !== '')}>
        ${icon}<p class="text-base text-white text-center mx-4 mb-4">Created by ${author}</p>
      </dialog>
    `
  },
  css: {
    img: { ...absoluteCenter('x'), top: 0 },
    dialog: {
      ...absoluteCenter('xy', 'fixed'),
      ...fadeInOut('0.2s ease-out'),
      background: dark(0.8),
      '.icon': { display: 'flex', justifyContent: 'end' }
    }
  },
  hooks: {
    created: ({ setData }) => {
      const page = parseInt(queries().page)
      if (!isNaN(page)) setData('page', page)
    }
  },
  actions: {
    img: {
      load: [
        ({ data: { photos }, setData, attributes: { key } }) => {
          const photo = photos.find(p => p.id === key)
          if (photo && !photo.isLoaded) {
            photo.isLoaded = true
            setData('photos', [...photos])
          }
        },
        { once: true }
      ],
      error: [
        ({ data: { photos }, setData, event: { currentTarget }, attributes: { key } }) => {
          const photo = photos.find(p => p.id === key)
          if (photo && !photo.isLoaded) {
            photo.isLoaded = true
            setData('photos', [...photos])
          }

          if (currentTarget) {
            const img = currentTarget as HTMLImageElement
            img.replaceWith(img.cloneNode(true))
          }
        },
        { once: true }
      ],
      click: [
        ({ data: { photos, photoId }, setData, attributes: { key } }) => {
          setData('photoId', photoId === key ? '' : key)

          if (photoId !== key)
            setData('author', photos.filter(({ id }) => id === key)[0]?.author ?? '')
        },
        { throttle: 500, blur: true }
      ]
    }
  },
  scroll: {
    unit: UNIT_LENGTH,
    elementMinHeight: PHOTO_SIZE,
    trigger: ({ data: { photos } }) => photos.length > 0,
    throttle: 200,
    method: async ({ data: { photos, page }, setData, crud }) =>
      await crud<Photo[]>(getPhotos(++page), { key: 'isLoading' }).then(newPhotos => {
        setData('page', page)
        setData('photos', [...photos, ...newPhotos])
        goto(`/scroll?page=${page}`)
      })
  }
})
