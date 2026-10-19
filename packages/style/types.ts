export type Axis = 'x' | 'y' | 'xy'

export interface Center {
  position: Position
  transform: 'translate(-50%, -50%)' | 'translateX(-50%)' | 'translateY(-50%)'
}

export type Interactive = string | false | ((base: string) => string)

export type Operator = '+' | '-' | '*' | '/'

export type Position = 'absolute' | 'fixed'

export type Rect =
  | number
  | 'auto'
  | '100%'
  | '100vw'
  | '100vh'
  | '100dvw'
  | '100dvh'
  | 'max-content'
  | 'min-content'
  | 'fit-content'
