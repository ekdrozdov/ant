import { type Agent, AntBase } from "./game/agent/agent";
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

const agents: Agent[] = [];
for (const _ of Array.from(new Array(5))) {
	const ant = new AntBase();
	const scout = new Scout(ant);
	ant.renderable.position = { x: 5000, y: 5000 };
	world.scene.mount(ant);
	agents.push(scout);
}

let i = 0;
// Limit fps with screen frequency rate.
// To keep 60 fps, loop execution should took no longer than 16.6 milliseconds.
world.clock.onTick(() => {
	if (i % 5 === 0) {
		for (const agent of agents) {
			agent.execute();
		}
	}
	world.scene.updateBatch(1);
	++i;
});

world.clock.setFreq(60);
world.clock.resume();
