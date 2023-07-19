import { NextFunction, Request, Response } from "express";
import { logger } from "../logger";
import { getPipeline } from "../pizza/pipeline";
import { OrderRequest } from "../pizza/types";

export const get = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id }: any = req.params;
        const pipeline = getPipeline();
        const status = await pipeline.getOrder(id);
        return res.status(200).json(status);
    } catch (e: any) {
        logger.error(e);
        return res.status(500).json({
            message: e?.message || JSON.stringify(e)
        })
    }
}

export const add = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order: OrderRequest = req.body;
        const pipeline = getPipeline();
        const orderId = await pipeline.addOrder(order);
        return res.status(200).json({ orderId });
    } catch (e: any) {
        logger.error(e);
        return res.status(500).json({
            message: e?.message || JSON.stringify(e)
        })
    }
}
