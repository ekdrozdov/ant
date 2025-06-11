export interface Agent {
	execute(): void;
}

export interface Body {
	agent?: Agent;
}
