# How ants navigate the world

## Navigation mechanisms

### Pheromone trail

Most basic mechanism. Pheromones forms a trail which ants follow using pheromone perceptors to read the surrounding pheromone intensity.

### Kinestetic navigation

Ant memorizes route as a sequence of turns and distances. Sometimes they could memorize visual cues to model a map representation. Memory persists up to several days.

### P2P communication

Ant could communicate direction and distance to the food source to its mates.


### Auxiliary

Different ant spicies also leverage

- sense of nest pheromones at large distance
- sun
- geomagnetic field

## Route optimization

Route is continiously optimized by

- cutting the corners along the route
- weighted random seleciton of route alternatie branches

When carring food back to home ants leave pheromone trails. As pheromone evaporates at constant rate, pheromone intensity maximizes along the shortest route.
