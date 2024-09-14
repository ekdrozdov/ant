import { type Renderable, RenderableBase } from "../renderer/renderable";
import { SceneObjectImpl } from "./scene/scene";

export const RESOURCES = {
	MATERIAL: "MATERIAL",
	FOOD: "FOOD",
	HOME: "HOME",
} as const;

export type ResourceTag = (typeof RESOURCES)[keyof typeof RESOURCES];

export class Tree extends SceneObjectImpl {
	constructor() {
		super(new RenderableBase({ kind: "tree" }));
	}
}

export interface Resource<T extends ResourceTag> {
	tag: T;
}

export class ResourceBase<T extends ResourceTag>
	extends SceneObjectImpl
	implements Resource<T>
{
	kind = "static" as const;
	constructor(
		public tag: T,
		renderable: Renderable,
	) {
		super(renderable);
	}
}

export class Food extends ResourceBase<typeof RESOURCES.FOOD> {
	constructor() {
		super(RESOURCES.FOOD, new RenderableBase({ kind: "tree-source" }));
		this.renderable.state = "default";
		this.renderable.rotation = -Math.PI / 2;
	}
}
