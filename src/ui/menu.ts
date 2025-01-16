import { FoodSourceObject } from "../game/object/resource";
import type { Scene } from "../game/scene/scene";
import type { RendererEvents } from "../renderer/renderer";
import { type Event, EventEmitter } from "../utils/events";

export interface MenuModel {
	readonly items: string[];
}

export interface SelectorMenu extends MenuModel {
	select(id: string): void;
	focus(): void;
	blur(): void;
}

export class SpawnerSelector implements SelectorMenu {
	items: string[] = ["bunny", "tree", "tree-source", "animal-source"];
	private selectee?: string;
	private inFocus = false;
	constructor(events: RendererEvents, scene: Scene) {
		events.onClick((e) => {
			if (!this.inFocus) return;
			// if (this.selectee === 'bunny') {
			//   const agent = new Bunny()
			//   agent.renderable.position = e.position
			//   scene.mount(agent)
			//   return
			// }
			// if (this.selectee === 'tree') {
			//   const agent = new Tree()
			//   agent.renderable.position = e.position
			//   scene.mount(agent)
			//   return
			// }
			// if (this.selectee === 'tree-source') {
			//   const agent = new FoodSource()
			//   agent.renderable.position = e.position
			//   scene.mount(agent)
			//   return
			// }
			// if (this.selectee === 'animal-source') {
			//   const agent = new MaterialSource()
			//   agent.renderable.position = e.position
			//   scene.mount(agent)
			//   return
			// }
			// TODO: use class instead of tag.
			// if (this.selectee === RESOURCES.FOOD) {
			const agent = new FoodSourceObject();
			agent.renderable.position = e.position;
			scene.mount(agent);
			return;
			// }
		});
	}
	select(id: string): void {
		this.selectee = id;
	}
	focus(): void {
		this.inFocus = true;
	}
	blur(): void {
		this.inFocus = false;
	}
}

export type MenuRegistryEvent = {
	registered: SelectorMenu;
};

export interface MenuRegistry {
	register(menu: SelectorMenu): void;
	readonly onRegistered: Event<SelectorMenu>;
}

export class MenuRegistryBase implements MenuRegistry {
	private readonly _onRegistered = new EventEmitter<SelectorMenu>();
	readonly onRegistered = this._onRegistered.event;
	register(menu: SelectorMenu): void {
		this._onRegistered.dispatch(menu);
	}
}
