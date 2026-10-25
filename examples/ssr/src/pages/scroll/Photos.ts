import { fics, type FiCs } from 'ficsjs'
import { zoom } from 'ficsjs/animation'
import { goto, queries } from 'ficsjs/router'
import { cssVar, flexCenter, hideScrollbar, positionCenter } from 'ficsjs/style'
import Icon from '@/components/Icon'
import AxisButton from '@/pages/scroll/AxisButton'
import Skeleton from '@/pages/scroll/Skeleton'
import { $axis, type Axis } from '@/pages/scroll/store'
import { MoveHorizontal, MoveVertical } from 'lucide-static'

interface Data {
  axis: Axis
  page: number
  photos: Photo[]
  photoId: string
  isOpen: boolean
}

const PAGE_KEY = ['page'] as const,
  PHOTOS_KEY = ['photos'] as const

const props: FiCs.Props<Data, {}> = [
  {
    descendants: ({ children: { skeleton } }) => skeleton,
    values: () => ({ size: PHOTO_SIZE, radius: 'sm' })
  },
  {
    descendants: ({ children: { iconButton } }) => iconButton,
    values: ({ data }) => {
      const nextAxis = data.axis === 'horizontal' ? 'vertical' : 'horizontal'
      return {
        svg: data.axis === 'horizontal' ? MoveVertical : MoveHorizontal,
        ariaLabel: `Switch axis direction to ${nextAxis}`,
        click: () => $axis.set(nextAxis)
      }
    }
  },
  {
    descendants: ({ children: { dialog } }) => dialog,
    values: ({ data }) => ({
      author: data.photos.find(({ id }) => id === data.photoId)?.author ?? '',
      isOpen: data.isOpen,
      close: () => (data.isOpen = false)
    })
  }
]

const html: FiCs.Html<Data, {}> = ({
  children: { icon, axisButton, skeleton },
  data: { isHorizontal, toAxis, photos, photoId, author },
  template,
  activeApis: { isLoading },
  attributes: {
    a11y: { liveStatus, srOnly },
    show
  },
  scroll
}) => {
  const skeletons = [...Array(UNIT_LENGTH)].map(_ => template`${skeleton}`)

  if (photos.length === 0) return template`<div class="flex-x">${skeletons}</div>`

  return template`
    ${axisButton}
    <p class="sr-only" ${statusLiveRegion}>The current scroll axis is ${toAxis(isHorizontal)}.</p>
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
      ${isLoading && skeletons}
    </div>
    <dialog
      id="photo-dialog"
      class="w-3xs rounded-lg border border-white z-1"
      aria-labelledby="dialog-title"
      ${photoId !== '' && 'open'}
      ${show(photoId !== '')}
    >
      ${icon}
      <h3 id="dialog-title" class="sr-only">Photo details</h3>
      <p class="text-base text-white text-center mt-2 mx-4 mb-4">Created by ${author}</p>
    </dialog>
  `
}

const css: FiCs.Css<Data, {}> = {
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
        '&:focus-visible': {
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
}

const hooks: FiCs.Hooks<Data, {}> = {
  created: ({ data, queryCache, signal }) => {
    const initialPage = Number(queries().page)

    if (Number.isInteger(initialPage) && initialPage > 0) data.page = initialPage - 1
    else goto('/scroll?page=1', { isWithoutHistory: true })

    const params = { data, signal, shouldInitCache: false }

    queryCache.bindTo({ ...params, key: PHOTOS_KEY, dataKey: 'photos' })
    queryCache.bindTo({ ...params, key: PAGE_KEY, dataKey: 'page' })
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
}

const actions: FiCs.Actions<Data, {}> = {
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
}

const options: FiCs.Options<Data, {}> = {
  scroll: ({ data, crud, queryCache }) => ({
    unit: UNIT_LENGTH,
    itemMinSize: PHOTO_SIZE,
    axis: data.toAxis(data.isHorizontal),
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
        mutator: async () => {
          const photos = await crud<Photo[]>(getPhotos(nextPage), { key: 'isLoading' })

          if (data.page !== nextPage) return data.page

          queryCache.set<Photo[]>(PHOTOS_KEY, current => [...(current ?? []), ...photos])
          queryCache.set<Photo[]>(key, photos)

          return nextPage
        }
      })
    }
  })
}

export default fics<Data, {}>({
  name: 'photos',
  children: [Icon(), AxisButton, Skeleton],
  data: () => ({
    axis: $axis.get(),
    page: 0,
    photos: [] as Photo[],
    photoId: '',
    isOpen: false
  }),
  deferredData,
  props,
  html,
  css,
  hooks,
  actions,
  options
})
