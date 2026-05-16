import { fics } from 'ficsjs'
import { zoom } from 'ficsjs/animation'
import { queries } from 'ficsjs/router'
import { cssVar, flexCenter, hideScrollbar, positionCenter } from 'ficsjs/style'
import Icon from '@/components/Icon'
import { BASE_URL, getPhotos, PAGE_KEY, PHOTOS_KEY, UNIT_LENGTH } from '@/data/photos'
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
    author: '',
    onEscapeKeydown: null as ((event: KeyboardEvent) => void) | null
  }),
  deferredData: async ({ data, queryCache }) => {
    const nextPage = data.page + 1,
      key = ['photos', nextPage] as const

    await queryCache.prefetch<Photo[]>(key, ({ signal }) =>
      fetch(getPhotos(nextPage), { signal }).then(resolve => resolve.json())
    )

    const photos = queryCache.get<Photo[]>(key) ?? []

    queryCache.set<Photo[]>(PHOTOS_KEY, photos)
    queryCache.set<number>(PAGE_KEY, nextPage)

    return { page: nextPage, photos }
  },
  props: [
    {
      descendant: ({ children: { icon } }) => icon,
      values: ({ data }) => ({
        svg: CircleX,
        ariaLabel: 'Close the dialog',
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
    scroll
  }) => {
    const skeletons = [...Array(UNIT_LENGTH)].map(_ => template`${skeleton}`)

    if (photos.length === 0) return template`<div class="flex-x">${skeletons}</div>`

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
                src="${BASE_URL}/id/${id}/${PHOTO_SIZE}/${PHOTO_SIZE}.webp?blur"
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
        aria-labelledby="dialog-title"
        ${photoId !== '' ? 'open' : ''}
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
      ...positionCenter('xy', 'fixed'),
      ...zoom('0.2s ease-out'),
      background: dark(0.8),
      '.icon': { display: 'flex', justifyContent: 'end' }
    }
  },
  hooks: {
    created: ({ data, queryCache, signal }) => {
      const initialPage = parseInt(queries().page)
      if (Number.isInteger(initialPage) && initialPage > 0) data.page = initialPage - 1

      const params = { data, signal, shouldSyncCache: false }

      queryCache.bindData({ ...params, key: PHOTOS_KEY, dataKey: 'photos' })
      queryCache.bindData({ ...params, key: PAGE_KEY, dataKey: 'page' })
    },
    mounted: ({ data, throttle }) => {
      window.history.scrollRestoration = 'manual'

      const onEscapeKeydown = throttle((event: KeyboardEvent) => {
        if (event.key !== 'Escape' || data.photoId === '') return

        event.preventDefault()
        data.photoId = ''
        data.photoElement?.focus()
        data.photoElement = null
      }, 1000) as (event: KeyboardEvent) => void

      data.onEscapeKeydown = onEscapeKeydown
      window.addEventListener('keydown', onEscapeKeydown)
    },
    destroyed: ({ data }) => {
      if (!data.onEscapeKeydown) return
      window.removeEventListener('keydown', data.onEscapeKeydown)
      data.onEscapeKeydown = null
    }
  },
  actions: {
    img: {
      load: [
        ({ data, queryCache, event: { currentTarget }, attributes: { key } }) => {
          if (!currentTarget) return

          const index = parseInt((currentTarget as HTMLImageElement).dataset.index ?? '')
          if (!Number.isInteger(index)) return

          const photo = data.photos[index]
          if (!photo || photo.id !== key || photo.isLoaded) return

          queryCache.set<Photo[]>(PHOTOS_KEY, current => {
            const newPhotos = [...(current ?? data.photos)]

            newPhotos[index] = { ...photo, isLoaded: true }
            return newPhotos
          })
        },
        { once: true }
      ],
      error: [
        ({ data, queryCache, event: { currentTarget }, attributes: { key } }) => {
          if (!currentTarget) return

          const img = currentTarget as HTMLImageElement,
            index = parseInt(img.dataset.index ?? '')

          if (Number.isInteger(index)) {
            const photo = data.photos[index]

            if (photo && photo.id === key && !photo.isLoaded)
              queryCache.set<Photo[]>(PHOTOS_KEY, current => {
                const newPhotos = [...(current ?? data.photos)]

                newPhotos[index] = { ...photo, isLoaded: true }
                return newPhotos
              })
          }

          img.replaceWith(img.cloneNode(true))
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
        { throttleMs: 500 }
      ],
      keydown: [
        ({ event }) => {
          const keyEvent = event as KeyboardEvent

          if (keyEvent.key !== 'Enter' && keyEvent.key !== ' ') return
          keyEvent.preventDefault()
          ;(keyEvent.currentTarget as HTMLElement | null)?.click()
        },
        { throttleMs: 500 }
      ]
    }
  },
  options: {
    scroll: ({ data, crud, queryCache }) => ({
      unit: UNIT_LENGTH,
      itemMinSize: PHOTO_SIZE,
      axis: data.isHorizontal ? 'horizontal' : 'vertical',
      trigger: data.photos.length > 0,
      parameter: 'page',
      rootMargin: PHOTO_SIZE,
      bufferLength: 2,
      throttleMs: 200,
      method: async () => {
        if (data.page < 1) return

        const nextPage = data.page + 1,
          key = ['photos', nextPage] as const,
          cachedPhotos: Photo[] | undefined = queryCache.get<Photo[]>(key)

        if (cachedPhotos !== undefined) {
          queryCache.set<Photo[]>(PHOTOS_KEY, current => [...(current ?? []), ...cachedPhotos])
          queryCache.set<number>(PAGE_KEY, nextPage)
          return
        }

        await queryCache.optimisticUpdate<number>({
          key: PAGE_KEY,
          newQuery: nextPage,
          updater: async () => {
            const photos = await crud<Photo[]>(getPhotos(nextPage), { key: 'isLoading' })

            if (data.page !== nextPage) return nextPage

            queryCache.set<Photo[]>(PHOTOS_KEY, current => [...(current ?? []), ...photos])
            queryCache.set<Photo[]>(key, photos)

            return nextPage
          }
        })
      }
    })
  }
})
