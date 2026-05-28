import { delay, getDelayMs, MAX_RETRIES, numberError, shouldRetry } from '../helpers'
import type { Optimistic, SetTimeout } from '../types'
import { createBackup, getDataKeys, hasDataKeys } from './helpers'

/**
 * @param config.timeoutMs Must be a non-negative integer if it is a number.
 * @param config.intervalMs Must be a non-negative integer if it is a number.
 * @param config.maxRetries Must be a non-negative integer if it is a number.
 */
export const optimisticUpdate = () => {
  const latestTasks: Map<string, Promise<void>> = new Map(),
    lockedKeys: Set<string> = new Set()

  return async <D extends object, T>({
    runtime: { name, rawData, data, activeApis, enqueue, reRender, signal, guardKey },
    config: {
      updateData,
      mutate,
      dataKeys,
      statusKey,
      timeoutMs,
      intervalMs,
      maxRetries = MAX_RETRIES,
      externalSignal
    }
  }: Optimistic.Ctx<D, T>): Promise<T> => {
    numberError({ timeoutMs, intervalMs, maxRetries }, 'non-negative-int')

    const targetKeys: string[] = getDataKeys(data, dataKeys).map(
      dataKey => `key:${String(dataKey)}`
    )
    if (statusKey) targetKeys.push(`status:${statusKey}`)

    if (hasDataKeys(dataKeys)) for (const dataKey of dataKeys!) guardKey?.(dataKey)

    for (const targetKey of targetKeys)
      if (lockedKeys.has(targetKey))
        throw new Error(
          `The target key "${targetKey}" is currently in use by optimistic update in the ${name}...`
        )

    const awaitingTasks: Promise<void>[] = [],
      seenTasks: Set<Promise<void>> = new Set()

    for (const targetKey of targetKeys) {
      const task: Promise<void> | undefined = latestTasks.get(targetKey)
      if (task && !seenTasks.has(task)) {
        seenTasks.add(task)
        awaitingTasks.push(task)
      }
    }

    const { promise, resolve }: PromiseWithResolvers<void> = Promise.withResolvers<void>()
    for (const targetKey of targetKeys) latestTasks.set(targetKey, promise)

    try {
      if (awaitingTasks.length > 0) await Promise.allSettled(awaitingTasks)

      if (signal.aborted)
        throw new DOMException(
          `Optimistic update disconnected before applying in the ${name}...`,
          'AbortError'
        )

      for (const targetKey of targetKeys) lockedKeys.add(targetKey)

      try {
        const controller: AbortController = new AbortController()

        const registerAbort = (source: AbortSignal): (() => void) => {
          if (source.aborted) {
            controller.abort(source.reason)
            return () => {}
          }
          const listener = (): void => controller.abort(source.reason)

          source.addEventListener('abort', listener, { once: true })
          return () => source.removeEventListener('abort', listener)
        }

        const signals: (() => void)[] = [registerAbort(signal)]
        if (externalSignal) signals.push(registerAbort(externalSignal))

        try {
          if (controller.signal.aborted)
            throw new DOMException(
              `Optimistic update aborted before applying in the ${name}...`,
              'AbortError'
            )

          const { backedUpData, rollback, touchedKeys }: Optimistic.Backup<D> = createBackup({
            rawData,
            data,
            guardKey
          })

          try {
            await updateData({ data: backedUpData })
          } catch (error) {
            rollback()
            throw error
          }

          if (hasDataKeys(dataKeys)) {
            const declaredDataKeys: Set<keyof D> = new Set(dataKeys!)
            for (const touchedKey of touchedKeys)
              if (!declaredDataKeys.has(touchedKey))
                console.warn(
                  `The undeclared key '${String(touchedKey)}' was modified. Please add it to 'dataKeys' for concurrent safety...`
                )
          }

          if (controller.signal.aborted) {
            rollback()
            throw new DOMException(
              `Optimistic update aborted after applying in the ${name}...`,
              'AbortError'
            )
          }

          if (statusKey) {
            if (activeApis.get(statusKey))
              console.warn(`The internal API status key "${statusKey}" is already in progress...`)

            activeApis.set(statusKey, true)
            enqueue(() => reRender(true), 're-render')
          }

          let attempt: number = 0

          try {
            while (true) {
              let error: unknown

              try {
                let timer: SetTimeout | undefined
                if (timeoutMs && timeoutMs > 0)
                  timer = setTimeout(
                    () =>
                      controller.abort(
                        new DOMException(
                          `Optimistic update timed out in the ${name}...`,
                          'AbortError'
                        )
                      ),
                    timeoutMs
                  )

                try {
                  return await mutate({ signal: controller.signal, attempt })
                } finally {
                  if (timer) clearTimeout(timer)
                }
              } catch (_error) {
                error = _error
              }

              attempt++

              if (!shouldRetry({ error, attempt, maxRetries, signal: controller.signal })) {
                rollback()
                throw error
              }

              try {
                await delay(getDelayMs({ error, attempt, intervalMs }), controller.signal)
              } catch {
                rollback()
                /** @remarks Rethrows mutate()'s original error, not delay()'s AbortError. */
                throw error
              }
            }
          } finally {
            if (statusKey) {
              activeApis.set(statusKey, false)
              enqueue(() => reRender(true), 're-render')
            }
          }
        } finally {
          for (const cleanup of signals) cleanup()
        }
      } finally {
        for (const targetKey of targetKeys) lockedKeys.delete(targetKey)
      }
    } finally {
      resolve()

      /** @remarks Cleans up the latestTask if there is no further promise. */
      for (const targetKey of targetKeys)
        if (latestTasks.get(targetKey) === promise) latestTasks.delete(targetKey)
    }
  }
}
