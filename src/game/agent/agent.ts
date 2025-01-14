import { PI } from "../../utils/math";
import {} from "../scene/scene";

export interface Agent {
	execute(): void;
}

class AgentRegistry {
	private readonly _agents: Agent[] = [];
	public get agents(): ReadonlyArray<Agent> {
		return this._agents;
	}
	register(agent: Agent): void {
		if (this._agents.find((a) => a === agent)) {
			throw new Error("Agent already registered");
		}
		this._agents.push(agent);
	}
	unregister(agent: Agent): void {
		const index = this._agents.indexOf(agent);
		if (index === -1) {
			throw new Error("Agent not registered");
		}
		this._agents.splice(index, 1);
	}
}

export const agentRegistry = new AgentRegistry();

export const NOISE_ROTATION = PI / 8;
