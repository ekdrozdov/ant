import type { Scene, SceneObject } from "../game/scene";
import type { Point } from "../renderer/renderable";

export class Spawn {
	constructor(private readonly _scene: Scene) {}
	execute(agent: SceneObject, position: Point) {
		this._scene.mount(agent);
		agent.renderable.position.x = position.x;
		agent.renderable.position.y = position.y;
	}
}
