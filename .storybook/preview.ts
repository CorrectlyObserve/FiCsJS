export const parameters = {
  backgrounds: {
    default: 'light-gray',
    values: [{ name: 'light-gray', value: '#efeff1' }],
  },
}

export const decorators = [
  (story) => ({
    components: { story },
    template: `<div style="font-family: 'Quicksand Medium', 'Helvetica Neue', sans-serif;"><story /></div>`,
  }),
]
