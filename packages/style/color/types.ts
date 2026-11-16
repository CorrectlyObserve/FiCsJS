import { COLOR_TOKENS, MAIN_COLOR_TOKENS, NEUTRAL_COLOR_TOKENS } from './constants'

export declare namespace Color {
  type BgFill = 'bg' | 'bg-sunken' | 'bg-raised'

  interface Ctx {
    darker?: number
    lighter?: number
    chroma?: number
    alpha?: number
  }

  type Fill = (typeof COLOR_TOKENS)[number] | BgFill

  interface Gradient {
    readonly image: string
    readonly text: Tone
    toString: () => string
  }

  interface Lms {
    l: number
    m: number
    s: number
  }

  type Main = (typeof MAIN_COLOR_TOKENS)[number]

  type Neutral = (typeof NEUTRAL_COLOR_TOKENS)[number]

  interface Oklab {
    l: number
    a: number
    b: number
  }

  interface Oklch {
    l: number
    c: number
    h: number
  }

  interface Rgb {
    r: number
    g: number
    b: number
  }

  type RgbArray = [r: number, g: number, b: number]

  type Role = 'text' | 'border'

  type Theme = Neutral | BgFill | 'text-muted'

  type Tone = 'light' | 'dark'
}
