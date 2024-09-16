import { AntBase } from "./game/agent/agent";
import { Scout } from "./game/agent/ai/scout";
import { WorldBase, initWorld } from "./game/world";
import { PixiRenderer } from "./renderer/pixi/pixiRenderer";
import type {} from "./renderer/renderable";
import { MenuRegistryBase, SpawnerSelector } from "./ui/menu";

const world = new WorldBase({ size: { x: 10000, y: 10000 } });
initWorld(world);
const renderer = new PixiRenderer();
const menuRegistry = new MenuRegistryBase();
renderer.render(world, menuRegistry);
menuRegistry.register(new SpawnerSelector(renderer, world.scene));

for (const _ of Array.from(new Array(1))) {
	const ant = new AntBase();
	const scout = new Scout(ant);
	ant.renderable.position = { x: 5000, y: 5000 };
	world.scene.mount(ant);

	world.clock.onTick(() => {
		// Execute agent script.
		scout.execute();
		world.scene.updateBatch(1);
	});
}

world.clock.setFreq(30);
world.clock.resume();
