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
export function createEatAtHomeTaskGraph(): TaskGraph<NavigationContext, void> {
	const reachStartOfTrailTask = task(reachStartOfTrail);
	const waitForFoodTask = task(waitForFood);
	const enterInteractionRangeTask = task(
		enterInteractionRange<FoodSourceObject>,
	);
	const eatTask = task(eat);

	let context: NavigationContext | undefined;

	reachStartOfTrailTask.next((input) => {
		context = input;
		return waitForFoodTask.start(input);
	});
	waitForFoodTask.next((availableFood) => {
		// TODO: would be nice to refine waitForFoodTask context with `ant` prop.
		if (!context) {
			throw new Error("Context read before assigned.");
		}
		return enterInteractionRangeTask.start({
			ant: context.ant,
			target: availableFood,
		});
	});
	enterInteractionRangeTask.next((interactibleFood) => {
				if (!context) {
					throw new Error("Context read before assigned.");
				}
				return eatTask.start({ ant: context.ant, target: interactibleFood });
	});

	return {
		root: reachStartOfTrailTask,
		terminal: eatTask,
	};
}
