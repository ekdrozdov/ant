import { RenderableBase, type Vector2d } from "../../renderer/renderable";
import { OrderedCircularBuffer } from "../../utils/buffer";
import type { ConstructorType } from "../../utils/class";
import { EventEmitter } from "../../utils/events";
import { PI, PI_2, distance, rotationOf } from "../../utils/math";
import type { Trail } from "../agent/task/trail";
import { config } from "../config";
import {
	directionTags,
	filterDirections,
	rollAttractingDireciton,
} from "../scene/pheromap";
import {
	type DynamicSceneObject,
	type SceneObject,
	type SceneObjectBase,
	SceneObjectImpl,
} from "../scene/scene";
import { type World, getWorld } from "../world";
import type { Ant, Pocket } from "./ant";
import { AntCorpse } from "./antCorpse";
import type { Building } from "./buildings";
import { Mark } from "./mark";
import {
	FoodResource,
	type FoodSourceObject,
	assertWithinInteractionRange,
	isWithinInteractionRange,
	transferResource,
} from "./resource";

const visibilityHalfAngle = Math.PI / 2;
const trackedPathTailPositions = 2;

let id = 0;
function generateId() {
	return id++;
}

export class AntBase
	extends SceneObjectImpl
	implements Ant, DynamicSceneObject
{
	readonly id: number = generateId();
	readonly kind = "dynamic";
	state: "move" | "idle" = "idle";
	emittingFoodPheromone = false;
	food = new FoodResource(100);
	readonly pocket: Pocket = { food: new FoodResource() };
	velocity = config.antVelocity;

	protected readonly world: World;
	private pathTailPositions: OrderedCircularBuffer<Vector2d>;

	private readonly _onDead = new EventEmitter<void>();
	// TODO: all scene objects must be wether child objects or self-disposable (=self-dismountable).
	readonly onDead = this._onDead.event;

	constructor(readonly home: Building) {
		super(new RenderableBase({ kind: "bunny" }));
		console.debug("Creating ant");
		this.world = getWorld();
		this.pathTailPositions = new OrderedCircularBuffer(
			trackedPathTailPositions,
			this.renderable.position,
		);
		this.register(
			this.world.clock.onMinute(() => {
				this.food.amount -= config.antFoodDepletionPerMinute;
				console.debug(`${this.id} food ${this.food.amount}`);
				if (this.food.amount <= 0) {
					const corpse = new AntCorpse();
					corpse.renderable.position = this.renderable.position;
					this.world.scene.mount(corpse);
					// TODO: all scene objects must be wether child objects or self-disposable (=self-dismountable).
					corpse.onDecomposed(() => this.world.scene.dismount(corpse));
					this._onDead.dispatch();
				}
			}),
		);
	}

	startPathRecording(): void {
		this.pathTailPositions.resetWith(this.renderable.position);
	}

	/**
	 * Non-physics driven reset (e.g. during scene initialization)
	 */
	resetPositionTo(position: Vector2d) {
		this.renderable.position = position;
		this.pathTailPositions.resetWith(position);
	}

	face(target: SceneObjectBase): void {
		const translatedTargetVector = {
			x: target.renderable.position.x - this.renderable.position.x,
			y: target.renderable.position.y - this.renderable.position.y,
		};
		this.updateRotation(rotationOf(translatedTargetVector));
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

	rotateRelative(radians: number): void {
		let normalizedRotation = radians % PI_2;
		if (normalizedRotation < 0) {
			normalizedRotation = PI_2 + normalizedRotation;
		}
		this.updateRotation((this.renderable.rotation + normalizedRotation) % PI_2);
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
					visibilityHalfAngle
				);
			});
	}

	getSurroundingPheromones(): number[] {
		return this.world.scene.pheromap.readSurroundingPheromonesAt(
			this.renderable.position,
		);
	}

	faceAttractingPheromone() {
		const phs = this.world.scene.pheromap.readSurroundingPheromonesAt(
			this.renderable.position,
		);
		// TODO: track path trajectory
		const movementDirection = this.getPathTailVectorRotation();
		// Want to capture 3 direcitons to roll from.
		const movementSectorHalfAngle = PI / 2 - 0.1;
		const dirs = filterDirections(
			movementDirection - movementSectorHalfAngle,
			movementDirection + movementSectorHalfAngle,
			phs.map((ph, i) => ({ tag: directionTags[i], value: ph })),
		);
		const attractor = rollAttractingDireciton(dirs, Math.random());
		const targetPosition =
			this.world.scene.pheromap.getNeighbourPheromonePositionAt(
				this.renderable.position,
				attractor.tag,
			);
		// console.log(
		// 	`agent ${JSON.stringify(this.renderable.position)} ${this.renderable.rotation}`,
		// );
		// console.log(
		// 	`attractor: ${attractor.tag} ${JSON.stringify(targetPosition)}`,
		// );
		// TODO: generalize
		const translatedTargetPosition: Vector2d = {
			x: targetPosition.x - this.renderable.position.x,
			y: targetPosition.y - this.renderable.position.y,
		};
		const targetRotation = rotationOf(translatedTargetPosition);
		this.updateRotation(targetRotation);
		// this.facePosition(targetPosition);
	}

	distanceTo(target: SceneObjectBase): number {
		return distance(this.renderable.position, target.renderable.position);
	}

	private updateRotation(targetRotation: number) {
		this.pathTailPositions.push({
			x: this.renderable.position.x,
			y: this.renderable.position.y,
		});
		this.renderable.rotation = targetRotation;
		return targetRotation;
	}

	private getPathTailVectorRotation(): number {
		// TODO: translate vectors first before sum it up.
		// Maybe just use last choosen direciton.
		const pathTailPositions = this.pathTailPositions.read();
		const trackedPositionsSumVection: Vector2d = {
			x: pathTailPositions[0].x,
			y: pathTailPositions[0].y,
		};
		for (let i = 1; i < pathTailPositions.length; ++i) {
			trackedPositionsSumVection.x += pathTailPositions[i].x;
			trackedPositionsSumVection.y += pathTailPositions[i].y;
		}
		trackedPositionsSumVection.x += this.renderable.position.x;
		trackedPositionsSumVection.y += this.renderable.position.y;

		return rotationOf(trackedPositionsSumVection);
	}
}
