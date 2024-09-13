import assert from "node:assert";
import { describe, it } from "node:test";
import { RenderableBase } from "../../renderer/renderable";
import { LazyIndexer } from "./indexer";
import { SceneObjectBase } from "./scene";

describe("Indexer", () => {
	describe("register", () => {
		it("contains registered obj ", () => {
			const indexer = new LazyIndexer(1, { x: 10, y: 10 });
			const renderable = new RenderableBase({ position: { x: 5, y: 5 } });
			const obj = new SceneObjectBase(renderable);
			indexer.register(obj);

			const objs = indexer.allInRadius(renderable.position, 1);
			assert.equal(
				objs.find((o) => o === obj),
				obj,
			);
		});
		it("not contains unregistered obj ", () => {
			const indexer = new LazyIndexer(1, { x: 10, y: 10 });
			const renderable = new RenderableBase({ position: { x: 5, y: 5 } });
			const registeredObj = new SceneObjectBase(renderable);
			indexer.register(registeredObj);

			const unregisteredObj = new SceneObjectBase(new RenderableBase());

			const objs = indexer.allInRadius(renderable.position, 1);
			assert.equal(
				objs.find((o) => o === unregisteredObj),
				undefined,
			);
		});
	});
});
