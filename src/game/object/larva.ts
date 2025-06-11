import { RenderableBase } from "../../renderer/renderable";
import { Worker } from "../agent/worker";
import { config } from "../config";
import {
	type Scene,
	SceneObjectImpl,
	type StaticSceneObject,
} from "../scene/scene";
import { getWorld } from "../world";
import { AntGenericBody } from "./antBase";
import type { Building } from "./buildings";
import { FoodResource } from "./resource";

export class Larva extends SceneObjectImpl implements StaticSceneObject {
	readonly kind = "static";
	readonly role: "worker" | "queen" | "male" = "worker";
	readonly basicFoodResource = new FoodResource(100);
	readonly proteinFoodResource = new FoodResource(100);
	private ageMinutes = 0;

	constructor(
		readonly home: Building,
		readonly fertilized: boolean,
	) {
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

	onMount(scene: Scene): void {
		const clock = getWorld().clock;
		this.register(
			clock.onMinute(() => {
				// TODO: deplete proteins first and add score.
				this.basicFoodResource.amount -= config.larvaFoodDepletionPerMinute;
			}),
		);
		this.register(
			clock.onMinute(() => {
				if (this.basicFoodResource.amount < 0) {
					// TODO: add a larva corpse.
					console.debug("larva dies of starvation");
					scene.dismountAndDispose(this);
				}
			}),
		);
		this.register(
			clock.onMinute(() => {
				const dtMinutes = 1;
				this.develop(dtMinutes);
			}),
		);
	}

	develop(dtMinutes: number) {
		// Stage completed -> hatch.
		if (this.ageMinutes > config.larvaLifetimeMinutes && Math.random() > 0.5) {
			getWorld().scene.dismountAndDispose(this);
			// TODO: add pupa stage.
			// TODO: spawn male if unfertilized.
			console.debug("spawning ant");
			const ant = new AntGenericBody(this.home);
			// pick a role
			ant.agent = new Worker(ant);
			ant.renderable.position = this.renderable.position;
			getWorld().scene.mount(ant);
			return;
		}

		this.ageMinutes += dtMinutes;
	}
}
