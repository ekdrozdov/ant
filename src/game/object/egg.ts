import { RenderableBase } from "../../renderer/renderable";
import { config } from "../config";
import {
	type Scene,
	SceneObjectImpl,
	type StaticSceneObject,
} from "../scene/scene";
import { getWorld } from "../world";
import type { Building } from "./buildings";
import { Larva } from "./larva";

export class Egg extends SceneObjectImpl implements StaticSceneObject {
	readonly kind = "static";
	private ageDays = 0;

	constructor(
		readonly home: Building,
		readonly fertilized: boolean,
	) {
		super(new RenderableBase({ kind: "mark" }));
	}

	onMount(scene: Scene): void {
		this.register(
			getWorld().clock.onDay(() => {
				const dtDays = 1;
				if (this.ageDays > config.eggStageLifetimeDays && Math.random() > 0.5) {
					// Stage completed -> hatch.
					scene.dismount(this);
					console.debug("spawn larva");
					const larva = new Larva(this.home, this.fertilized);
					larva.renderable.position = this.renderable.position;
					scene.mount(larva);
					return;
				}

				this.ageDays += dtDays;
			}),
		);
	}
}
