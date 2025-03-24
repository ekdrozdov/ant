import { config } from "../config";
import type { Ant } from "../object/ant";
import type { FoodSourceObject } from "../object/resource";
import {} from "../scene/pheromap";
import type { Agent } from "./agent";
import { enterInteractionRange } from "./task/interaction";
import { type TaskGraph, TaskGraphExecutor, task } from "./task/task";
import { type Trail, reachStartOfTrail } from "./task/trail";

interface TrailContext {
	trail: Trail;
	ant: Ant;
}

// Engages into pheromone trails by chance.
function* findJob(input: { ant: Ant }): Generator<void, { ant: Ant }> {
	const { ant } = input;
	while (true) {
		if (ant.getSurroundingPheromones().some((ph) => ph > 0)) {
			return input;
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

function* followPheromone(input: { ant: Ant }): Generator<void, { ant: Ant }> {
	const { ant } = input;
	ant.startPathRecording();
	ant.faceAttractingPheromone();
	ant.move();
	// move along pheromone path
	// re-roll moving direction sometimes
	// do not walk too far away from filled pheromones
	// complete task when target reached
	while (true) {
		// TODO: add walk meter to ant.
		// ant.
		if (Math.random() < 0.3) {
			ant.faceAttractingPheromone();
		}
		yield;
	}
}

function createMineTaskGraph(): TaskGraph<{ ant: Ant }, { ant: Ant }> {
	// let foodLeft = 1;

	const goToMine = task(followPheromone);
	const enterMine = task(enterInteractionRange<FoodSourceObject>);
	const goToHome = task(reachStartOfTrail);
	const enterHome = task(enterInteractionRange<FoodSourceObject>);
	// const terminal = task(reachStartOfTrail);
	const terminal = goToMine;

	// const load = task(function* (
	// 	input: NavigationContext & { food: FoodSourceObject },
	// ) {
	// 	input.ant.grab(input.food);
	// 	foodLeft = input.food.amount;
	// 	return input;
	// });

	// const unload = task(function* (input: NavigationContext) {
	// 	input.ant.store(input.ant.home.storage);
	// 	return input;
	// });

	// let context: undefined | (NavigationContext & { food: FoodSourceObject });

	// goToMine.next((input) => {
	// 	const food = input.ant.getVisibleObjects(FoodSourceObject)[0];
	// 	if (!food) {
	// 		return terminal.start(input);
	// 	}
	// 	context = {
	// 		ant: input.ant,
	// 		trail: input.trail,
	// 		food,
	// 	};
	// 	return enterMine.start({ ant: input.ant, target: food });
	// });

	// enterMine.next(() => {
	// 	if (!context) {
	// 		throw new Error("Context read before assigned.");
	// 	}
	// 	return load.start(context);
	// });
	// load.next(goToHome);
	// goToHome.next((input) => {
	// 	return enterHome.start({ ant: input.ant, target: input.ant.home.storage });
	// });

	// enterHome.next(() => {
	// 	if (!context) {
	// 		throw new Error("Context read before assigned.");
	// 	}
	// 	return unload.start({
	// 		ant: context.ant,
	// 		trail: context.trail,
	// 	});
	// });

	// unload.next((input) => {
	// 	if (foodLeft === 0) {
	// 		return terminal.start(input);
	// 	}
	// 	return goToMine.start(input);
	// });

	return {
		root: goToMine,
		terminal: goToMine,
	};
}

export class Worker implements Agent {
	private readonly executor: TaskGraphExecutor;

	constructor(private readonly ant: Ant) {
		const findJobTask = task(findJob);
		const mineTaskGraph = createMineTaskGraph();

		// TODO: must be a compilation error.
		findJobTask.next(mineTaskGraph.root);
		mineTaskGraph.terminal.next(findJobTask);

		// TODO: eat sometimes hehe.

		this.executor = new TaskGraphExecutor(findJobTask.start({ ant }));
	}

	execute() {
		this.executor.execute();
	}
}
