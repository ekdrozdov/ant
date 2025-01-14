import { RenderableBase } from "../../renderer/renderable";
import { distance } from "../../utils/math";
import { INTERACTION_DISTANCE } from "../config";
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

export class Food
	extends SceneObjectImpl
	implements Resource<"food">, StaticSceneObject
{
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

export function isWithinInteractionRange(
	one: SceneObject,
	other: SceneObject,
): boolean {
	return (
		distance(one.renderable.position, other.renderable.position) <=
		INTERACTION_DISTANCE
	);
}

function openInteractionWithStatic(requester: SceneObject, target: StaticSceneObject) {

}

class Interaction {
	
}
