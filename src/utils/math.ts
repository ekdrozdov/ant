import { Point } from '../renderer/renderable'

export function crop(target: number, absLimit: number) {
  if (target < 0) {
    return Math.max(target, -absLimit)
  }
  return Math.min(target, absLimit)
}

export function distance(source: Point, target: Point) {
  return Math.abs(source.x - target.x) + Math.abs(source.y - target.y)
}
