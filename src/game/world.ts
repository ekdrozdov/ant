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
		this.scene = new SceneBase(this.size);
	}
}

let _world: World;

export function initWorld(world: World) {
	_world = world;
}

export function getWorld() {
	return _world;
}
