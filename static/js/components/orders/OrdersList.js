import { ordersListTemplate } from '../../templates/orders/ordersListTemplate.js';
import { OrderItem } from './OrderItem.js';

export class OrdersList {
    constructor(ordersManager) {
        this.ordersManager = ordersManager;
    }

    render(filteredOrders) {
        const containerHtml = ordersListTemplate(filteredOrders, this.ordersManager);

        // Если есть заказы, рендерим их после вставки в DOM
        if (filteredOrders.length > 0) {
            setTimeout(() => {
                this.renderOrderItems(filteredOrders);
            }, 0);
        }

        return containerHtml;
    }

    renderOrderItems(filteredOrders) {
        const container = document.getElementById('orders-list-items');
        if (container) {
            const ordersHtml = filteredOrders.map((order, index) => {
                const orderItem = new OrderItem(
                    order,
                    index,
                    this.ordersManager.app,
                    this.ordersManager.ordersData.orders.length
                );
                return orderItem.render();
            }).join('');

            container.innerHTML = ordersHtml;
        }
    }

    update() {
        const ordersContainer = document.getElementById('orders-list-container');
        if (ordersContainer) {
            const filteredOrders = this.ordersManager.getFilteredOrders();
            ordersContainer.innerHTML = this.render(filteredOrders);
        }
    }
}