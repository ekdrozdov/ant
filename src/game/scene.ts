import { Disposable, DisposableStorage } from "../utils/lifecycle";
import { Point, Renderable, RenderableKind } from "../renderer/renderable";
import { World } from "./world";
import { Event, EventEmitter } from "../utils/events";

export interface Meta {
  readonly id: number;
}

export class MetaBase implements Meta {
  private static _count = 0;
  readonly id: number;
  constructor() {
    this.id = MetaBase._count++;
  }
}

export interface SceneObject extends Disposable {
  index?: Set<SceneObject>;
  readonly meta: Meta;
  readonly renderable: Renderable;
  onMount?(world: World): void;
  onDismount?(): void;
}

export class SceneObjectBase extends DisposableStorage implements SceneObject {
  readonly meta: Meta;

  constructor(readonly renderable: Renderable) {
    super();
    this.meta = new MetaBase();
  }
  onDismount(): void {
    this.dispose();
  }
}

export interface MountEvent {
  obj: SceneObject;
}

export interface DismountEvent {
  obj: SceneObject;
}

export interface Scene {
  readonly onMount: Event<MountEvent>;
  readonly onDismount: Event<MountEvent>;
  mount(obj: SceneObject): void;
  dismount(obj: SceneObject): void;
  reindex(obj: SceneObject): void;
  all(): readonly SceneObject[];
  all<T extends SceneObject>(_class: new (...args: any) => T): readonly T[];
}

const INDEX_STEP = 10;

export class SceneBase implements Scene {
  private readonly _onMount = new EventEmitter<MountEvent>();
  readonly onMount = this._onMount.event;
  private readonly _onDismount = new EventEmitter<MountEvent>();
  readonly onDismount = this._onDismount.event;

  private readonly _objs: SceneObject[] = [];
  /**
   * World size must be a multiple of index step.
   * Index is flattened, so given the world size (X, Y), object at position (x0, y0) stored in
   *
   *        ________________base________________     ______offset____
   *       /                                    \   /                \
   * index[(X // INDEX_STEP) * (y0 // INDEX_STEP) + (x0 // INDEX_STEP)].
   */
  private readonly index: Set<SceneObject>[] = [];
  private readonly indexBaseStep: number;

  constructor(private readonly _world: World) {
    if (_world.size.x % INDEX_STEP !== 0) {
      throw new Error(
        `World size width must be multiple of ${INDEX_STEP}, but got ${_world.size.x}`
      );
    }
    this.indexBaseStep = _world.size.x / INDEX_STEP;
  }

  mount(obj: SceneObject): void {
    obj.onMount?.(this._world);
    this._objs.push(obj);
    this.reindex(obj);
    this._onMount.dispatch({ obj: obj });
  }
  dismount(obj: SceneObject): void {
    obj.onDismount?.();

    obj.index?.delete(obj);

    const i = this._objs.findIndex((o) => o === obj);
    if (i === -1) throw new Error("Object is missing.");
    this._objs.splice(i, 1);
    this._onDismount.dispatch({ obj: obj });
  }
  /**
   * Must be called whenever object position changed.
   */
  reindex(obj: SceneObject) {
    const address =
      this.indexBaseStep * Math.trunc(obj.renderable.position.y / INDEX_STEP) +
      Math.trunc(obj.renderable.position.x / INDEX_STEP);
    this.index[address] ??= new Set();
    this.index[address].add(obj);
    obj.index = this.index[address];
  }

  all(): readonly SceneObject[];
  all<T extends SceneObject>(_class: new (...args: any) => T): readonly T[];
  all<T extends SceneObject>(
    _class?: new () => T
  ): readonly T[] | readonly SceneObject[] {
    if (!_class) return this._objs;
    return this._objs.filter((obj) => obj instanceof _class);
  }
  findInSquare(center: Point, halfSize: number): readonly SceneObject[] {
    const centerAddress =
      this.indexBaseStep * Math.trunc(center.y / INDEX_STEP) +
      Math.trunc(center.x / INDEX_STEP);

    // select candidates using center and halfSize
    // cast up/down/r/l positions, and include indexes they hit.
    // select sets up-down left-right

    return [];
  }
}
