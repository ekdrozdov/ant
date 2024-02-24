import { RenderableBase, Renderable } from '../renderer/renderable'
import { SceneObjectBase } from './scene'

export const RESOURCES = {
  MATERIAL: 'MATERIAL',
  FOOD: 'FOOD',
  HOME: 'HOME',
} as const

export type ResourceTag = (typeof RESOURCES)[keyof typeof RESOURCES]

export class Tree extends SceneObjectBase {
  constructor() {
    super(new RenderableBase({ kind: 'tree' }))
  }
}

export interface Resource<T extends ResourceTag> {
  tag: T
}

export class ResourceBase<T extends ResourceTag>
  extends SceneObjectBase
  implements Resource<T>
{
  constructor(public tag: T, renderable: Renderable) {
    super(renderable)
  }
}

export class Food extends ResourceBase<typeof RESOURCES.FOOD> {
  constructor() {
    super(RESOURCES.FOOD, new RenderableBase({ kind: 'tree-source' }))
  }
}

// export class Material extends ResourceBase {
//   constructor() {
//     super(RESOURCES.MATERIAL, new RenderableBase({ kind: 'animal-source' }))
//   }
// }

// export class Home extends ResourceBase {
//   constructor() {
//     super(RESOURCES.MATERIAL, new RenderableBase({ kind: 'animal-source' }))
//   }
// }
