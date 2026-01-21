export const API_PATH = 'https://picsum.photos' as const
export const UNIT_LENGTH = 8 as const

export const getPhotos = (page: number) =>
  `${API_PATH}/v2/list?page=${page}&limit=${UNIT_LENGTH}` as const
