import { fics } from 'ficsjs'
import { fadeInOut } from 'ficsjs/animation'
import { queries } from 'ficsjs/router'
import { absoluteCenter, cssVar, flexCenter, hideScrollbar } from 'ficsjs/style'
import Icon from '@/components/Icon'
import { API_PATH, getPhotos, UNIT_LENGTH } from '@/data/photos'
import AxisButton from '@/pages/scroll/_components/AxisButton'
import Skeleton from '@/pages/scroll/_components/Skeleton'
import type { Photo } from '@/types'
import { dark } from '@/utils'
import { CircleX } from 'lucide-static'

const PHOTO_SIZE = 200 as const

export default fics({
  name: 'photos',
  children: [Icon(), AxisButton, Skeleton],
  data: () => ({
    isHorizontal: false,
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
  props: [
    {
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
    {
      descendant: ({ children: { axisButton } }) => axisButton,
      values: ({ data }) => ({
        isHorizontal: data.isHorizontal,
        click: () => (data.isHorizontal = !data.isHorizontal)
      })
    }
  ],
  className: ({ data: { isHorizontal } }) =>
    isHorizontal ? 'block w-full overflow-x-hidden' : 'min-h-200',
  html: ({
    children: { icon, axisButton, skeleton },
    data: { isHorizontal, photos, photoId, author },
    template,
    show,
    apiStatuses: { isLoading },
    attributes: { statusLiveRegion, boolean },
    isBrowser,
    isDeferred,
    scroll
  }) => {
    const skeletons = [...Array(UNIT_LENGTH)].map(_ => template`${skeleton}`)

    if (!isBrowser || !isDeferred) return template`<div class="flex-x">${skeletons}</div>`

    return template`
      ${axisButton}
      <p class="sr-only" ${statusLiveRegion}>
        The current scroll axis is ${isHorizontal ? 'horizontal' : 'vertical'}.
      </p>
      <div class="flex-x">
        ${scroll(
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
                aria-expanded="${boolean(photoId === id)}"
                ${show(isLoaded)}
              />
            </div>
          `
        )}
        ${isLoading ? skeletons : ''}
      </div>
      <dialog
        id="photo-dialog"
        class="w-3xs rounded-lg border border-white z-1"
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
    div: ({ data: { isHorizontal, photos } }) => ({
      '&.flex-x': {
        ...hideScrollbar,
        ...(isHorizontal ? flexCenter('x') : {}),
        'div.relative': {
          ...flexCenter('xy'),
          ...(isHorizontal
            ? {
                marginBlock: cssVar('outline'),
                '&:first-child': { marginInlineStart: cssVar('outline') },
                '&:last-child': { marginInlineEnd: cssVar('outline') }
              }
            : {})
        },
        img: {
          position: 'absolute',
          top: 0,
          '&:focus, &:focus-visible': {
            zIndex: 1,
            '&[data-index="0"]': {
              [`margin${isHorizontal ? 'Inline' : 'Block'}Start`]: cssVar('outline')
            },
            [`&[data-index="${photos.length - 1}"]`]: {
              [`margin${isHorizontal ? 'Inline' : 'Block'}End`]: cssVar('outline')
            }
          }
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
      if (!isNaN(initialPage) && initialPage > 0) data.page = initialPage - 1
    },
    mounted: ({ data, throttle }) => {
      window.history.scrollRestoration = 'manual'
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
    }
  },
  actions: {
    img: {
      load: [
        ({ data, attributes: { key } }) =>
          (data.photos = data.photos.map(photo =>
            photo.id === key && !photo.isLoaded ? { ...photo, isLoaded: true } : photo
          )),
        { once: true }
      ],
      error: [
        ({ data, event: { currentTarget }, attributes: { key } }) => {
          data.photos = data.photos.map(photo =>
            photo.id === key && !photo.isLoaded ? { ...photo, isLoaded: true } : photo
          )

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

            const closeButton = ref('#photo-dialog button')
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
  options: {
    scroll: {
      unit: UNIT_LENGTH,
      elementMinSize: PHOTO_SIZE,
      axis: ({ data: { isHorizontal } }) => (isHorizontal ? 'horizontal' : 'vertical'),
      trigger: ({ data: { photos } }) => photos.length > 0,
      parameter: 'page',
      rootMargin: PHOTO_SIZE,
      throttle: 200,
      method: async ({ data, crud }) =>
        await crud<Photo[]>(getPhotos(++data.page), { key: 'isLoading' }).then(
          photos => (data.photos = [...data.photos, ...photos])
        )
    }
  }
})
