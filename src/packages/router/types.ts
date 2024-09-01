import type {
  Attrs,
  ClassName,
  Css,
  Descendant,
  Hooks,
  Inheritances,
  Reflections
} from '../core/types'

export interface Data {
  pathname: string
}

export interface Router<P> extends Data {
  pages: Record<string, string | Descendant>
  reflections?: Reflections<Data>
  inheritances?: Inheritances<Data>
  className?: ClassName<Data, P>
  attributes?: Attrs<Data, P>
  css?: Css<Data, P>
  hooks?: Hooks<Data, P>
}
