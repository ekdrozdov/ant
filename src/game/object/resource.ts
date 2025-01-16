import { RenderableBase } from "../../renderer/renderable";
import { distance } from "../../utils/math";
import { config } from "../config";
import {
	type SceneObject,
	SceneObjectImpl,
	type StaticSceneObject,
} from "../scene/scene";

type ResourceTag = "food";

export interface Resource<T extends ResourceTag> {
	readonly tag: T;
	amount: number;
}

export function transferResource<T extends ResourceTag>(
	source: Resource<T>,
	target: Resource<T>,
	amount: number,
) {
	const transactionAmount = Math.min(source.amount, amount);
	source.amount -= transactionAmount;
	target.amount += transactionAmount;
}

export function isWithinInteractionRange(
	one: SceneObject,
	other: SceneObject,
): boolean {
	return (
		distance(one.renderable.position, other.renderable.position) <=
		config.interactionDistance
	);
}

export function assertWithinInteractionRange(
	one: SceneObject,
	other: SceneObject,
) {
	if (!isWithinInteractionRange(one, other)) {
		throw new Error("Objects are not within interaction range");
	}
}

export class FoodResource implements Resource<"food"> {
	readonly tag = "food";
	amount: number;
	constructor(amount = 0) {
		this.amount = amount;
	}
}

export class FoodSourceObject
	extends SceneObjectImpl
	implements Resource<"food">, StaticSceneObject
{
	food = new FoodResource();
	amount: number;
	readonly tag = "food";
	kind = "static" as const;
	constructor(amount = 0) {
		// TODO: add food sprite.
		super(new RenderableBase({ kind: "tree-source" }));
		this.renderable.state = "default";
		this.renderable.rotation = -Math.PI / 2;
		this.amount = amount;
	}
}
