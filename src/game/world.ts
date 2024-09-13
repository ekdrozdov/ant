import type { Vector2d } from "../renderer/renderable";
import { type Scene, SceneBase } from "./scene/scene";
import { type GameClock, GameClockBase } from "./time";

export interface World {
	readonly size: Vector2d;
	readonly scene: Scene;
	readonly clock: GameClock;
}

export class WorldBase implements World {
	size: Vector2d;
	scene: Scene;
	clock: GameClock = new GameClockBase();
	constructor(props?: { size?: Vector2d }) {
		this.size = props?.size ?? {
			x: 100,
			y: 100,
		};
		this.scene = new SceneBase();
	}
}

export function estimateLocalFood(point: Vector2d, radius: number): number {
	return 10;
} // setTimeout(() => world.clock.setFreq(300), 3000)

let _world: World;

export function initWorld(world: World) {
	_world = world;
}

export function getWorld() {
	return _world;
}
