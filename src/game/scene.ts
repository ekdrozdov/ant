import { Disposable, DisposableStorage } from '../utils/lifecycle'
import { Point, Renderable, RenderableKind } from '../renderer/renderable'
import { World } from './world'
import { EventEmitter, EventEmitterBase } from '../utils/events'

export interface Meta {
  readonly id: number
}

export class MetaBase implements Meta {
  private static _count = 0
  readonly id: number
  constructor() {
    this.id = MetaBase._count++
  }
}

export interface SceneObject extends Disposable {
  readonly meta: Meta
  readonly renderable: Renderable
  onMount?(world: World): void
  onDismount?(): void
}

export class SceneObjectBase extends DisposableStorage implements SceneObject {
  readonly meta: Meta

  constructor(readonly renderable: Renderable) {
    super()
    this.meta = new MetaBase()
  }
  onDismount(): void {
    this.dispose()
  }
}

export type SceneEvents = {
  mount: { obj: SceneObject }
  dismount: { obj: SceneObject }
}

export interface Scene extends EventEmitter<SceneEvents> {
  mount(obj: SceneObject): void
  dismount(obj: SceneObject): void
  all(): readonly SceneObject[]
  all<T extends SceneObject>(_class: new (...args: any) => T): readonly T[]
}

export class SceneBase extends EventEmitterBase<SceneEvents> implements Scene {
  private readonly _objs: SceneObject[] = []

  constructor(private readonly _world: World) {
    super()
  }

  mount(obj: SceneObject): void {
    obj.onMount?.(this._world)
    this._objs.push(obj)
    this.dispatch('mount', { obj })
  }
  dismount(obj: SceneObject): void {
    obj.onDismount?.()
    const i = this._objs.findIndex((o) => o === obj)
    if (i === -1) throw new Error('Object is missing.')
    this._objs.splice(i, 1)
    this.dispatch('dismount', { obj })
  }

  all(): readonly SceneObject[]
  all<T extends SceneObject>(_class: new (...args: any) => T): readonly T[]
  all<T extends SceneObject>(
    _class?: new () => T
  ): readonly T[] | readonly SceneObject[] {
    if (!_class) return this._objs
    return this._objs.filter((obj) => obj instanceof _class)
  }
}
