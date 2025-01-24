import type { Ant } from "../../object/ant";
import { FoodSourceObject } from "../../object/resource";
import type { SceneObject } from "../../scene/scene";

export function* enterInteractionRange<Target extends SceneObject>(input: {
	ant: Ant;
	target: Target;
}) {
	const { ant, target } = input;
	console.debug(`${ant.id} enterInteractionRange`);
	ant.face(target);
	ant.move();
	while (!ant.isWithinInteractionRange(target)) {
		ant.face(target);
		yield;
	}
	ant.stop();
	return target;
}
export function* waitForFood(input: { ant: Ant }): Generator<
	void,
	FoodSourceObject
> {
	const { ant } = input;
	console.debug(`${ant.id} waitForFood`);
	while (true) {
		const targets = ant.getVisibleObjects(FoodSourceObject);
		if (targets.length > 0) {
			return targets[0];
		}
		yield;
	}
}
