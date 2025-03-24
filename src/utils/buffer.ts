export class OrderedCircularBuffer<T> {
	private i = 0;
	private buffer: T[];

	constructor(
		private readonly size: number,
		initItem: T,
	) {
		this.buffer = Array(size);
		this.resetWith(initItem);
	}

	push(item: T) {
    this.buffer[this.i] = item;
		this.i = (this.i + 1) % this.size;
	}

	read(): readonly T[] {
		return [
			...this.buffer.slice(this.i, this.buffer.length),
			...this.buffer.slice(0, this.i),
		];
	}

	resetWith(initItem: T) {
		for (let index = 0; index < this.buffer.length; index++) {
			this.buffer[index] = initItem;
		}
	}
}
