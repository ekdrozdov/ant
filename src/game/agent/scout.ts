import { config } from "../config";
import type { Ant } from "../object/ant";
import { Mark, isMark } from "../object/mark";
import { FoodSourceObject } from "../object/resource";
import type { SceneObject } from "../scene/scene";
import { type Agent, NOISE_ROTATION } from "./agent";
import {
	type TaskExecutor,
	type TaskExecutorFactory,
	type TaskGraph,
	TaskGraphExecutor,
	createTaskNode,
	createTaskResultFrom,
	pendingTaskResult,
} from "./task";

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

const createEatExecutor: TaskExecutorFactory<
	{
		ant: Ant;
		target: FoodSourceObject;
	},
	void
> = (input) => {
	const { ant, target } = input;
	console.debug(`${ant.id} initializing eatExecutor`);
	return () => {
		if (ant.food.amount >= config.antFoodMaxAmount) {
			return createTaskResultFrom(undefined);
		}
		ant.eat(target);
		return pendingTaskResult;
	};
};

function createEatAtHomeTaskGraph(ant: Ant): TaskGraph<PathContext, void> {
	const reachStartOfPathTask = createTaskNode(createReachStartOfPathExecutor);
	const waitForFoodTask = createTaskNode(createWaitForFoodExecutor);
	const enterInteractionRangeTask = createTaskNode(
		createEnterInteractionRangeExecutor<FoodSourceObject>,
	);
	const eatTask = createTaskNode(createEatExecutor);

	reachStartOfPathTask.setNextTaskResolver(() =>
		waitForFoodTask.createTask({ ant }),
	);
	waitForFoodTask.setNextTaskResolver((availableFood) =>
		enterInteractionRangeTask.createTask({ ant, target: availableFood }),
	);
	enterInteractionRangeTask.setNextTaskResolver((interactibleFood) =>
		eatTask.createTask({ ant, target: interactibleFood }),
	);

	return {
		root: reachStartOfPathTask,
		terminal: eatTask,
	};
}

function createEnterInteractionRangeExecutor<
	Target extends SceneObject,
>(input: {
	ant: Ant;
	target: Target;
}): TaskExecutor<Target> {
	const { ant, target } = input;
	console.debug(`${ant.id} initializing enterInteractionRangeExecutor`);
	return () => {
		if (ant.isWithinInteractionRange(target)) {
			ant.stop();
			return createTaskResultFrom(target);
		}
		ant.face(target);
		ant.move();
		return pendingTaskResult;
	};
}

const createWaitForFoodExecutor: TaskExecutorFactory<
	{ ant: Ant },
	FoodSourceObject
> = (input) => {
	const { ant } = input;
	console.debug(`${ant.id} initializing waitForFoodExecutor`);
	return () => {
		const targets = lookup(ant, FoodSourceObject);
		if (targets.length > 0) {
			return createTaskResultFrom(targets[0]);
		}
		return pendingTaskResult;
	};
};

function isInstanceOf<T>(o: unknown, targetClass: ConstructorType<T>): o is T {
	return o instanceof targetClass;
}

function lookup<T extends SceneObject>(
	ant: Ant,
	targetClass: ConstructorType<T>,
): T[] {
	return ant.getVisibleObjects().filter((o) => isInstanceOf(o, targetClass));
}

const createExtendPathExecutor: TaskExecutorFactory<PathContext, Path> = (
	input,
) => {
	const { ant, path } = input;
	const visibleClosesToEndPathMark = path.findClosestToEnd(
		ant.getVisibleObjects().filter(isMark),
	);
	console.debug(`${ant.id} initializing extendPathExecutor`);
	return () => {
		if (
			ant.distanceTo(visibleClosesToEndPathMark) >
			config.pathAdjacentNodesDistance
		) {
			path.append(ant.mark());
			ant.stop();
			return createTaskResultFrom(path);
		}

		if (Math.random() < 0.1) {
			ant.rotate(Math.sign(Math.random() - 0.5) * NOISE_ROTATION);
		}
		ant.move();
		return pendingTaskResult;
	};
};

function createDummyExecutor<Output = void>(
	output: Output,
): TaskExecutor<Output> {
	return () => {
		return createTaskResultFrom(output);
	};
}

