import { Point } from '../renderer/renderable'
import { Scene, SceneBase } from './scene'
import { GameClock, GameClockBase } from './time'

export interface World {
  readonly size: Point
  readonly scene: Scene
  readonly clock: GameClock
}

export class WorldBase implements World {
  size: Point
  scene: Scene = new SceneBase(this)
  clock: GameClock = new GameClockBase()
  constructor(props?: { size?: Point }) {
    this.size = props?.size ?? {
      x: 100,
      y: 100,
    }
  }
}

export function estimateLocalFood(point: Point, radius: number): number {
  return 10
}
