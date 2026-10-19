export declare namespace Color {
  interface Ctx {
    darker?: number
    lighter?: number
    chroma?: number
    alpha?: number
  }

  interface Lms {
    l: number
    m: number
    s: number
  }

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

  interface Vector {
    R: number
    G: number
    B: number
  }

  interface Wave {
    L: number
    M: number
    S: number
  }
}
