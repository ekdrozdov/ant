import { RenderableBase } from "../../renderer/renderable";
import { agentRegistry } from "../agent/agent";
import { Worker } from "../agent/worker";
import { config } from "../config";
import { SceneObjectImpl, type StaticSceneObject } from "../scene/scene";
import { getWorld } from "../world";
import { AntBase } from "./antBase";
import type { Building } from "./buildings";
import { FoodResource } from "./resource";

export class Larva extends SceneObjectImpl implements StaticSceneObject {
	readonly kind = "static";
	readonly role: "worker" | "queen" | "male" = "worker";
	readonly basicFoodResource = new FoodResource(config.larvaFoodInitAmount);
	readonly proteinFoodResource = new FoodResource(0);
	private ageDays = 0;

	constructor(
		readonly home: Building,
		readonly fertilized: boolean,
	) {
		console.debug("Creating larva");
		super(new RenderableBase({ kind: "mark" }));
		// tasks
		// emit pheromones to ask for feed

		// discriminate weak and strong (small/big) larvas (strong have feeding priority)
		// more protein food -> more size -> higher chance to recieve more protein food
		// small larvas likely to become workers and recieve carbohydrate food
		// workers ignore queen inhibitors when food is abundant

		// when it is too early before mating season -> queens will be decomposed to food
		// when mating season is near (workers feel it by temperature and day lenght) -> workers slow down feeding to slow down the newborn queen metabolism

		// JH - juvenile hormone
	}

	onMount(): void {
		this.register(
			getWorld().clock.onDay(() => {
				const dtDays = 1;
				this.develop(dtDays);
			}),
		);
		this.register(
			getWorld().clock.onMinute(() => {
				// TODO: deplete proteins first and add score.
				this.basicFoodResource.amount -= config.larvaFoodDepletionPerMinute;
			}),
		);
	}

	develop(dtDays: number) {
		if (this.basicFoodResource.amount < 0) {
			// TODO: add a larva corpse.
			getWorld().scene.dismount(this);
		}

		// Stage completed -> hatch.
		if (this.ageDays > config.larvaLifetimeDays && Math.random() > 0.5) {
			getWorld().scene.dismount(this);
			// TODO: add pupa stage.
			// TODO: spawn male if unfertilized.
			const ant = new AntBase(this.home);
			// pick a role
			const worker = new Worker(ant);
			// TODO: who manages it? ant obj should.
			agentRegistry.register(worker)
			ant.renderable.position = this.renderable.position;
			getWorld().scene.mount(ant);
			return;
		}

		this.ageDays += dtDays;
	}
}
