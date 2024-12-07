export interface Vector2d {
	x: number;
	y: number;
}

export type RenderableState = "default" | "dead";

export type RenderableKind =
	| "bunny"
	| "tree"
	| "tree-source"
	| "animal-source"
	| "mark"
	| "chamber";

/**
 * Contains a data to render an entity. This data will be synced with actual renderer every frame.
 */
export interface Renderable {
	readonly kind: RenderableKind;
	state: RenderableState;
	position: Vector2d;
	/**
	 * Rotation reltive to unit circle.
	 *
	 * Note that Y-axis goes top to bottom,
	 * so the unit circle is mirrored relative to the X-axis:
	 * * 0 faces to the right
	 * * PI / 2 faces to the bottom
	 * * PI faces to the left
	 * * PI * 3 / 2 faces to the top
	 */
	rotation: number;
}

export class RenderableBase implements Renderable {
	position: Vector2d;
	readonly kind: RenderableKind;
	state: RenderableState;
	rotation: number;
	constructor(props?: Partial<Renderable>) {
		this.position = props?.position ?? { x: 0, y: 0 };
		this.kind = props?.kind ?? "bunny";
		this.state = props?.state ?? "default";
		this.rotation = 0;
	}
}
