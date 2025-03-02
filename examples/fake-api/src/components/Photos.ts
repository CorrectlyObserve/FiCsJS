import { fics } from 'ficsjs'

interface Data {
  count: number
  photos: { id: number; author: string }[]
}

export default () =>
  fics<Data, {}>({
    name: 'photos',
    data: () => ({ count: 0 }),
    fetch: () => {
      return Promise.resolve({ photos: [] })
    },
    html: ({ data: { photos }, template }) => template`
      <div>
        <div>
          ${photos.map(
            ({ id, author }) => template`
            <img src="https://picsum.photos/id/${id}/300/300?blur" />
            <p>${author}</p>`
          )}
        </div>
      </div>
    `,
    css: '',
    hooks: {}
  })
