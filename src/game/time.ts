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
	readonly onTick: Event;
	readonly years: number;
	readonly month: number;
	readonly days: number;
	readonly hours: number;
	readonly minutes: number;
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
	private readonly _onTick = new EventEmitter();
	readonly onTick = this._onTick.event;

	years = 0;
	month = 0;
	days = 0;
	hours = 0;
	minutes = 0;

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
			this._onTick.dispatch();

			this.minutes = ++this.minutes % 60;
			if (this.minutes !== 0) return;
			this._onMinute.dispatch();
			this.hours = ++this.hours % 24;
			if (this.hours !== 0) {
				this._onHour.dispatch();
				return;
			}
			this.days = ++this.days % 30;
			if (this.days !== 0) {
				this._onDay.dispatch();
				return;
			}
			this.month = ++this.month % 12;
			if (this.month !== 0) {
				this._onMonth.dispatch();
				console.log(`month ${this.month}`);
				return;
			}
			this.years = ++this.years;
			this._onYear.dispatch();
			console.log(`year ${this.years}`);
		};
		clearInterval(this._intervalId);
		if (value === 0) return;
		this._intervalId = setInterval(() => {
			update();
		}, 1000 / value);
	}
}
