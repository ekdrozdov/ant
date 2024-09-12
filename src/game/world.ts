import type { Vector2d } from "../renderer/renderable";
import { type Scene, SceneBase } from "./scene";
import { type GameClock, GameClockBase } from "./time";

export interface World {
	readonly size: Vector2d;
	readonly scene: Scene;
	readonly clock: GameClock;
}

export class WorldBase implements World {
	size: Vector2d;
	scene: Scene = new SceneBase(this);
	clock: GameClock = new GameClockBase();
	constructor(props?: { size?: Vector2d }) {
		this.size = props?.size ?? {
			x: 100,
			y: 100,
		};
	}
}

export function estimateLocalFood(point: Vector2d, radius: number): number {
	return 10;
}
