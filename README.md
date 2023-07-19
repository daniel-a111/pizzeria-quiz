

# Pizzeria Pipeline Quiz

## Requirements
- docker + docker-compose

## Run the application
```
docker-compose up -d
```

## Configure Workers
Workers are configured by the following env variables:

the number of chefs / ovens:
- DOUGH_CHEFS
- TOPPING_CHEFS
- OVENS

the time for a single work, by pipeline stages: 
- DOUGH_SEC_PER_WORK
- TOPPING_SEC_PER_WORK
- OVEN_SEC_PER_WORK

the parallel rate by pipeline stage, i.e. how many jobs can be done at once by a single chef / oven
- DOUGH_CHEF_PARALLEL_RATE
- TOPPING_CHEF_PARALLEL_RATE
- OVEN_PARALLEL_RATE