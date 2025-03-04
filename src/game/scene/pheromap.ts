import type { Vector2d } from "../../renderer/renderable";
import { PI, insideSectorStrict } from "../../utils/math";
import { config } from "../config";

export type Direction =
	| "north"
	| "north-east"
	| "east"
	| "south-east"
	| "south"
	| "south-west"
	| "west"
	| "north-west";

export const pheromoneIndexToDirection = [
	"north",
	"north-east",
	"east",
	"south-east",
	"south",
	"south-west",
	"west",
	"north-west",
] as const;

export type PheroDirection = {
	tag: DirectionTag;
	value: number;
};

export const directionIndexToAngle = [
	PI / 2,
	(3 * PI) / 4,
	PI,
	(5 * PI) / 4,
	(3 * PI) / 2,
	(7 * PI) / 4,
	0,
	PI / 4,
] as const;

export const directionTagToAngle = {
	n: PI / 2,
	nw: (3 * PI) / 4,
	w: PI,
	sw: (5 * PI) / 4,
	s: (3 * PI) / 2,
	se: (7 * PI) / 4,
	e: 0,
	ne: PI / 4,
} as const;

export type DirectionTag = "n" | "nw" | "w" | "sw" | "s" | "se" | "e" | "ne";

export const directionTags: DirectionTag[] = [
	"n",
	"nw",
	"w",
	"sw",
	"s",
	"se",
	"e",
	"ne",
] as const;

export function filterDirections(
	start: number,
	end: number,
	directions: PheroDirection[],
) {
	const directionsInSector = directions.filter((direction) =>
		insideSectorStrict(directionTagToAngle[direction.tag], start, end),
	);
	if (directionsInSector.length === 0) {
		throw new Error("No directions belongs to sector");
	}
	return directionsInSector;
}

/**
 * Randomly chooses a direction.
 * @param facingSector
 * @param directions
 * @param roll random number between 0 and 1.
 * @returns
 */
export function rollAttractingDireciton(
	directions: PheroDirection[],
	roll: number,
) {
	const handicapValue = config.antPheromoneMarkIntensity / 2;
	const handicappedDirs = directions.map((dir) =>
		dir.value > 0 ? dir : { ...dir, value: handicapValue },
	);

	let pheromoneAmountSum = 0;
	for (const dir of handicappedDirs) {
		pheromoneAmountSum += dir.value;
	}

	const chancesPerDir = handicappedDirs.map((dir) => ({
		...dir,
		value: dir.value / pheromoneAmountSum,
	}));

	const ascendingChancesPerDir = chancesPerDir.sort(
		(lhs, rhs) => lhs.value - rhs.value,
	);

	let cumulativeChance = 0;
	for (const dir of ascendingChancesPerDir) {
		cumulativeChance += dir.value;
		dir.value = cumulativeChance;
	}

	let winnerIndex = 0;
	while (
		ascendingChancesPerDir[winnerIndex].value < roll &&
		winnerIndex < ascendingChancesPerDir.length - 1 
	) {
		winnerIndex++;
	}

	const winnerDir = ascendingChancesPerDir[winnerIndex];
	if (winnerDir === undefined) {
		throw new Error(
			"Missing winner direciton, probably no direction belongs to the facing sector",
		);
	}
	return winnerDir;
}

/**
 * Stores pheromone data.
 */
export interface Pheromap {
	/**
	 * Increace pheromone intensity at trajectory. Includes start position, excludes end position.
	 * Limited to support movements no more than 1 cell away per update.
	 */
	updateBatch(
		startPosition: Vector2d[],
		endPosition: Vector2d[],
		amount: number,
	): void;
	/**
	 *
	 * @returns array of surrounding pheromones according to {@link pheromoneIndexToDirection}.
	 */
	readSurroundingPheromonesAt(position: Vector2d): number[];
	evaporte(amount: number): void;
}

export function getPheromoneByDirection(
	direction: Direction,
	pheromones: number[],
) {
	return pheromones[pheromoneIndexToDirection.indexOf(direction)];
}

export class ScenePheromap implements Pheromap {
	// Scene position stored into cells with left-including right-excluding boundies:
	// [0, 1), [1, 2), ... (for step = 1)
	private readonly nodes: number[];
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
		this.nodes = Array(this.columnsInRow * rows).fill(0);
	}

	evaporte(amount: number): void {
		for (let i = 0; i < this.nodes.length; ++i) {
			this.nodes[i] = Math.max(0, this.nodes[i] - amount);
		}
	}

	updateBatch(
		startPosition: Vector2d[],
		endPosition: Vector2d[],
		amount: number,
	): void {
		if (startPosition.length !== endPosition.length) {
			throw new Error("Invalid arguments");
		}

		// Assume ant moves no more than 1 cell away per call.
		for (let i = 0; i < startPosition.length; ++i) {
			const startNodeIndex = this.indexOf(startPosition[i]);
			const endNodeIndex = this.indexOf(endPosition[i]);
			// Apply pheromone when ant leaves a cell.
			if (startNodeIndex !== endNodeIndex) {
				this.nodes[startNodeIndex] += amount;
			}
		}
	}

	readSurroundingPheromonesAt(position: Vector2d): number[] {
		const center = this.indexOf(position);

		return [
			// north
			this.nodes[center - this.columnsInRow],
			// north-east
			this.nodes[center - this.columnsInRow + 1],
			// east
			this.nodes[center + 1],
			// south-east
			this.nodes[center + this.columnsInRow + 1],
			// south
			this.nodes[center + this.columnsInRow],
			// south-west
			this.nodes[center + this.columnsInRow - 1],
			// west
			this.nodes[center - 1],
			// north-west
			this.nodes[center - this.columnsInRow - 1],
		];
	}

	private indexOf(v: Vector2d) {
		return (
			this.columnsInRow * Math.trunc(v.y / this.step) +
			Math.trunc(v.x / this.step)
		);
	}
}
