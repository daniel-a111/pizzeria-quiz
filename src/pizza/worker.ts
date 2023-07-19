import { logger } from '../logger';
import { Pipeline } from './pipeline';
import { Queue } from './queue';
import { OrderItem } from './types';

export class Worker {

    static nextWorkerId = 1;
    id: number;
    pipeline: Pipeline;
    queue: Queue;
    secPerWork: number;
    running: boolean = false;
    stopped: boolean = false;
    constructor(pipeline: Pipeline, queue: Queue, secPerWork: number) {
        this.id = Worker.nextWorkerId++;
        this.pipeline = pipeline;
        this.queue = queue;
        this.secPerWork = secPerWork;
    }

    run() {
        if (this.running) {
            throw new Error("already running");
        }
        this.running = true;
        this.stopped = false;
        const work = async () => {
            logger.info(`worker #${this.id} (${this.queue.name}): waiting for job...`);
            const item: OrderItem | null = await this.queue.dequeue();
            if (item) {
                logger.info(`worker #${this.id} (${this.queue.name}): job found, processing: [order: ${item.orderId}, item: ${item.itemIdx}]`);
            } else {
                logger.info(`worker #${this.id} (${this.queue.name}): waiting timeout`);
            }
            setTimeout(async () => {
                if (item) {
                    logger.info(`worker #${this.id} (${this.queue.name}): done with job [order: ${item.orderId}, item: ${item.itemIdx}]`);
                    await this.queue.setAsDone(item);
                    await this.pipeline.processItem(item);
                }
                if (!this.stopped) {
                    work();
                }
            }, this.secPerWork * 1000);
        }
        work();
    }

    stop() {
        this.running = false;
        this.stopped = true;
    }
}
