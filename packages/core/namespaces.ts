import type {
  Action as _Action,
  Attr,
  ClassName as _ClassName,
  Css,
  DeferredData as _DeferredData,
  Descendant,
  Form,
  Hook,
  Html,
  I18n,
  MutableData as _MutableData,
  Props as _Props,
  Options,
  SingleOrArray
} from './types'

export declare namespace FiCs {
  type Action<D extends object, P> = _Action.Entry<D, P>

  type Actions<D extends object, P> = _Action.Handlers<D, P> | undefined

  type Attributes<D extends object, P> = Attr.Input<D, P> | undefined

  type Children = Descendant[] | undefined

  type ClassName<D extends object, P> = _ClassName<D, P> | undefined

  type Css<D extends object, P> = Css.Input<D, P> | undefined

  type DeferredData<D extends object, P> = SingleOrArray<_DeferredData.Entry<D, P>> | undefined

  type FormAssociation = Form.Association

  type GlobalCss = string

  type Html<D extends object, P extends object> = Html.Fn<D, P>

  type Hooks<D extends object, P> = Hook.Lifecycle<D, P> | undefined

  type Interpolate = I18n.Interpolate

  type MutableData<D extends object> = _MutableData<D>

  type Options<D extends object, P> = Options.Input<D, P> | undefined

  type Props<D extends object, P> = SingleOrArray<_Props<D, P>> | undefined
}
