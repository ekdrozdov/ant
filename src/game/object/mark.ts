import { RenderableBase } from "../../renderer/renderable";
import type { Trail } from "../agent/task/trail";
import { SceneObjectImpl, type StaticSceneObject } from "../scene/scene";

export class Mark extends SceneObjectImpl implements StaticSceneObject {
	readonly kind = "static";
	constructor(
		readonly id: number,
		public attracting: boolean,
		readonly trail: Trail,
	) {
		super(new RenderableBase({ kind: "mark" }));
	}
}

export function isMark(o: unknown): o is Mark {
	return o instanceof Mark;
}
