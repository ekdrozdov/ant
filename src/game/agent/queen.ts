import type { SettledQueenBody } from "../object/queen";
import type { Agent } from "./agent";
import { TaskGraphExecutor, task } from "./task/task";

function* reproduce(input: { queen: SettledQueenBody }): Generator<void, void> {
	const { queen } = input;
	while (true) {
		if (Math.random() < 0.2) {
			queen.spawn();
		}
		yield;
	}
	// more food -> more birth

	// requests:
	// food (high protein)
	// tend
	// defense

	// emit pheromones:
	// queen's inhibitors (may inhibit development of new queens from eggs)
	// queen's inhibitors (may inhibit workers to feed eggs proteins needed for new queens development)
	//  less when breeding season
	//  less when food abundance (more energy spend of eggs spawning less energy for inhibitors)
	//  when too many eggs and colony is too big, ingibitor pheromones budget isn't enough to cover all of them
	// queen.
}

export class QueenAgent implements Agent {
	private readonly executor: TaskGraphExecutor;
	constructor(queen: SettledQueenBody) {
		// tasks:
		// eat
		// reproduction
		const reproduceTask = task(reproduce);
		this.executor = new TaskGraphExecutor(reproduceTask.start({ queen }));
	}

	execute(): void {
		this.executor.execute();
	}
}
