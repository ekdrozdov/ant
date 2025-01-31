import { config } from "../config";
import type { Ant } from "../object/ant";
import { Mark } from "../object/mark";
import { FoodSourceObject } from "../object/resource";
import type { Agent } from "./agent";
import { type TaskGraph, TaskGraphExecutor, task } from "./task/task";
import {
	type NavigationContext,
	type Trail,
	reachEndOfTrail,
	reachStartOfTrail,
} from "./task/trail";

interface HaulJob {
	trail: Trail;
}

// Engages into pheromone trails by chance.
function* findJob(input: { ant: Ant }): Generator<void, HaulJob> {
	const { ant } = input;
	while (true) {
		const mark = ant.getVisibleObjects(Mark).filter((m) => m.attracting)[0];
		if (mark) {
			return { trail: mark.trail };
		}

		if (ant.distanceTo(ant.home) >= config.antJoblessRoamingMaxDistance) {
			ant.face(ant.home);
		}

		if (Math.random() < 0.1) {
			ant.rotate(
				Math.sign(Math.random() - 0.5) * config.antNoiseRotationAmount,
			);
		}

		if (Math.random() < 0.1) {
			ant.stop();
		}

		if (Math.random() < 0.1) {
			ant.move();
		}
		yield;
	}
}

function createMineGraph(): TaskGraph<NavigationContext, unknown> {
	let foodLeft = 1;

	const goToMine = task(reachEndOfTrail);
	const goToHome = task(reachStartOfTrail);
	const terminal = task(reachStartOfTrail);

	const load = task(function* (
		input: NavigationContext & { food: FoodSourceObject },
	) {
		input.ant.grab(input.food);
		foodLeft = input.food.amount;
		return input;
	});

	const unload = task(function* (input: NavigationContext) {
		input.ant.store(input.ant.home.storage);
		return input;
	});

	goToMine.next((out) => {
		const food = out.ant.getVisibleObjects(FoodSourceObject)[0];
		if (!food) {
			return terminal.start(out);
		}
		return load.start({ ...out, food });
	});

	load.next((out) => {
		return goToHome.start(out);
	});

	goToHome.next(unload);

	unload.next((input) => {
		if (foodLeft === 0) {
			return terminal.start(input);
		}
		return goToMine.start(input);
	});

	return {
		root: goToMine,
		terminal,
	};
}

export class Worker implements Agent {
	private readonly executor: TaskGraphExecutor;

	constructor(private readonly ant: Ant) {
		const findJobTask = task(findJob);
		const mineGraph = createMineGraph();

		findJobTask.next(mineGraph.root);
		mineGraph.terminal.next(findJobTask);

		// TODO: eat sometimes hehe.

		this.executor = new TaskGraphExecutor(findJobTask.start({ ant }));
	}

	execute() {
		this.executor.execute();
	}
}
