export interface Point {
  x: number
  y: number
}

export type RenderableState = 'default' | 'dead'

export type RenderableKind =
  | 'bunny'
  | 'tree'
  | 'tree-source'
  | 'animal-source'
  | 'mark'

/**
 * Contains a data to render an entity. This data will be synced with actual renderer every frame.
 */
export interface Renderable {
  readonly kind: RenderableKind
  state: RenderableState
  position: Point
  rotation: number
}

export class RenderableBase implements Renderable {
  position: Point
  readonly kind: RenderableKind
  state: RenderableState
  rotation: number
  constructor(props?: Partial<Renderable>) {
    this.position = props?.position ?? { x: 0, y: 0 }
    this.kind = props?.kind ?? 'bunny'
    this.state = props?.state ?? 'default'
    this.rotation = 0
  }
}
