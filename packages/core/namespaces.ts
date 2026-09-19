import type {
  Action,
  Attrs,
  ClassName as _ClassName,
  Css,
  Deferred,
  Descendant,
  Form,
  Hook,
  Html,
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

  type DeferredData<D extends object, P> = SingleOrArray<Deferred.Entry<D, P>> | undefined

  type DeferredStatus = Deferred.Status

  type FormAssociation = Form.Association

  type GlobalCss = string

  type Html<D extends object, P extends object> = Html.Core<D, P>

  type Hooks<D extends object, P> = Hook.Lifecycle<D, P> | undefined

  type Options<D extends object, P> = Options.Ctx<D, P> | undefined

  type Props<D extends object, P> = SingleOrArray<_Props<D, P>> | undefined
}
