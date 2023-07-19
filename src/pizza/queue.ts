import { logger } from "../logger";
import { blockingDequeue, clearTimeIn, clearTimeOut, enqueue, loadTimeIn, loadTimeOut, storeTimeOut } from "../services/redis";
import { OrderItem } from "./types";

export class Queue {

    name: string;
    redisClient: any;
    constructor(name: string, client: any) {
        this.name = name;
        this.redisClient = client;
    }

    async timeIn(item: OrderItem) {
        return await loadTimeIn(this.name, item);
    }

    async clearTimeOut(item: OrderItem) {
        return await clearTimeOut(this.name, item);
    }
    async enqueue(item: OrderItem) {
        await enqueue(this.name, item);
    }

    async dequeue(): Promise<OrderItem | null> {
        return await blockingDequeue(this.redisClient, this.name);
    }

    async setAsDone(item: OrderItem) {
        logger.info(`queue ${this.name}: item ${JSON.stringify(item)} done`)
        await storeTimeOut(this.name, item, new Date().getTime());
    }

    async totalTime(item: OrderItem): Promise<number> {
        const time = new Date().getTime();
        const timeIn: number = await loadTimeIn(this.name, item) || time;
        const timeOut: number = await loadTimeOut(this.name, item) || time;
        return (timeOut - timeIn) / 1000;
    }

    // can be use later
    async flushCache(item: OrderItem) {
        await clearTimeIn(this.name, item);
    }
};
