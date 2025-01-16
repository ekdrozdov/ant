import { RenderableBase } from "../../renderer/renderable";
import { EventEmitter } from "../../utils/events";
import { PI_2, distance, rotationOf } from "../../utils/math";
import type { Building } from "../buildings";
import { config } from "../config";
import {
	type DynamicSceneObject,
	type SceneObject,
	type SceneObjectBase,
	SceneObjectImpl,
	type StaticSceneObject,
} from "../scene/scene";
import { type World, getWorld } from "../world";
import { Mark } from "./mark";
import {
	FoodResource,
	type FoodSourceObject,
	assertWithinInteractionRange,
	isWithinInteractionRange,
	transferResource,
} from "./resource";

let id = 0;
function getId() {
	return id++;
}

export interface Ant {
	readonly id: number;
	state: "move" | "idle";
	food: FoodResource;
	readonly home: Building;
	mark(attracting?: boolean): Mark;
	move(): void;
	/**
	 * Rotate unit clockwise.
	 * @param radians amount of rotation.
	 */
	rotate(radians: number): void;
	face(position: SceneObject): void;
	isWithinInteractionRange(target: SceneObject): boolean;
	stop(): void;
	eat(source: FoodSourceObject): void;
	getVisibleObjects(): readonly SceneObject[];
	getVisibleObjectsInfront(): readonly SceneObject[];
	distanceTo(target: SceneObject): number;
}

export class AntBase
	extends SceneObjectImpl
	implements Ant, DynamicSceneObject
{
	kind = "dynamic" as const;
	state: "move" | "idle" = "idle";
	food = new FoodResource(100);
	velocity = config.antVelocity;
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
				this.food.amount -= 1;
				console.debug(`${this.id} food ${this.food.amount}`);
				if (this.food.amount <= 0) {
					const corpse = new AntCorpse();
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
	isWithinInteractionRange(target: SceneObject): boolean {
		return isWithinInteractionRange(this, target);
	}
	stop(): void {
		this.state = "idle";
	}
	eat(source: FoodSourceObject): void {
		assertWithinInteractionRange(this, source);
		transferResource(
			source.food,
			this.food,
			config.antFoodConsumptionPerSecond,
		);
	}
	getVisibleObjects(): readonly SceneObject[] {
		return this.world.scene.findObjectsInRadius(this, config.antVisionDistance);
	}
	getVisibleObjectsInfront(): readonly SceneObject[] {
		return this.world.scene
			.findObjectsInRadius(this, config.antVisionDistance)
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

export class AntCorpse extends SceneObjectImpl implements StaticSceneObject {
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
