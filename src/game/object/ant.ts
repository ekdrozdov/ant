import { RenderableBase } from "../../renderer/renderable";
import type { ConstructorType } from "../../utils/class";
import { EventEmitter } from "../../utils/events";
import { PI_2, distance, rotationOf } from "../../utils/math";
import type { Trail } from "../agent/task/trail";
import { config } from "../config";
import type { Direction } from "../scene/pheromap";
import {
	type DynamicSceneObject,
	type SceneObject,
	type SceneObjectBase,
	SceneObjectImpl,
	type StaticSceneObject,
} from "../scene/scene";
import { type World, getWorld } from "../world";
import type { Building } from "./buildings";
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

type Pocket = {
	food: FoodResource;
};

export interface Ant {
	readonly id: number;
	state: "move" | "idle";
	emittingFoodPheromone: boolean;
	food: FoodResource;
	pocket: Pocket;
	readonly home: Building;
	mark(trail: Trail, attracting?: boolean): Mark;
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
	getVisibleObjects(): SceneObject[];
	getVisibleObjects<T extends SceneObject>(
		targetClass: ConstructorType<T>,
	): T[];
	getVisibleObjectsInfront(): SceneObject[];
	getSurroundingPheromones(): number[];
	getPheromonesDownTheWay(): number[];
	distanceTo(target: SceneObject): number;
	grab(target: FoodSourceObject): void;
	store(target: FoodSourceObject): void;
}

export class AntBase extends SceneObjectImpl implements Ant, DynamicSceneObject {
		kind = "dynamic" as const;
		state: "move" | "idle" = "idle";
		emittingFoodPheromone = false;
		food = new FoodResource(100);
		pocket: Pocket = { food: new FoodResource() };
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
		store(target: FoodSourceObject): void {
			assertWithinInteractionRange(this, target);
			transferResource(this.pocket.food, target.food, this.pocket.food.amount);
			this.home.storage;
		}
		grab(target: FoodSourceObject): void {
			assertWithinInteractionRange(this, target);
			transferResource(target.food, this.pocket.food, config.antCarryCapacity);
			console.debug(`Ant ${this.id} grabbed food`);
		}
		mark(trail: Trail, attracting = false): Mark {
			const mark = new Mark(this.id, attracting, trail);
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
		getVisibleObjects<T extends SceneObject>(
			targetClass: ConstructorType<T>,
		): T[];
		getVisibleObjects(): SceneObject[];
		getVisibleObjects<T extends SceneObject>(
			targetClass?: ConstructorType<T>,
		): T[] | SceneObject[] {
			const visibleObjects = this.world.scene.findObjectsInRadius(
				this,
				config.antVisionDistance,
			);
			return targetClass
				? visibleObjects.filter((o) => o instanceof targetClass)
				: visibleObjects;
		}
		getVisibleObjectsInfront(): SceneObject[] {
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
		getSurroundingPheromones(): number[] {
			return this.world.scene.pheromap.readSurroundingPheromonesAt(
				this.renderable.position,
			);
		}
		getPheromonesDownTheWay(): number[] {
			const ps = this.world.scene.pheromap.readSurroundingPheromonesAt(
				this.renderable.position,
			);
			// figure out a sector corresponding to the movement

			return ps;
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
