import type { Vector2d } from "../renderer/renderable";
import type { Disposable } from "../utils/lifecycle";
import type { SceneObject } from "./scene";

interface Indexer {
	allInRadius(center: Vector2d, radius: number): SceneObject[];
	register(obj: SceneObject): void;
	unregister(obj: SceneObject): void;
	notifyPositionUpdate(obj: SceneObject, oldPosition: Vector2d): void;
}

/**
 * Initializes index cells as objects hit them.
 */
class LazyIndexer implements Indexer {
	// Scene position stored into cells with left-including right-excluding boundies:
	// [0, 1), [1, 2), ... (for step = 1)
	private readonly flattenedCells: Set<SceneObject>[] = [];
	private readonly columnsInRow: number;
	constructor(
		private readonly step: number,
		sceneDimensions: Vector2d,
	) {
		if (sceneDimensions.x % step !== 0) {
			throw new Error(
				`World size width must be multiple of ${step}, but got ${sceneDimensions.x}`,
			);
		}
		this.columnsInRow = sceneDimensions.x / step;
	}

	register(obj: SceneObject) {
		const i = this.indexOf(obj.renderable.position);
		// lazy init
		if (!this.flattenedCells[i]) {
			this.flattenedCells[i] = new Set();
		}
		this.flattenedCells[i].add(obj);
	}

	unregister(obj: SceneObject): void {
		const i = this.indexOf(obj.renderable.position);
		this.flattenedCells[i].delete(obj);
	}

	allInRadius(center: Vector2d, radius: number) {
		const scenePositionLeft = center.x - radius;
		const scenePositionRight = center.x + radius;
		const scenePositionTop = center.y - radius;
		const scenePositionBottom = center.y + radius;

		const indexColumnLeft = Math.trunc(scenePositionLeft / this.step);
		const indexColumnRight = Math.trunc(scenePositionRight / this.step);
		const indexRowTop = Math.trunc(scenePositionTop / this.step);
		const indexRowBottom = Math.trunc(scenePositionBottom / this.step);

		const cells: Set<SceneObject>[] = [];
		// for rows from top to bottom
		// for columns from left to right
		for (let row = indexRowTop; row <= indexRowBottom; ++row) {
			for (let column = indexColumnLeft; column <= indexColumnRight; ++column) {
				cells.push(this.flattenedCells[this.columnsInRow * row + column]);
			}
		}
		return Array.from(
			cells.reduce((union, cell) => union.union(cell), new Set()).values(),
		);
	}

	notifyPositionUpdate(obj: SceneObject, oldPosition: Vector2d): void {
		this.flattenedCells[this.indexOf(oldPosition)].delete(obj);
		this.flattenedCells[this.indexOf(obj.renderable.position)].add(obj);
	}

	private indexOf(v: Vector2d) {
		return (
			this.columnsInRow * Math.trunc(v.y / this.step) +
			Math.trunc(v.x / this.step)
		);
	}
}
