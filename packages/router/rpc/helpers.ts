import type { Rpc } from './../types'

export const isBodiless = (method: Rpc.Method | string): method is 'GET' | 'HEAD' =>
  method === 'GET' || method === 'HEAD'
