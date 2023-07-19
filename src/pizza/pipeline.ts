import { logger } from "../logger";
import * as redis from '../services/redis';
import { Queue } from "./queue";
import { OrderItem, OrderItemState, OrderRequest, OrderStatus, WorkerDescriptor } from "./types";
import { Worker } from "./worker";

let pipeline: Pipeline;
export const getPipeline = () => {
    return pipeline;
}

export const startPipeline = async (workers: WorkerDescriptor[]) => {
    const queues = {
        dough: new Queue('dough', await redis.startClient()),
        topping: new Queue('topping', await redis.startClient()),
        oven: new Queue('oven', await redis.startClient())
    }
    const pipe = new Pipeline(queues.dough, queues.topping, queues.oven, await redis.startClient());
    for (const workerDesc of workers) {
        const queue = queues[workerDesc.stage];
        for (let i = 0; i < workerDesc.parallel; i++) {
            const worker = new Worker(pipe, queue, workerDesc.secPerWork);
            worker.run();
        }
    }
    pipeline = new Pipeline(queues.dough, queues.topping, queues.oven, await redis.startClient());
}


export class Pipeline {

    dough: Queue;
    topping: Queue;
    oven: Queue;

    constructor(dough: Queue, topping: Queue, oven: Queue, client: any) {
        this.dough = dough;
        this.topping = topping;
        this.oven = oven;
    }

    async getState(item: OrderItem): Promise<OrderItemState | null> {
        return await redis.loadItemState(item);
    }

    async numberOfItemsInOrder(orderId: number): Promise<number> {
        return await redis.loadOrderItems(orderId);
    }

    async addOrder(order: OrderRequest): Promise<number> {
        const orderId = await redis.nextOrderId();
        logger.info(`pipeline: new order added: #${orderId}`);
        await redis.storeOrderItems(orderId, order.length);
        for (let i = 0; i < order.length; i++) {
            const toppingsAmount = order[i].toppings_amount;
            const item: OrderItem = { orderId, itemIdx: i };
            await this.processItem(item, toppingsAmount);
        }
        return orderId;
    }

    async proceedState(item: OrderItem, toppingsAmount?: number) {
        let state: OrderItemState | null = await redis.loadItemState(item);
        if (!state) {
            if (toppingsAmount === undefined) {
                throw new Error("toppings amount must be defined on item init");
            }
            state = { state: 'dough', toppingsLeft: toppingsAmount };
        } else if (state.state === 'dough' || state.state === 'topping') {
            if (state.toppingsLeft) {
                state.toppingsLeft -= 1;
                state.state = 'topping';
            } else {
                state.state = 'oven';
            }
        }
        else if (state.state === 'oven') {
            state.state = null;
        }
        await redis.storeItemState(item, state);
        return state;
    }

    async processItem(item: OrderItem, toppingsAmount?: number) {
        const state = await this.proceedState(item, toppingsAmount);
        logger.info(`pipeline: next job process of ${JSON.stringify(item)} is ${state.state}`);
        await redis.storeItemState(item, state);
        if (state.state === 'dough') {
            await this.dough.enqueue(item);
        } else if (state.state === 'topping') {
            logger.info(`pipeline: ${JSON.stringify(item)}: topping left: ${state.toppingsLeft}`);
            await this.topping.enqueue(item);
        } else if (state.state === 'oven') {
            await this.oven.enqueue(item);
        }
    }

    async getOrder(orderId: number): Promise<OrderStatus | null> {
        if (orderId > await redis.lastOrderId()) {
            throw new Error(`order #${orderId} does not exists yet`);
        }
        const n = await this.numberOfItemsInOrder(orderId);
        const status: OrderStatus = { items: [] };
        for (let i = 0; i < n; i++) {
            const orderItem: OrderItem = { orderId, itemIdx: i };
            status.items.push({
                dough: await this.dough.totalTime(orderItem),
                topping: await this.topping.totalTime(orderItem),
                oven: await this.oven.totalTime(orderItem),
            });
        }
        return status;
    }

    queues(): Queue[] {
        return [this.dough, this.topping, this.oven];
    }

    async flushOrderCache(orderId: number) {
        const n = await this.numberOfItemsInOrder(orderId);
        for (let i = 0; i < n; i++) {
            for (const queue of this.queues()) {
                queue.flushCache({ orderId, itemIdx: i });
            }
        }
    }
}
