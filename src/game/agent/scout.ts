import type { ConstructorType } from "../../utils/class";
import { config } from "../config";
import type { Ant } from "../object/ant";
import { Mark } from "../object/mark";
import { FoodSourceObject } from "../object/resource";
import type { SceneObject } from "../scene/scene";
import type { Agent } from "./agent";
import { createEatAtHomeTaskGraph } from "./task/food";
import { enterInteractionRange } from "./task/interaction";
import { type TaskGraph, TaskGraphExecutor, task } from "./task/task";
import {
	type NavigationContext,
	type Trail,
	TrailImpl,
	extendTrail,
	reachEndOfTrail,
	reachStartOfTrail,
} from "./task/trail";

function createScanTaskGraph<Target extends SceneObject>(
	ant: Ant,
	targetClass: ConstructorType<Target>,
): TaskGraph<void, Trail> {
	const trailMaxDistance =
		(config.antFoodLowAmount / config.antFoodDepletionPerMinute) *
		config.antVelocity *
		60;

	const context = {
		trail: new TrailImpl(),
		ant,
		trailDistance: 0,
	};

	const initTrailTask = task(function* () {
		context.trail = new TrailImpl();
		context.trailDistance = 0;
		context.trail.append(context.ant.mark(context.trail));
	});

	const lookupTask = task(function* () {
		return ant.getVisibleObjects(targetClass).filter(
			// biome-ignore lint/suspicious/noExplicitAny: TODO: better types.
			(o) => o !== (ant.home.storage as any),
		);
	});

	const extendTrailTask = task(extendTrail);

	const enterInteractionRangeTask = task(enterInteractionRange<Target>);
	const resetScanTask = task(reachStartOfTrail);

	const eatAtHomeTaskGraph = createEatAtHomeTaskGraph();
	const recoverScanPositionTask = task(reachEndOfTrail);

	const terminalTask = task(function* () {
		return context.trail;
	});

	initTrailTask.next(lookupTask);

	lookupTask.next((targets) => {
		const target = targets[0];
		if (target) {
			return enterInteractionRangeTask.start({ ant, target });
		}

		if (context.trailDistance >= trailMaxDistance) {
			return resetScanTask.start(context);
		}

		if (ant.food.amount < config.antFoodLowAmount) {
			return eatAtHomeTaskGraph.root.start(context);
		}

		return extendTrailTask.start(context);
	});

	enterInteractionRangeTask.next(terminalTask);

	resetScanTask.next(initTrailTask);

	eatAtHomeTaskGraph.terminal.next(() =>
		recoverScanPositionTask.start(context),
	);

	extendTrailTask.next(() => {
		context.trailDistance += config.trailAdjacentNodesDistance;
		return lookupTask.start();
	});

	recoverScanPositionTask.next(lookupTask);

	return {
		root: initTrailTask,
		terminal: terminalTask,
	};
}

function createPatrolTrailTaskGraph(): TaskGraph<
	NavigationContext,
	NavigationContext
> {
	const reachEndOfTrailTask = task(reachEndOfTrail);
	const reachStartOfTrailTask = task(reachStartOfTrail);
	const eatAtHomeTaskGraph = createEatAtHomeTaskGraph();
	const terminal = task(reachStartOfTrail);

	let context: NavigationContext | undefined;

	reachEndOfTrailTask.next((input) => {
		input.ant.emittingFoodPheromone = true;
		return reachStartOfTrailTask.start(input)
	});
	reachStartOfTrailTask.next((input) => {
		input.ant.emittingFoodPheromone = false;
		if (input.ant.food.amount < config.antFoodLowAmount) {
			context = input;
			eatAtHomeTaskGraph.root.start(input);
		}
		return reachEndOfTrailTask.start(input);
	});
	eatAtHomeTaskGraph.terminal.next(() => {
		if (!context) {
			throw new Error("Context read before assigned.");
		}
		return reachEndOfTrailTask.start(context);
	});

	// TODO: proceed to terminal task if there is no food left.

	return {
		root: reachEndOfTrailTask,
		terminal,
	};
}

function createActivateTrailTaskGraph(): TaskGraph<
	NavigationContext,
	NavigationContext
> {
	const reachEndOfTrailTask = task(reachEndOfTrail);

	// TODO: add task decorators to improve reuse of tasks:
	// when defined the decorator is executed within a task on certain input.
	const activateTrailUntilStartTask = task(function* (
		input: NavigationContext,
	) {
		const { ant, trail } = input;
		console.debug(`${ant.id} activateTrailUntilStartTask`);
		while (true) {
			const marks = ant.getVisibleObjects(Mark);
			// Activate all visible marks along the way.
			for (const mark of marks) {
				mark.attracting = true;
			}
			const closest = trail.findClosestToStart(marks);
			if (ant.distanceTo(closest) < config.interactionDistance) {
				// Already reach the start -> complete.
				ant.stop();
				return input;
			}
			ant.face(closest);
			// TODO: add move options with max distance to prevent overreach of the move target.
			ant.move();
			yield;
		}
	});

	reachEndOfTrailTask.next((input) => {
		return activateTrailUntilStartTask.start(input);
	});

	return {
		root: reachEndOfTrailTask,
		terminal: activateTrailUntilStartTask,
	};
}

export class Scout implements Agent {
	private readonly executor: TaskGraphExecutor;

	constructor(private readonly ant: Ant) {
		const scanTaskGraph = createScanTaskGraph(this.ant, FoodSourceObject);
		const activateTrailUntilStartTaskGraph = createActivateTrailTaskGraph();
		const patrolTrailTaskGraph = createPatrolTrailTaskGraph();

		scanTaskGraph.terminal.next((trail) =>
			activateTrailUntilStartTaskGraph.root.start({ ant, trail: trail }),
		);
		activateTrailUntilStartTaskGraph.terminal.next(patrolTrailTaskGraph.root);
		patrolTrailTaskGraph.terminal.next(scanTaskGraph.root);

		this.executor = new TaskGraphExecutor(scanTaskGraph.root.start());
	}

	execute() {
		this.executor.execute();
	}
}
