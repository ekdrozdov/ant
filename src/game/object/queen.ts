import { RenderableBase } from "../../renderer/renderable";
import type { Agent, Body } from "../agent/agent";
import { config } from "../config";
import {
	type Scene,
	SceneObjectImpl,
	type StaticSceneObject,
} from "../scene/scene";
import { getWorld } from "../world";
import type { Building } from "./buildings";
import { Egg } from "./egg";
import { FoodResource } from "./resource";

// todo: inherit props like age, food etc. from ant.
export interface WingedQueenBody extends Body {
	fly(): void;
	move(): void;
	breed(): void;
	settle(): void;
}

export interface SettledQueenBody extends Body {
	spawn(): void;
	eat(): void;
}

// TODO: should extend antbase.
export class SettledQueenBodyImpl
	extends SceneObjectImpl
	implements StaticSceneObject, SettledQueenBody
{
	readonly kind = "static";
	private age = 0;
	private food = new FoodResource(10);
	private scene!: Scene;
	agent?: Agent;

	constructor(readonly home: Building) {
		super(new RenderableBase({ kind: "bunny" }));
	}

	onMount(scene: Scene): void {
		this.scene = scene;
		this.register(
			getWorld().clock.onMinute(() => {
				this.food.amount -= config.antFoodDepletionPerMinute;
				console.debug(`queen food ${this.food.amount}`);
				if (this.food.amount <= 0) {
					console.debug("queen dies of starvation");
					scene.dismountAndDispose(this);
					// todo: dispose related agent
				}
			}),
		);
	}

	spawn() {
		// todo: add males spawn
		console.log("spawning Egg");
		const fertilized = Math.random() < 0.1;
		const egg = new Egg(this.home, fertilized);
		egg.renderable.position = {
			x: this.renderable.position.x,
			y: this.renderable.position.y,
		};
		this.scene.mount(egg);
	}

	eat() {
		// todo
	}
}
