import assert from "node:assert";
import { describe, it } from "node:test";
import {
	TaskGraphExecutor,
	type TaskNode,
	createPendingTaskResult,
	createTaskNode,
	createTaskResultFrom,
} from "./task";

/**
 * Test task graph:
 * ```
 *    +-----(after composite task)
 *    |                ^
 *    |                |  --------------+
 *    |           (subtask 3)           |
 *    |                ^                |
 *    |                |                | reusable
 *    |           (subtask 2)           | composite
 *    |                ^                | task
 *    |                |                |
 *    |           (subtask 1)           |
 *    |                ^  --------------+
 *    |                |
 *    |    (reusable composite task)
 *    |                ^
 *    |                |
 *    |    +--(many outputs task)
 *    |    |      ^
 *    v    v      |
 *   (multistep task) // initial task
 * ```
 */

function createResulableCompositeTask(executionScriptLog: string[]): {
	root: TaskNode<number, void>;
	terminal: TaskNode<unknown, number>;
} {
	// Composite task could initialize its own isolated context.
	const context = {
		executionStepsCount: 0,
	};

	const subtask1 = createTaskNode<number, void>((input) => {
		executionScriptLog.push("initializing subtask1");
		executionScriptLog.push(`subtask1 input: ${input}`);
		return () => {
			context.executionStepsCount++;
			return createTaskResultFrom(undefined);
		};
	});
	const subtask2 = createTaskNode<void, void>(() => {
		executionScriptLog.push("initializing subtask2");
		return () => {
			context.executionStepsCount++;
			return createTaskResultFrom(undefined);
		};
	});

	const subtask3 = createTaskNode<void, number>(() => {
		executionScriptLog.push("initializing subtask3");
		return () => {
			context.executionStepsCount++;
			executionScriptLog.push(
				`subtask3 output: ${context.executionStepsCount}`,
			);
			return createTaskResultFrom(context.executionStepsCount);
		};
	});

	subtask1.setNextTaskResolver((out) => subtask2.createTask(out));
	subtask2.setNextTaskResolver(() => subtask3.createTask());

	return {
		root: subtask1,
		terminal: subtask3,
	};
}

describe("task graph executor", () => {
	it("should execute each task until completion in order defined by task graph", () => {
		const context: {
			multistepTaskVisitCount: number;
			executionScriptLog: string[];
		} = {
			multistepTaskVisitCount: 0,
			executionScriptLog: [],
		};

		const terminateAfterMultistepCount = 3;

		const multistepTask = createTaskNode<void, void>(() => {
			context.executionScriptLog.push("initializing multistepTask");
			context.multistepTaskVisitCount++;
			let stepsLeft = 2;
			return () => {
				stepsLeft--;
				if (stepsLeft > 0) {
					return createPendingTaskResult();
				}
				return createTaskResultFrom(undefined);
			};
		});

		const manyOutputsTask = createTaskNode<number, "even" | "odd">((input) => {
			context.executionScriptLog.push("initializing manyOutsTask");
			let checkPhase = true;
			return () => {
				if (checkPhase) {
					checkPhase = false;
					return createPendingTaskResult();
				}
				return input % 2 === 0
					? createTaskResultFrom("even")
					: createTaskResultFrom("odd");
			};
		});

		const compositeTask = createResulableCompositeTask(
			context.executionScriptLog,
		);

		const afterCompositeTask = createTaskNode<number, void>((input) => {
			context.executionScriptLog.push("initializing afterCompositeTask");
			return () => {
				context.executionScriptLog.push(`afterCompositeTask input: ${input}`);
				return createTaskResultFrom(undefined);
			};
		});

		multistepTask.setNextTaskResolver(() => {
			return manyOutputsTask.createTask(context.multistepTaskVisitCount);
		});

		manyOutputsTask.setNextTaskResolver((output) => {
			return output === "even"
				? multistepTask.createTask()
				: compositeTask.root.createTask(2);
		});
		compositeTask.terminal.setNextTaskResolver((output) => {
			return afterCompositeTask.createTask(output);
		});

		afterCompositeTask.setNextTaskResolver(() => {
			return multistepTask.createTask();
		});

		const executor = new TaskGraphExecutor(multistepTask.createTask());

		while (context.multistepTaskVisitCount < terminateAfterMultistepCount) {
			executor.execute();
		}

		assert.deepStrictEqual(context.executionScriptLog, [
			"initializing multistepTask",
			"initializing manyOutsTask",
			"initializing subtask1",
			"subtask1 input: 2",
			"initializing subtask2",
			"initializing subtask3",
			"subtask3 output: 3",
			"initializing afterCompositeTask",
			"afterCompositeTask input: 3",
			"initializing multistepTask",
			"initializing manyOutsTask",
			"initializing multistepTask",
		]);
	});

	it("throws when task graph is not cyclic", () => {
		const orphanTask = createTaskNode<void, void>(() => {
			return () => {
				return createTaskResultFrom(undefined);
			};
		});
		const executor = new TaskGraphExecutor(orphanTask.createTask());
		assert.throws(
			() => {
				executor.execute();
			},
			{ message: "Next task resolver was not set." },
		);
	});
});
