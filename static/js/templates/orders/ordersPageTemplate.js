export const ordersPageTemplate = (ordersManager, filteredOrders) => `
    <div class="fade-in">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-3xl font-bold dark:text-white">📋 Управление заказами</h2>
            <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                    onclick="app.ordersManager.openOrderModal()">
                📋 Новый заказ
            </button>
        </div>
        
        <!-- Фильтр заказов -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mb-4">
            <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-semibold dark:text-white">Фильтр заказов</h4>
                <span id="orders-counter" class="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                    Показано: <strong>${filteredOrders.length}</strong> из <strong>${ordersManager.ordersData.orders.length}</strong>
                </span>
            </div>
            <div class="flex space-x-2">
                <input type="text" 
                       id="orders-filter-input"
                       placeholder="Введите название заказа..."
                       value="${ordersManager.ordersFilter}"
                       class="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                       oninput="app.ordersManager.filterOrders(this.value)">
                ${ordersManager.ordersFilter ? `
                    <button onclick="app.ordersManager.clearOrdersFilter()"
                            class="bg-green-500 hover:bg-green-600 text-white px-3 py-0 rounded transition-colors">
                        ❎
                    </button>
                ` : ''}
            </div>
        </div>
        
        <!-- Список заказов -->
        <div id="orders-list-container" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            ${ordersManager.renderOrdersList(filteredOrders)}
        </div>
    </div>
`;