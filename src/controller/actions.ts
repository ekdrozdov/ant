import { AntBase } from "../game/agent/agent";
import { Scout } from "../game/agent/ai/scout";
import type { Scene } from "../game/scene/scene";
import { getWorld } from "../game/world";
import type { Vector2d } from "../renderer/renderable";
import type { Disposable } from "../utils/lifecycle";

interface Action {
	readonly id: string;
	execute(): void;
}

class ActionRegistry {
	private readonly actions = new Map<string, () => void>();
	register(action: Action): Disposable {
		if (this.actions.has(action.id)) {
			throw new Error(`Action with id ${action.id} is already registered`);
		}
		this.actions.set(action.id, action.execute.bind(action));
		return {
			dispose: () => {
				this.actions.delete(action.id);
			},
		};
	}
	execute(id: string) {
		const execute = this.actions.get(id);
		if (!execute) {
			throw new Error(`No handler registered for action ${id}`);
		}
		execute();
	}
}

export const actionRegistry = new ActionRegistry();

const context: {
	objToSpawn: string;
	event: { id: "sceneClick"; position: Vector2d };
} = {
	objToSpawn: "scout",
	event: { id: "sceneClick", position: { x: 0, y: 0 } },
};

class Spawn implements Action {
	readonly id = "spawn";
	constructor(private readonly _scene: Scene) {}
	execute() {
		if (context.objToSpawn !== "scout") {
			throw new Error(`Unknown object type ${context.objToSpawn}`);
		}
		if (context.event.id !== "sceneClick") {
			throw new Error(`Event ${context.event.id} is not supported`);
		}
		const obj = new AntBase();
		// TODO: register agent.
		const agent = new Scout(new AntBase());
		this._scene.mount(obj);
		const { position } = context.event;
		obj.renderable.position.x = position.x;
		obj.renderable.position.y = position.y;
	}
}

actionRegistry.register(new Spawn(getWorld().scene));

const defaultFreq = 60
let freq = defaultFreq;
actionRegistry.register({
	id: "incSpeed",
	execute: () => {
		freq = freq * 2;
		freq = Math.max(defaultFreq * 2 * 2 * 2, freq);
		getWorld().clock.setFreq(freq);
	},
});
actionRegistry.register({
	id: "decSpeed",
	execute: () => {
		freq = freq / 2;
		freq = Math.min(defaultFreq / 2 / 2, freq);
		getWorld().clock.setFreq(freq);
	},
});
actionRegistry.register({
	id: "pause",
	execute: () => {
		getWorld().clock.pause()
	},
});
actionRegistry.register({
	id: "resume",
	execute: () => {
		getWorld().clock.resume();
	},
});
