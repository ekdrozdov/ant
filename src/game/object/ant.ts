import type { ConstructorType } from "../../utils/class";
import type { Trail } from "../agent/task/trail";
import type { SceneObject } from "../scene/scene";
import type { Body } from "./body";
import type { Building } from "./buildings";
import type { Mark } from "./mark";
import type { FoodResource, FoodSourceObject } from "./resource";

export interface Pocket {
	food: FoodResource;
}

export interface AntBody extends Body {
	readonly id: number;
	state: "move" | "idle";
	emittingFoodPheromone: boolean;
	food: FoodResource;
	readonly pocket: Pocket;
	readonly home: Building;

	mark(trail: Trail, attracting?: boolean): Mark;

	move(): void;

	/**
	 * Rotate unit clockwise.
	 * @param radians amount of rotation.
	 */
	rotateRelative(radians: number): void;

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

	faceAttractingPheromone(): void;

	distanceTo(target: SceneObject): number;

	grab(target: FoodSourceObject): void;

	store(target: FoodSourceObject): void;

	startPathRecording(): void;
}

// interface AntNavi {
// 	tripMemory: { rotationAbs: number; distance: number }[];
// 	getRouteBranches(): Branch[];
// 	// read all pheromones in a square
// 	// filter by direction
// 	// face towards pheromone at the edge
// 	// so ant will move directly towards farest pheromone
// 	// skipping any non optimal turns.
// 	cut(branch: Branch): Branch;
// }
