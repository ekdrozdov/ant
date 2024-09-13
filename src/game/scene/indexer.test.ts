import assert from "node:assert";
import { describe, it } from "node:test";
import { RenderableBase, type Vector2d } from "../../renderer/renderable";
import { SceneIndexer } from "./indexer";
import { SceneObjectBase } from "./scene";

describe("Indexer", () => {
	describe("register", () => {
		it("contains registered obj ", () => {
			const indexer = new SceneIndexer(1, { x: 10, y: 10 });
			const renderable = new RenderableBase({ position: { x: 5, y: 5 } });
			const obj = new SceneObjectBase(renderable);
			indexer.register(obj);

			const objs = indexer.allInRadius(renderable.position, 1);
			assert.equal(
				objs.find((o) => o === obj),
				obj,
			);
		});

		it("does not contain non registered obj ", () => {
			const indexer = new SceneIndexer(1, { x: 10, y: 10 });
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

	describe("unregister", () => {
		it("does not contain unregistered obj", () => {
			const indexer = new SceneIndexer(1, { x: 10, y: 10 });
			const renderable = new RenderableBase({ position: { x: 5, y: 5 } });
			const obj = new SceneObjectBase(renderable);
			indexer.register(obj);
			indexer.unregister(obj);

			const objs = indexer.allInRadius(renderable.position, 1);
			assert.equal(
				objs.find((o) => o === obj),
				undefined,
			);
		});
	});

	describe("allInRadius", () => {
		it("finds objects only in radius", () => {
			const indexer = new SceneIndexer(1, { x: 10, y: 10 });
			const center: Vector2d = { x: 5, y: 5 };
			const radius = 1;
			const halfRadius = radius / 2;

			const objAtTop = new SceneObjectBase(
				new RenderableBase({
					position: { x: center.x, y: center.y + halfRadius },
				}),
			);
			const objAtRight = new SceneObjectBase(
				new RenderableBase({
					position: { x: center.x + halfRadius, y: center.y },
				}),
			);
			const objAtBottom = new SceneObjectBase(
				new RenderableBase({
					position: { x: center.x, y: center.y - halfRadius },
				}),
			);
			const objAtLeft = new SceneObjectBase(
				new RenderableBase({
					position: { x: center.x - halfRadius, y: center.y },
				}),
			);
			const objAtTopRight = new SceneObjectBase(
				new RenderableBase({
					position: { x: center.x + halfRadius, y: center.y + halfRadius },
				}),
			);
			const objAtBottomLeft = new SceneObjectBase(
				new RenderableBase({
					position: { x: center.x - halfRadius, y: center.y - halfRadius },
				}),
			);
			const objOutside = new SceneObjectBase(
				new RenderableBase({
					position: { x: center.x + radius * 2, y: center.y + radius * 2 },
				}),
			);
			const objsWithin = [
				objAtBottom,
				objAtBottomLeft,
				objAtLeft,
				objAtRight,
				objAtTop,
				objAtTopRight,
			];
			for (const obj of objsWithin) {
				indexer.register(obj);
			}
			indexer.register(objOutside);
			const foundObjs = indexer.allInRadius(center, radius);
			for (const obj of objsWithin) {
				assert.equal(foundObjs.includes(obj), true);
			}
			assert.equal(foundObjs.includes(objOutside), false);
		});

		it("respects indexing step", () => {});

		it("index is left-inlcuding", () => {});

		it("index is right-excluding", () => {});
	});

	describe("notifyPositionUpdate", () => {
		it("finds obj when obj stays in radius", () => {});

		it("not finds obj when obj leaves the radius", () => {});
	});
});
