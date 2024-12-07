import type { Vector2d } from "../../renderer/renderable";
import type { DynamicSceneObject } from "../scene/scene";

export function getNextPositionBatch(
	objs: DynamicSceneObject[],
	dt: number,
): Vector2d[] {
	const nextPos = [];
	for (const obj of objs) {
		const dx = obj.velocity * dt * Math.cos(obj.renderable.rotation);
		const dy = obj.velocity * dt * Math.sin(obj.renderable.rotation);
		nextPos.push({
			x: obj.renderable.position.x + dx,
			y: obj.renderable.position.y + dy,
		});
	}
	return nextPos;
}
