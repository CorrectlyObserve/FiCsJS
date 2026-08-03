import { SCRIPT_BASE } from '../constants'
import { isHeadMethod } from '../helpers'
import type { Routing } from '../types'
import { dispatch } from './dispatch'

export const createPageHandler =
  <C extends Record<string, unknown>>(
    { routes, middlewares = {}, statusPages = {}, redirects }: Routing.Options.PageManifest<C>,
    { render, createContext, scriptBase = SCRIPT_BASE }: Routing.Options.PageHost<C>
  ): ((req: Request) => Promise<Response>) =>
  async (req: Request): Promise<Response> => {
    const res: Response = await dispatch({
      req,
      routes,
      middlewares,
      statusPages,
      redirects,
      render,
      createContext,
      scriptBase
    })

    if (isHeadMethod(req.method))
      return new Response(null, { status: res.status, headers: res.headers })

    return res
  }
