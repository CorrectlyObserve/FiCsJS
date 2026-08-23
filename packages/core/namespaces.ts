import type {
  Action,
  Attrs,
  ClassName as _ClassName,
  Css,
  DataProps,
  Descendant,
  Form,
  Hook,
  Html,
  I18n,
  Props as _Props,
  Options,
  SingleOrArray
} from './types'

export declare namespace FiCs {
  type Actions<D extends object, P> = Action.Handlers<D, P> | undefined

  type Attributes<D extends object, P> = Attrs<D, P> | undefined

  type Children = Descendant[] | undefined

  type ClassName<D extends object, P> = _ClassName<D, P> | undefined

  type Css<D extends object, P> = Css.Ctx<D, P> | undefined

  type DeferredContext<D extends object, P> = DataProps.Payload<D, P, true>

  type FormAssociation = Form.Association

  type Html<D extends object, P extends object> = Html.Core<D, P>

  type Hooks<D extends object, P> = Hook.Lifecycle<D, P> | undefined

  type I18nContext<D extends object, P> = DataProps.Payload<D, P> & I18n

  type Options<D extends object, P> = Options.Ctx<D, P> | undefined

  type Props<D extends object, P> = SingleOrArray<_Props<D, P>> | undefined
}
