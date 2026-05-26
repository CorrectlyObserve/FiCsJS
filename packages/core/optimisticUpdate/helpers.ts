import type { Optimistic, ProxyMutable } from '../types'

export const createBackup = <D extends object>({
  rawData,
  data,
  guardKey
}: {
  rawData: D
  data: D
  guardKey?: (key: keyof D) => void
}): Optimistic.Backup<D> => {
  const backupData: Partial<D> = {},
    touchedKeys: Set<keyof D> = new Set(),
    originalKeys: ReadonlySet<keyof D> = new Set(getDataKeys(rawData))

  const backup = (prop: keyof D): void => {
      if (modifiedKeys.has(prop)) return

      guardKey?.(prop)

      /** @remarks Reads from raw data to avoid capturing bound function wrappers from the data Proxy. */
      const rawDatum: D[keyof D] = rawData[prop]

      if (typeof rawDatum === 'function') backupData[prop] = rawDatum
      else
        try {
          backupData[prop] = structuredClone(rawDatum)
        } catch (error) {
          throw new Error(`The value "${String(prop)}" cannot be deep-cloned...`, { cause: error })
        }

      modifiedKeys.add(prop)
    },
    backedUpData: ProxyMutable<D> = new Proxy(data, {
      set(target, prop, value, receiver): boolean {
        backup(prop as keyof D)
        return Reflect.set(target, prop, value, receiver)
      },
      deleteProperty(target, prop): boolean {
        backup(prop as keyof D)
        return Reflect.deleteProperty(target, prop)
      }
    }) as ProxyMutable<D>,
    rollback = (): void => {
      for (const currentKey of getDataKeys(data))
        if (!originalKeys.has(currentKey)) delete data[currentKey]

      for (const modifiedKey of modifiedKeys)
        if (originalKeys.has(modifiedKey)) data[modifiedKey] = backupData[modifiedKey] as D[keyof D]
    }

  return { backedUpData, rollback, modifiedKeys }
}

export const getDataKeys = <D extends object>(
  data: D,
  dataKeys?: Optimistic.DataKeys<D>
): (keyof D)[] => (hasDataKeys(dataKeys) ? [...dataKeys!] : (Object.keys(data) as (keyof D)[]))

export const hasDataKeys = <D extends object>(dataKeys?: Optimistic.DataKeys<D>): boolean =>
  !!dataKeys?.length
