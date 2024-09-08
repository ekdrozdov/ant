import { World } from "../game/world";
import { MenuRegistry } from "../ui/menu";
import { Event, EventEmitter } from "../utils/events";
import { Point } from "./renderable";

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
