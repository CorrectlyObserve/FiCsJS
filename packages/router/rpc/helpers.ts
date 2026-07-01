import type { Rpc } from './../types'

export const isBodiless = (method: Rpc.Method | string): method is 'GET' | 'HEAD' =>
  method === 'GET' || isHeadMethod(method)

export const isHeadMethod = (method: Rpc.Method | string): method is 'HEAD' => method === 'HEAD'
