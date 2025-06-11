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
	private hp = 100;
	constructor() {
		super(new RenderableBase({ kind: "chamber" }));
	}

	onMount(scene: Scene) {
		const clock = getWorld().clock;
		this.register(
			clock.onMinute(() => {
				if (this.hp < 0) {
					console.debug("chamber dies");
					scene.dismountAndDispose(this);
					return;
				}
				this.hp = this.hp - config.chamberDegradationPerMinute;
			}),
		);
	}
}

export class StorageChamber extends Building {}
