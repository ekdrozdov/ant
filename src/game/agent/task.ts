export interface TaskNode<Input = unknown, Output = unknown> {
	createTask(input: Input): Task<Output>;
	setNextTaskResolver(resolve: (output: Output) => Task<unknown>): void;
	// @internal
	resolveNextTask(output: Output): Task<unknown>;
}

interface PendingTaskResult {
	readonly status: "pending";
}

interface CompletedTaskResult<Output = unknown> {
	readonly status: "completed";
	output: Output;
}

export type TaskResult<Output> =
	| PendingTaskResult
	| CompletedTaskResult<Output>;

interface Task<Output> {
	readonly node: TaskNode<unknown, Output>;
	execute(): TaskResult<Output>;
}

export const pendingTaskResult: PendingTaskResult = {
	status: "pending",
} as const;

export function createTaskResultFrom<Output>(
	output: Output,
): CompletedTaskResult<Output> {
	return {
		status: "completed",
		output,
	};
}

export type TaskExecutor<Output> = () => TaskResult<Output>;

export type TaskExecutorFactory<Input, Output> = (
	input: Input,
) => TaskExecutor<Output>;

export type TaskGraph<RootInput, TerminalOutput> = {
	root: TaskNode<RootInput>;
	terminal: TaskNode<unknown, TerminalOutput>;
};

export function createTaskNode<Input, Output>(
	taskExecutorFactory: TaskExecutorFactory<Input, Output>,
): TaskNode<Input, Output> {
	return new TaskNodeImpl(taskExecutorFactory);
}

class TaskNodeImpl<Input, Output> implements TaskNode<Input, Output> {
	private _resolveNextTask?: (output: Output) => Task<unknown>;
	constructor(
		private readonly taskExecutorFactory: TaskExecutorFactory<Input, Output>,
	) {}
	createTask(input: Input): Task<Output> {
		const execute = this.taskExecutorFactory(input);
		return {
			node: this,
			execute: execute.bind(execute),
		};
	}
	setNextTaskResolver(resolve: (output: Output) => Task<unknown>): void {
		this._resolveNextTask = resolve;
	}
	// @internal
	resolveNextTask(output: Output): Task<unknown> {
		const resolveNextTask = this._resolveNextTask;
		if (!resolveNextTask) {
			throw new Error("Next task resolver was not set.");
		}
		return resolveNextTask(output);
	}
}

export class TaskGraphExecutor {
	private executable: Task<unknown>;
	constructor(initialTask: Task<unknown>) {
		this.executable = initialTask;
	}
	execute() {
		const result = this.executable.execute();
		if (result.status === "completed") {
			const output = result.output;
			const nextExecutable =
				// Output type compatibility is guaranteed by task chaining typing.
				this.executable.node.resolveNextTask(output);
			this.executable = nextExecutable;
		}
	}
}
