import assert from "node:assert";
import { describe, it } from "node:test";
import { PI, PI_2, translate } from "../../utils/math";
import {
	type PheroDirection,
	ScenePheromap,
	directionTagToAngle,
	directionTags,
	filterDirections,
	getPheromoneByDirection,
	rollAttractingDireciton,
} from "./pheromap";

const eps = 0.001;

describe("Pheromap", () => {
	it("update pheromones evenly", () => {
		const pheromap = new ScenePheromap(2, { x: 10, y: 10 });
		let start = { x: 0.2, y: 0.2 };
		let end = { x: 1.2, y: 0.2 };

		// Should update first cell.

		pheromap.notifyPositionUpdateBatch([start], [end], 10);
		start = translate(start, 1, 0);
		end = translate(end, 1, 0);

		pheromap.notifyPositionUpdateBatch([start], [end], 10);
		start = translate(start, 1, 0);
		end = translate(end, 1, 0);

		// Should update second cell.

		pheromap.notifyPositionUpdateBatch([start], [end], 10);
		start = translate(start, 1, 0);
		end = translate(end, 1, 0);

		pheromap.notifyPositionUpdateBatch([start], [end], 10);
		start = translate(start, 1, 0);
		end = translate(end, 1, 0);

		// Should update third cell.

		pheromap.notifyPositionUpdateBatch([start], [end], 10);
		start = translate(start, 1, 0);
		end = translate(end, 1, 0);

		pheromap.notifyPositionUpdateBatch([start], [end], 10);
		start = translate(start, 1, 0);
		end = translate(end, 1, 0);

		const pheromones = pheromap.readSurroundingPheromonesAt({
			x: 3,
			y: 3,
		});

		assert.equal(getPheromoneByDirection("north", pheromones), 10);
		assert.equal(getPheromoneByDirection("north-east", pheromones), 10);
		assert.equal(getPheromoneByDirection("east", pheromones), 0);
		assert.equal(getPheromoneByDirection("south-east", pheromones), 0);
		assert.equal(getPheromoneByDirection("south", pheromones), 0);
		assert.equal(getPheromoneByDirection("south-west", pheromones), 0);
		assert.equal(getPheromoneByDirection("west", pheromones), 0);
		assert.equal(getPheromoneByDirection("north-west", pheromones), 10);
	});

	it("support batch update", () => {
		const pheromap = new ScenePheromap(2, { x: 10, y: 10 });
		let startOne = { x: 0.2, y: 0.2 };
		let endOne = { x: 2.2, y: 0.2 };

		let startAnother = { x: 0.2, y: 5.2 };
		let endAnother = { x: 2.2, y: 5.2 };

		// Should update first cell.

		pheromap.notifyPositionUpdateBatch(
			[startOne, startAnother],
			[endOne, endAnother],
			10,
		);

		// Should update second cell.

		startOne = translate(startOne, 2, 0);
		endOne = translate(endOne, 2, 0);
		startAnother = translate(startAnother, 2, 0);
		endAnother = translate(endAnother, 2, 0);

		pheromap.notifyPositionUpdateBatch(
			[startOne, startAnother],
			[endOne, endAnother],
			10,
		);

		// Should update third cell.

		startOne = translate(startOne, 2, 0);
		endOne = translate(endOne, 2, 0);
		startAnother = translate(startAnother, 2, 0);
		endAnother = translate(endAnother, 2, 0);

		pheromap.notifyPositionUpdateBatch(
			[startOne, startAnother],
			[endOne, endAnother],
			10,
		);

		const pheromones = pheromap.readSurroundingPheromonesAt({
			x: 3,
			y: 3,
		});

		assert.equal(getPheromoneByDirection("north", pheromones), 10);
		assert.equal(getPheromoneByDirection("north-east", pheromones), 10);
		assert.equal(getPheromoneByDirection("east", pheromones), 0);
		assert.equal(getPheromoneByDirection("south-east", pheromones), 10);
		assert.equal(getPheromoneByDirection("south", pheromones), 10);
		assert.equal(getPheromoneByDirection("south-west", pheromones), 10);
		assert.equal(getPheromoneByDirection("west", pheromones), 0);
		assert.equal(getPheromoneByDirection("north-west", pheromones), 10);
	});

	it("support diagonal movement", () => {
		const pheromap = new ScenePheromap(2, { x: 10, y: 10 });
		let start = { x: 0.1, y: 0.1 };
		let end = { x: 1.1, y: 1.1 };

		// Should update first cell.

		pheromap.notifyPositionUpdateBatch([start], [end], 10);
		start = translate(start, 1, 1);
		end = translate(end, 1, 1);

		pheromap.notifyPositionUpdateBatch([start], [end], 10);
		start = translate(start, 1, 1);
		end = translate(end, 1, 1);

		// Should update second cell.

		pheromap.notifyPositionUpdateBatch([start], [end], 10);
		start = translate(start, 1, 1);
		end = translate(end, 1, 1);

		pheromap.notifyPositionUpdateBatch([start], [end], 10);
		start = translate(start, 1, 1);
		end = translate(end, 1, 1);

		// Should update third cell.

		pheromap.notifyPositionUpdateBatch([start], [end], 10);
		start = translate(start, 1, 1);
		end = translate(end, 1, 1);

		pheromap.notifyPositionUpdateBatch([start], [end], 10);
		start = translate(start, 1, 1);
		end = translate(end, 1, 1);

		const pheromones = pheromap.readSurroundingPheromonesAt({
			x: 2.5,
			y: 4.5,
		});

		assert.equal(getPheromoneByDirection("north", pheromones), 10);
		assert.equal(getPheromoneByDirection("north-east", pheromones), 0);
		assert.equal(getPheromoneByDirection("east", pheromones), 10);
		assert.equal(getPheromoneByDirection("south-east", pheromones), 0);
		assert.equal(getPheromoneByDirection("south", pheromones), 0);
		assert.equal(getPheromoneByDirection("south-west", pheromones), 0);
		assert.equal(getPheromoneByDirection("west", pheromones), 0);
		assert.equal(getPheromoneByDirection("north-west", pheromones), 0);
	});

	it("evaporates", () => {
		const pheromap = new ScenePheromap(2, { x: 10, y: 10 });
		let start = { x: 0, y: 0 };
		let end = { x: 1, y: 0 };

		// Should update first cell.

		pheromap.notifyPositionUpdateBatch([start], [end], 4);
		start = translate(start, 1, 0);
		end = translate(end, 1, 0);

		pheromap.notifyPositionUpdateBatch([start], [end], 4);
		start = translate(start, 1, 0);
		end = translate(end, 1, 0);

		assert.equal(
			getPheromoneByDirection(
				"north",
				pheromap.readSurroundingPheromonesAt({
					x: 1,
					y: 3,
				}),
			),
			4,
		);
		assert.equal(
			getPheromoneByDirection(
				"south",
				pheromap.readSurroundingPheromonesAt({
					x: 1,
					y: 3,
				}),
			),
			0,
		);

		pheromap.evaporte(2);

		assert.equal(
			getPheromoneByDirection(
				"north",
				pheromap.readSurroundingPheromonesAt({
					x: 1,
					y: 3,
				}),
			),
			2,
		);
		assert.equal(
			getPheromoneByDirection(
				"south",
				pheromap.readSurroundingPheromonesAt({
					x: 1,
					y: 3,
				}),
			),
			0,
		);

		pheromap.evaporte(2);

		assert.equal(
			getPheromoneByDirection(
				"north",
				pheromap.readSurroundingPheromonesAt({
					x: 1,
					y: 3,
				}),
			),
			0,
		);
		assert.equal(
			getPheromoneByDirection(
				"south",
				pheromap.readSurroundingPheromonesAt({
					x: 1,
					y: 3,
				}),
			),
			0,
		);

		pheromap.evaporte(2);
		assert.equal(
			getPheromoneByDirection(
				"north",
				pheromap.readSurroundingPheromonesAt({
					x: 1,
					y: 3,
				}),
			),
			0,
		);
		assert.equal(
			getPheromoneByDirection(
				"south",
				pheromap.readSurroundingPheromonesAt({
					x: 1,
					y: 3,
				}),
			),
			0,
		);
	});
});

