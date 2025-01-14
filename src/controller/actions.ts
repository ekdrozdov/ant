import { agentRegistry } from "../game/agent/agent";
import { Scout } from "../game/agent/ai/scout";
import { LivingChamber } from "../game/buildings";
import { AntBase } from "../game/scene/object/ant";
import type { Scene } from "../game/scene/scene";
import { getWorld } from "../game/world";
import type { RenderableKind, Vector2d } from "../renderer/renderable";
import type { Disposable } from "../utils/lifecycle";

interface Action {
	// TODO: just use class directly?
	readonly id: string;
	execute(): void;
}

// TODO: just use actions directly?
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

const spawnContext: {
	objToSpawn: string;
	event: { id: "sceneClick"; position: Vector2d };
} = {
	objToSpawn: "scout",
	event: { id: "sceneClick", position: { x: 0, y: 0 } },
};

// biome-ignore lint/correctness/noUnusedVariables: add to registry when finished.
class Spawn implements Action {
	readonly id = "spawn";
	constructor(private readonly _scene: Scene) {}
	execute() {
		if (spawnContext.objToSpawn !== "scout") {
			throw new Error(`Unknown object type ${spawnContext.objToSpawn}`);
		}
		if (spawnContext.event.id !== "sceneClick") {
			throw new Error(`Event ${spawnContext.event.id} is not supported`);
		}
		// TODO: picker.
		const obj = new AntBase(new LivingChamber());
		const agent = new Scout(obj);
		agentRegistry.register(agent);
		this._scene.mount(obj);
		const { position } = spawnContext.event;
		obj.renderable.position.x = position.x;
		obj.renderable.position.y = position.y;
	}
}

// actionRegistry.register(new Spawn(getWorld().scene));

export const DOUBLE_SPEED_ACTION_ID = "doubleSpeed";
export const HALF_SPEED_ACTION_ID = "halfSpeed";
{
	const defaultFreq = 60;
	let freq = defaultFreq;
	actionRegistry.register({
		id: DOUBLE_SPEED_ACTION_ID,
		execute: () => {
			freq = freq * 2;
			freq = Math.min(defaultFreq * 2 * 2 * 2, freq);
			getWorld().clock.setFreq(freq);
		},
	});
	actionRegistry.register({
		id: HALF_SPEED_ACTION_ID,
		execute: () => {
			freq = freq / 2;
			freq = Math.max(defaultFreq / 2 / 2, freq);
			getWorld().clock.setFreq(freq);
		},
	});
}
export const PAUSE_ACTION_ID = "pause";
actionRegistry.register({
	id: PAUSE_ACTION_ID,
	execute: () => {
		getWorld().clock.pause();
	},
});
export const RESUME_ACTION_ID = "resume";
actionRegistry.register({
	id: RESUME_ACTION_ID,
	execute: () => {
		getWorld().clock.resume();
	},
});

export const NEXT_ENTITY_ACTION_ID = "NEXT_ENTITY_ACTION_ID";
export const PREV_ENTITY_ACTION_ID = "PREV_ENTITY_ACTION_ID";
{
	const objectList: RenderableKind[] = ["bunny", "tree"];
	let selectedIndex = 0;
	spawnContext.objToSpawn = objectList[selectedIndex];

	actionRegistry.register({
		id: NEXT_ENTITY_ACTION_ID,
		execute() {
			spawnContext.objToSpawn =
				objectList[Math.abs(++selectedIndex % objectList.length)];
		},
	});
	actionRegistry.register({
		id: PREV_ENTITY_ACTION_ID,
		execute() {
			spawnContext.objToSpawn =
				objectList[Math.abs(--selectedIndex % objectList.length)];
		},
	});
}
