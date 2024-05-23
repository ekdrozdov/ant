import { getWorld } from '../../main'
import { Point, Renderable, RenderableBase } from '../../renderer/renderable'
import { PI, PI_2, distance, rotationOf } from '../../utils/math'
import { Food, RESOURCES, Resource, ResourceTag } from '../resource'
import { SceneObject, SceneObjectBase } from '../scene'
import { allObjectsInRadius as findObjectsInRadius } from '../sceneUtils'

export interface Agent {
  execute(): void
}

export interface Ant {
  readonly id: number
  state: 'move' | 'idle'
  fuel: number
  mark(attracting?: boolean): void
  move(): void
  rotate(angle: number): void
  face(position: Point): void
  stop(): void
  refuel(): void
  getVisibleObjects(): readonly SceneObject[]
  getVisibleObjectsInfront(): readonly SceneObject[]
  distanceTo(target: SceneObject): number
}

let id = 0
function getId() {
  return id++
}

export class AntBase extends SceneObjectBase implements Ant {
  state: 'move' | 'idle' = 'idle'
  fuel = 100
  private readonly visibilityHalfAngle = Math.PI / 2
  private readonly visionDistance = 100
  public readonly id: number = getId()
  constructor() {
    super(new RenderableBase({ kind: 'bunny' }))
  }
  mark(attracting = false): void {
    getWorld().scene.mount(
      new Mark(this.id, attracting, {
        kind: 'mark',
        position: { ...this.renderable.position },
        state: 'default',
        rotation: 0,
      })
    )
  }
  move(): void {
    this.state = 'move'
  }
  rotate(rotation: number): void {
    let normalizedRotation = rotation % PI_2
    if (normalizedRotation < 0) {
      normalizedRotation = PI_2 + normalizedRotation
    }
    this.renderable.rotation =
      (this.renderable.rotation + normalizedRotation) % PI_2
  }
  face(target: Point): void {
    const targetVector = {
      x: target.x - this.renderable.position.x,
      y: target.y - this.renderable.position.y,
    }
    const targetRotation = rotationOf(targetVector)
    this.renderable.rotation = targetRotation
  }
  stop(): void {
    this.state = 'idle'
  }
  refuel(): void {
    throw new Error('Method not implemented.')
  }
  getVisibleObjects(): readonly SceneObject[] {
    return findObjectsInRadius(this, this.visionDistance)
  }
  getVisibleObjectsInfront(): readonly SceneObject[] {
    return findObjectsInRadius(this, this.visionDistance).filter((obj) => {
      const targetVector = {
        x: obj.renderable.position.x - this.renderable.position.x,
        y: obj.renderable.position.y - this.renderable.position.y,
      }
      const targetRotation = rotationOf(targetVector)
      return (
        Math.abs(targetRotation - this.renderable.rotation) <=
        this.visibilityHalfAngle
      )
    })
  }
  distanceTo(target: SceneObject): number {
    return distance(this.renderable.position, target.renderable.position)
  }
}

class Mark extends SceneObjectBase {
  constructor(
    readonly id: number,
    readonly attracting: boolean,
    renderable: Renderable
  ) {
    super(renderable)
  }
}

export function isMark(o: any): o is Mark {
  return o instanceof Mark
}

export function isFood(o: any): o is Food {
  return o instanceof Food
}

export const NOISE_ROTATION = PI / 8
