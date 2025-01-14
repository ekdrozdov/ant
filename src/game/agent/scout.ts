import { type Ant, AntBase } from "../object/ant";
import { Mark, isMark } from "../object/mark";
import { Food } from "../resource";
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
	readonly result: "pending" | Result;
	execute(): Task<Context, Result>;
}

type WithPath = {
	readonly path: Path;
};

class RefuelTask implements Task<WithPath> {
	result = "pending" as const;
	constructor(public context: WithPath) {}
	execute(): Task<WithPath> {
		// console.debug(`${this.ant.id} initializing ${this.constructor.name}`);
		throw new Error("Method not implemented.");
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
	// TODO: move constants to configuration.
	static readonly PATH_EXTENSION_DISTANCE = Math.floor(
		AntBase.VISION_DISTANCE / 2,
	);
	readonly context: WithPath;
	result: "pending" | Path = "pending";
	private readonly visibleClosesToEndPathMark: Mark;
	constructor(
		private readonly ant: Ant,
		private readonly path: Path,
	) {
		this.context = { path };
		this.visibleClosesToEndPathMark = path.findClosestToEnd(
			this.ant.getVisibleObjects().filter(isMark),
		);
	}
	execute(): Task<WithPath, Path> {
		if (
			this.ant.distanceTo(this.visibleClosesToEndPathMark) >
			ExtendPathTask.PATH_EXTENSION_DISTANCE
		) {
			this.path.append(this.ant.mark());
			this.result = this.path;
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
	readonly context: WithPath;
	private subtask?: Task<unknown, unknown>;
	result: "pending" | Path = "pending";
	constructor(
		private readonly ant: Ant,
		private readonly targetClass: ConstructorType<Target>,
	) {
		console.debug(`${this.ant.id} initializing ${this.constructor.name}`);
		this.context = { path: new PathImpl() };
		// TODO: assert ant is at home.
		// Initizalize home path node.
		this.context.path.append(this.ant.mark());
	}

	execute(): Task<WithPath, Path> {
		// Has pending subtask -> complete it first.
		if (this.subtask && this.subtask.result === "pending") {
			this.subtask = this.subtask.execute();
			return this;
		}

		this.subtask = undefined;

		// Maybe refuel.
		if (this.ant.fuel < 30) {
			this.subtask = new RefuelTask(this.context);
			this.subtask = this.subtask.execute();
			return this;
		}

		// Lookup target.
		const target = lookup(this.ant, this.targetClass);
		// Target found -> complete task.
		if (target.length > 0) {
			this.result = this.context.path;
			return this;
		}

		// Extend search path.
		this.subtask = new ExtendPathTask(this.ant, this.context.path);
		this.subtask = this.subtask.execute();

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

export const INTERACTION_DISTANCE = 5;

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
		if (this.ant.distanceTo(closest) < INTERACTION_DISTANCE) {
			this.result = this.path;
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
		if (this.ant.distanceTo(closest) < 1) {
			this.result = this.path;
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
	private scanTask?: ScanTask<Food>;
	private optimizePathTask?: OptimizePathTask;
	private patrolPathTask?: PatrolPathTask;

	constructor(private readonly ant: Ant) {}

	// TODO: add utils for task composition.
	execute() {
		const scanTask = this.scanTask;
		if (!scanTask) {
			this.scanTask = new ScanTask(this.ant, Food);
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
