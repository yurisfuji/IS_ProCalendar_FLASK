export default class OrdersManager {
    constructor(app) {
        this.app = app;
        this.ordersData = null;
        this.ordersFilter = localStorage.getItem('lastOrdersFilter') || '';
    }

    async renderOrdersPage() {
        try {
            // Загружаем данные заказов
            await this.loadOrdersData();

            return `
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
                            <span class="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                                Показано: <strong>${this.getFilteredOrders().length}</strong> из <strong>${this.ordersData.orders.length}</strong>
                            </span>
                        </div>
                        <div class="flex space-x-2">
                            <input type="text" 
                                   id="orders-filter-input"
                                   placeholder="Введите название заказа..."
                                   value="${this.ordersFilter}"
                                   class="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                   oninput="app.ordersManager.filterOrders(this.value)">
                            ${this.ordersFilter ? `
                                <button onclick="app.ordersManager.clearOrdersFilter()"
                                        class="bg-green-500 hover:bg-green-600 text-white px-3 py-0 rounded transition-colors">
                                    ❎
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Список заказов -->
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                        ${this.getFilteredOrders().length === 0 ?
                this.ordersData.orders.length === 0 ?
                    '<div class="text-center py-8">' +
                    '<p class="text-gray-500 dark:text-gray-400 text-sm mb-3">Заказы не найдены</p>' +
                    '</div>' :
                    '<div class="text-center py-8">' +
                    '<p class="text-gray-500 dark:text-gray-400 text-sm mb-3">Заказы по фильтру не найдены</p>' +
                    '<button onclick="app.ordersManager.clearOrdersFilter()" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">' +
                    'Очистить фильтр' +
                    '</button>' +
                    '</div>' :
                `<div class="space-y-2">${this.getFilteredOrders().map((order, index) => this.renderOrderItem(order, index)).join('')}</div>`
            }
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Ошибка загрузки страницы заказов:', error);
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

    renderOrderItem(order, index) {
        // Определяем цвет для этапа
        let stageColor = '';
        let stageIcon = '';

        switch (order.stage) {
            case 'запланирован':
                stageColor = 'text-blue-500';
                stageIcon = '📅';
                break;
            case 'в производстве':
                stageColor = 'text-orange-500';
                stageIcon = '⚙️';
                break;
            case 'завершён':
                stageColor = 'text-green-500';
                stageIcon = '✅';
                break;
            default:
                stageColor = 'text-gray-500';
                stageIcon = '❓';
        }

        return `
            <div class="order-item group bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg p-3 transition-colors border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                        <!-- Цветной индикатор заказа -->
                        <div class="w-9 h-12 rounded flex-shrink-0 border border-white dark:border-gray-600 shadow-sm" 
                             style="background-color: ${order.color}">
                        </div>
                        
                        <!-- Информация о заказе -->
                        <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-semibold dark:text-white truncate" title="${order.name}">
                                ${order.name}
                            </h4>
                            <div class="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                                <span>Кол-во: ${order.quantity} шт.</span>
                                <span>•</span>
                                <span>Работ: ${order.jobs_count || 0}</span>
                                <span>•</span>
                                <span class="flex items-center space-x-1">
                                    <span>Этап:</span>
                                    <span class="${stageColor} font-medium flex items-center space-x-1">
                                        <span>${stageIcon}</span>
                                        <span>${order.stage}</span>
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Кнопки управления -->
                    <div class="flex items-center space-x-1 ml-3 opacity-0 group-hover:opacity-100">
                        ${index > 0 ? `
                            <button class="${this.app.move_button_class}"
                                    onclick="app.ordersManager.moveOrder(${order.id}, 'up')"
                                    title="Повысить приоритет">
                                ${this.app.move_up_button_svg}
                            </button>
                        ` : ''}
                        
                        ${index < this.ordersData.orders.length - 1 ? `
                            <button class="${this.app.move_button_class}"
                                    onclick="app.ordersManager.moveOrder(${order.id}, 'down')"
                                    title="Понизить приоритет">
                                ${this.app.move_down_button_svg}
                            </button>
                        ` : ''}
                        
                        <button class="${this.app.edit_button_class}"
                                onclick="app.ordersManager.openOrderModal(${order.id})"
                                title="Редактировать">
                                ${this.app.edit_button_svg}
                        </button>
                        
                        ${order.jobs_count === 0 ? `
                            <button class="${this.app.delete_button_class}"
                                    onclick="app.ordersManager.deleteOrder(${order.id})"
                                    title="Удалить">
                                 ${this.app.delete_button_svg}
                            </button>
                        ` : `
                            <button class="${this.app.cant_delete_button_class}"
                                    title="Нельзя удалить: связано ${order.jobs_count} работ">
                                 ${this.app.delete_button_svg}
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    // Методы для фильтрации заказов
    filterOrders(filterText) {
        this.ordersFilter = filterText.toLowerCase().trim();
        localStorage.setItem('lastOrdersFilter', this.ordersFilter);

        // Debounce для оптимизации
        clearTimeout(this.filterTimeout);
        this.filterTimeout = setTimeout(() => {
            this.updateOrdersList();
        }, 300);
    }

    // Новый метод для обновления только списка заказов
    updateOrdersList() {
        const ordersContainer = document.getElementById('orders-list-container') ||
            document.querySelector('.bg-white.dark\\:bg-gray-800:last-child');

        if (ordersContainer) {
            const filteredOrders = this.getFilteredOrders();

            if (filteredOrders.length === 0) {
                ordersContainer.innerHTML = this.ordersData.orders.length === 0 ?
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
                ordersContainer.innerHTML = `<div class="space-y-2">${filteredOrders.map((order, index) => this.renderOrderItem(order, index)).join('')}</div>`;
            }

            // Обновляем счетчик по ID
            const counter = document.getElementById('orders-counter');
            if (counter) {
                counter.innerHTML = `Показано: <strong>${filteredOrders.length}</strong> из <strong>${this.ordersData.orders.length}</strong>`;
            }

            // Обновляем кнопку очистки фильтра
            this.updateOrdersClearButton();
        }
    }

    // Новый метод для обновления кнопки очистки фильтра заказов
    updateOrdersClearButton() {
        const filterContainer = document.querySelector('.bg-white.dark\\:bg-gray-800 .flex.space-x-2');
        if (filterContainer) {
            const clearButtonHtml = this.ordersFilter ?
                `<button onclick="app.ordersManager.clearOrdersFilter()"
                    class="bg-green-500 hover:bg-green-600 text-white px-3 py-0 rounded transition-colors">
                    ❎
                </button>` : '';

            // Сохраняем поле ввода
            const input = filterContainer.querySelector('input');
            if (input) {
                filterContainer.innerHTML = `
                <input type="text" 
                       id="orders-filter-input"
                       placeholder="Введите название заказа..."
                       value="${this.ordersFilter}"
                       class="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                       oninput="app.ordersManager.filterOrders(this.value)">
                ${clearButtonHtml}
            `;

                // Восстанавливаем фокус
                const newInput = filterContainer.querySelector('input');
                if (newInput) {
                    newInput.focus();
                    // Устанавливаем курсор в конец текста
                    newInput.setSelectionRange(newInput.value.length, newInput.value.length);
                }
            }
        }
    }

    getFilteredOrders() {
        if (!this.ordersData || !this.ordersData.orders) return [];

        if (!this.ordersFilter) {
            return this.ordersData.orders;
        }

        return this.ordersData.orders.filter(order =>
            order.name.toLowerCase().includes(this.ordersFilter)
        );
    }

    async loadOrdersData() {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to load orders data');
        this.ordersData = await response.json();
    }

    clearOrdersFilter() {
        this.ordersFilter = '';
        localStorage.removeItem('lastOrdersFilter');
        // Сбрасываем значение в поле ввода
        const filterInput = document.getElementById('orders-filter-input');
        if (filterInput) {
            filterInput.value = '';
        }
        this.updateOrdersList();
    }

    // Модальные окна для заказов
    openOrderModal(orderId = null) {
        const order = orderId ? this.ordersData.orders.find(o => o.id === orderId) : null;

        const modalHtml = `
        <div class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="modal-dialog bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                <!-- Заголовок для перетаскивания -->
                <div class="modal-header cursor-move bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 rounded-t-lg flex justify-between items-center select-none"
                     id="modal-drag-handle">
                    <h3 class="text-xl font-semibold text-gray-800 dark:text-white">
                        ${order ? '✏️ Редактировать заказ' : '📋 Новый заказ'}
                    </h3>
                    <button onclick="app.closeModal()" 
                            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        ×
                    </button>
                </div>
                
                <!-- Содержимое формы -->
                <div class="modal-content flex-1 overflow-auto p-6">
                    <form id="order-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                                Наименование заказа*
                            </label>
                            <input type="text" name="name" value="${order?.name || ''}"
                                   class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                   placeholder="Введите название заказа..." required>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                                Цвет заказа*
                            </label>
                            <input type="color" name="color" value="${order?.color || '#0800ff'}"
                                   class="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                                Количество
                            </label>
                            <input type="number" name="quantity" value="${order?.quantity || 1}"
                                   class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                   min="1" required>
                        </div>
                    </form>
                </div>
                
                <!-- Кнопки действий -->
                <div class="modal-footer bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600 rounded-b-lg">
                    <div class="flex justify-end space-x-3">
                        <button onclick="app.closeModal()"
                                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                            Отмена
                        </button>
                        <button onclick="app.ordersManager.${order ? 'updateOrder' : 'addOrder'}(${orderId || ''})"
                                class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">
                            ${order ? 'Обновить' : 'Добавить'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

        this.app.showModal(modalHtml);
    }

    async addOrder() {
        try {
            const form = document.getElementById('order-form');
            const formData = new FormData(form);

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    color: formData.get('color'),
                    quantity: parseInt(formData.get('quantity'))
                })
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification('✅ Заказ добавлен!', 'success');
                this.app.closeModal();
                await this.loadOrdersData();
                await this.app.updateJobButtonState();
                await this.app.loadPage('orders');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка добавления заказа:', error);
            this.app.showNotification('❌ Ошибка при добавлении заказа', 'error');
        }
    }

    async updateOrder(orderId) {
        try {
            const form = document.getElementById('order-form');
            const formData = new FormData(form);

            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    color: formData.get('color'),
                    quantity: parseInt(formData.get('quantity'))
                })
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification('✅ Заказ обновлен!', 'success');
                this.app.closeModal();
                await this.loadOrdersData();
                this.app.loadPage('orders');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка обновления заказа:', error);
            this.app.showNotification('❌ Ошибка при обновлении заказа', 'error');
        }
    }

    async deleteOrder(orderId) {
        if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return;

        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification('✅ Заказ удален!', 'success');
                await this.loadOrdersData();
                await this.app.updateJobButtonState();
                await this.app.loadPage('orders');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления заказа:', error);
            this.app.showNotification('❌ Ошибка при удалении заказа', 'error');
        }
    }

    async moveOrder(orderId, direction) {
        try {
            const response = await fetch(`/api/orders/${orderId}/move/${direction}`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification('✅ Приоритет заказа обновлен!', 'success');
                await this.loadOrdersData();
                this.app.loadPage('orders');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка перемещения заказа:', error);
            this.app.showNotification('❌ Ошибка при изменении приоритета', 'error');
        }
    }
}