import { config } from "../config";
import type { Ant } from "../object/ant";
import { Mark, isMark } from "../object/mark";
import { FoodSourceObject } from "../object/resource";
import type { SceneObject } from "../scene/scene";
import { type Agent, NOISE_ROTATION } from "./agent";

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

/**
 * Task defines context and result.
 */
interface Task<Context = void, Result = void> {
	// TODO: probably context don't need to be public?
	readonly context: Context;
	// TODO: add "completed" task state for tasks with void result.
	readonly result: "pending" | Result;
	execute(): Task<Context, Result>;
}

type WithPath = {
	readonly path: Path;
};

class EatTask implements Task<WithPath, "completed"> {
	result: "pending" | "completed" = "pending";
	readonly context: WithPath;
	private reachStartOfPathTask?: ReachStartOfPathTask;
	private waitForTargetTask?: WaitForTargetTask<FoodSourceObject>;
	private enterInteractionRangeTask?: EnterInteractionRangeTask<FoodSourceObject>;
	constructor(
		private readonly ant: Ant,
		path: Path,
	) {
		this.context = { path };
		console.debug(`${this.ant.id} initializing ${this.constructor.name}`);
	}
	execute() {
		// Go until the start of path (start of the path always leads to the home).
		const reachStartOfPathTask = this.reachStartOfPathTask;
		if (!reachStartOfPathTask) {
			this.reachStartOfPathTask = new ReachStartOfPathTask(
				this.ant,
				this.context.path,
			);
			this.reachStartOfPathTask.execute();
			return this;
		}

		if (reachStartOfPathTask.result === "pending") {
			reachStartOfPathTask.execute();
			return this;
		}

		// Wait for a food to become available.
		const waitForTargetTask = this.waitForTargetTask;
		if (!waitForTargetTask) {
			this.waitForTargetTask = new WaitForTargetTask(
				this.ant,
				FoodSourceObject,
			);
			this.waitForTargetTask.execute();
			return this;
		}

		if (waitForTargetTask.result === "pending") {
			waitForTargetTask.execute();
			return this;
		}

		// Go to food interaction range.
		const enterInteractionRangeTask = this.enterInteractionRangeTask;
		if (!enterInteractionRangeTask) {
			this.enterInteractionRangeTask = new EnterInteractionRangeTask(
				this.ant,
				waitForTargetTask.result,
			);
			this.enterInteractionRangeTask.execute();
			return this;
		}

		if (enterInteractionRangeTask.result === "pending") {
			enterInteractionRangeTask.execute();
			return this;
		}

		// Eat until full.
		if (this.ant.food.amount >= config.antFoodMaxAmount) {
			this.result = "completed";
			return this;
		}

		this.ant.eat(enterInteractionRangeTask.result);
		return this;
	}
}

class EnterInteractionRangeTask<Target extends SceneObject>
	implements Task<void, Target>
{
	result: "pending" | Target = "pending";
	context = undefined;
	constructor(
		private readonly ant: Ant,
		private readonly target: Target,
	) {
		console.debug(`${this.ant.id} initializing ${this.constructor.name}`);
	}
	execute(): Task<void, Target> {
		if (this.ant.isWithinInteractionRange(this.target)) {
			this.ant.stop();
			this.result = this.target;
			return this;
		}
		this.ant.face(this.target);
		this.ant.move();
		return this;
	}
}

