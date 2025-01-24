import type { ConstructorType } from "../../utils/class";
import { config } from "../config";
import type { Ant } from "../object/ant";
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
		context.trail.append(context.ant.mark());
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

	const eatAtHomeTaskGraph = createEatAtHomeTaskGraph(ant);
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
	// TODO: eat at home when food amount is low.

	reachEndOfTrailTask.next(reachStartOfTrailTask);
	reachStartOfTrailTask.next(reachEndOfTrailTask);

	return {
		root: reachEndOfTrailTask,
		terminal: reachStartOfTrailTask,
	};
}

export class Scout implements Agent {
	private readonly executor: TaskGraphExecutor;

	constructor(private readonly ant: Ant) {
		const scanTaskGraph = createScanTaskGraph(this.ant, FoodSourceObject);
		const patrolTrailTaskGraph = createPatrolTrailTaskGraph();
		scanTaskGraph.terminal.next((trail) =>
			patrolTrailTaskGraph.root.start({ ant, trail: trail }),
		);
		this.executor = new TaskGraphExecutor(scanTaskGraph.root.start());
	}

	execute() {
		this.executor.execute();
	}
}
