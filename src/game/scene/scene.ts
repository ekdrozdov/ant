import type { Renderable, Vector2d } from "../../renderer/renderable";
import type { ConstructorType } from "../../utils/class";
import { type Event, EventEmitter } from "../../utils/events";
import { type Disposable, DisposableStorage } from "../../utils/lifecycle";
import { distance } from "../../utils/math";
import type { Agent } from "../agent/agent";
import { config } from "../config";
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
	agent?: Agent;
	onMount?(scene: Scene): void;
	onDismount?(): void;
}

export interface DynamicSceneObject extends SceneObjectBase {
	kind: "dynamic";
	readonly state: "move" | "idle";
	readonly velocity: number;
	emittingFoodPheromone: boolean;
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
	dismountAndDispose(obj: SceneObject): void;
	updateBatch(dtSeconds: number): void;
	all(): readonly SceneObject[];
	all<T extends SceneObject>(targetClass: new (...args: unknown[]) => T): T[];
	findObjectsInRadius(center: SceneObject, radius: number): SceneObject[];
}

let throttleCounter = 0;

export class SceneBase implements Scene {
	private readonly _onMount = new EventEmitter<MountEvent>();
	readonly onMount = this._onMount.event;
	private readonly _onDismount = new EventEmitter<MountEvent>();
	readonly onDismount = this._onDismount.event;
	private readonly indexer: Indexer;
	readonly pheromap: Pheromap;
	private readonly _objs: SceneObject[] = [];
	private readonly bodies: Set<Body> = new Set();

	constructor(private readonly size: Vector2d) {
		this.indexer = new SceneIndexer(100, this.size);
		this.pheromap = new ScenePheromap(10, this.size);
	}

	mount(obj: SceneObject): void {
		obj.onMount?.(this);
		if (
			obj.renderable.position.x < 0 ||
			obj.renderable.position.y < 0 ||
			obj.renderable.position.x > this.size.x ||
			obj.renderable.position.y > this.size.y
		) {
			throw new Error(
				`Object out of bounds: ${JSON.stringify(obj.renderable.position)}`,
			);
		}
		this._objs.push(obj);
		this.indexer.register(obj);
		this._onMount.dispatch({ obj: obj });
	}

	dismountAndDispose(obj: SceneObject): void {
		obj.onDismount?.();
		obj.dispose();
		const i = this._objs.findIndex((o) => o === obj);
		if (i === -1) throw new Error("Object is missing.");
		this._objs.splice(i, 1);
		this.indexer.unregister(obj);
		this._onDismount.dispatch({ obj: obj });
	}

	updateBatch(dtSeconds: number) {
		const nonEmittingMovingObjs: DynamicSceneObject[] = this._objs
			.filter((o) => o.kind === "dynamic")
			.filter((o) => o.state === "move")
			.filter((o) => !o.emittingFoodPheromone);

		const nonEmittingPrevPos: Vector2d[] = [];
		for (const obj of nonEmittingMovingObjs) {
			nonEmittingPrevPos.push(obj.renderable.position);
		}

		const emittingMovingObjs = this._objs
			.filter((o) => o.kind === "dynamic")
			.filter((o) => o.state === "move")
			.filter((o) => o.emittingFoodPheromone);

		const emittingPrevPos: Vector2d[] = [];
		for (const obj of emittingMovingObjs) {
			emittingPrevPos.push(obj.renderable.position);
		}

		// TODO check out of bounds
		// filetr/map obj to movable or make movable compatible
		const nonEmittingNextPos: Vector2d[] = getNextPositionBatch(
			nonEmittingMovingObjs,
			dtSeconds,
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
				throw new Error(
					`Object out of bounds: ${JSON.stringify(obj.renderable.position)}`,
				);
			}
			++i;
		}

		const emittingNextPos: Vector2d[] = getNextPositionBatch(
			emittingMovingObjs,
			dtSeconds,
		);

		// Update position.
		let j = 0;
		for (const obj of emittingMovingObjs) {
			obj.renderable.position = emittingNextPos[j];
			if (
				obj.renderable.position.x < 0 ||
				obj.renderable.position.y < 0 ||
				obj.renderable.position.x > this.size.x ||
				obj.renderable.position.y > this.size.y
			) {
				throw new Error(
					`Object out of bounds: ${JSON.stringify(obj.renderable.position)}`,
				);
			}
			++j;
		}

		// Reindex.
		this.indexer.notifyPositionUpdateBatch(
			nonEmittingMovingObjs,
			nonEmittingPrevPos,
		);
		this.indexer.notifyPositionUpdateBatch(emittingMovingObjs, emittingPrevPos);

		// Apply pheromones.
		this.pheromap.notifyPositionUpdateBatch(
			emittingPrevPos,
			emittingNextPos,
			config.antPheromoneMarkIntensity,
		);

		// TODO: find better way to throttle operations, like dedicated hooks.
		// Operations throttled to execute no frequent than 5 seconds.
		if (throttleCounter > 4) {
			throttleCounter = 0;
			// Execute agents.
			for (const obj of this._objs) {
				if (obj.agent) {
					obj.agent.execute();
				}
			}
		}
		throttleCounter += dtSeconds;
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
