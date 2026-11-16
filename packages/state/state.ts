import {
  deepEqual,
  isBlankString,
  isBrowser,
  isPlainObject,
  numberError,
  toLowerFirst
} from '../core/helpers'
import type { Options } from './types'

export class State<S> {
  static #keyUsageCounts: Map<string, number> = new Map()
  static #duplicatedKeys: Set<string> = new Set()
  readonly #options: Options<S> = {
    version: 1,
    readonly: false,
    strictMode: true
  }
  readonly #subscribers: Map<string, (state: S) => void> = new Map()
  #state: S
  #isLossyWarned: boolean = false
  #isUpdateLocked: boolean = false
  #isDeleted: boolean = false

  constructor(state: S, options?: Options<S>) {
    this.#state = state

    if (options) {
      const {
        version,
        readonly,
        strictMode,
        onError,
        sessionStorage: { validate } = {}
      }: Options<S> = options
      let { sessionStorage: { key } = {} }: Options<S> = options

      if (version !== undefined) {
        numberError({ version }, 'positive-int')
        this.#options.version = version
      }

      if (readonly) this.#options.readonly = readonly
      if (strictMode === false) this.#options.strictMode = false

      if (onError) this.#options.onError = onError

      if (key && isBrowser()) {
        key = key.trim()

        if (isBlankString(key))
          throw new Error('The "sessionStorage" key must be a non-empty string...')

        this.#options.sessionStorage ??= { key }

        try {
          const usageCount: number = (State.#keyUsageCounts.get(key) ?? 0) + 1
          State.#keyUsageCounts.set(key, usageCount)

          const subject: string = `The sessionStorage key "${key}"`

          if (usageCount > 1) {
            const errorMessage: string = `${subject} is used by multiple State instances...`

            if (this.#options.strictMode === true) throw new Error(errorMessage)
            else if (!State.#duplicatedKeys.has(key)) {
              State.#duplicatedKeys.add(key)
              console.warn(`${errorMessage} This can lead to unintended side effects.`)
            }
          }

          let stored: string | null = null

          try {
            stored = sessionStorage.getItem(key)
          } catch (error) {
            this.#options.onError?.(error, 'read')
          }

          if (stored === null) this.#setToSessionStorage(this.#state)
          else
            try {
              const sbj = `The stored state with ${toLowerFirst(subject)}`,
                parsed: unknown = JSON.parse(stored)

              if (!isPlainObject(parsed)) throw new Error(`${sbj} is invalid...`)

              const { version, data }: { version?: unknown; data?: S } = parsed

              if (version !== this.#options.version)
                throw new Error(`${sbj} has a version mismatch...`)

              if (validate?.(data) === false) throw new Error(`${sbj} failed validation...`)

              this.#state = data
            } catch (error) {
              if (this.#options.sessionStorage?.key)
                try {
                  sessionStorage.removeItem(this.#options.sessionStorage.key)
                } catch (purgeError) {
                  this.#options.onError?.(purgeError, 'remove')
                }

              this.#options.onError?.(error, 'read')
              this.#setToSessionStorage(this.#state)
            }
        } catch (error) {
          this.#decrementKeyUsageCount(key)
          throw error
        }
      }
    }
  }

  #setToSessionStorage(state: S): void {
    if (!this.#options.sessionStorage?.key) return

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
          `The state with the sessionStorage key "${this.#options.sessionStorage?.key}" has JSON-lossy values and they may not be accurately restored.`
        )
        this.#isLossyWarned = true
      }

      serialized = json
    } catch (error) {
      this.#options.onError?.(error, 'write')
    }

    if (!serialized) return

    try {
      sessionStorage.setItem(this.#options.sessionStorage?.key, serialized)
    } catch (error) {
      this.#options.onError?.(error, 'write')
    }
  }

  #decrementKeyUsageCount(storageKey?: string): void {
    if (!storageKey) return

    const usageCount: number = State.#keyUsageCounts.get(storageKey) ?? 0,
      decrementedUsageCount: number = Math.max(0, usageCount - 1)

    if (decrementedUsageCount === 0) State.#keyUsageCounts.delete(storageKey)
    else State.#keyUsageCounts.set(storageKey, decrementedUsageCount)

    if (decrementedUsageCount <= 1) State.#duplicatedKeys.delete(storageKey)
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

  get(): S {
    this.#assertAlive()
    return this.#state
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
    this.#decrementKeyUsageCount(this.#options?.sessionStorage?.key)

    /** @remarks Detaches the state reference to prevent memory leaks. */
    this.#state = undefined as unknown as S
  }
}
