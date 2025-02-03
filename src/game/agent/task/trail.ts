import { config } from "../../config";
import type { Ant } from "../../object/ant";
import { Mark, isMark } from "../../object/mark";

/**
 * Assuming an ant remembers his own path, this is a util
 * to navigate ant back and forth the path.
 */
export interface Trail {
	readonly id: number;
	append(mark: Mark): void;
	findClosestToStart(marks: Mark[]): Mark;
	findClosestToEnd(marks: Mark[]): Mark;
}

export class TrailImpl implements Trail {
	static count = 0;
	// TODO: use hashmap instead of array to optimize the search.
	/**
	 * Marks in order of path.
	 */
	private marks: Mark[] = [];
	id: number;
	constructor() {
		this.id = TrailImpl.count++;
	}

	append(mark: Mark) {
		this.marks.push(mark);
	}

	findClosestToStart(marks: Mark[]): Mark {
		if (marks.length === 0) {
			throw new Error("Unexpected empty array");
		}

		const marksBelongsToPath = marks.filter((mark) =>
			this.marks.includes(mark),
		);

		if (marksBelongsToPath.length === 0) {
			throw new Error("No mark belongs to path found");
		}

		let closestMark = marksBelongsToPath[0];

		for (let i = this.marks.length - 1; i > 0; i--) {
			if (marks.includes(this.marks[i])) {
				closestMark = this.marks[i];
			}
		}

		return closestMark;
	}

	findClosestToEnd(marks: Mark[]): Mark {
		if (marks.length === 0) {
			throw new Error("Unexpected empty array");
		}

		const marksBelongsToPath = marks.filter((mark) =>
			this.marks.includes(mark),
		);

		if (marksBelongsToPath.length === 0) {
			throw new Error("No mark belongs to path found");
		}

		let closestMark = marksBelongsToPath[0];

		for (let i = 0; i < this.marks.length; i++) {
			if (marks.includes(this.marks[i])) {
				closestMark = this.marks[i];
			}
		}

		return closestMark;
	}
}

export type NavigationContext = {
	ant: Ant;
	trail: Trail;
};

export function* extendTrail(input: NavigationContext): Generator<void, Trail> {
	const { ant, trail } = input;
	const visibleClosesToEndPathMark = trail.findClosestToEnd(
		ant.getVisibleObjects().filter(isMark),
	);
	console.debug(`${ant.id} extendPath`);
	ant.move();
	while (
		ant.distanceTo(visibleClosesToEndPathMark) <
		config.trailAdjacentNodesDistance
	) {
		if (Math.random() < 0.1) {
			ant.rotate(
				Math.sign(Math.random() - 0.5) * config.antNoiseRotationAmount,
			);
		}
		yield;
	}
	ant.stop();
	trail.append(ant.mark(trail));
	return trail;
}

export function* reachStartOfTrail(
	input: NavigationContext,
): Generator<void, NavigationContext> {
	const { ant, trail } = input;
	console.debug(`${ant.id} reachStartOfTrail`);
	while (true) {
		const marks = ant.getVisibleObjects(Mark);
		const closest = trail.findClosestToStart(marks);
		if (ant.distanceTo(closest) < config.interactionDistance) {
			// TODO: add interaction range to enable mark lifetime refresh.
			// Already reach the start -> complete.
			ant.stop();
			return input;
		}
		ant.face(closest);
		// TODO: add move options with max distance to prevent overreach of the move target.
		ant.move();
		yield;
	}
}

export function* reachEndOfTrail(
	input: NavigationContext,
): Generator<void, NavigationContext> {
	const { ant, trail } = input;
	console.debug(`${ant.id} reachEndOfTrail`);
	while (true) {
		const marks = ant.getVisibleObjects(Mark);
		const closest = trail.findClosestToEnd(marks);
		if (ant.distanceTo(closest) < config.interactionDistance) {
			// TODO: add interaction range to enable mark lifetime refresh.
			// Already reach the end -> complete.
			ant.stop();
			return input;
		}
		ant.face(closest);
		// TODO: add move options with max distance to prevent overreach of the move target.
		ant.move();
		yield;
	}
}
