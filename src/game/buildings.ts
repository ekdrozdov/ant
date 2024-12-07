import { RenderableBase } from "../renderer/renderable";
import { SceneObjectImpl, type StaticSceneObject } from "./scene/scene";

export function isBuilding(o: unknown): o is Building {
		return o instanceof Building;
	}

export class Building extends SceneObjectImpl implements StaticSceneObject {
	kind = "static" as const;
}

export class QueenChamber extends Building {}

export class LivingChamber extends Building {
	constructor() {
		super(new RenderableBase({ kind: "chamber" }));
	}
}

export class StorageChamber extends Building {}
