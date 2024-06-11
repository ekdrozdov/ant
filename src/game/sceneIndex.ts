import type { Point } from "../renderer/renderable";
import type { SceneObject } from "./scene";

interface SceneIndex {
	// readonly index: readonly ReadonlySet<SceneObject>[]
	findCellsInRadius(center: Point, radius: number): number[];
	update(obj: SceneObject): void;
}

class LazyInitIndex implements SceneIndex {
	private readonly squares: Set<SceneObject>[] = [];
	private readonly addressBase: number;
	private readonly maxAddresBase: number;
	constructor(
		private readonly step: number,
		sceneDimensions: Point,
	) {
		if (sceneDimensions.x % step !== 0) {
			throw new Error(
				`World size width must be multiple of ${step}, but got ${sceneDimensions.x}`,
			);
		}

		this.addressBase = sceneDimensions.x / step;
		this.maxAddresBase = sceneDimensions.y;
	}
	findCellsInRadius(center: Point, radius: number): number[] {
		// a b c d
		// e f g k
		// l m n p
		// u h z q
		const centerOffset = 0;
		const centerBase = 0;
		const cellsRadius = Math.ceil(radius / this.step);
		const leftBound = centerOffset - cellsRadius;
		const rightBound = centerOffset + cellsRadius;

		if (
			leftBound < 0 ||
			rightBound > this.addressBase ||
			topBound < NaN ||
			bottomBound > this.maxAddresBase
		) {
			throw new Error("Out of bounds");
		}
	}
	update(obj: SceneObject): void {
		throw new Error("Method not implemented.");
	}
	private indexOf(position: Point) {
		return (
			this.addressBase * Math.trunc(position.y / this.step) +
			Math.trunc(position.x / this.step)
		);
	}
}
