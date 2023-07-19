import { Mutex } from "async-mutex";
import { createClient } from "redis";
import * as config from '../config';
// import { KEY_ITEM_STATE, KEY_NEXT_ORDER_ID, KEY_ORDER_TO_ITEMS_COUNT, NULL } from "../pizza/consts";
import { OrderItem, OrderItemState } from "../pizza/types";
import { KEY_ITEM_STATE, KEY_NEXT_ORDER_ID, KEY_ORDER_TO_ITEMS_COUNT, NULL } from "./consts";

let client: any = null;

export const startClient = async () => {
    client = createClient({
        url: `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`
    });
    client.on('error', (err: any) => console.log('Redis Client Error', err));
    await client.connect();
    return client;
}

export const storeTimeIn = async (queue: string, item: OrderItem, time: number) => {
    await storeTimeInOrOut(queue, item, time, 'in');
}

export const loadTimeIn = async (queue: string, item: OrderItem): Promise<number> => {
    return await loadTimeInOrOut(queue, item, 'in');
}

export const clearTimeIn = async (queue: string, item: OrderItem) => {
    await clearTimeInOrOut(queue, item, 'in');
}

export const storeTimeOut = async (queue: string, item: OrderItem, time: number) => {
    await storeTimeInOrOut(queue, item, time, 'out');
}

export const loadTimeOut = async (queue: string, item: OrderItem): Promise<number> => {
    return await loadTimeInOrOut(queue, item, 'out');
}

export const clearTimeOut = async (queue: string, item: OrderItem) => {
    await clearTimeInOrOut(queue, item, 'out');
}

const loadTimeInOrOut = async (queue: string, item: OrderItem, dir: 'in' | 'out') => {
    return parseInt(await client.hGet(timeKey(queue, dir), `${item.orderId}_${item.itemIdx}`) || '0');
}

const storeTimeInOrOut = async (queue: string, item: OrderItem, time: number, dir: 'in' | 'out') => {
    await client.hSet(timeKey(queue, dir), `${item.orderId}_${item.itemIdx}`, time);
}

const clearTimeInOrOut = async (queue: string, item: OrderItem, dir: 'in' | 'out') => {
    await client.hDel(timeKey(queue, dir), `${item.orderId}_${item.itemIdx}`);
}

export const enqueue = async (queue: string, item: OrderItem) => {
    const mutex = new Mutex();
    const release = await mutex.acquire();
    try {
        const importMulti = client.MULTI();

        await clearTimeOut(queue, item);
        const time = new Date().getTime();
        const timeIn = await loadTimeIn(queue, item);
        importMulti.lPush(queueKey(queue), JSON.stringify(item));
        if (!timeIn) {
            importMulti.hSet(timeInKey(queue), itemKey(item), time);
        }
        await importMulti.exec();
    } catch {
        await client.DISCARD();
    } finally {
        release();
    }
}

export const blockingDequeue = async (client: any, queue: string) => {
    const rawItem = await client.brPop(queueKey(queue), 0);
    if (rawItem) {
        const item: OrderItem | null = JSON.parse(rawItem.element);
        return item;
    } else {
        return null
    }
}

export const loadItemState = async (item: OrderItem): Promise<OrderItemState | null> => {
    return JSON.parse(await client.hGet(KEY_ITEM_STATE, `${item.orderId}_${item.itemIdx}`) || NULL);
}

export const storeItemState = async (item: OrderItem, state: OrderItemState) => {
    await client.hSet(KEY_ITEM_STATE, `${item.orderId}_${item.itemIdx}`, JSON.stringify(state));
}

export const nextOrderId = async () => {
    const mutex = new Mutex();
    const release = await mutex.acquire();
    try {
        const next: number = parseInt(await client.get(KEY_NEXT_ORDER_ID) || '1');
        await client.set(KEY_NEXT_ORDER_ID, next + 1);
        return next;
    } finally {
        release();
    }
}
export const loadOrderItems = async (orderId: number) => {
    return await client.hGet(KEY_ORDER_TO_ITEMS_COUNT, `${orderId}`);
}

export const storeOrderItems = async (orderId: number, itemsCount: number) => {
    await client.hSet(KEY_ORDER_TO_ITEMS_COUNT, `${orderId}`, itemsCount);
}

export const lastOrderId = async () => {
    return parseInt(await client.get('next_order_id') || '1') - 1;
}

const timeInKey = (queue: string) => {
    return timeKey(queue, 'in');
}

const timeKey = (queue: string, dir: 'in' | 'out') => {
    return `time_${dir}_${queue}`;
}

const queueKey = (queue: string) => {
    return `queue_${queue}`;
}

const itemKey = (item: OrderItem) => {
    return `${item.orderId}_${item.itemIdx}`;
}

