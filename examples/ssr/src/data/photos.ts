import type { Photo } from '@/types'

const api = 'https://picsum.photos'
const getPhotos = (page: number) => `${api}/v2/list?page=${page}&limit=5`
const photos: Photo[] = await fetch(getPhotos(1)).then(res => res.json())

export { api, getPhotos, photos }
