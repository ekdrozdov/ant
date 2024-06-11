import { Point } from "../renderer/renderable";

export const PI = Math.PI;
export const PI_2 = Math.PI * 2;

export function crop(target: number, absLimit: number) {
	if (target < 0) {
		return Math.max(target, -absLimit);
	}
	return Math.min(target, absLimit);
}

export function distance(source: Point, target: Point) {
	return Math.sqrt(
		(source.x - target.x) * (source.x - target.x) +
			(source.y - target.y) * (source.y - target.y),
	);
}

export function rotationOf(position: Point) {
	// Ignore the possibility of zero coordinates.
	const rotation = Math.acos(
		Math.abs(position.x) /
			Math.sqrt(position.x * position.x + position.y * position.y),
	);
	if (position.x > 0 && position.y < 0) {
		return PI_2 - rotation;
	}
	if (position.x < 0 && position.y > 0) {
		return PI - rotation;
	}
	if (position.x < 0 && position.y < 0) {
		return PI + rotation;
	}
	return rotation;
}
