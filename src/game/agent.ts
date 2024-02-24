// All agnet actions are equally spaced in time.

import { getWorld } from '../main'
import { Point, Renderable, RenderableBase } from '../renderer/renderable'
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
  constructor(public readonly id: number) {
    super(new RenderableBase({ kind: 'bunny' }))
  }
  mark(): void {
    this.renderable.position
    getWorld().scene.mount(
      new Mark({
        kind: 'animal-source',
        position: this.renderable.position,
        state: 'default',
        rotation: 0,
      })
    )
  }
  move(): void {
    this.state = 'move'
  }
  rotate(angle: number): void {
    this.renderable.rotation = angle
  }
  face(position: Point): void {
    throw new Error('Method not implemented.')
  }
  stop(): void {
    this.state = 'idle'
  }
  refuel(): void {
    throw new Error('Method not implemented.')
  }
  getVisibleObjects(): readonly SceneObject[] {
    return []
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
    if (food.length > 0) {
      this.ant.rotate(180)
      this.execute = this.trace
    }
  }
  trace() {
    this.ant.move()
    const mark = [{} as any]
      .filter(isMark)
      .find((mark) => mark.id === this.ant.id)
    if (!mark) {
      console.error('Ant panic')
      this.ant.stop()
      this.ant.rotate(5)
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
