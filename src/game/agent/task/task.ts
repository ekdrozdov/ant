export interface TaskNode<Input = unknown, Output = unknown> {
	start(input: Input): Task<Output>;
	next(resolve: (output: Output) => Task<unknown>): void;
	next(
		task:
			| { start: (input: Output) => Task<unknown> }
			| { start: () => Task<unknown> },
	): void;
}

interface Internal_TaskNode<Input = unknown, Output = unknown>
	extends TaskNode<Input, Output> {
	resolveNextTask(output: Output): Task<unknown>;
}

// TODO: add task decorators to improve reuse of tasks:
// when defined the decorator is executed within a task on certain input.
// Decorators should be like lifecycle hooks:
// beforeStarted(in), afterCompleted(out), beforeContinue(ctx)
interface Task<Output> {
	readonly node: TaskNode<unknown, Output>;
	readonly executor: IterableIterator<void, Output>;
}

export type TaskGraph<RootInput, TerminalOutput> = {
	root: TaskNode<RootInput>;
	terminal: TaskNode<unknown, TerminalOutput>;
};

type TaskExecutorFactory<Input, Output> = (
	input: Input,
) => IterableIterator<void, Output>;

export function task<Input = void, Output = void>(
	createTaskExecutor: TaskExecutorFactory<Input, Output>,
): TaskNode<Input, Output> {
	return new TaskNodeImpl(createTaskExecutor);
}

class TaskNodeImpl<Input, Output> implements TaskNode<Input, Output> {
	private _resolveNextTask?: (output: Output) => Task<unknown>;
	constructor(
		private readonly createTaskExecutor: TaskExecutorFactory<Input, Output>,
	) {}
	start(input: Input): Task<Output> {
		const executor = this.createTaskExecutor(input);
		return {
			node: this,
			executor,
		};
	}
	next(
		task:
			| { start: (input: Output) => Task<unknown> }
			| { start: () => Task<unknown> },
	): void;
	next(resolve: (output: Output) => Task<unknown>): void;
	next(
		taskOrResolver:
			| { start: (input: Output) => Task<unknown> }
			| { start: () => Task<unknown> }
			| ((output: Output) => Task<unknown>),
	): void {
		if (this._resolveNextTask) {
			throw new Error("Next task is already assigned.");
		}
		if ("start" in taskOrResolver) {
			this._resolveNextTask = (output) => taskOrResolver.start(output);
			return;
		}
		this._resolveNextTask = taskOrResolver;
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
		const result = this.executable.executor.next();
		if (result.done) {
			const output = result.value;
			const nextExecutable =
				// Output type compatibility is guaranteed by task chaining typing.
				(this.executable.node as Internal_TaskNode).resolveNextTask(output);
			this.executable = nextExecutable;
		}
	}
}
