export const ordersListTemplate = (orders, ordersManager) => {
    if (orders.length === 0) {
        return ordersManager.ordersData.orders.length === 0 ?
            '<div class="text-center py-8">' +
            '<p class="text-gray-500 dark:text-gray-400 text-sm mb-3">Заказы не найдены</p>' +
            '</div>' :
            '<div class="text-center py-8">' +
            '<p class="text-gray-500 dark:text-gray-400 text-sm mb-3">Заказы по фильтру не найдены</p>' +
            '<button onclick="app.ordersManager.clearOrdersFilter()" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">' +
            'Очистить фильтр' +
            '</button>' +
            '</div>';
    } else {
        // Вместо создания OrderItem здесь, просто возвращаем контейнер
        // OrderItem будет создаваться в OrdersList компоненте
        return `<div id="orders-list-items" class="space-y-2"></div>`;
    }
};