export const api = 'https://picsum.photos'
export const getPhotos = (page: number) => `${api}/v2/list?page=${page}&limit=5`
