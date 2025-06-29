export const api = 'https://picsum.photos'
export const LIMIT_LENGTH = 5
export const getPhotos = (page: number) => `${api}/v2/list?page=${page}&limit=${LIMIT_LENGTH}`
