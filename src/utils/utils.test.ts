import assert from "node:assert";
import { describe, it } from "node:test";
import { OrderedCircularBuffer } from "./buffer";

describe("OrderedCircularBuffer", () => {
	it("returns items in order of insertion", () => {
		const size = 3;
		const initItem = 0;
		const buffer = new OrderedCircularBuffer<number>(size, initItem);

		const initContent = buffer.read();
		const initContentExpected = [0, 0, 0];
		assert.strictEqual(initContent.length, initContentExpected.length);
		for (let i = 0; i < initContent.length; ++i) {
			assert.strictEqual(initContent[i], initContentExpected[i]);
		}

		buffer.push(1);
		const onePushedContent = buffer.read();
		const onePushContentExpected = [0, 0, 1];
		assert.strictEqual(onePushedContent.length, onePushContentExpected.length);
		for (let i = 0; i < onePushedContent.length; ++i) {
			assert.strictEqual(onePushedContent[i], onePushContentExpected[i]);
		}

		buffer.push(2);
		const twoPushedContent = buffer.read();
		const twoPushContentExpected = [0, 1, 2];
		assert.strictEqual(twoPushedContent.length, twoPushContentExpected.length);
		for (let i = 0; i < twoPushedContent.length; ++i) {
			assert.strictEqual(twoPushContentExpected[i], twoPushContentExpected[i]);
		}

		buffer.push(3);
		const threePushedContent = buffer.read();
		const threePushContentExpected = [1, 2, 3];
		assert.strictEqual(
			threePushedContent.length,
			threePushContentExpected.length,
		);
		for (let i = 0; i < threePushedContent.length; ++i) {
			assert.strictEqual(threePushedContent[i], threePushContentExpected[i]);
		}

		buffer.push(4);
		const fourPushedContent = buffer.read();
		const fourPushContentExpected = [2, 3, 4];
		assert.strictEqual(
			fourPushedContent.length,
			fourPushContentExpected.length,
		);
		for (let i = 0; i < fourPushedContent.length; ++i) {
			assert.strictEqual(fourPushedContent[i], fourPushContentExpected[i]);
		}

		buffer.push(5);
		const fivePushedContent = buffer.read();
		const fivePushContentExpected = [3, 4, 5];
		assert.strictEqual(
			fivePushedContent.length,
			fivePushContentExpected.length,
		);
		for (let i = 0; i < fivePushedContent.length; ++i) {
			assert.strictEqual(fivePushedContent[i], fivePushContentExpected[i]);
		}

		buffer.resetWith(10);
		const resetContent = buffer.read();
		const resetContentExpected = [10, 10, 10];
		assert.strictEqual(resetContent.length, resetContentExpected.length);
		for (let i = 0; i < resetContent.length; ++i) {
			assert.strictEqual(resetContent[i], resetContentExpected[i]);
		}

		buffer.push(11);
		const elevenPushedContent = buffer.read();
		const elevenPushContentExpected = [10, 10, 11];
		assert.strictEqual(
			elevenPushedContent.length,
			elevenPushContentExpected.length,
		);
		for (let i = 0; i < elevenPushedContent.length; ++i) {
			assert.strictEqual(elevenPushedContent[i], elevenPushContentExpected[i]);
		}

		buffer.push(12);
		const twelvePushedContent = buffer.read();
		const twelvePushContentExpected = [10, 11, 12];
		assert.strictEqual(
			twelvePushedContent.length,
			twelvePushContentExpected.length,
		);
		for (let i = 0; i < twelvePushedContent.length; ++i) {
			assert.strictEqual(twelvePushedContent[i], twelvePushContentExpected[i]);
		}
	});
});
