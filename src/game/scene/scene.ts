import type { Renderable, Vector2d } from "../../renderer/renderable";
import type { ConstructorType } from "../../utils/class";
import { type Event, EventEmitter } from "../../utils/events";
import { type Disposable, DisposableStorage } from "../../utils/lifecycle";
import { distance } from "../../utils/math";
import { config } from "../config";
import { AntBase } from "../object/ant";
import { getNextPositionBatch } from "../physics/movement";
import { type Indexer, SceneIndexer } from "./indexer";
import { type Pheromap, ScenePheromap } from "./pheromap";

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

export interface SceneObjectBase extends Disposable {
	readonly meta: Meta;
	readonly renderable: Renderable;
	onMount?(): void;
	onDismount?(): void;
}

export interface DynamicSceneObject extends SceneObjectBase {
	kind: "dynamic";
	readonly state: "move" | "idle";
	readonly velocity: number;
}

export interface StaticSceneObject extends SceneObjectBase {
	kind: "static";
}

export type SceneObject = DynamicSceneObject | StaticSceneObject;

export class SceneObjectImpl
	extends DisposableStorage
	implements SceneObjectBase
{
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
	obj: SceneObjectBase;
}

export interface DismountEvent {
	obj: SceneObjectBase;
}

export interface Scene {
	readonly pheromap: Pheromap;
	readonly onMount: Event<MountEvent>;
	readonly onDismount: Event<MountEvent>;
	mount(obj: SceneObject): void;
	dismount(obj: SceneObject): void;
	updateBatch(dt: number): void;
	all(): readonly SceneObject[];
	all<T extends SceneObject>(targetClass: new (...args: unknown[]) => T): T[];
	findObjectsInRadius(center: SceneObject, radius: number): SceneObject[];
}

export class SceneBase implements Scene {
	private readonly _onMount = new EventEmitter<MountEvent>();
	readonly onMount = this._onMount.event;
	private readonly _onDismount = new EventEmitter<MountEvent>();
	readonly onDismount = this._onDismount.event;
	private readonly indexer: Indexer;
	readonly pheromap: Pheromap;
	private readonly _objs: SceneObject[] = [];

	constructor(private readonly size: Vector2d) {
		this.indexer = new SceneIndexer(100, this.size);
		this.pheromap = new ScenePheromap(5, this.size);
	}

	mount(obj: SceneObject): void {
		obj.onMount?.();
		if (
			obj.renderable.position.x < 0 ||
			obj.renderable.position.y < 0 ||
			obj.renderable.position.x > this.size.x ||
			obj.renderable.position.y > this.size.y
		) {
			throw new Error(`Object out of bounds: ${obj.renderable.position}`);
		}
		this._objs.push(obj);
		this.indexer.register(obj);
		this._onMount.dispatch({ obj: obj });
	}
	dismount(obj: SceneObject): void {
		obj.onDismount?.();
		const i = this._objs.findIndex((o) => o === obj);
		if (i === -1) throw new Error("Object is missing.");
		this._objs.splice(i, 1);
		this.indexer.unregister(obj);
		this._onDismount.dispatch({ obj: obj });
	}

	updateBatch(dt: number) {
		const nonEmittingMovingObjs: DynamicSceneObject[] = this._objs
			.filter((o) => o.kind === "dynamic")
			.filter((o) => o.state === "move")
			.filter((o) => !(o instanceof AntBase) || !o.emittingFoodPheromone);

		const nonEmittingPrevPos: Vector2d[] = [];
		for (const obj of nonEmittingMovingObjs) {
			nonEmittingPrevPos.push(obj.renderable.position);
		}

		const emittingAnts = this._objs
			.filter((o) => o.kind === "dynamic")
			.filter((o) => o.state === "move")
			.filter((o) => o instanceof AntBase && o.emittingFoodPheromone);

		const emittingPrevPos: Vector2d[] = [];
		for (const obj of emittingAnts) {
			emittingPrevPos.push(obj.renderable.position);
		}

		// TODO check out of bounds
		// filetr/map obj to movable or make movable compatible
		const nonEmittingNextPos: Vector2d[] = getNextPositionBatch(
			nonEmittingMovingObjs,
			dt,
		);

		// Update position.
		let i = 0;
		for (const obj of nonEmittingMovingObjs) {
			obj.renderable.position = nonEmittingNextPos[i];
			if (
				obj.renderable.position.x < 0 ||
				obj.renderable.position.y < 0 ||
				obj.renderable.position.x > this.size.x ||
				obj.renderable.position.y > this.size.y
			) {
				throw new Error(`Object out of bounds: ${obj.renderable.position}`);
			}
			++i;
		}

		const emittingNextPos: Vector2d[] = getNextPositionBatch(
			nonEmittingMovingObjs,
			dt,
		);

		// Update position.
		let j = 0;
		for (const obj of emittingAnts) {
			obj.renderable.position = emittingNextPos[j];
			if (
				obj.renderable.position.x < 0 ||
				obj.renderable.position.y < 0 ||
				obj.renderable.position.x > this.size.x ||
				obj.renderable.position.y > this.size.y
			) {
				throw new Error(`Object out of bounds: ${obj.renderable.position}`);
			}
			++j;
		}

		// Reindex.
		this.indexer.notifyPositionUpdateBatch(
			nonEmittingMovingObjs,
			nonEmittingPrevPos,
		);
		this.indexer.notifyPositionUpdateBatch(emittingAnts, emittingPrevPos);

		// Apply pheromones.
		this.pheromap.updateBatch(
			emittingPrevPos,
			emittingNextPos,
			config.antPheromoneMarkIntensity,
		);
	}

	all(): readonly SceneObject[];
	all<T extends SceneObject>(targetClass: ConstructorType<T>): T[];
	all<T extends SceneObject>(
		targetClass?: ConstructorType<T>,
	): T[] | SceneObject[] {
		if (!targetClass) return this._objs;
		return this._objs.filter((obj) => obj instanceof targetClass);
	}

	findObjectsInRadius(center: SceneObject, radius: number): SceneObject[] {
		return this.indexer
			.allInRadius(center.renderable.position, radius)
			.filter(
				(obj) =>
					center !== obj &&
					distance(center.renderable.position, obj.renderable.position) <
						radius,
			);
	}
}
