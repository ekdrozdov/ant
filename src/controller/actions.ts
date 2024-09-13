import type { Scene, SceneObject } from "../game/scene/scene";
import type { Vector2d } from "../renderer/renderable";

export class Spawn {
	constructor(private readonly _scene: Scene) {}
	execute(agent: SceneObject, position: Vector2d) {
		this._scene.mount(agent);
		agent.renderable.position.x = position.x;
		agent.renderable.position.y = position.y;
	}
}
