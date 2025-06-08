import { agentRegistry } from "./game/agent/agent";
import { QueenAgent } from "./game/agent/queen";
import { Scout } from "./game/agent/scout";
import { Worker } from "./game/agent/worker";
import { AntBase } from "./game/object/antBase";
import { LivingChamber } from "./game/object/buildings";
import { QueenImpl } from "./game/object/queen";
import { WorldBase, initWorld } from "./game/world";
import { PixiRenderer } from "./renderer/pixi/pixiRenderer";
import type {} from "./renderer/renderable";
import { MenuRegistryBase, SpawnerSelector } from "./ui/menu";

(async () => {
	const world = new WorldBase({ size: { x: 10000, y: 10000 } });
	initWorld(world);
	const renderer = new PixiRenderer();
	await renderer.init();
	const menuRegistry = new MenuRegistryBase();
	renderer.watchAndRender(world, menuRegistry);
	menuRegistry.register(new SpawnerSelector(renderer, world.scene));

	const chamber = new LivingChamber();
	chamber.renderable.position = { x: 5010, y: 5010 };
	// TODO: objects nesting with position relative to parent,
	// absolute position updated automatically.
	chamber.storage.renderable.position = chamber.renderable.position;
	chamber.storage.food.amount = 500;
	world.scene.mount(chamber);
	// TODO: also nested objects must be mounted/dismounted recursively.
	world.scene.mount(chamber.storage);

	for (const _ of Array.from(new Array(1))) {
		const ant = new AntBase(chamber);
		const scout = new Scout(ant);
		ant.resetPositionTo({ x: 5000, y: 5000 });
		world.scene.mount(ant);
		agentRegistry.register(scout);
		ant.onDead(() => {
			agentRegistry.unregister(scout);
			world.scene.dismount(ant);
		});
	}

	for (const _ of Array.from(new Array(1))) {
		const ant = new AntBase(chamber);
		const worker = new Worker(ant);
		ant.resetPositionTo({ x: 5000, y: 5000 });
		world.scene.mount(ant);
		agentRegistry.register(worker);
		// let the body manage its agent obj lifecycle
		ant.onDead(() => {
			agentRegistry.unregister(worker);
			world.scene.dismount(ant);
		});
	}

	const queen = new QueenImpl(chamber);
	queen.renderable.position = {
		x: chamber.renderable.position.x,
		y: chamber.renderable.position.y,
	};
	const queenAgent = new QueenAgent(queen);
	world.scene.mount(queen);
	agentRegistry.register(queenAgent);

	let i = 0;
	// Limit fps with screen frequency rate.
	// To keep 60 fps, loop execution should took no longer than 16.6 milliseconds.
	world.clock.onSecond(() => {
		if (i % 5 === 0) {
			for (const agent of agentRegistry.agents) {
				agent.execute();
			}
		}
		world.scene.updateBatch(1);
		++i;
	});

	world.clock.setFreq(60);
	// world.clock.resume();
})();
