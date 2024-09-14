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

		it("index is left-inlcuding", () => {
			const step = 1;
			const indexer = new SceneIndexer(step, { x: 10, y: 10 });
			const center: Vector2d = { x: 5.5, y: 5.5 };
			const position: Vector2d = { x: 4, y: center.y };
			const renderable = new RenderableBase({ position });
			const obj = new SceneObjectBase(renderable);
			indexer.register(obj);

			const objs = indexer.allInRadius(center, step);
			assert.equal(objs.includes(obj), true);
		});

		it("index is right-excluding", () => {
			const step = 1;
			const indexer = new SceneIndexer(step, { x: 10, y: 10 });
			const center: Vector2d = { x: 5.5, y: 5.5 };
			const position: Vector2d = { x: 7, y: center.y };
			const renderable = new RenderableBase({ position });
			const obj = new SceneObjectBase(renderable);
			indexer.register(obj);

			const objs = indexer.allInRadius(center, step);
			assert.equal(objs.includes(obj), false);
		});

		it("index is top-including", () => {
			const step = 1;
			const indexer = new SceneIndexer(step, { x: 10, y: 10 });
			const center: Vector2d = { x: 5.5, y: 5.5 };
			const position: Vector2d = { x: center.x, y: 4 };
			const renderable = new RenderableBase({ position });
			const obj = new SceneObjectBase(renderable);
			indexer.register(obj);

			const objs = indexer.allInRadius(center, step);
			assert.equal(objs.includes(obj), true);
		});

		it("index is bottom-excluding", () => {
			const step = 1;
			const indexer = new SceneIndexer(step, { x: 10, y: 10 });
			const center: Vector2d = { x: 5.5, y: 5.5 };
			const position: Vector2d = { x: center.x, y: 7 };
			const renderable = new RenderableBase({ position });
			const obj = new SceneObjectBase(renderable);
			indexer.register(obj);

			const objs = indexer.allInRadius(center, step);
			assert.equal(objs.includes(obj), false);
		});
	});

	describe("notifyPositionUpdate", () => {
		it("finds obj when obj stays in radius", () => {
			const step = 1;
			const indexer = new SceneIndexer(step, { x: 10, y: 10 });
			const center: Vector2d = { x: 5.5, y: 5.5 };
			const initPosition: Vector2d = center;
			const renderable = new RenderableBase({ position: initPosition });
			const obj = new SceneObjectBase(renderable);
			indexer.register(obj);

			assert.equal(indexer.allInRadius(center, step).includes(obj), true);

			const newPos: Vector2d = {
				x: initPosition.x + step,
				y: initPosition.y + step,
			};
			obj.renderable.position = newPos;
			indexer.notifyPositionUpdate(obj, initPosition);
			assert.equal(indexer.allInRadius(center, step).includes(obj), true);
		});

		it("not finds obj when obj leaves the radius", () => {
			const step = 1;
			const indexer = new SceneIndexer(step, { x: 10, y: 10 });
			const center: Vector2d = { x: 5.5, y: 5.5 };
			const initPosition: Vector2d = center;
			const renderable = new RenderableBase({ position: initPosition });
			const obj = new SceneObjectBase(renderable);
			indexer.register(obj);

			assert.equal(indexer.allInRadius(center, step).includes(obj), true);

			const newPos: Vector2d = {
				x: initPosition.x + step * 2,
				y: initPosition.y + step * 2,
			};
			obj.renderable.position = newPos;
			indexer.notifyPositionUpdate(obj, initPosition);
			assert.equal(indexer.allInRadius(center, step).includes(obj), false);
		});
	});
});
