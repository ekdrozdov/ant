import type { Vector2d } from "../../renderer/renderable";
import type { SceneObject } from "./scene";

export interface Indexer {
	allInRadius(center: Vector2d, radius: number): SceneObject[];
	register(obj: SceneObject): void;
	unregister(obj: SceneObject): void;
	notifyPositionUpdateBatch(objs: SceneObject[], prevPos: Vector2d[]): void;
}

/**
 * Initializes index cells as objects hit them.
 * Position is assumed to be within scene boundaries, otherwise the behavior is undetermined.
 */
export class SceneIndexer implements Indexer {
	// Scene position stored into cells with left-including right-excluding boundies:
	// [0, 1), [1, 2), ... (for step = 1)
	private readonly flattenedCells: Set<SceneObject>[];
	private readonly columnsInRow: number;
	constructor(
		private readonly step: number,
		size: Vector2d,
	) {
		if (size.x % step !== 0 || size.y % step !== 0) {
			throw new Error(
				`Size of the space to be indexed must be multiple of ${step}, but got ${size}`,
			);
		}
		this.columnsInRow = size.x / step;
		const rows = size.y / step;
		this.flattenedCells = Array.from(Array(this.columnsInRow * rows)).map(
			() => new Set(),
		);
	}

	register(obj: SceneObject) {
		const i = this.indexOf(obj.renderable.position);
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
		for (let row = indexRowTop; row <= indexRowBottom; ++row) {
			for (let column = indexColumnLeft; column <= indexColumnRight; ++column) {
				cells.push(this.flattenedCells[this.columnsInRow * row + column]);
			}
		}

		let union = new Set<SceneObject>();
		for (const cell of cells) {
			union = union.union(cell);
		}

		return Array.from(union.values());
	}

	notifyPositionUpdateBatch(objs: SceneObject[], prevPos: Vector2d[]): void {
		let i = 0;
		for (const obj of objs) {
			this.flattenedCells[this.indexOf(prevPos[i])].delete(obj);
			this.flattenedCells[this.indexOf(obj.renderable.position)].add(obj);
			++i;
		}
	}

	private indexOf(v: Vector2d) {
		return (
			this.columnsInRow * Math.trunc(v.y / this.step) +
			Math.trunc(v.x / this.step)
		);
	}
}
