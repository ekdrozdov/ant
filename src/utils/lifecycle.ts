export interface Disposable {
	dispose(): void;
}

export class DisposableStorage implements Disposable {
	private _storage: Disposable[] = [];
	register(d: Disposable) {
		this._storage.push(d);
	}
	dispose(): void {
		for (const { dispose } of this._storage) {
			dispose();
		}
		this._storage = [];
	}
}
