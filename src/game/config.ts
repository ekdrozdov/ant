const antVisionDistance = 40;

export const config = {
	interactionDistance: 10,

	pathAdjacentNodesDistance: antVisionDistance / 2,

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
} as const;
