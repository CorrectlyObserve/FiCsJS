import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { absoluteCenter, color } from 'ficsjs/style'
import Icon from '@/components/materials/Icon'
import Skeleton from '@/components/materials/Skeleton'
import { api, getPhotos, LIMIT_LENGTH } from '@/data/photos'
import type { Photo } from '@/types'
import { CircleX } from 'lucide-static'

const PHOTO_SIZE = 200

export default fics({
  name: 'photos',
  children: [Icon(), Skeleton()],
  data: () => ({ page: 0, photos: [] as Photo[], photo: {} as Omit<Photo, 'isLoaded'> }),
  deferredData: async ({ data: { page }, crud }) =>
    await crud<Photo[]>(getPhotos(++page)).then(photos => ({ page, photos })),
  props: {
    descendant: ({ children: { icon } }) => icon,
    values: ({ setData }) => ({
      svg: CircleX,
      areaLabel: 'Close the dialog',
      click: () => setData('photo', {} as Photo)
    })
  },
  className: 'min-h-200',
  html: ({
    children: { icon, skeleton },
    data: {
      photos,
      photo: { id, author }
    },
    template,
    show,
    apiStatuses: { isLoading },
    isBrowser,
    isDeferred,
    virtualScroll
  }) => {
    const skeletons = template`${[...Array(LIMIT_LENGTH)].map(_ => template`${skeleton}`)}`

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
      <dialog class="rounded-xl" open ${show(!!id)}>
        ${icon}<p class="text-base text-white mx-4 mb-4 whitespace-nowrap">Created by ${author}</p>
      </dialog>
    `
  },
  css: {
    img: { ...absoluteCenter('x'), top: 0 },
    dialog: {
      ...absoluteCenter('xy', 'fixed'),
      background: `${color({ hex: '#282828', rate: 0.5 })}`,
      '.icon': { display: 'flex', justifyContent: 'end' }
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
      ],
      error: [
        ({ data: { photos }, setData, event: { target }, attributes: { key } }) => {
          setData(
            'photos',
            photos.map(photo => {
              if (photo.id === key) photo.isLoaded = true
              return photo
            })
          )

          if (target) {
            const img = target as HTMLImageElement
            img.replaceWith(img.cloneNode(true))
          }
        },
        { once: true }
      ],
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
            key === id ? ({} as Photo) : { id: key, author: photos[parseInt(key)]?.author }
          ),
        { throttle: 500, blur: true }
      ]
    }
  },
  scroll: {
    rootMargin: '100px 0px 0px 0px',
    trigger: ({ data: { photos } }) => photos.length > 0,
    minLength: LIMIT_LENGTH,
    elementMinHight: PHOTO_SIZE,
    throttle: 200,
    method: async ({ data: { photos, page }, setData, crud }) =>
      await crud<Photo[]>(getPhotos(++page), { key: 'isLoading' }).then(newPhotos => {
        setData('page', page)
        setData('photos', [...photos, ...newPhotos])
        goto(`/scroll?page=${page}`, { reload: false })
      })
  }
})
