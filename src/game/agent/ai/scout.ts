import { type Agent, type Ant, NOISE_ROTATION, isFood, isMark } from "../agent";

import { PI } from "../../../utils/math";
import { isBuilding } from "../../buildings";
import type { Food } from "../../resource";

export class Scout implements Agent {
	private patrolTarget: "food" | "home" = "food";
	execute: () => void;
	constructor(private readonly ant: Ant) {
		console.debug(`${this.ant.id} executing scan`);
		this.execute = this.goHome;
	}
	private scan() {
		this.ant.mark();
		Math.random() < 0.1 &&
			this.ant.rotate(Math.sign(Math.random() - 0.5) * NOISE_ROTATION);
		this.ant.move();
		const food = this.ant.getVisibleObjects().filter(isFood);
		if (food.length > 0) {
			this.execute = this.connect(food[0]);
		}
	}
	private connect(food: Food) {
		let distance = this.ant.distanceTo(food);
		this.ant.face(food.renderable.position);
		this.ant.move();
		return () => {
			const newDistance = this.ant.distanceTo(food);
			if (newDistance < distance) {
				this.ant.mark();
				distance = newDistance;
			} else {
				this.ant.rotate(Math.PI);
				this.patrolTarget = "home";
				console.debug(`${this.ant.id} executing patrol`);
				this.execute = this.patrol;
			}
		};
	}
	private patrol() {
		this.ant.move();
		if (this.patrolTarget === "home") {
			this.ant.mark(true);
		}
		const mark = this.ant
			.getVisibleObjectsInfront()
			.filter(isMark)
			.find((mark) => mark.id === this.ant.id);
		if (!mark) {
			switch (this.patrolTarget) {
				case "food":
					if (this.ant.getVisibleObjects().find(isFood) === undefined) {
						console.debug(`${this.ant.id} lost food, executing goHome`);
						this.execute = this.goHome;
						return;
					}
					this.ant.rotate(PI);
					this.patrolTarget = "home";
					console.debug(
						`${this.ant.id} executing patrol to home`,
					);
					return;
				case "home":
					this.ant.rotate(PI);
					this.patrolTarget = "food";
					console.debug(
						`${this.ant.id} executing patrol to food`,
					);
					return;
				default: {
					const e: never = this.patrolTarget;
					throw new Error(`Unknown switch key ${e}`);
				}
			}
		}
		this.ant.face(mark.renderable.position);
	}
	private goHome() {
		this.ant.mark();
		Math.random() < 0.1 &&
			this.ant.rotate(Math.sign(Math.random() - 0.5) * NOISE_ROTATION);
		this.ant.move();
		const home = this.ant
			.getVisibleObjects()
			.filter(isBuilding)
			.find((b) => b === this.ant.home);
		// Home found -> restart working loop.
		if (home) {
			this.execute = this.scan;
		}
	}
}
