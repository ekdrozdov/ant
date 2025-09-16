import { Scout } from "./game/agent/scout";
import { Worker } from "./game/agent/worker";
import { AntGenericBody } from "./game/object/antBase";
import { LivingChamber } from "./game/object/buildings";
import { WorldBase, initWorld } from "./game/world";
import { PixiRenderer } from "./renderer/pixi/pixiRenderer";
import type {} from "./renderer/renderable";
import { MenuRegistryBase, SpawnerSelector } from "./ui/menu";

(async () => {
	const world = new WorldBase({ size: { x: 10000, y: 10000 } });
	initWorld(world);
	world.clock.onHour(() => console.debug("next hour started"));
	world.clock.onDay(() => console.debug("next day started"));
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

	// const queen = new SettledQueenBodyImpl(chamber);
	// queen.renderable.position = {
	// 	x: chamber.renderable.position.x,
	// 	y: chamber.renderable.position.y,
	// };
	// queen.agent = new QueenAgent(queen);
	// // queen.
	// world.scene.mount(queen);

	const scout = new AntGenericBody(chamber);
	scout.renderable.position = {
		x: chamber.renderable.position.x,
		y: chamber.renderable.position.y,
	};
	scout.agent = new Scout(scout);
	world.scene.mount(scout);

	const worker = new AntGenericBody(chamber);
	worker.renderable.position = {
		x: chamber.renderable.position.x,
		y: chamber.renderable.position.y,
	};
	worker.agent = new Worker(worker);
	world.scene.mount(worker);

	// Limit fps with screen frequency rate.
	// To keep 60 fps, loop execution should took no longer than 16.6 milliseconds.
	world.clock.onSecond(() => {
		world.scene.updateBatch(1);
	});

	world.clock.setFreq(60);
	// world.clock.resume();
})();
