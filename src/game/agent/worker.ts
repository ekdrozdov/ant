import { config } from "../config";
import type { Ant } from "../object/ant";
import { Mark } from "../object/mark";
import { FoodSourceObject } from "../object/resource";
import type { Agent } from "./agent";
import { enterInteractionRange } from "./task/interaction";
import { type TaskGraph, TaskGraphExecutor, task } from "./task/task";
import {
	type NavigationContext,
	type Trail,
	reachEndOfTrail,
	reachStartOfTrail,
} from "./task/trail";

interface TrailContext {
	trail: Trail;
	ant: Ant;
}

// Engages into pheromone trails by chance.
function* findJob(input: { ant: Ant }): Generator<void, TrailContext> {
	const { ant } = input;
	while (true) {
		const mark = ant.getVisibleObjects(Mark).filter((m) => m.attracting)[0];
		if (mark) {
			return { trail: mark.trail, ant };
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

// direction to sector map

// [start, end)
type PheroDirection = {
	sectorStart: number
	sectorEnd: number
	sectorCenter: number
	value: number
}

function rotate() {
	const dirs: PheroDirection[];
	// n: 10
	// s: 40
	// w: 0
	// e: 15

	// filter irrelevant dirs

	// n: 10
	// s: 40
	// w: 0

	// handicap zero vals

	// n: 10
	// s: 40
	// w: 5 -- handicap eqs to half of min mark val

	// map pheromone amount into chance

	// 10 + 35 + 5 = 50
	// 100/50 = 2

	// chances per direction are:

	// n: 0.2
	// s: 0.7
	// w: 0.1

	// roll

	// let's say 0.5 is rolled

	// map chances to value from 0 to 1
	// w <= 0.1
	// n <= 0.3
	// s <= 1

	// find winner

	// winner is south

	// map winning direciton to rotation
	// face towards center of the section
}

function* followPheromone(input: { ant: Ant }): Generator<void, TrailContext> {
	const { ant } = input;
	const phs = ant.getSurroundingPheromones();
	// build weights
	// filter irrelevant directions
	// choose direction by chance
	while (true) {
		const mark = ant.getVisibleObjects(Mark).filter((m) => m.attracting)[0];
		if (mark) {
			return { trail: mark.trail, ant };
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

function createMineTaskGraph(): TaskGraph<
	NavigationContext,
	NavigationContext
> {
	let foodLeft = 1;

	const goToMine = task(reachEndOfTrail);
	const enterMine = task(enterInteractionRange<FoodSourceObject>);
	const goToHome = task(reachStartOfTrail);
	const enterHome = task(enterInteractionRange<FoodSourceObject>);
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

	let context: undefined | (NavigationContext & { food: FoodSourceObject });

	goToMine.next((input) => {
		const food = input.ant.getVisibleObjects(FoodSourceObject)[0];
		if (!food) {
			return terminal.start(input);
		}
		context = {
			ant: input.ant,
			trail: input.trail,
			food,
		};
		return enterMine.start({ ant: input.ant, target: food });
	});

	enterMine.next(() => {
		if (!context) {
			throw new Error("Context read before assigned.");
		}
		return load.start(context);
	});
	load.next(goToHome);
	goToHome.next((input) => {
		return enterHome.start({ ant: input.ant, target: input.ant.home.storage });
	});

	enterHome.next(() => {
		if (!context) {
			throw new Error("Context read before assigned.");
		}
		return unload.start({
			ant: context.ant,
			trail: context.trail,
		});
	});

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
