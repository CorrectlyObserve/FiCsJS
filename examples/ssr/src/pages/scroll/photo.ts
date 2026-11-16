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
  photoId: string
): ((current: Photo[] | undefined) => Photo[]) | null => {
  const photo: Photo | undefined = photos.find(({ id }) => id === photoId)
  if (!photo || photo.isLoaded) return null

  return current =>
    (current ?? photos).map(photo => (photo.id === photoId ? { ...photo, isLoaded: true } : photo))
}
