import { config } from "../../config";
import type { Ant } from "../../object/ant";
import type { FoodSourceObject } from "../../object/resource";
import { waitForFood } from "./interaction";
import { enterInteractionRange } from "./interaction";
import { type TaskGraph, task } from "./task";
import { type NavigationContext, reachStartOfTrail } from "./trail";

export function* eat(input: { ant: Ant; target: FoodSourceObject }) {
	const { ant, target } = input;
	console.debug(`${ant.id} eat`);
	while (ant.food.amount < config.antFoodMaxAmount) {
		ant.eat(target);
		yield;
	}
}
export function createEatAtHomeTaskGraph(
	ant: Ant,
): TaskGraph<NavigationContext, void> {
	const reachStartOfTrailTask = task(reachStartOfTrail);
	const waitForFoodTask = task(waitForFood);
	const enterInteractionRangeTask = task(
		enterInteractionRange<FoodSourceObject>,
	);
	const eatTask = task(eat);

	reachStartOfTrailTask.next(waitForFoodTask);
	waitForFoodTask.next((availableFood) =>
		enterInteractionRangeTask.start({ ant, target: availableFood }),
	);
	enterInteractionRangeTask.next((interactibleFood) =>
		eatTask.start({ ant, target: interactibleFood }),
	);

	return {
		root: reachStartOfTrailTask,
		terminal: eatTask,
	};
}
