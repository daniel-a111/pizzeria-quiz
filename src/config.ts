import { env } from "process";

import * as dotenv from "dotenv";
import { WorkerDescriptor } from "./pizza/types";
dotenv.config({ path: __dirname + '/../.env' });

export const REDIS_HOST = env.REDIS_HOST || '127.0.0.1';
export const REDIS_PORT = env.REDIS_PORT || '6379';

export const DOUGH_CHEFS = parseInt(env.DOUGH_CHEFS || '0');
export const DOUGH_SEC_PER_WORK = parseInt(env.DOUGH_SEC_PER_WORK || '0');
export const DOUGH_CHEF_PARALLEL_RATE = parseInt(env.DOUGH_CHEF_PARALLEL_RATE || '0');

export const TOPPING_CHEFS = parseInt(env.TOPPING_CHEFS || '0');
export const TOPPING_SEC_PER_WORK = parseInt(env.TOPPING_SEC_PER_WORK || '0');
export const TOPPING_CHEF_PARALLEL_RATE = parseInt(env.TOPPING_CHEF_PARALLEL_RATE || '0');

export const OVENS = parseInt(env.OVENS || '0');
export const OVEN_SEC_PER_WORK = parseInt(env.OVEN_SEC_PER_WORK || '0');
export const OVEN_PARALLEL_RATE = parseInt(env.OVEN_PARALLEL_RATE || '0');

export const WORKERS: WorkerDescriptor[] = [];
for (let i = 0; i < DOUGH_CHEFS; i++) {
    WORKERS.push({
        stage: 'dough',
        secPerWork: DOUGH_SEC_PER_WORK,
        parallel: DOUGH_CHEF_PARALLEL_RATE,
    });
}
for (let i = 0; i < TOPPING_CHEFS; i++) {
    WORKERS.push({
        stage: 'topping',
        secPerWork: TOPPING_SEC_PER_WORK,
        parallel: TOPPING_CHEF_PARALLEL_RATE,
    });
}
for (let i = 0; i < OVENS; i++) {
    WORKERS.push({
        stage: 'oven',
        secPerWork: OVEN_SEC_PER_WORK,
        parallel: OVEN_PARALLEL_RATE,
    });
}
