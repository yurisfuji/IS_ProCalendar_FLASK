import { orderModalTemplate } from '../../templates/orders/orderModalTemplate.js';

export class OrderModal {
    constructor(ordersManager) {
        this.ordersManager = ordersManager;
    }

    open(orderId = null) {
        const order = orderId ? this.ordersManager.ordersData.orders.find(o => o.id === orderId) : null;
        const modalHtml = orderModalTemplate(order);
        this.ordersManager.app.showModal(modalHtml);
    }
}