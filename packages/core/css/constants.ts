import { HOST_SELECTOR } from '../helpers'

export const GROUPING_AT_RULES = [
  '@container',
  '@layer',
  '@media',
  '@scope',
  '@starting-style',
  '@supports'
] as const

export const HOST_GROUP = `${HOST_SELECTOR}\\(([^()]*(?:\\([^()]*\\))*[^()]*)\\)` as const
export const HOST_STRICT = `${HOST_SELECTOR}(?!-)` as const

export const TOP_LEVEL_AT_RULES = [
  '@counter-style',
  '@font-face',
  '@keyframes',
  '@page',
  '@property'
] as const
