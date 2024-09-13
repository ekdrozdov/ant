import { AntBase } from "./game/agent/agent";
import { Scout } from "./game/agent/ai/scout";
import { WorldBase, initWorld } from "./game/world";
import { PixiRenderer } from "./renderer/pixi/pixiRenderer";
import type { Renderable } from "./renderer/renderable";
import { MenuRegistryBase, SpawnerSelector } from "./ui/menu";

const world = new WorldBase({ size: { x: 500, y: 500 } });
initWorld(world);
const renderer = new PixiRenderer();
const menuRegistry = new MenuRegistryBase();
renderer.render(world, menuRegistry);
menuRegistry.register(new SpawnerSelector(renderer, world.scene));

for (const _ of Array.from(new Array(1))) {
	const ant = new AntBase();
	ant.rotate(Math.random());
	const scout = new Scout(ant);
	world.scene.mount(ant);

	let i = 0;
	world.clock.onTick(() => {
		// Execute agent script.
		++i % 10 === 0 && scout.execute();
		// Execute physics.
		if (ant.state === "move") {
			setNextPos(ant.renderable, 2, 1);
			// world.scene.reindex(ant);
		}
	});
}

function setNextPos(r: Renderable, velocity: number, dt: number): void {
	const dx = velocity * dt * Math.cos(r.rotation);
	const dy = velocity * dt * Math.sin(r.rotation);
	r.position.x += dx;
	r.position.y += dy;
}

world.clock.setFreq(30);
world.clock.resume();
