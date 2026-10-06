import { DEFERRED_DATA_LOAD_KEY } from './constants'
import {
  deepEqual,
  forwardAbort,
  isPlainObject,
  onAbort,
  setOwnKey,
  toArray,
  typedEntries
} from './helpers'
import { i18n } from './i18n'
import type { DataProps, DeferredData as Deferred, I18n, SingleOrArray } from './types'

export class DeferredData<D extends object, P> {
  static readonly JS_AUTO_READ_KEYS: ReadonlySet<string> = new Set(['toJSON', 'then'])
  readonly states: Deferred.States
  readonly #runtime: Deferred.Runtime<D, P>
  readonly #rawStates: Record<string, Deferred.State> = {}
  readonly #loads: Deferred.Load<D, P>[] = []
  readonly #subscribers: Map<keyof Deferred.States, Set<() => void>> = new Map()
  readonly #chains: { ids: string[]; owner?: Deferred.Load<D, P> }[] = []
  readonly #changedKeys: Set<string> = new Set()
  readonly #queuedLoads: Map<Deferred.Load<D, P>, string[]> = new Map()
  #canLoad: boolean = false

  constructor(
    entries: SingleOrArray<Deferred.Entry<D, P>> | undefined,
    runtime: Deferred.Runtime<D, P>
  ) {
    this.#runtime = runtime

    const keys: Set<string> = new Set()

    for (const [index, entry] of toArray(entries ?? []).entries()) {
      const { stateKey: key }: Deferred.Entry<D, P> = entry
      if (key !== undefined) {
        if (keys.has(key))
          throw new Error(
            `Rename the key "${key}" in ${runtime.name}, as it is already used by other deferredData...`
          )

        keys.add(key)
        setOwnKey(this.#rawStates, key, Object.freeze({ status: 'loading' }))
      }

      this.#loads.push({
        id: key ?? `#${index}`,
        entry,
        chain: [],
        hasReportedLoop: false,
        hasLoadedOnce: false,
        needsLoad: true,
        loadedValues: [],
        version: 0
      })
    }

    const readOnlyStates = (): never => {
      throw new TypeError(`The deferredStates are read-only in ${this.#runtime.name}...`)
    }

