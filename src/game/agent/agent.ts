import {
	type Renderable,
	RenderableBase,
	type Vector2d,
} from "../../renderer/renderable";
import { PI, PI_2, distance, rotationOf } from "../../utils/math";
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

export interface Ant {
	readonly id: number;
	state: "move" | "idle";
	fuel: number;
	mark(attracting?: boolean): void;
	move(): void;
	/**
	 * Rotate unit clockwise.
	 * @param radians amount of rotation.
	 */
	rotate(radians: number): void;
	face(position: Vector2d): void;
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

export class AntBase
	extends SceneObjectImpl
	implements Ant, DynamicSceneObject
{
	kind = "dynamic" as const;
	state: "move" | "idle" = "idle";
	fuel = 100;
	velocity = 1;
	private readonly visibilityHalfAngle = Math.PI / 2;
	private readonly visionDistance = 100;
	protected readonly world: World;
	public readonly id: number = getId();
	constructor() {
		super(new RenderableBase({ kind: "bunny" }));
		this.world = getWorld();
	}
	mark(attracting = false): void {
		this.world.scene.mount(
			new Mark(this.id, attracting, {
				kind: "mark",
				position: { ...this.renderable.position },
				state: "default",
				rotation: 0,
			}),
		);
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
	face(target: Vector2d): void {
		const targetVector = {
			x: target.x - this.renderable.position.x,
			y: target.y - this.renderable.position.y,
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
		return this.world.scene.findObjectsInRadius(this, this.visionDistance);
	}
	getVisibleObjectsInfront(): readonly SceneObjectBase[] {
		return this.world.scene
			.findObjectsInRadius(this, this.visionDistance)
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

class Mark extends SceneObjectImpl implements StaticSceneObject {
	readonly kind = "static";
	constructor(
		readonly id: number,
		readonly attracting: boolean,
		renderable: Renderable,
	) {
		super(renderable);
	}
}

export function isMark(o: unknown): o is Mark {
	return o instanceof Mark;
}

export function isFood(o: unknown): o is Food {
	return o instanceof Food;
}

export const NOISE_ROTATION = PI / 8;
