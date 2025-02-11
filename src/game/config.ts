import { PI } from "../utils/math";

const antVisionDistance = 40;

export const config = {
	interactionDistance: 10,

	trailAdjacentNodesDistance: antVisionDistance / 2,

	// TODO: ants should eat approximately twice a day.
	antFoodDepletionPerMinute: 1,
	/**
	 * Distance ant travels per second.
	 */
	antVelocity: 1,
	antFoodConsumptionPerSecond: 5,
	antFoodLowAmount: 20,
	antFoodMaxAmount: 100,
	antVisionDistance,
	antNoiseRotationAmount: PI / 8,
	antJoblessRoamingMaxDistance: 20,
	antCarryCapacity: 50,
	antSensitivityDistance: 10,
	antPheromoneMarkIntensity: 10,

	pheromoneDecayPerMinute: 10,
} as const;
