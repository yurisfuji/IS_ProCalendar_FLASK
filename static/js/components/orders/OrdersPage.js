import { ordersPageTemplate } from '../../templates/orders/ordersPageTemplate.js';

export class OrdersPage {
    constructor(ordersManager) {
        this.ordersManager = ordersManager;
    }

    async render() {
        try {
            await this.ordersManager.loadOrdersData();
            const filteredOrders = this.ordersManager.getFilteredOrders();
            return ordersPageTemplate(this.ordersManager, filteredOrders);
        } catch (error) {
            console.error('Ошибка загрузки страницы заказов:', error);
            return this.renderError();
        }
    }

    renderError() {
        return `
            <div class="text-center py-12">
                <div class="text-red-500 text-xl mb-4">❌ Ошибка загрузки заказов</div>
                <button onclick="app.navigateTo('orders')" 
                        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                    Попробовать снова
                </button>
            </div>
        `;
    }
}