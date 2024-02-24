import { Disposable, DisposableStorage } from './lifecycle'

type EventMap = Record<string, Record<any, any> | void>

export interface Event<T extends EventMap> {
  on<K extends keyof T>(name: K, listener: (event: T[K]) => void): Disposable
}

export interface EventEmitter<T extends EventMap> extends Event<T> {
  dispatch<K extends keyof T>(name: K, event: T[K]): void
}

export class EventEmitterBase<T extends EventMap> implements EventEmitter<T> {
  private readonly _listeners = new Map<string, ((event: any) => void)[]>()

  on<K extends keyof T>(name: K, listener: (event: T[K]) => void): Disposable {
    if (typeof name !== 'string') throw new Error(`Event name must be a string`)
    if (!this._listeners.has(name)) this._listeners.set(name, [])
    this._listeners.get(name)?.push(listener)
    return {
      dispose: () => {
        const i = this._listeners.get(name)?.findIndex((l) => l === listener)
        if (i === undefined) return
        this._listeners.get(name)?.splice(i, 1)
      },
    }
  }

  dispatch<K extends keyof T>(name: K, event: T[K]): void {
    if (typeof name !== 'string') throw new Error(`Event name must be a string`)
    const listeners = this._listeners.get(name)
    listeners?.forEach((listener) => listener(event))
  }
}

export class DisposableEventEmitter<T extends EventMap>
  extends DisposableStorage
  implements EventEmitter<T>, DisposableStorage
{
  private readonly _listeners = new Map<string, ((event: any) => void)[]>()

  on<K extends keyof T>(name: K, listener: (event: T[K]) => void): Disposable {
    if (typeof name !== 'string') throw new Error(`Event name must be a string`)
    if (!this._listeners.has(name)) this._listeners.set(name, [])
    this._listeners.get(name)?.push(listener)
    return {
      dispose: () => {
        const i = this._listeners.get(name)?.findIndex((l) => l === listener)
        if (i === undefined) return
        this._listeners.get(name)?.splice(i, 1)
      },
    }
  }

  dispatch<K extends keyof T>(name: K, event: T[K]): void {
    if (typeof name !== 'string') throw new Error(`Event name must be a string`)
    const listeners = this._listeners.get(name)
    listeners?.forEach((listener) => listener(event))
  }
}
