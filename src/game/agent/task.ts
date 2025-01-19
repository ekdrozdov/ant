interface TaskNode<Input, Output> {
	createTask(input: Input): Task<Output>;
	chain(factory: (output: Output) => Task<unknown>): void;
	resolveNextExecutable(output: Output): Task<unknown>;
}

interface PendingTaskResult {
	status: "pending";
}

interface CompletedTaskResult<Output = unknown> {
	status: "completed";
	output: Output;
}

type TaskResult<Output> = PendingTaskResult | CompletedTaskResult<Output>;

type TaskExecutor<Output> = () => TaskResult<Output>;

interface Task<Output> {
	readonly node: TaskNode<unknown, Output>;
	execute(): TaskResult<Output>;
}

export const pendingTaskResult: PendingTaskResult = {
	status: "pending",
} as const;

export function taskResultFrom<Output>(
	output: Output,
): CompletedTaskResult<Output> {
	return {
		status: "completed",
		output,
	};
}

export type TaskExecutorFactory<Input, Output> = (
	input: Input,
) => TaskExecutor<Output>;

export function createTaskNode<Input, Output>(
	taskExecutorFactory: TaskExecutorFactory<Input, Output>,
): TaskNode<Input, Output> {
	return new TaskNodeImpl(taskExecutorFactory);
}

class TaskNodeImpl<Input, Output> implements TaskNode<Input, Output> {
	private chainedTaskFactory?: (output: Output) => Task<unknown>;
	constructor(
		private readonly taskExecutorFactory: TaskExecutorFactory<Input, Output>,
	) {}
	resolveNextExecutable(output: Output): Task<unknown> {
		const factory = this.chainedTaskFactory;
		if (!factory) {
			throw new Error("No task was chained");
		}
		return factory(output);
	}
	createTask(input: Input): Task<Output> {
		const execute = this.taskExecutorFactory(input);
		return {
			node: this,
			execute: execute.bind(execute),
		};
	}
	chain(factory: (output: Output) => Task<unknown>): void {
		this.chainedTaskFactory = factory;
	}
}

export class TaskGraphExecutor<Input> {
	private executable: Task<unknown>;
	constructor(initialNode: TaskNode<Input, unknown>, input: Input) {
		this.executable = initialNode.createTask(input);
	}
	execute() {
		const result = this.executable.execute();
		if (result.status === "completed") {
			const output = result.output;
			const nextExecutable =
				// Output type compatibility is guaranteed by task chaining typing.
				this.executable.node.resolveNextExecutable(output);
			this.executable = nextExecutable;
		}
	}
}

// interface Path {
// 	path: number[];
// }

// const path = {} as Path;
// let food = 3;

// const resolve = {} as TaskNode<{ food: "food" }, { food: "food" }>;
// const lookup = {} as TaskNode<void, { food: "food" | undefined }>;
// const assertLimit = {} as TaskNode<Path, boolean>;
// const extend = {} as TaskNode<Path, void>;
// const toStart = {} as TaskNode<Path, void>;
// const eatAtHome = {} as TaskNode<Path, void>;

// lookup.chain((res) => {
// 	const food = res.food;
// 	if (food === "food") {
// 		return resolve.createTask({ food });
// 	}
// 	return assertLimit.createTask(path);
// });

// assertLimit.chain((res) => {
// 	return res ? toStart.createTask(path) : extend.createTask(path);
// });

// extend.chain(() => {
// 	food--;
// 	if (food < 30) {
// 		return eatAtHome.createTask(path);
// 	}
// 	return lookup.createTask();
// });
