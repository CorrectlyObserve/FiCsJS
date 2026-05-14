import { browserError, deepEqual, isBlankString, isPlainObject, numberError } from '../core/helpers'
import type { Options } from './types'

export class State<S> {
  static #keyUsageCounts: Map<string, number> = new Map()
  static #duplicateKeys: Set<string> = new Set()
  readonly #options: Options.Local = { readonly: false, version: 1, strictMode: true }
  readonly #subscribers: Map<string, (state: S) => void> = new Map()
  #state: S
  #isLossyWarned: boolean = false
  #isUpdateLocked: boolean = false
  #isDeleted: boolean = false

  constructor(state: S, options?: Options.Global<S>) {
    this.#state = state

    if (options?.readonly === true) this.#options.readonly = true

    if (options?.version !== undefined) {
      numberError({ version: options.version }, 'positive-int')
      this.#options.version = options.version
    }

    if (options?.strictMode === false) this.#options.strictMode = false

    if (options?.onError !== undefined) this.#options.onError = options.onError

    if (options?.sessionStorage !== undefined) {
      browserError()

      const storageKey: string = options.sessionStorage.trim()

      if (isBlankString(storageKey))
        throw new Error('The "sessionStorage" key must be a non-empty string...')

      this.#options.sessionStorage = storageKey

      try {
        const usageCount: number = (State.#keyUsageCounts.get(storageKey) ?? 0) + 1
        State.#keyUsageCounts.set(storageKey, usageCount)

        const subject: string = `The sessionStorage key "${storageKey}"`

        if (usageCount > 1) {
          const errorMessage: string = `${subject} is used by multiple State instances...`

          if (this.#options.strictMode === true) throw new Error(errorMessage)
          else if (!State.#duplicateKeys.has(storageKey)) {
            State.#duplicateKeys.add(storageKey)
            console.warn(`${errorMessage} This can lead to unintended side effects.`)
          }
        }

        let stored: string | null = null

        try {
          stored = sessionStorage.getItem(storageKey)
        } catch (error) {
          this.#options.onError?.(error, 'read')
        }

        if (stored === null) this.#setToSessionStorage(this.#state)
        else
          try {
            const customizedSubject = `The stored state with ${subject.charAt(0).toLowerCase() + subject.slice(1)}`,
              parsed: unknown = JSON.parse(stored)

            if (!isPlainObject(parsed))
              throw new Error(`The stored state with ${customizedSubject} is invalid...`)

            const { version, data }: { version?: unknown; data?: S } = parsed

            if (version !== this.#options.version)
              throw new Error(
                `The stored state with ${customizedSubject} has a version mismatch...`
              )

            if (options.validate?.(data) === false)
              throw new Error(`The stored state with ${customizedSubject} failed validation...`)

            this.#state = data
          } catch (error) {
            if (this.#options.sessionStorage)
              try {
                sessionStorage.removeItem(this.#options.sessionStorage)
              } catch (purgeError) {
                this.#options.onError?.(purgeError, 'remove')
              }

            this.#options.onError?.(error, 'read')
            this.#setToSessionStorage(this.#state)
          }
      } catch (error) {
        this.#decrementKeyUsageCount(storageKey)
        throw error
      }
    }
  }

  #setToSessionStorage(state: S): void {
    if (!this.#options.sessionStorage) return

    let serialized: string | undefined

    try {
      let hasLossyType = false
      const json: string = JSON.stringify(
        { version: this.#options.version, data: state },
        /** @param this Uses `this[key]` to bypass automatic `.toJSON()` conversions. */
        function <T>(this: unknown, key: string, value: T): T {
          if (hasLossyType) return value

          const original: unknown = (this as Record<string, unknown> | undefined)?.[key] ?? value

          if (
            original === undefined ||
            typeof original === 'function' ||
            typeof original === 'symbol' ||
            original instanceof Date ||
            original instanceof Map ||
            original instanceof Set
          )
            hasLossyType = true

          return value
        }
      )

      if (hasLossyType && !this.#isLossyWarned) {
        console.warn(
          `The state with the sessionStorage key "${this.#options.sessionStorage}" has JSON-lossy values and they may not be accurately restored.`
        )
        this.#isLossyWarned = true
      }

      serialized = json
    } catch (error) {
      this.#options.onError?.(error, 'write')
    }

    if (!serialized) return

    try {
      sessionStorage.setItem(this.#options.sessionStorage, serialized)
    } catch (error) {
      this.#options.onError?.(error, 'write')
    }
  }

  #decrementKeyUsageCount(storageKey?: string): number {
    if (!storageKey) return 0

    const usageCount: number = State.#keyUsageCounts.get(storageKey) ?? 0,
      reducedUsageCount: number = Math.max(0, usageCount - 1)

    if (reducedUsageCount === 0) State.#keyUsageCounts.delete(storageKey)
    else State.#keyUsageCounts.set(storageKey, reducedUsageCount)

    if (reducedUsageCount <= 1) State.#duplicateKeys.delete(storageKey)

    return reducedUsageCount
  }

  #assertAlive(): void {
    if (this.#isDeleted) throw new Error('This state has been already deleted...')
  }

  #assertWritable(): void {
    this.#assertAlive()
    if (this.#options.readonly) throw new Error('This state is readonly...')
  }

  #normalizeKey(key: string, type: 'subscribe' | 'unsubscribe'): string {
    key = key.trim()

    if (isBlankString(key))
      throw new Error(`The subscriber key to ${type} must be a non-empty string...`)

    if (type === 'subscribe' && this.#subscribers.has(key))
      throw new Error(`The subscriber key "${key}" is already registered...`)

    if (type === 'unsubscribe' && !this.#subscribers.has(key))
      throw new Error(`The subscriber key "${key}" is not found...`)

    return key
  }

  get(): S {
    this.#assertAlive()
    return this.#state
  }

  set(newState: S): void {
    this.#assertWritable()

    if (this.#isUpdateLocked)
      throw new Error('The set method cannot be called during subscriber notification...')

    if (deepEqual(this.#state, newState)) return

    this.#state = newState

    const errors: Error[] = []
    this.#isUpdateLocked = true

    try {
      for (const [key, subscriber] of Array.from(this.#subscribers))
        try {
          subscriber(newState)
        } catch (error) {
          const cause: Error = error instanceof Error ? error : new Error(String(error))

          errors.push(new Error(`The subscriber "${key}" threw during notification...`, { cause }))
        }
    } finally {
      this.#isUpdateLocked = false
    }

    if (this.#state === newState) this.#setToSessionStorage(newState)

    if (errors.length > 0) throw new AggregateError(errors)
  }

  subscribe(key: string, callback: (state: S) => void): void {
    this.#assertWritable()

    this.#subscribers.set(this.#normalizeKey(key, 'subscribe'), callback)
  }

  unsubscribe(key?: string): void {
    this.#assertAlive()

    if (key === undefined) this.#subscribers.clear()
    else this.#subscribers.delete(this.#normalizeKey(key, 'unsubscribe'))
  }

  delete(): void {
    this.#assertAlive()

    this.#isDeleted = true
    this.#subscribers.clear()
    this.#decrementKeyUsageCount(this.#options?.sessionStorage)

    /** @remarks Detaches the state reference to prevent memory leaks. */
    this.#state = undefined as unknown as S
  }
}
