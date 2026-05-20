export const BASE_URL = 'https://picsum.photos' as const

export const getPhotos = (page: number) =>
  `${BASE_URL}/v2/list?page=${page}&limit=${UNIT_LENGTH}` as const

export const PAGE_KEY = ['page'] as const
export const PHOTOS_KEY = ['photos'] as const

export const UNIT_LENGTH = 8 as const
