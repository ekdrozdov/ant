import { RenderableBase } from "../../renderer/renderable";
import { config } from "../config";
import {
	type Scene,
	SceneObjectImpl,
	type StaticSceneObject,
} from "../scene/scene";
import { getWorld } from "../world";
import { FoodSourceObject } from "./resource";

export class Building extends SceneObjectImpl implements StaticSceneObject {
	kind = "static" as const;
	storage = new FoodSourceObject(500);
}

export class QueenChamber extends Building {}

export class LivingChamber extends Building {
	constructor() {
		super(new RenderableBase({ kind: "chamber" }));
	}
}

export class StorageChamber extends Building {}
