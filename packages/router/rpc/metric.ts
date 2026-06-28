import { RPC_MODULE_TYPE } from './../constants'
import type { Rpc } from './../types'

export const emitMetric = (
  onMetric: ((event: Rpc.Metric.Event) => void) | undefined,
  payload: Rpc.Metric.Payload
): void => {
  if (!onMetric) return

  try {
    onMetric({ ...RPC_MODULE_TYPE, ...payload })
  } catch (error) {
    console.error(
      `The onMetric callback in RPC failed during the '${payload.type}' event...`,
      error
    )
  }
}
