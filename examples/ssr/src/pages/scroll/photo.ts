export interface Photo {
  id: string
  author: string
  isLoaded: boolean
}

const BASE_URL = 'https://picsum.photos' as const

export const UNIT_LENGTH = 8 as const
export const PHOTO_SIZE = 200 as const

export const photoListUrl = (page: number) =>
  `${BASE_URL}/v2/list?page=${page}&limit=${UNIT_LENGTH}` as const

export const photoUrl = (id: string) => `${BASE_URL}/id/${id}/${PHOTO_SIZE}/${PHOTO_SIZE}.webp?blur`

export const toLoadedPhotos = (
  photos: readonly Photo[],
  key: string,
  index: number
): ((current: Photo[] | undefined) => Photo[]) | null => {
  const photo: Photo | undefined = photos[index]
  if (!photo || photo.id !== key || photo.isLoaded) return null

  return current => {
    const newPhotos: Photo[] = [...(current ?? photos)]

    newPhotos[index] = { ...photo, isLoaded: true }
    return newPhotos
  }
}
