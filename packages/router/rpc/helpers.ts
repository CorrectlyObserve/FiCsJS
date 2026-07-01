import type { Rpc } from './../types'

const textEncoder: TextEncoder = new TextEncoder()
export const getByteLength = (str: string): number => textEncoder.encode(str).byteLength

export const isBodiless = (method: Rpc.Method | string): method is 'GET' | 'HEAD' =>
  method === 'GET' || isHeadMethod(method)

export const isHeadMethod = (method: Rpc.Method | string): method is 'HEAD' => method === 'HEAD'
