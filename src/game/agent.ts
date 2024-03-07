// All agnet actions are equally spaced in time.

import { getWorld } from '../main'
import { Point, Renderable, RenderableBase } from '../renderer/renderable'
import { PI, PI_2, distance, rotationOf } from '../utils/math'
import { Food, RESOURCES, Resource, ResourceTag } from './resource'
import { SceneObject, SceneObjectBase } from './scene'

// Only access a local data.
interface Agent {
  execute(): void
}

interface Ant {
  readonly id: number
  state: 'move' | 'idle'
  fuel: number
  mark(): void
  move(): void
  rotate(angle: number): void
  face(position: Point): void
  stop(): void
  refuel(): void
  getVisibleObjects(): readonly SceneObject[]
}

export class AntBase extends SceneObjectBase implements Ant {
  state: 'move' | 'idle' = 'idle'
  fuel = 100
  private readonly visibilityHalfAngle = Math.PI / 4
  private readonly visionDistance = 100
  constructor(public readonly id: number) {
    super(new RenderableBase({ kind: 'bunny' }))
  }
  mark(): void {
    getWorld().scene.mount(
      new Mark({
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
    return getWorld()
      .scene.all()
      .filter((obj) => {
        if (this === obj) {
          return false
        }
        if (
          distance(this.renderable.position, obj.renderable.position) >
          this.visionDistance
        ) {
          return false
        }
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
}

class Mark extends SceneObjectBase {
  id: number = 0
}

function isMark(o: any): o is Mark {
  return o instanceof Mark
}

function isFood(o: any): o is Food {
  return o instanceof Food
}

export class Scout implements Agent {
  private state: 'scan' | 'trace' = 'scan'
  scan() {
    this.ant.mark()
    this.ant.move()
    const food = this.ant.getVisibleObjects().filter(isFood)
    food.forEach((item) => (item.renderable.state = 'dead'))
    if (food.length > 0) {
      this.ant.rotate(Math.PI)
      this.execute = this.trace
    }
  }
  trace() {
    this.ant.move()
    const mark = this.ant
      .getVisibleObjects()
      .filter(isMark)
      .find((mark) => mark.id === this.ant.id)
    if (!mark) {
      console.error('Ant panic')
      this.ant.stop()
      Math.random() < 0.1 && this.ant.rotate(PI / 4)
      return
    }
    this.ant.face(mark.renderable.position)
  }
  patrol() {}
  execute: () => void
  constructor(private readonly ant: Ant) {
    this.execute = this.scan
  }
}

// Read my info
// Read world info
// Make an action

// Queen
// Scout
// Hauler
// Builder

// Housing
// Food