function createScanTaskGraph<Target extends SceneObject>(
	ant: Ant,
	targetClass: ConstructorType<Target>,
): TaskGraph<void, Path> {
	//#region Scan task context.
	const pathMaxDistance =
		(config.antFoodLowAmount / config.antFoodDepletionPerMinute) *
		config.antVelocity *
		60;

	const context = {
		path: new PathImpl(),
		ant,
		pathDistance: 0,
	};

	const initPathTask = createTaskNode(createDummyExecutor);
	const lookupTask = createTaskNode(createDummyExecutor);
	const extendPathTask = createTaskNode(createExtendPathExecutor);

	const enterInteractionRangeTask = createTaskNode(
		createEnterInteractionRangeExecutor<Target>,
	);
	const resetScanTask = createTaskNode(createReachStartOfPathExecutor);

	const eatAtHomeTaskGraph = createEatAtHomeTaskGraph(ant);
	const recoverScanPositionTask = createTaskNode(createReachEndOfPathExecutor);

	const terminalTask = createTaskNode(createDummyExecutor<Path>);
	//#endregion

	initPathTask.setNextTaskResolver(() => {
		// TODO: refactor execution functions to generators to simplify definitions.
		context.path = new PathImpl();
		context.pathDistance = 0;
		context.path.append(context.ant.mark());
		return lookupTask.createTask(context);
	});

	lookupTask.setNextTaskResolver(() => {
		const target = lookup(ant, targetClass).filter(
			// biome-ignore lint/suspicious/noExplicitAny: TODO: better types.
			(o) => o !== (ant.home.storage as any),
		)[0];

		// TODO: think of predicate-based task chaining, maybe it would be more readable.
		if (target) {
			return enterInteractionRangeTask.createTask({ ant, target });
		}

		if (context.pathDistance >= pathMaxDistance) {
			return resetScanTask.createTask(context);
		}

		if (ant.food.amount < config.antFoodLowAmount) {
			return eatAtHomeTaskGraph.root.createTask(context);
		}

		return extendPathTask.createTask(context);
	});

	enterInteractionRangeTask.setNextTaskResolver(() =>
		terminalTask.createTask(context.path),
	);

	resetScanTask.setNextTaskResolver(() => initPathTask.createTask(context));

	eatAtHomeTaskGraph.terminal.setNextTaskResolver(() =>
		recoverScanPositionTask.createTask(context),
	);

	extendPathTask.setNextTaskResolver(() => {
		context.pathDistance += config.pathAdjacentNodesDistance;
		return lookupTask.createTask(undefined);
	});

	recoverScanPositionTask.setNextTaskResolver(() =>
		lookupTask.createTask(undefined),
	);

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

const createReachStartOfPathExecutor: TaskExecutorFactory<
	PathContext,
	PathContext
> = (input) => {
	const { ant, path } = input;
	console.debug(`${ant.id} initializing reachStartOfPathExecutor`);
	return () => {
		const marks = lookup(ant, Mark);
		const closest = path.findClosestToStart(marks);
		if (ant.distanceTo(closest) < config.interactionDistance) {
			// TODO: add interaction range to enable mark lifetime refresh.
			// Already reach the end -> complete.
			ant.stop();
			return createTaskResultFrom(input);
		}
		ant.face(closest);
		// TODO: add move options with max distance to prevent overreach of the move target.
		ant.move();
		return pendingTaskResult;
	};
};

const createReachEndOfPathExecutor: TaskExecutorFactory<
	PathContext,
	PathContext
> = (input) => {
	const { ant, path } = input;
	console.debug(`${ant.id} initializing reachEndOfPathExecutor`);
	return () => {
		const marks = lookup(ant, Mark);
		const closest = path.findClosestToEnd(marks);
		if (ant.distanceTo(closest) < config.interactionDistance) {
			// TODO: add interaction range to enable mark lifetime refresh.
			// Already reach the end -> complete.
			ant.stop();
			return createTaskResultFrom(input);
		}
		ant.face(closest);
		// TODO: add move options with max distance to prevent overreach of the move target.
		ant.move();
		return pendingTaskResult;
	};
};

function createPatrolPathTaskGraph(): TaskGraph<PathContext, PathContext> {
	const reachEndOfPathTask = createTaskNode(createReachEndOfPathExecutor);
	const reachStartOfPathTask = createTaskNode(createReachStartOfPathExecutor);
	// TODO: eat at home when food amount is low.

	reachEndOfPathTask.setNextTaskResolver((output) =>
		reachStartOfPathTask.createTask(output),
	);
	reachStartOfPathTask.setNextTaskResolver((output) =>
		reachEndOfPathTask.createTask(output),
	);

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
		scanTaskGraph.terminal.setNextTaskResolver((path) =>
			patrolPathTaskGraph.root.createTask({ ant, path }),
		);
		this.executor = new TaskGraphExecutor(scanTaskGraph.root.createTask());
	}

	execute() {
		this.executor.execute();
	}
}
