import type { World } from "../game/world";
import type { MenuRegistry } from "../ui/menu";
import { type Event, EventEmitter } from "../utils/events";
import type { Point } from "./renderable";

export interface ClickEvent {
	position: Point;
}

export interface RendererEvents {
	onClick: Event<ClickEvent>;
}

export interface Renderer extends RendererEvents {
	render(world: World, registry: MenuRegistry): void;
}

export class RendererBase {
	protected readonly _onClick = new EventEmitter<ClickEvent>();
	readonly onClick = this._onClick.event;
}
