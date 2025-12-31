import { fics } from 'ficsjs'
import { fadeInOut } from 'ficsjs/animation'
import { goto, queries } from 'ficsjs/router'
import { absoluteCenter, cssVar, flexCenter } from 'ficsjs/style'
import Icon from '@/components/Icon'
import { API_PATH, getPhotos, UNIT_LENGTH } from '@/data/photos'
import Skeleton from '@/pages/scroll/_components/Skeleton'
import type { Photo } from '@/types'
import { dark } from '@/utils'
import { CircleX } from 'lucide-static'

const PHOTO_SIZE = 200 as const

export default fics({
  name: 'photos',
  children: [Icon(), Skeleton],
  data: () => ({
    page: 0,
    photos: [] as Photo[],
    photoId: '',
    photoElement: null as HTMLImageElement | null,
    author: ''
  }),
  deferredData: async ({ data, crud }) => {
    data.page++

    return await crud<Photo[]>(getPhotos(data.page)).then(photos => ({
      page: data.page,
      photos
    }))
  },
  props: {
    descendant: ({ children: { icon } }) => icon,
    values: ({ data }) => ({
      svg: CircleX,
      areaLabel: 'Close the dialog',
      click: () => {
        data.photoId = ''
        data.photoElement?.focus()
        data.photoElement = null
      }
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
          ({ id, author, isLoaded }, index) => template`
            <div class="relative h-50" key="${id}-container">
              ${skeleton}
              <img
                class="clickable mx-auto"
                src="${API_PATH}/id/${id}/${PHOTO_SIZE}/${PHOTO_SIZE}.webp?blur"
                alt="Image created by ${author}"
                key="${id}"
                data-index="${index}"
                tabindex="0"
                role="button"
                aria-haspopup="dialog"
                aria-controls="photo-dialog"
                aria-expanded="${photoId === id ? 'true' : 'false'}"
                ${show(isLoaded)}
              />
            </div>
          `
        )}
      </div>
      ${isLoading ? skeletons : ''}
      <dialog
        id="photo-dialog"
        class="w-3xs rounded-lg"
        open
        aria-modal="true"
        aria-labelledby="dialog-title"
        ${show(photoId !== '')}
      >
        ${icon}
        <h3 id="dialog-title" class="sr-only">Photo details</h3>
        <p class="text-base text-white text-center mt-2 mx-4 mb-4">Created by ${author}</p>
      </dialog>
    `
  },
  css: {
    'div.photos': ({ data: { photos } }) => ({
      'div.relative': flexCenter('xy'),
      img: {
        position: 'absolute',
        top: 0,
        '&:focus-visible': {
          zIndex: 1,
          '&[data-index="0"]': { marginTop: cssVar('outline') },
          [`&[data-index="${photos.length - 1}"]`]: { marginBottom: cssVar('outline') }
        }
      }
    }),
    dialog: {
      ...absoluteCenter('xy', 'fixed'),
      ...fadeInOut('0.2s ease-out'),
      background: dark(0.8),
      '.icon': { display: 'flex', justifyContent: 'end' }
    }
  },
  hooks: {
    created: ({ data }) => {
      const initialPage = parseInt(queries().page)
      if (!isNaN(initialPage)) data.page = initialPage
    },
    mounted: ({ data, throttle }) =>
      window.addEventListener(
        'keydown',
        throttle(event => {
          if (event.key !== 'Escape' || data.photoId === '') return

          event.preventDefault()
          data.photoId = ''
          data.photoElement?.focus()
          data.photoElement = null
        }, 1000)
      )
  },
  actions: {
    img: {
      load: [
        ({ data, attributes: { key } }) => {
          const { photos } = data,
            photo = photos.find(({ id }) => id === key)

          if (photo && !photo.isLoaded) {
            photo.isLoaded = true
            data.photos = [...photos]
          }
        },
        { once: true }
      ],
      error: [
        ({ data, event: { currentTarget }, attributes: { key } }) => {
          const { photos } = data,
            photo = photos.find(({ id }) => id === key)

          if (photo && !photo.isLoaded) {
            photo.isLoaded = true
            data.photos = [...photos]
          }

          if (currentTarget) {
            const img = currentTarget as HTMLImageElement
            img.replaceWith(img.cloneNode(true))
          }
        },
        { once: true }
      ],
      click: [
        ({ data, event: { currentTarget }, ref, attributes: { key } }) => {
          const isOpening = data.photoId !== key

          data.photoId = isOpening ? key : ''
          data.author = isOpening ? (data.photos.find(({ id }) => id === key)?.author ?? '') : ''

          if (currentTarget && currentTarget instanceof HTMLImageElement) {
            data.photoElement = currentTarget
            if (!isOpening) return

            const closeButton = ref('button')
            if (closeButton instanceof HTMLButtonElement) setTimeout(() => closeButton.focus())
          }
        },
        { throttle: 500 }
      ],
      keydown: [
        ({ event }) => {
          const keyEvent = event as KeyboardEvent

          if (keyEvent.key !== 'Enter' && keyEvent.key !== ' ') return
          keyEvent.preventDefault()
          ;(keyEvent.currentTarget as HTMLElement | null)?.click()
        },
        { throttle: 500 }
      ]
    }
  },
  scroll: {
    unit: UNIT_LENGTH,
    elementMinHeight: PHOTO_SIZE,
    trigger: ({ data: { photos } }) => photos.length > 0,
    throttle: 200,
    method: async ({ data, crud }) =>
      await crud<Photo[]>(getPhotos(++data.page), { key: 'isLoading' }).then(photos => {
        data.page = data.page
        data.photos = [...data.photos, ...photos]
        goto(`/scroll?page=${data.page}`)
      })
  }
})
