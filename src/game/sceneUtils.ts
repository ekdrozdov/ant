import { getWorld } from '../main'
import { distance } from '../utils/math'
import { SceneObject } from './scene'

export function allObjectsInRadius(
  center: SceneObject,
  radius: number
): readonly SceneObject[] {
  return getWorld()
    .scene.all()
    .filter(
      (obj) =>
        center !== obj &&
        distance(center.renderable.position, obj.renderable.position) < radius
    )
}
