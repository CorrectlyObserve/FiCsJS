import { fics } from 'ficsjs'

export default () =>
  fics<{}, { svg: string; areaLabel: string; isLarge?: string; click?: () => void }>({
    name: 'icon',
    className: 'icon',
    html: ({ props: { svg, areaLabel, isLarge }, template, html }) => template`
      <button class="clickable flex text-white ${isLarge ? 'p-4' : 'p-3'}" aria-label="${areaLabel}">
        ${html(svg)}
      </button>
    `,
    css: {
      button: ({ props: { isLarge } }) => ({
        svg: { width: `${isLarge ? 2.5 : 1.25}rem`, height: 'auto', stroke: 'currentColor' }
      })
    },
    actions: {
      button: { click: [({ props: { click } }) => click?.(), { throttle: 500, blur: true }] }
    }
  })
