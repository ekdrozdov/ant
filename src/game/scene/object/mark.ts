import { RenderableBase } from "../../../renderer/renderable";
import { SceneObjectImpl, type StaticSceneObject } from "../scene";

export class Mark extends SceneObjectImpl implements StaticSceneObject {
	readonly kind = "static";
	constructor(
		readonly id: number,
		readonly attracting: boolean,
	) {
		super(new RenderableBase({ kind: "mark" }));
	}
}

export function isMark(o: unknown): o is Mark {
	return o instanceof Mark;
}
