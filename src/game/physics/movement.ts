import type { Vector2d } from "../../renderer/renderable";

interface Movable {
	velocity: number;
	rotation: number;
	position: Vector2d;
}

export function getNextPosition(objs: Movable[], dt: number): Vector2d[] {
	const nextPos = [];
	for (const obj of objs) {
		const dx = obj.velocity * dt * Math.cos(obj.rotation);
		const dy = obj.velocity * dt * Math.sin(obj.rotation);
		nextPos.push({
			x: obj.position.x + dx,
			y: obj.position.y + dy,
		});
	}
	return nextPos;
}
