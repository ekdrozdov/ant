import { RenderableBase } from "../../renderer/renderable";
import { EventEmitter } from "../../utils/events";
import { SceneObjectImpl, type StaticSceneObject } from "../scene/scene";
import { getWorld } from "../world";

export class AntCorpse extends SceneObjectImpl implements StaticSceneObject {
	kind = "static" as const;
	private readonly _onDecomposed = new EventEmitter<void>();
	readonly onDecomposed = this._onDecomposed.event;
	private remains = 20;
	constructor() {
		super(new RenderableBase({ kind: "corpse" }));
		this.register(
			getWorld().clock.onMinute(() => {
				this.remains -= 10;
				console.debug(`flesh remains: ${this.remains}`);
				if (this.remains <= 0) {
					this._onDecomposed.dispatch();
				}
			}),
		);
	}
}
