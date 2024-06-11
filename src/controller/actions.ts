import { Point, Renderable } from "../renderer/renderable";
import { Scene, SceneObject } from "../game/scene";

export class Spawn {
	constructor(private readonly _scene: Scene) {}
	execute(agent: SceneObject, position: Point) {
		this._scene.mount(agent);
		agent.renderable.position.x = position.x;
		agent.renderable.position.y = position.y;
	}
}
