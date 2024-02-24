export interface Disposable {
  dispose(): void
}

export class DisposableStorage implements Disposable {
  private _storage: Disposable[] = []
  register(d: Disposable) {
    this._storage.push(d)
  }
  dispose(): void {
    this._storage.forEach(({ dispose }) => dispose())
    this._storage = []
  }
}
