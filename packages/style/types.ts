export type Axis = 'x' | 'y' | 'xy'

export interface Center {
  position: Position
  transform: 'translate(-50%, -50%)' | 'translateX(-50%)' | 'translateY(-50%)'
}

export declare namespace Color {
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

export type Direction = 'row' | 'column'

export interface Flex {
  display: 'flex'
  flexDirection: Direction
}

export type Operator = '+' | '-' | '*' | '/'

export type Position = 'absolute' | 'fixed'
