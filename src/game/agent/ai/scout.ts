import { Agent, Ant, NOISE_ROTATION, isFood, isMark } from "../agent";

import { PI } from "../../../utils/math";
import { Food } from "../../resource";

export class Scout implements Agent {
	private traceTarget: "trace" | "restart" | "backtrace" = "trace";
	execute: () => void;
	constructor(private readonly ant: Ant) {
		console.debug(`${this.ant.id} executing scan`);
		this.execute = this.scan;
	}
	private scan() {
		this.ant.mark();
		Math.random() < 0.1 && this.ant.rotate(NOISE_ROTATION);
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
				this.traceTarget = "backtrace";
				console.debug(`${this.ant.id} executing backtrace`);
				this.execute = this.trace;
			}
		};
	}
	private trace() {
		this.ant.move();
		if (this.traceTarget === "backtrace") {
			this.ant.mark(true);
		}
		const mark = this.ant
			.getVisibleObjectsInfront()
			.filter(isMark)
			.find((mark) => mark.id === this.ant.id);
		if (!mark) {
			switch (this.traceTarget) {
				case "trace":
					if (this.ant.getVisibleObjects().find(isFood) === undefined) {
						this.ant.rotate(PI);
						console.debug(`${this.ant.id} executing restart`);
						this.traceTarget = "restart";
						return;
					} else {
						this.ant.rotate(PI);
						console.debug(`${this.ant.id} executing backtrace`);
						this.traceTarget = "backtrace";
						return;
					}
				case "backtrace":
					this.ant.rotate(PI);
					console.debug(`${this.ant.id} executing trace`);
					this.traceTarget = "trace";
					return;
				case "restart":
					this.execute = this.scan;
					return;
				default:
					const e: never = this.traceTarget;
					throw new Error(`Unknown switch key ${e}`);
			}
		}
		this.ant.face(mark.renderable.position);
	}
}

// interface Fsa { execute }
// class FsaBase { registerState }
