export type Axis = 'x' | 'y' | 'xy'

export interface Center {
  position: Position
  transform: 'translate(-50%, -50%)' | 'translateX(-50%)' | 'translateY(-50%)'
}

export type Direction = 'row' | 'column'

export interface Flex {
  display: 'flex'
  flexDirection: Direction
}

export interface Lms {
  l: number
  m: number
  s: number
}

export interface Oklab {
  l: number
  a: number
  b: number
}

export interface Oklch {
  l: number
  c: number
  h: number
}

export type Operator = '+' | '-' | '*' | '/'

export type Position = 'absolute' | 'fixed'

export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Vector {
  R: number
  G: number
  B: number
}

export interface Wave {
  L: number
  M: number
  S: number
}
