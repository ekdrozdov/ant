import assert from "node:assert";
import { describe, it } from "node:test";
import { translate } from "../../utils/math";
import { ScenePheromap, getPheromoneByDirection } from "./pheromap";

describe("Pheromap", () => {
	it("update pheromones evenly", () => {
		const pheromap = new ScenePheromap(2, { x: 10, y: 10 });
		let start = { x: 0.2, y: 0.2 };
		let end = { x: 1.2, y: 0.2 };

		// Should update first cell.

		pheromap.updateBatch([start], [end], 10);
		start = translate(start, 1, 0);
		end = translate(end, 1, 0);

		pheromap.updateBatch([start], [end], 10);
		start = translate(start, 1, 0);
		end = translate(end, 1, 0);

		// Should update second cell.

		pheromap.updateBatch([start], [end], 10);
		start = translate(start, 1, 0);
		end = translate(end, 1, 0);

		pheromap.updateBatch([start], [end], 10);
		start = translate(start, 1, 0);
		end = translate(end, 1, 0);

		// Should update third cell.

		pheromap.updateBatch([start], [end], 10);
		start = translate(start, 1, 0);
		end = translate(end, 1, 0);

		pheromap.updateBatch([start], [end], 10);
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

		pheromap.updateBatch([startOne, startAnother], [endOne, endAnother], 10);

		// Should update second cell.

		startOne = translate(startOne, 2, 0);
		endOne = translate(endOne, 2, 0);
		startAnother = translate(startAnother, 2, 0);
		endAnother = translate(endAnother, 2, 0);

		pheromap.updateBatch([startOne, startAnother], [endOne, endAnother], 10);

		// Should update third cell.

		startOne = translate(startOne, 2, 0);
		endOne = translate(endOne, 2, 0);
		startAnother = translate(startAnother, 2, 0);
		endAnother = translate(endAnother, 2, 0);
		
		pheromap.updateBatch([startOne, startAnother], [endOne, endAnother], 10);

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

		pheromap.updateBatch([start], [end], 10);
		start = translate(start, 1, 1);
		end = translate(end, 1, 1);

		pheromap.updateBatch([start], [end], 10);
		start = translate(start, 1, 1);
		end = translate(end, 1, 1);

		// Should update second cell.

		pheromap.updateBatch([start], [end], 10);
		start = translate(start, 1, 1);
		end = translate(end, 1, 1);

		pheromap.updateBatch([start], [end], 10);
		start = translate(start, 1, 1);
		end = translate(end, 1, 1);

		// Should update third cell.

		pheromap.updateBatch([start], [end], 10);
		start = translate(start, 1, 1);
		end = translate(end, 1, 1);

		pheromap.updateBatch([start], [end], 10);
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

		pheromap.updateBatch([start], [end], 4);
		start = translate(start, 1, 0);
		end = translate(end, 1, 0);

		pheromap.updateBatch([start], [end], 4);
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
