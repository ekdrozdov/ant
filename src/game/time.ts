import { type Event, EventEmitter } from "../utils/events";

export interface GameClock {
	readonly onYear: Event;
	readonly onMonth: Event;
	readonly onDay: Event;
	readonly onHour: Event;
	readonly onMinute: Event;
	/**
	 * Tick represents a minimal game time unit.
	 */
	readonly onSecond: Event;
	readonly year: number;
	readonly month: number;
	readonly day: number;
	readonly hour: number;
	readonly minute: number;
	readonly second: number;
	resume(): void;
	pause(): void;
	/**
	 * Sets how many times per second tick happens.
	 */
	setFreq(value: number): void;
}

export class GameClockBase implements GameClock {
	private readonly _onYear = new EventEmitter();
	readonly onYear = this._onYear.event;
	private readonly _onMonth = new EventEmitter();
	readonly onMonth = this._onMonth.event;
	private readonly _onDay = new EventEmitter();
	readonly onDay = this._onDay.event;
	private readonly _onHour = new EventEmitter();
	readonly onHour = this._onHour.event;
	private readonly _onMinute = new EventEmitter();
	readonly onMinute = this._onMinute.event;
	private readonly _onSecond = new EventEmitter();
	readonly onSecond = this._onSecond.event;

	year = 0;
	month = 0;
	day = 0;
	hour = 0;
	minute = 0;
	second = 0;

	private _intervalId?: ReturnType<typeof setInterval>;
	private _isRunning = false;

	constructor() {
		this.setFreq(1);
	}

	resume(): void {
		this._isRunning = true;
	}

	pause(): void {
		this._isRunning = false;
	}
	setFreq(value: number): void {
		const update = () => {
			if (!this._isRunning) return;

			this.second = ++this.second % 60;
			this._onSecond.dispatch();
			if (this.second !== 0) {
				return;
			}

			this.minute = ++this.minute % 60;
			this._onMinute.dispatch();
			if (this.minute !== 0) {
				return;
			}

			this.hour = ++this.hour % 24;
			this._onHour.dispatch();
			if (this.hour !== 0) {
				return;
			}

			this.day = ++this.day % 30;
			this._onDay.dispatch();
			if (this.day !== 0) {
				return;
			}

			this.month = ++this.month % 12;
			this._onMonth.dispatch();
			if (this.month !== 0) {
				console.log(`month ${this.month}`);
				return;
			}

			this.year = ++this.year;
			this._onYear.dispatch();
			console.log(`year ${this.year}`);
		};
		clearInterval(this._intervalId);
		if (value === 0) return;
		this._intervalId = setInterval(() => {
			update();
		}, 1000 / value);
	}
}
