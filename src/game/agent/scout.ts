import { config } from "../config";
import type { Ant } from "../object/ant";
import { Mark, isMark } from "../object/mark";
import { FoodSourceObject } from "../object/resource";
import type { SceneObject } from "../scene/scene";
import { type Agent, NOISE_ROTATION } from "./agent";
import { type TaskGraph, TaskGraphExecutor, task } from "./task";

interface Path {
	readonly id: number;
	append(mark: Mark): void;
	findClosestToStart(marks: Mark[]): Mark;
	findClosestToEnd(marks: Mark[]): Mark;
}

class PathImpl implements Path {
	static count = 0;
	// TODO: use hashmap instead of array to optimize the search.
	/**
	 * Marks in order of path.
	 */
	private marks: Mark[] = [];
	id: number;
	constructor() {
		this.id = PathImpl.count++;
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

function* eat(input: { ant: Ant; target: FoodSourceObject }) {
	const { ant, target } = input;
	console.debug(`${ant.id} eat`);
	while (ant.food.amount < config.antFoodMaxAmount) {
		ant.eat(target);
		yield;
	}
}

function createEatAtHomeTaskGraph(ant: Ant): TaskGraph<PathContext, void> {
	const reachStartOfPathTask = task(reachStartOfPath);
	const waitForFoodTask = task(waitForFood);
	const enterInteractionRangeTask = task(
		enterInteractionRange<FoodSourceObject>,
	);
	const eatTask = task(eat);

	reachStartOfPathTask.next(waitForFoodTask);
	waitForFoodTask.next((availableFood) =>
		enterInteractionRangeTask.start({ ant, target: availableFood }),
	);
	enterInteractionRangeTask.next((interactibleFood) =>
		eatTask.start({ ant, target: interactibleFood }),
	);

	return {
		root: reachStartOfPathTask,
		terminal: eatTask,
	};
}

function* enterInteractionRange<Target extends SceneObject>(input: {
	ant: Ant;
	target: Target;
}) {
	const { ant, target } = input;
	console.debug(`${ant.id} enterInteractionRange`);
	ant.face(target);
	ant.move();
	while (!ant.isWithinInteractionRange(target)) {
		ant.face(target);
		yield;
	}
	ant.stop();
	return target;
}

function* waitForFood(input: { ant: Ant }): Generator<void, FoodSourceObject> {
	const { ant } = input;
	console.debug(`${ant.id} waitForFood`);
	while (true) {
		const targets = lookup(ant, FoodSourceObject);
		if (targets.length > 0) {
			return targets[0];
		}
		yield;
	}
}

function isInstanceOf<T>(o: unknown, targetClass: ConstructorType<T>): o is T {
	return o instanceof targetClass;
}

function lookup<T extends SceneObject>(
	ant: Ant,
	targetClass: ConstructorType<T>,
): T[] {
	return ant.getVisibleObjects().filter((o) => isInstanceOf(o, targetClass));
}

function* extendPath(input: PathContext): Generator<void, Path> {
	const { ant, path } = input;
	const visibleClosesToEndPathMark = path.findClosestToEnd(
		ant.getVisibleObjects().filter(isMark),
	);
	console.debug(`${ant.id} extendPath`);
	ant.move();
	while (
		ant.distanceTo(visibleClosesToEndPathMark) <
		config.pathAdjacentNodesDistance
	) {
		if (Math.random() < 0.1) {
			ant.rotate(Math.sign(Math.random() - 0.5) * NOISE_ROTATION);
		}
		yield;
	}
	ant.stop();
	path.append(ant.mark());
	return path;
}

function createScanTaskGraph<Target extends SceneObject>(
	ant: Ant,
	targetClass: ConstructorType<Target>,
): TaskGraph<void, Path> {
	const pathMaxDistance =
		(config.antFoodLowAmount / config.antFoodDepletionPerMinute) *
		config.antVelocity *
		60;

	const context = {
		path: new PathImpl(),
		ant,
		pathDistance: 0,
	};

	const initPathTask = task(function* () {
		context.path = new PathImpl();
		context.pathDistance = 0;
		context.path.append(context.ant.mark());
	});

	const lookupTask = task(function* () {
		return lookup(ant, targetClass).filter(
			// biome-ignore lint/suspicious/noExplicitAny: TODO: better types.
			(o) => o !== (ant.home.storage as any),
		);
	});

	const extendPathTask = task(extendPath);

	const enterInteractionRangeTask = task(enterInteractionRange<Target>);
	const resetScanTask = task(reachStartOfPath);

	const eatAtHomeTaskGraph = createEatAtHomeTaskGraph(ant);
	const recoverScanPositionTask = task(reachEndOfPath);

	const terminalTask = task(function* () {
		return context.path;
	});

	initPathTask.next(lookupTask);

	lookupTask.next((targets) => {
		const target = targets[0];
		// TODO: think of predicate-based task chaining, maybe it would be more readable.
		if (target) {
			return enterInteractionRangeTask.start({ ant, target });
		}

		if (context.pathDistance >= pathMaxDistance) {
			return resetScanTask.start(context);
		}

		if (ant.food.amount < config.antFoodLowAmount) {
			return eatAtHomeTaskGraph.root.start(context);
		}

		return extendPathTask.start(context);
	});

	enterInteractionRangeTask.next(terminalTask);

	resetScanTask.next(initPathTask);

	eatAtHomeTaskGraph.terminal.next(() =>
		recoverScanPositionTask.start(context),
	);

	extendPathTask.next(() => {
		context.pathDistance += config.pathAdjacentNodesDistance;
		return lookupTask.start();
	});

	recoverScanPositionTask.next(lookupTask);

	return {
		root: initPathTask,
		terminal: terminalTask,
	};
}

// biome-ignore lint/suspicious/noExplicitAny: not supposed to be used for instantiation and cannot use "unknown[]" here.
type ConstructorType<T> = abstract new (...args: any[]) => T;

type PathContext = {
	ant: Ant;
	path: Path;
};

function* reachStartOfPath(input: PathContext): Generator<void, PathContext> {
	const { ant, path } = input;
	console.debug(`${ant.id} reachStartOfPath`);
	while (true) {
		const marks = lookup(ant, Mark);
		const closest = path.findClosestToStart(marks);
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

function* reachEndOfPath(input: PathContext): Generator<void, PathContext> {
	const { ant, path } = input;
	console.debug(`${ant.id} reachEndOfPath`);
	while (true) {
		const marks = lookup(ant, Mark);
		const closest = path.findClosestToEnd(marks);
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

function createPatrolPathTaskGraph(): TaskGraph<PathContext, PathContext> {
	const reachEndOfPathTask = task(reachEndOfPath);
	const reachStartOfPathTask = task(reachStartOfPath);
	// TODO: eat at home when food amount is low.

	reachEndOfPathTask.next(reachStartOfPathTask);
	reachStartOfPathTask.next(reachEndOfPathTask);

	return {
		root: reachEndOfPathTask,
		terminal: reachStartOfPathTask,
	};
}

export class Scout implements Agent {
	private readonly executor: TaskGraphExecutor;

	constructor(private readonly ant: Ant) {
		const scanTaskGraph = createScanTaskGraph(this.ant, FoodSourceObject);
		const patrolPathTaskGraph = createPatrolPathTaskGraph();
		scanTaskGraph.terminal.next((path) =>
			patrolPathTaskGraph.root.start({ ant, path }),
		);
		this.executor = new TaskGraphExecutor(scanTaskGraph.root.start());
	}

	execute() {
		this.executor.execute();
	}
}
