import type { Disposable } from "./lifecycle";

export type Event<T = void> = (listener: (event: T) => void) => Disposable;

export class EventEmitter<T = void> {
	private readonly _listeners: ((event: T) => void)[] = [];
	readonly event: Event<T> = (listener) => {
		this._listeners.push(listener);
		return {
			dispose: () => {
				const i = this._listeners.findIndex((l) => l === listener);
				if (i === undefined) return;
				this._listeners.splice(i, 1);
			},
		};
	};

	dispatch(event: T): void {
		for (const listener of this._listeners) {
			listener(event);
		}
	}
}
