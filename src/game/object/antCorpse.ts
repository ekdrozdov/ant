import { RenderableBase } from "../../renderer/renderable";
import {
	type Scene,
	SceneObjectImpl,
	type StaticSceneObject,
} from "../scene/scene";
import { getWorld } from "../world";

export class AntCorpse extends SceneObjectImpl implements StaticSceneObject {
	kind = "static" as const;
	private remains = 20;
	constructor() {
		super(new RenderableBase({ kind: "corpse" }));
	}

	onMount(scene: Scene): void {
		this.register(
			getWorld().clock.onMinute(() => {
				this.remains = this.remains - 10;
				if (this.remains <= 0) {
					scene.dismountAndDispose(this);
				}
			}),
		);
	}
}
