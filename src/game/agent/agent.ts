import { RenderableBase, type Vector2d } from "../../renderer/renderable";
import { EventEmitter } from "../../utils/events";
import { PI, PI_2, distance, rotationOf } from "../../utils/math";
import type { Building } from "../buildings";
import { Food } from "../resource";
import {
	type DynamicSceneObject,
	type SceneObjectBase,
	SceneObjectImpl,
	type StaticSceneObject,
} from "../scene/scene";
import { type World, getWorld } from "../world";

export interface Agent {
	execute(): void;
}

class AgentRegistry {
	private readonly _agents: Agent[] = [];
	public get agents(): ReadonlyArray<Agent> {
		return this._agents;
	}
	register(agent: Agent): void {
		if (this._agents.find((a) => a === agent)) {
			throw new Error("Agent already registered");
		}
		this._agents.push(agent);
	}
	unregister(agent: Agent): void {
		const index = this._agents.indexOf(agent);
		if (index === -1) {
			throw new Error("Agent not registered");
		}
		this._agents.splice(index, 1);
	}
}

export const agentRegistry = new AgentRegistry();

export interface Ant {
	readonly id: number;
	state: "move" | "idle";
	fuel: number;
	readonly home: Building;
	mark(attracting?: boolean): Mark;
	move(): void;
	/**
	 * Rotate unit clockwise.
	 * @param radians amount of rotation.
	 */
	rotate(radians: number): void;
	face(position: SceneObjectBase): void;
	stop(): void;
	refuel(): void;
	getVisibleObjects(): readonly SceneObjectBase[];
	getVisibleObjectsInfront(): readonly SceneObjectBase[];
	distanceTo(target: SceneObjectBase): number;
}

let id = 0;
function getId() {
	return id++;
}

class Corpse extends SceneObjectImpl implements StaticSceneObject {
	kind = "static" as const;
	private readonly _onDecomposed = new EventEmitter<void>();
	readonly onDecomposed = this._onDecomposed.event;
	private remains = 20;
	constructor() {
		super(new RenderableBase({ kind: "corpse" }));
		this.register(
			getWorld().clock.onMinute(() => {
				this.remains -= 10;
				console.debug(`flesh remains: ${this.remains}`);
				if (this.remains <= 0) {
					this._onDecomposed.dispatch();
				}
			}),
		);
	}
}

export class AntBase
	extends SceneObjectImpl
	implements Ant, DynamicSceneObject
{
	static VISION_DISTANCE = 40;
	kind = "dynamic" as const;
	state: "move" | "idle" = "idle";
	fuel = 100;
	velocity = 1;
	private readonly visibilityHalfAngle = Math.PI / 2;
	protected readonly world: World;
	public readonly id: number = getId();
	private readonly _onDead = new EventEmitter<void>();
	readonly onDead = this._onDead.event;
	constructor(readonly home: Building) {
		super(new RenderableBase({ kind: "bunny" }));
		this.world = getWorld();
		this.register(
			this.world.clock.onMinute(() => {
				this.fuel -= 1;
				console.debug(`${this.id} fuel ${this.fuel}`);
				if (this.fuel <= 0) {
					const corpse = new Corpse();
					corpse.renderable.position = this.renderable.position;
					this.world.scene.mount(corpse);
					corpse.onDecomposed(() => this.world.scene.dismount(corpse));
					this._onDead.dispatch();
				}
			}),
		);
	}
	mark(attracting = false): Mark {
		const mark = new Mark(this.id, attracting);
		mark.renderable.position = this.renderable.position;
		this.world.scene.mount(mark);
		return mark;
	}
	move(): void {
		this.state = "move";
	}
	rotate(radians: number): void {
		let normalizedRotation = radians % PI_2;
		if (normalizedRotation < 0) {
			normalizedRotation = PI_2 + normalizedRotation;
		}
		this.renderable.rotation =
			(this.renderable.rotation + normalizedRotation) % PI_2;
	}
	face(target: SceneObjectBase): void {
		const targetVector = {
			x: target.renderable.position.x - this.renderable.position.x,
			y: target.renderable.position.y - this.renderable.position.y,
		};
		const targetRotation = rotationOf(targetVector);
		this.renderable.rotation = targetRotation;
	}
	stop(): void {
		this.state = "idle";
	}
	refuel(): void {
		throw new Error("Method not implemented.");
	}
	getVisibleObjects(): readonly SceneObjectBase[] {
		return this.world.scene.findObjectsInRadius(this, AntBase.VISION_DISTANCE);
	}
	getVisibleObjectsInfront(): readonly SceneObjectBase[] {
		return this.world.scene
			.findObjectsInRadius(this, AntBase.VISION_DISTANCE)
			.filter((obj) => {
				const targetVector = {
					x: obj.renderable.position.x - this.renderable.position.x,
					y: obj.renderable.position.y - this.renderable.position.y,
				};
				const targetRotation = rotationOf(targetVector);
				return (
					Math.abs(targetRotation - this.renderable.rotation) <=
					this.visibilityHalfAngle
				);
			});
	}
	distanceTo(target: SceneObjectBase): number {
		return distance(this.renderable.position, target.renderable.position);
	}
}

export class Mark extends SceneObjectImpl implements StaticSceneObject {
	readonly kind = "static";
	constructor(
		readonly id: number,
		readonly attracting: boolean,
	) {
		super(new RenderableBase({ kind: "mark" }));
	}
}

export function isMark(o: unknown): o is Mark {
	return o instanceof Mark;
}

export function isFood(o: unknown): o is Food {
	return o instanceof Food;
}

export const NOISE_ROTATION = PI / 8;
