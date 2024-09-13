import type { Renderable } from "../../renderer/renderable";
import { type Event, EventEmitter } from "../../utils/events";
import { type Disposable, DisposableStorage } from "../../utils/lifecycle";
import { distance } from "../../utils/math";
import { getWorld } from "../world";

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
	onMount?(): void;
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
	all(): readonly SceneObject[];
	all<T extends SceneObject>(
		_class: new (...args: unknown[]) => T,
	): readonly T[];
}

export class SceneBase implements Scene {
	private readonly _onMount = new EventEmitter<MountEvent>();
	readonly onMount = this._onMount.event;
	private readonly _onDismount = new EventEmitter<MountEvent>();
	readonly onDismount = this._onDismount.event;

	private readonly _objs: SceneObject[] = [];

	mount(obj: SceneObject): void {
		obj.onMount?.();
		this._objs.push(obj);
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

	all(): readonly SceneObject[];
	all<T extends SceneObject>(
		_class: new (...args: unknown[]) => T,
	): readonly T[];
	all<T extends SceneObject>(
		_class?: new () => T,
	): readonly T[] | readonly SceneObject[] {
		if (!_class) return this._objs;
		return this._objs.filter((obj) => obj instanceof _class);
	}
}

export function findObjectsInRadius(
	center: SceneObject,
	radius: number,
): readonly SceneObject[] {
	return getWorld()
		.scene.all()
		.filter(
			(obj) =>
				center !== obj &&
				distance(center.renderable.position, obj.renderable.position) < radius,
		);
}