describe("filterDirections", () => {
	it("filters out directions outside of a sector", () => {
		const directions: PheroDirection[] = directionTags.map((tag) => ({
			value: 10,
			tag,
		}));
		const dirsWithinSector = filterDirections(
			directionTagToAngle.n - eps,
			directionTagToAngle.s + eps,
			directions,
		);
		const tagsWithinSector = dirsWithinSector.map((d) => d.tag);

		assert.equal(tagsWithinSector.includes("n"), true);
		assert.equal(tagsWithinSector.includes("nw"), true);
		assert.equal(tagsWithinSector.includes("w"), true);
		assert.equal(tagsWithinSector.includes("sw"), true);
		assert.equal(tagsWithinSector.includes("s"), true);

		assert.equal(tagsWithinSector.includes("se"), false);
		assert.equal(tagsWithinSector.includes("e"), false);
		assert.equal(tagsWithinSector.includes("ne"), false);
	});

	it("captures clockwise directions when sector end is greater than 2 * Pi", () => {
		const directions: PheroDirection[] = directionTags.map((tag) => ({
			value: 10,
			tag,
		}));
		const dirsWithinSector = filterDirections(
			directionTagToAngle.s - eps,
			directionTagToAngle.n + PI_2 + eps,
			directions,
		);
		const tagsWithinSector = dirsWithinSector.map((d) => d.tag);

		assert.equal(tagsWithinSector.includes("s"), true);
		assert.equal(tagsWithinSector.includes("se"), true);
		assert.equal(tagsWithinSector.includes("e"), true);
		assert.equal(tagsWithinSector.includes("ne"), true);
		assert.equal(tagsWithinSector.includes("n"), true);

		assert.equal(tagsWithinSector.includes("nw"), false);
		assert.equal(tagsWithinSector.includes("w"), false);
		assert.equal(tagsWithinSector.includes("sw"), false);
	});

	it("captures counter-clockwise directions when sector start is less than 0", () => {
		const directions: PheroDirection[] = directionTags.map((tag) => ({
			value: 10,
			tag,
		}));
		const dirsWithinSector = filterDirections(
			directionTagToAngle.s - PI_2 - eps,
			directionTagToAngle.n + eps,
			directions,
		);
		const tagsWithinSector = dirsWithinSector.map((d) => d.tag);

		assert.equal(tagsWithinSector.includes("s"), true);
		assert.equal(tagsWithinSector.includes("se"), true);
		assert.equal(tagsWithinSector.includes("e"), true);
		assert.equal(tagsWithinSector.includes("ne"), true);
		assert.equal(tagsWithinSector.includes("n"), true);

		assert.equal(tagsWithinSector.includes("nw"), false);
		assert.equal(tagsWithinSector.includes("w"), false);
		assert.equal(tagsWithinSector.includes("sw"), false);
	});

	it("throws when no direction belongs to sector", () => {
		const directions: PheroDirection[] = directionTags.map((tag) => ({
			value: 10,
			tag,
		}));
		assert.throws(
			() => {
				filterDirections(
					directionTagToAngle.n + PI / 8 - eps,
					directionTagToAngle.n + PI / 8 + eps,
					directions,
				);
			},
			{ message: "No directions belongs to sector" },
		);
	});
});