class WaitForTargetTask<Target extends SceneObject>
	implements Task<void, Target>
{
	result: "pending" | Target = "pending";
	context = undefined;
	constructor(
		private readonly ant: Ant,
		private readonly target: ConstructorType<Target>,
	) {
		console.debug(`${this.ant.id} initializing ${this.constructor.name}`);
	}
	execute(): Task<void, Target> {
		const target = lookup(this.ant, this.target);
		if (target.length > 0) {
			this.result = target[0];
		}
		return this;
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

class ExtendPathTask implements Task<WithPath, Path> {
	readonly context: WithPath;
	result: "pending" | Path = "pending";
	private readonly visibleClosesToEndPathMark: Mark;
	constructor(
		private readonly ant: Ant,
		private readonly path: Path,
	) {
		console.debug(`${this.ant.id} initializing ${this.constructor.name}`);
		this.context = { path };
		this.visibleClosesToEndPathMark = path.findClosestToEnd(
			this.ant.getVisibleObjects().filter(isMark),
		);
	}
	execute(): Task<WithPath, Path> {
		if (
			this.ant.distanceTo(this.visibleClosesToEndPathMark) >
			config.pathAdjacentNodesDistance
		) {
			this.path.append(this.ant.mark());
			this.result = this.path;
			this.ant.stop();
			return this;
		}

		if (Math.random() < 0.1) {
			this.ant.rotate(Math.sign(Math.random() - 0.5) * NOISE_ROTATION);
		}
		this.ant.move();

		return this;
	}
}

// biome-ignore lint/suspicious/noExplicitAny: not supposed to be used for instantiation and cannot use "unknown[]" here.
type ConstructorType<T> = abstract new (...args: any[]) => T;

class ScanTask<Target extends SceneObject> implements Task<WithPath, Path> {
	context: WithPath = { path: new PathImpl() };
	private eatTask?: EatTask;
	private extendPathTask?: ExtendPathTask;
	private reachEndOfThePathTask?: ReachEndOfPathTask;
	private reachStartOfThePathTask?: ReachStartOfPathTask;
	private pathDistance = 0;
	result: "pending" | Path = "pending";
	constructor(
		private readonly ant: Ant,
		private readonly targetClass: ConstructorType<Target>,
	) {
		console.debug(`${this.ant.id} initializing ${this.constructor.name}`);
		this.resetPath();
	}

	private resetPath() {
		this.context = { path: new PathImpl() };
		this.pathDistance = 0;
		// Initizalize home path node.
		this.context.path.append(this.ant.mark());
	}

	execute(): Task<WithPath, Path> {
		// TODO: throw error if task is already completed.

		const eatTask = this.eatTask;
		// Food is low and not already eating -> cancel current tasks and eat.
		// TODO: ant could die when going home; fix max distance.
		if (!eatTask && this.ant.food.amount < config.antFoodLowAmount) {
			// Cancel other tasks.
			this.extendPathTask = undefined;
			this.reachEndOfThePathTask = undefined;

			this.eatTask = new EatTask(this.ant, this.context.path);
			this.eatTask.execute();
			return this;
		}

		if (eatTask && eatTask.result === "pending") {
			// Already eating -> continue until completion.
			eatTask.execute();
			return this;
		}

		// Restore position.
		const reachEndOfThePathTask = this.reachEndOfThePathTask;
		if (!reachEndOfThePathTask) {
			this.reachEndOfThePathTask = new ReachEndOfPathTask(
				this.ant,
				this.context.path,
			);
			this.reachEndOfThePathTask.execute();
			return this;
		}

		if (reachEndOfThePathTask.result === "pending") {
			reachEndOfThePathTask.execute();
			return this;
		}

		// Lookup target.
		// TODO: filter out objects belongs to home.
		const target = lookup(this.ant, this.targetClass).filter(
			// biome-ignore lint/suspicious/noExplicitAny: TODO: better types.
			(o) => o !== (this.ant.home.storage as any),
		);
		if (target.length > 0) {
			// TODO: add enter interaction range task.
			// Target found -> complete task.
			this.result = this.context.path;
			return this;
		}

		// TODO: limit path by time rather than by endurance.
		const pathMaxDistance =
			(config.antFoodLowAmount / config.antFoodDepletionPerMinute) *
			config.antVelocity *
			60;

		const reachStartOfThePathTask = this.reachStartOfThePathTask;

		// Path distance limit exceeded -> go home and restart the scan.
		if (!reachStartOfThePathTask && this.pathDistance >= pathMaxDistance) {
			console.log(`curr distance: ${this.pathDistance}`);
			this.reachStartOfThePathTask = new ReachStartOfPathTask(
				this.ant,
				this.context.path,
			);
		}

		if (
			reachStartOfThePathTask &&
			reachStartOfThePathTask.result === "pending"
		) {
			reachStartOfThePathTask.execute();
			return this;
		}

		if (reachStartOfThePathTask) {
			this.resetPath();
			this.reachStartOfThePathTask = undefined;
			return this;
		}

		// Lookup did not found a target -> extend search path.
		const extendPathTask = this.extendPathTask;
		if (!extendPathTask) {
			this.extendPathTask = new ExtendPathTask(this.ant, this.context.path);
			this.extendPathTask.execute();
			return this;
		}

		if (extendPathTask.result === "pending") {
			extendPathTask.execute();
			return this;
		}

		if (extendPathTask) {
			this.pathDistance += config.pathAdjacentNodesDistance;
		}

		this.extendPathTask = undefined;

		return this;
	}
}

class OptimizePathTask implements Task<WithPath, Path> {
	context: WithPath;
	result: "pending" | Path = "pending";
	constructor(
		private readonly ant: Ant,
		path: Path,
	) {
		console.debug(`${this.ant.id} initializing ${this.constructor.name}`);
		this.context = { path };
	}
	execute(): Task<WithPath, Path> {
		// TODO: implement path optimization.
		this.result = this.context.path;
		return this;
	}
}

class ReachEndOfPathTask implements Task<WithPath, Path> {
	context: WithPath;
	result: "pending" | Path = "pending";
	constructor(
		private readonly ant: Ant,
		private readonly path: Path,
	) {
		console.debug(`${this.ant.id} initializing ${this.constructor.name}`);
		this.context = { path };
	}

	execute(): Task<WithPath, Path> {
		const marks = lookup(this.ant, Mark);
		const closest = this.path.findClosestToEnd(marks);
		// TODO: add interaction range to enable mark lifetime refresh.
		// Already reach the end -> complete.
		if (this.ant.distanceTo(closest) < config.interactionDistance) {
			this.result = this.path;
			this.ant.stop();
			return this;
		}
		this.ant.face(closest);
		// TODO: add move options with max distance to prevent overreach of the move target.
		this.ant.move();
		return this;
	}
}

class ReachStartOfPathTask implements Task<WithPath, Path> {
	context: WithPath;
	result: "pending" | Path = "pending";
	constructor(
		private readonly ant: Ant,
		private readonly path: Path,
	) {
		console.debug(`${this.ant.id} initializing ${this.constructor.name}`);
		this.context = { path };
	}

	execute(): Task<WithPath, Path> {
		const marks = lookup(this.ant, Mark);
		const closest = this.path.findClosestToStart(marks);
		// TODO: add interaction range to enable mark lifetime refresh.
		// Already reach the end -> complete.
		if (this.ant.distanceTo(closest) < config.interactionDistance) {
			this.result = this.path;
			this.ant.stop();
			return this;
		}
		this.ant.face(closest);
		// TODO: add move options with max distance to prevent overreach of the move target.
		this.ant.move();
		return this;
	}
}

class PatrolPathTask implements Task<WithPath, Path> {
	context: WithPath;
	result: Path | "pending" = "pending";
	private reachEndOfPathTask?: ReachEndOfPathTask;
	private reachStartOfPathTask?: ReachStartOfPathTask;
	constructor(
		private readonly ant: Ant,
		private readonly path: Path,
	) {
		console.debug(`${this.ant.id} initializing ${this.constructor.name}`);
		this.context = { path };
	}
	execute(): Task<WithPath, Path> {
		// TODO: add refuel subtask.

		const reachEndOfPathTask = this.reachEndOfPathTask;
		// Go until the end of path.
		if (!reachEndOfPathTask) {
			this.reachEndOfPathTask = new ReachEndOfPathTask(this.ant, this.path);
			this.reachEndOfPathTask.execute();
			return this;
		}

		if (reachEndOfPathTask.result === "pending") {
			reachEndOfPathTask.execute();
			return this;
		}

		const reachStartOfPathTask = this.reachStartOfPathTask;
		// Go until the start of path.
		if (!reachStartOfPathTask) {
			this.reachStartOfPathTask = new ReachStartOfPathTask(this.ant, this.path);
			this.reachStartOfPathTask.execute();
			return this;
		}

		if (reachStartOfPathTask.result === "pending") {
			reachStartOfPathTask.execute();
			return this;
		}

		// All tasks completed -> reset all tasks.
		this.reachEndOfPathTask = undefined;
		this.reachStartOfPathTask = undefined;

		// TODO: completion condition: resource reachable from path is depleted.
		return this;
	}
}

export class Scout implements Agent {
	private scanTask?: ScanTask<FoodSourceObject>;
	private optimizePathTask?: OptimizePathTask;
	private patrolPathTask?: PatrolPathTask;

	constructor(private readonly ant: Ant) {}

	// TODO: add utils for task composition.
	execute() {
		const scanTask = this.scanTask;
		if (!scanTask) {
			this.scanTask = new ScanTask(this.ant, FoodSourceObject);
			this.scanTask.execute();
			return;
		}

		if (scanTask.result === "pending") {
			scanTask.execute();
			return;
		}

		const optimizePathTask = this.optimizePathTask;
		// Optimize path task not initizlized -> initialize it with path found during scan.
		if (!optimizePathTask) {
			const path = scanTask.result;
			this.optimizePathTask = new OptimizePathTask(this.ant, path);
			this.optimizePathTask.execute();
			return;
		}

		if (optimizePathTask.result === "pending") {
			optimizePathTask.execute();
			return;
		}

		const patrolPathTask = this.patrolPathTask;
		// Patrl path task not initizlized -> initialize it with optimized path.
		if (!patrolPathTask) {
			const path = optimizePathTask.result;
			this.patrolPathTask = new PatrolPathTask(this.ant, path);
			this.patrolPathTask.execute();
			return;
		}

		if (patrolPathTask.result === "pending") {
			patrolPathTask.execute();
			return;
		}

		// All tasks completed -> reset all tasks.
		this.scanTask = undefined;
		this.optimizePathTask = undefined;
		this.patrolPathTask = undefined;
	}
}
