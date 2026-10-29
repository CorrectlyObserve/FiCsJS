import { fics, type FiCs } from 'ficsjs'
import { queries } from 'ficsjs/router'
import { flex, hideScrollbar, interactive, radius, space, stroke } from 'ficsjs/style'
import Icon from '@/components/Icon'
import {
  type Photo,
  PHOTO_SIZE,
  photoListUrl,
  photoUrl,
  toLoadedPhotos,
  UNIT_LENGTH
} from '@/pages/scroll/photo'
import Dialog from '@/pages/scroll/Dialog'
import Skeleton from '@/pages/scroll/Skeleton'
import { $axis, type Axis } from '@/pages/scroll/store'
import { MoveHorizontal, MoveVertical } from 'lucide-static'

interface Data {
  axis: Axis
  page: number
  photos: readonly Photo[]
  photoId: string
  isOpen: boolean
}

const PAGE_KEY = ['page'] as const,
  PHOTOS_KEY = ['photos'] as const

const deferredData: FiCs.DeferredData<Data, {}> = {
  load: async ({ data, queryCache }) => {
    const nextPage: number = data.page + 1,
      key = ['photos', nextPage] as const

    await queryCache.prefetch<Photo[]>(key, ({ signal }) =>
      fetch(photoListUrl(nextPage), { signal }).then(res => res.json())
    )

    const photos: Photo[] = queryCache.get<Photo[]>(key) ?? []

    queryCache.set<Photo[]>(PHOTOS_KEY, photos)
    queryCache.set<number>(PAGE_KEY, nextPage)

    return { page: nextPage, photos }
  }
}

const props: FiCs.Props<Data, {}> = [
  {
    descendants: ({ children: { skeleton } }) => skeleton,
    values: () => ({ size: PHOTO_SIZE, radius: 'sm' })
  },
  {
    descendants: ({ children: { icon } }) => icon,
    values: ({ data }) => {
      const nextAxis = data.axis === 'horizontal' ? 'vertical' : 'horizontal'
      return {
        svg: data.axis === 'horizontal' ? MoveVertical : MoveHorizontal,
        ariaLabel: `Switch axis direction to ${nextAxis}`,
        isBottomFixed: true,
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
  children: { skeleton, icon, dialog },
  data: { axis, photos },
  template,
  activeApis: { isLoading },
  attributes: {
    a11y: { liveStatus, srOnly },
    show
  },
  scroll
}) => {
  const skeletons = [...Array(UNIT_LENGTH)].map(
    (_, index) => template`<div class="photo" key="skeleton-${index}">${skeleton}</div>`
  )

  if (photos.length === 0) return template`${skeletons}`

  return template`
    ${icon}
    <p ${liveStatus} ${srOnly}>The current scroll axis is ${axis}.</p>
    <div class="scroller">
      ${scroll(
        photos,
        ({ id, author, isLoaded }) => template`
          <div class="photo" key="${id}-container">
            ${!isLoaded && skeleton}
            <button type="button" key="${id}" aria-haspopup="dialog" ${show(isLoaded)}>
              <img src="${photoUrl(id)}" alt="Image created by ${author}" key="${id}" />
            </button>
          </div>
        `
      )}
      ${isLoading && skeletons}
    </div>
    ${dialog}
  `
}

const css: FiCs.Css<Data, {}> = ({ data: { axis } }) => {
  const isHorizontal = axis === 'horizontal'
  return `
    :host { 
      ${isHorizontal ? 'overflow-x: hidden;' : `min-height: calc(${PHOTO_SIZE}px * ${UNIT_LENGTH});`}

      div {
        &.scroller {
          ${(isHorizontal && flex({ center: 'x' })) || ''}
          ${hideScrollbar}
        }

        &.photo {
          ${flex({ center: 'x' })}
          margin-${isHorizontal ? 'inline' : 'block'}-end: ${space('sm')};

          &:last-child { margin-${isHorizontal ? 'inline' : 'block'}-end: 0; }

          > button {
            ${interactive({ focusVisible: base => `${base}; outline-offset: calc(${stroke('md')} * -1);` })}

            > img { ${radius('sm')} }
          }
        }
      }
    }
  `
}

const hooks: FiCs.Hooks<Data, {}> = {
  created: ({ data, queryCache, signal }) => {
    const initialPage = Number(queries().page)

    // Uses the value before "?page=" (default 1) as "page" tracks the last loaded page.
    data.page = (Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 1) - 1

    const params = { data, signal, shouldInitCache: false }

    queryCache.bindTo({ ...params, key: PHOTOS_KEY, dataKey: 'photos' })
    queryCache.bindTo({ ...params, key: PAGE_KEY, dataKey: 'page' })
  },
  mounted: () => {
    window.history.scrollRestoration = 'manual'
  },
  rerendered: ({ data: { isOpen, photoId }, changedKeys, ref }) => {
    if (changedKeys.data.includes('isOpen') && !isOpen)
      (ref(`.photo > button[key="${photoId}"]`) as HTMLElement | null)?.focus()
  }
}

const markLoaded: FiCs.Action<Data, {}> = [
  ({ data, queryCache, attributes: { key } }) => {
    const loadedPhotos = toLoadedPhotos(data.photos, key)
    if (loadedPhotos) queryCache.set<Photo[]>(PHOTOS_KEY, loadedPhotos)
  },
  { once: true }
]

const actions: FiCs.Actions<Data, {}> = {
  img: { load: markLoaded, error: markLoaded },
  '.photo > button': {
    click: [
      ({ data, attributes: { key } }) => {
        data.photoId = key
        data.isOpen = true
      },
      { throttleMs: 500 }
    ]
  }
}

const options: FiCs.Options<Data, {}> = {
  scroll: ({ data, crud, queryCache }) => ({
    unit: UNIT_LENGTH,
    itemMinSize: PHOTO_SIZE,
    axis: data.axis,
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
          const photos: Photo[] = await crud<Photo[]>(photoListUrl(nextPage), { key: 'isLoading' })

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
  children: [Skeleton, Icon(), Dialog],
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
