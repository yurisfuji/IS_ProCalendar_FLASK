import { orderItemTemplate } from '../../templates/orders/orderItemTemplate.js';

export class OrderItem {
    constructor(order, index, app, totalOrders) {
        this.order = order;
        this.index = index;
        this.app = app;
        this.totalOrders = totalOrders;
        this.stageConfig = this.getStageConfig(order.stage);
    }

    getStageConfig(stage) {
        const configs = {
            'запланирован': { color: 'text-blue-500', icon: '📅' },
            'в производстве': { color: 'text-orange-500', icon: '⚙️' },
            'завершён': { color: 'text-green-500', icon: '✅' },
            default: { color: 'text-gray-500', icon: '❓' },
        };
        return configs[stage] || configs.default;
    }

    render() {
        return orderItemTemplate(
            this.order,
            this.index,
            this.stageConfig.color,
            this.stageConfig.icon,
            this.app,
            this.totalOrders
        );
    }
}