    this.states = new Proxy(this.#rawStates, {
      get: (target, key, receiver): Deferred.State | undefined => {
        if (typeof key == 'string') {
          if (!(key in target) && !DeferredData.JS_AUTO_READ_KEYS.has(key))
            throw new Error(
              `The deferredData key "${key}" is not registered in ${this.#runtime.name}...`
            )

          const sync: (() => void) | null = this.#runtime.getActiveSync()
          if (sync) {
            if (!this.#subscribers.has(key)) this.#subscribers.set(key, new Set())
            this.#subscribers.get(key)!.add(sync)
          }
        }

        return Reflect.get(target, key, receiver)
      },
      set: readOnlyStates,
      deleteProperty: readOnlyStates,
      defineProperty: readOnlyStates
    })
  }

  #getLoadedValues({
    dataKey,
    propsKey
  }: Deferred.Entry<D, P>): Deferred.Load<D, P>['loadedValues'] {
    return [
      ...(dataKey === undefined ? [] : toArray(dataKey).map(key => this.#runtime.rawData[key])),
      ...(propsKey === undefined ? [] : toArray(propsKey).map(key => this.#runtime.rawProps[key]))
    ]
  }

  #withChain(ids: string[], func: () => void, owner?: Deferred.Load<D, P>): void {
    this.#chains.push({ ids, owner })

    try {
      func()
    } finally {
      this.#chains.pop()
    }
  }

  #setState(
    { id, entry: { stateKey: key }, chain }: Deferred.Load<D, P>,
    state: Deferred.State
  ): void {
    if (key === undefined) return

    const current: Deferred.State = this.#rawStates[key]
    if (current?.status === state.status)
      if (!('error' in state) || state.error === (current as typeof state).error) return

    setOwnKey(this.#rawStates, key, Object.freeze(state))
    this.#changedKeys.add(key)

    const subscribers: Set<() => void> | undefined = this.#subscribers.get(key)

    /** @remarks Runs them in the same chain, or an infinite loop would occur. */
    if (subscribers)
      this.#withChain([...chain, id], () => {
        for (const sync of subscribers) sync()
      })

    this.#runtime.enqueueReRender()
  }

  #stopChain({ load, isStale, details }: Deferred.Ctx<D, P>): void {
    load.needsLoad = false

    if (load.hasReportedLoop) return

    load.hasReportedLoop = true

    const error = new Error(
      `Increase options.maxLoopLength or suspect an infinite loop, as the chain "${[...load.chain, load.id].join(' > ')}" exceeded the limit in ${this.#runtime.name}...`
    )

    this.#runtime.emitMetric({
      key: DEFERRED_DATA_LOAD_KEY,
      error,
      isError: true,
      startedAt: Date.now(),
      details
    })
    if (!this.#runtime.getOptions().telemetry?.onError) console.error(error)

    this.#setState(load, { status: isStale ? 'done' : 'error', error })
  }

  async #request(
    load: Deferred.Load<D, P>,
    {
      signal,
      nextChain,
      settle,
      isLatest,
      loadedValues,
      isStale,
      startedAt,
      details
    }: Deferred.Attempt<D, P>
  ): Promise<void> {
    const {
      data,
      props,
      deferredStates,
      crud,
      queryCache,
      optimisticUpdate
    }: DataProps.Payload<D, P, true> = this.#runtime.getDataProps(true)

    try {
      const result: unknown =
        (await load.entry.load({
          /** @remarks Runs in the same chain, or an infinite loop would occur. */
          data: new Proxy(data, {
            set: (_, prop, value): true => {
              this.#withChain(nextChain, () => (data[prop as keyof D] = value), load)
              return true
            }
          }),
          props,
          deferredStates,
          crud,
          queryCache,
          optimisticUpdate,
          i18n: <T>(args: Parameters<I18n<T>>[0]): Promise<T> =>
            i18n<T>({ ...args, signal: args.signal ?? signal }),
          signal
        })) ?? {}

      if (!settle()) return

      if (!isPlainObject(result))
        throw new TypeError(
          `The deferredData load must return a plain object in ${this.#runtime.name}...`
        )

      if (isLatest()) {
        load.hasLoadedOnce = true
        load.loadedValues = loadedValues
        this.#setState(load, { status: 'done' })
      }

      /** @remarks Runs in the same chain, or an infinite loop would occur. */
      this.#withChain(
        nextChain,
        () => {
          for (const [key, value] of typedEntries(result as D)) (data as D)[key] = value
        },
        load
      )

      this.#runtime.emitMetric({ key: DEFERRED_DATA_LOAD_KEY, startedAt, details })
    } catch (error) {
      if (!settle()) return

      this.#runtime.emitMetric({
        key: DEFERRED_DATA_LOAD_KEY,
        error,
        isError: true,
        startedAt,
        details
      })
      if (!this.#runtime.getOptions().telemetry?.onError)
        console.error(
          `The deferredData load "${load.id}" failed in ${this.#runtime.name}...`,
          error
        )

      /** @remarks Remains 'done' if stale data is preserved. */
      if (isLatest()) this.#setState(load, { status: isStale ? 'done' : 'error', error })
    }
  }

  #createAttempt({
    load,
    chain,
    isStale,
    details
  }: Deferred.Ctx<D, P> & { chain: string[] }): Deferred.Attempt<D, P> {
    load.abort?.()
    load.needsLoad = false

    const controller: AbortController = new AbortController(),
      { signal }: { signal: AbortSignal } = controller,
      unobserveElementAbort: () => void = forwardAbort(controller, this.#runtime.getSignal()),
      version: number = ++load.version,
      isLatest = (): boolean => load.version === version,
      startedAt: number = Date.now()

    let isOutdated: boolean = false

    const unobserveOwnAbort: () => void = onAbort(signal, () => {
      unobserveElementAbort()

      if (isLatest()) load.abort = undefined
      if (!isOutdated) load.needsLoad = true

      this.#runtime.emitMetric({
        key: DEFERRED_DATA_LOAD_KEY,
        isAborted: true,
        startedAt,
        details: { ...details, abortReason: isOutdated ? 'outdated' : 'disconnected' }
      })
    })

    load.abort = (): void => {
      isOutdated = true
      controller.abort()
    }

    this.#runtime.emitMetric({ key: DEFERRED_DATA_LOAD_KEY, details })

    return {
      signal,
      nextChain: [...chain, load.id],
      settle: (): boolean => {
        if (signal.aborted) return false

        unobserveOwnAbort()
        unobserveElementAbort()
        if (isLatest()) load.abort = undefined
        return true
      },
      isLatest,
      loadedValues: this.#getLoadedValues(load.entry),
      isStale,
      startedAt,
      details
    }
  }

  #run(load: Deferred.Load<D, P>, chain: string[] = []): void {
    load.needsLoad = true

    if (!this.#canLoad) return

    const isStale: boolean = !!load.entry.allowStale && load.hasLoadedOnce,
      details: Deferred.Attempt<D, P>['details'] = { key: load.entry.stateKey }

    load.chain = chain

    if (load.chain.length >= this.#runtime.getOptions().maxLoopLength)
      return this.#stopChain({ load, isStale, details })

    load.hasReportedLoop = false

    if (this.#runtime.getSignal().aborted) return

    if (!isStale) this.#setState(load, { status: 'loading' })

    void this.#request(load, this.#createAttempt({ load, chain, isStale, details }))
  }

  get #chain(): string[] {
    return this.#chains.at(-1)?.ids ?? []
  }

  get entries(): Deferred.Entry<D, P>[] {
    return this.#loads.map(({ entry }) => entry)
  }

  takeChangedKeys(): string[] {
    const keys: string[] = [...this.#changedKeys]

    this.#changedKeys.clear()
    return keys
  }

  mount(): void {
    this.#canLoad = true

    for (const load of this.#loads)
      if (load.needsLoad || !deepEqual(this.#getLoadedValues(load.entry), load.loadedValues))
        this.#run(load)
  }

  reconnect(): void {
    for (const load of this.#loads) if (load.needsLoad) this.#run(load)
  }

  queueLoads(arg: { dataKey: keyof D } | { propsKey: keyof P }): void {
    if (!this.#canLoad) return

    const [type, key]: ['dataKey' | 'propsKey', keyof D | keyof P] =
        'dataKey' in arg ? ['dataKey', arg.dataKey] : ['propsKey', arg.propsKey],
      wasIdle: boolean = this.#queuedLoads.size === 0

    for (const load of this.#loads) {
      /** @remarks Prevents a load from reloading itself */
      if (load === this.#chains.at(-1)?.owner) continue

      const keys: SingleOrArray<keyof D | keyof P> | undefined = load.entry[type]
      if (keys === undefined || !toArray(keys).includes(key)) continue

      const queuedChain: string[] | undefined = this.#queuedLoads.get(load)

      /** @remarks Keeps the shortest chain, as a write made outside any load has none. */
      if (this.#chain.length < (queuedChain?.length ?? Infinity))
        this.#queuedLoads.set(load, this.#chain)
    }

    if (wasIdle && this.#queuedLoads.size > 0)
      queueMicrotask(() => {
        /** @remarks Copies before clearing, as loading may queue new tasks. */
        const batch: [Deferred.Load<D, P>, string[]][] = [...this.#queuedLoads]

        this.#queuedLoads.clear()
        for (const [load, chain] of batch) this.#run(load, chain)
      })
  }

  reload(key?: string): void {
    const isComputing: boolean = this.#runtime.getActiveSync() !== null

    if (isComputing)
      throw new Error(
        `The deferredData of ${this.#runtime.name} cannot reload while the props of its children are computed...`
      )

    let loads: Deferred.Load<D, P>[] = this.#loads

    if (key !== undefined) {
      const found: Deferred.Load<D, P> | undefined = this.#loads.find(
        ({ entry: { stateKey } }) => stateKey === key
      )

      if (!found)
        throw new Error(
          `The deferredData key "${key}" is not registered in ${this.#runtime.name}...`
        )

      loads = [found]
    }

    for (const load of loads)
      this.#run(
        load,
        /**
         * @remarks
         * Inherits the chain to prevent infinite loops while reloading automatically,
         * or uses the current transaction chain otherwise.
         */
        this.#runtime.isPostRerendering() ? [...load.chain, load.id] : this.#chain
      )
  }
}
