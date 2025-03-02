import type { Vector2d } from "../renderer/renderable";

export const PI = Math.PI;
export const PI_2 = Math.PI * 2;

export function crop(target: number, absLimit: number) {
	if (target < 0) {
		return Math.max(target, -absLimit);
	}
	return Math.min(target, absLimit);
}

export function distance(source: Vector2d, target: Vector2d) {
	return Math.sqrt(
		(source.x - target.x) * (source.x - target.x) +
			(source.y - target.y) * (source.y - target.y),
	);
}

// todo: track unit vector indicating a rotation.
export function angleBetween(lhs: Vector2d, rhs: Vector2d) {
	return Math.acos(
		(lhs.x * rhs.x + lhs.y * rhs.y) /
			(Math.sqrt(lhs.x * lhs.x + lhs.y * lhs.y) *
				Math.sqrt(rhs.x * rhs.x + rhs.y * rhs.y)),
	);
}

/**
 * Unit circle has `0` length at rightmost point and
 * `PI` length at leftmost point.
 * Length is increasing counter-clockwise.
 * @param vector A vector specifying a point on unit circle.
 * @returns Amount of rotation of vector relative to unit circle in radians.
 */
export function rotationOf(vector: Vector2d) {
	// Ignore the possibility of zero coordinates.
	const rotation = Math.acos(
		Math.abs(vector.x) / Math.sqrt(vector.x * vector.x + vector.y * vector.y),
	);
	if (vector.x > 0 && vector.y < 0) {
		return PI_2 - rotation;
	}
	if (vector.x < 0 && vector.y > 0) {
		return PI - rotation;
	}
	if (vector.x < 0 && vector.y < 0) {
		return PI + rotation;
	}
	return rotation;
}

export function translate(position: Vector2d, x: number, y: number): Vector2d {
	return { x: position.x + x, y: position.y + y };
}

/**
 * @param teta a point in unit circle, 0 <= teta <= 2 * PI
 * @param start a point in unit circle, 0 <= start < 2 * PI
 * @param end a point in unit circle, 0 < end <= 4 * PI
 */
export function withinSector(
	teta: number,
	start: number,
	end: number,
): boolean {
	return end <= PI_2
		? teta >= start && teta <= end
		: withinSector(teta, start, PI_2) || withinSector(teta, 0, end - PI_2);
}
