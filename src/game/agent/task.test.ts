import assert from "node:assert";
import { describe, it } from "node:test";
import { TaskGraphExecutor, type TaskNode, task } from "./task";

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

	const subtask1 = task(function* (input: number) {
		executionScriptLog.push("initializing subtask1");
		executionScriptLog.push(`subtask1 input: ${input}`);
		context.executionStepsCount++;
	});
	const subtask2 = task(function* () {
		executionScriptLog.push("initializing subtask2");
		context.executionStepsCount++;
	});

	const subtask3 = task<void, number>(function* () {
		executionScriptLog.push("initializing subtask3");
		context.executionStepsCount++;
		executionScriptLog.push(`subtask3 output: ${context.executionStepsCount}`);
		return context.executionStepsCount;
	});

	subtask1.next((out) => subtask2.start(out));
	subtask2.next(() => subtask3.start());

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

		const multistepTask = task(function* () {
			context.executionScriptLog.push("initializing multistepTask");
			context.multistepTaskVisitCount++;
			let stepsLeft = 2;
			stepsLeft--;
			if (stepsLeft > 0) {
				yield;
			}
		});

		const manyOutputsTask = task<number, "even" | "odd">(function* (input) {
			context.executionScriptLog.push("initializing manyOutsTask");
			return input % 2 === 0 ? "even" : "odd";
		});

		const compositeTask = createResulableCompositeTask(
			context.executionScriptLog,
		);

		const afterCompositeTask = task<number>(function* (input) {
			context.executionScriptLog.push("initializing afterCompositeTask");
			context.executionScriptLog.push(`afterCompositeTask input: ${input}`);
		});

		multistepTask.next(() => {
			return manyOutputsTask.start(context.multistepTaskVisitCount);
		});

		manyOutputsTask.next((output) => {
			return output === "even"
				? multistepTask.start()
				: compositeTask.root.start(2);
		});
		compositeTask.terminal.next((output) => {
			return afterCompositeTask.start(output);
		});

		afterCompositeTask.next(() => {
			return multistepTask.start();
		});

		const executor = new TaskGraphExecutor(multistepTask.start());

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
		const orphanTask = task(function* () {});
		const executor = new TaskGraphExecutor(orphanTask.start());
		assert.throws(
			() => {
				executor.execute();
			},
			{ message: "Next task resolver was not set." },
		);
	});
});
