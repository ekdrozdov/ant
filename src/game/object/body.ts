import type { Agent } from "../agent/agent";

export interface Body {
	resetAgent(agent: Agent): void;
}
