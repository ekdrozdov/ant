import { AntBase, Scout } from './game/agent'
import { WorldBase } from './game/world'
import { PixiRenderer } from './renderer/pixi/pixiRenderer'
import { Renderable } from './renderer/renderable'
import { MenuRegistryBase, SpawnerSelector } from './ui/menu'

const world = new WorldBase({ size: { x: 500, y: 500 } })
const renderer = new PixiRenderer()
const menuRegistry = new MenuRegistryBase()
renderer.render(world, menuRegistry)
menuRegistry.register(new SpawnerSelector(renderer, world.scene))

// const bunny = new Bunny()
// world.scene.mount(bunny)
const ant = new AntBase(0)
const scout = new Scout(ant)
world.scene.mount(ant)

function setNextPos(r: Renderable, velocity: number, dt: number): void {
  const dx = velocity * dt * Math.cos(r.rotation)
  const dy = velocity * dt * Math.sin(r.rotation)
  r.position.x += dx
  r.position.y += dy
}

world.clock.on('tick', () => {
  scout.execute()
  setNextPos(ant.renderable, 5, 1)
})

world.clock.setFreq(1)
world.clock.resume()

export function getWorld() {
  return world
}
