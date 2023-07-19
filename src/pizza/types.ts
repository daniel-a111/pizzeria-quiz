export interface WorkerDescriptor {
    stage: 'dough' | 'topping' | 'oven',
    parallel: number,
    secPerWork: number
}

export interface OrderItem {
    orderId: number;
    itemIdx: number;
}

export interface ItemStatus {
    dough: number; topping: number; oven: number;
}

export interface Slot {
    starts: number;
    ends: number;
}

export type slotZRecord = [string, string];


export interface Item {
    toppings_amount: number;
}

export type OrderRequest = Item[];


export interface OrderStatus {
    items: ItemStatus[];
}

export interface OrderItemState {
    doughStart?: number;
    doughEnds?: number;
    toppingStart?: number;
    toppingEnds?: number;
    ovenStart?: number;
    ovenEnds?: number;
    state: 'dough' | 'topping' | 'oven' | null;
    toppingsLeft?: number;
}