describe("rollAttractingDireciton", () => {
	it("returns direction maching the roll", () => {
		// (n, s, w) -> (60%, 10%, 30%)
		const dirs: PheroDirection[] = [
			{
				tag: "n",
				value: 30,
			},
			{
				tag: "s",
				value: 5,
			},
			{
				tag: "w",
				value: 15,
			},
		];
		assert.equal(rollAttractingDireciton(dirs, 0.05).tag, "s");
		assert.equal(rollAttractingDireciton(dirs, 0.1).tag, "s");
		assert.equal(rollAttractingDireciton(dirs, 0.21).tag, "w");
		assert.equal(rollAttractingDireciton(dirs, 0.3).tag, "w");
		assert.equal(rollAttractingDireciton(dirs, 0.5).tag, "n");
		assert.equal(rollAttractingDireciton(dirs, 0.9).tag, "n");
	});
	it("returns least probable direction when roll is 0", () => {
		// (n, s, w) -> (60%, 10%, 30%)
		const dirs: PheroDirection[] = [
			{
				tag: "n",
				value: 30,
			},
			{
				tag: "s",
				value: 5,
			},
			{
				tag: "w",
				value: 15,
			},
		];
		assert.equal(rollAttractingDireciton(dirs, 0).tag, "s");
	});
	it("returns most probable direction when roll is 1", () => {
		// (n, s, w) -> (60%, 10%, 30%)
		const dirs: PheroDirection[] = [
			{
				tag: "n",
				value: 30,
			},
			{
				tag: "s",
				value: 5,
			},
			{
				tag: "w",
				value: 15,
			},
		];
		assert.equal(rollAttractingDireciton(dirs, 1).tag, "n");
	});
	it("handicaps directions with no pheromone", () => {
		const dirs: PheroDirection[] = [
			{
				tag: "n",
				value: 30,
			},
			{
				tag: "s",
				value: 0,
			},
			{
				tag: "w",
				value: 15,
			},
		];
		assert.equal(rollAttractingDireciton(dirs, 0.1).tag, "s");
	});
	it("rolls fair competition for equally probable", () => {
		const dirs: PheroDirection[] = [
			{
				tag: "n",
				value: 10,
			},
			{
				tag: "s",
				value: 10,
			},
			{
				tag: "w",
				value: 10,
			},
		];
		assert.equal(rollAttractingDireciton(dirs, 0.1).tag, "n");
		assert.equal(rollAttractingDireciton(dirs, 0.5).tag, "s");
		assert.equal(rollAttractingDireciton(dirs, 0.9).tag, "w");
	});
	it("getNeighbourPheromonePositionAt", () => {
		const pheromap = new ScenePheromap(2, { x: 10, y: 10 });

		const northPos = pheromap.getNeighbourPheromonePositionAt(
			{ x: 4.5, y: 4.5 },
			"n",
		);
		assert.strictEqual(northPos.x, 5);
		assert.strictEqual(northPos.y, 3);

		const nePos = pheromap.getNeighbourPheromonePositionAt(
			{ x: 4.5, y: 4.5 },
			"ne",
		);
		assert.strictEqual(nePos.x, 7);
		assert.strictEqual(nePos.y, 3);

		const eastPos = pheromap.getNeighbourPheromonePositionAt(
			{ x: 4.5, y: 4.5 },
			"e",
		);
		assert.strictEqual(eastPos.x, 7);
		assert.strictEqual(eastPos.y, 5);
	});
});
