import { OrdersPage } from '../components/orders/OrdersPage.js';
import { OrdersList } from '../components/orders/OrdersList.js';
import { OrderModal } from '../components/orders/OrderModal.js';

/**
 * Менеджер для работы с заказами
 * Отвечает за управление заказами, включая CRUD операции, фильтрацию и отображение
 */
export default class OrdersManager {
    /**
     * Конструктор менеджера заказов
     * @param {Object} app - Главный экземпляр приложения
     */
    constructor(app) {
        this.app = app;
        this.ordersData = null;
        this.ordersFilter = localStorage.getItem('lastOrdersFilter') || '';

        // Инициализируем компоненты
        this.ordersPage = new OrdersPage(this);
        this.ordersList = new OrdersList(this);
        this.orderModal = new OrderModal(this);
    }

    /**
     * Рендерит страницу управления заказами
     * @returns {Promise<string>} HTML-разметка страницы заказов
     */
    async renderOrdersPage() {
        return await this.ordersPage.render();
    }

    /**
     * Рендерит список заказов
     * @param {Array} filteredOrders - Отфильтрованный массив заказов
     * @returns {string} HTML-разметка списка заказов
     */
    renderOrdersList(filteredOrders) {
        return this.ordersList.render(filteredOrders);
    }

    // === МЕТОДЫ ФИЛЬТРАЦИИ И ОБНОВЛЕНИЯ ===

    /**
     * Фильтрует заказы по введенному тексту
     * @param {string} filterText - Текст для фильтрации
     */
    filterOrders(filterText) {
        this.ordersFilter = filterText.toLowerCase().trim();
        localStorage.setItem('lastOrdersFilter', this.ordersFilter);

        // Debounce для оптимизации - обновляем список через 300мс после последнего ввода
        clearTimeout(this.filterTimeout);
        this.filterTimeout = setTimeout(() => {
            this.updateOrdersList();
        }, 300);
    }

    /**
     * Обновляет отображение списка заказов
     * Вызывается при изменении фильтра или данных
     */
    updateOrdersList() {
        this.ordersList.update();
        this.updateOrdersCounter();
        this.updateOrdersClearButton();
    }

    /**
     * Обновляет счетчик отображенных заказов
     * Показывает количество отфильтрованных заказов из общего числа
     */
    updateOrdersCounter() {
        const counter = document.getElementById('orders-counter');
        if (counter) {
            const filteredOrders = this.getFilteredOrders();
            counter.innerHTML = `Показано: <strong>${filteredOrders.length}</strong> из <strong>${this.ordersData.orders.length}</strong>`;
        }
    }

    /**
     * Обновляет кнопку очистки фильтра
     * Показывает/скрывает кнопку в зависимости от наличия фильтра
     */
    updateOrdersClearButton() {
        const filterContainer = document.querySelector('.bg-white.dark\\:bg-gray-800 .flex.space-x-2');
        if (filterContainer) {
            const clearButtonHtml = this.ordersFilter ?
                `<button onclick="app.ordersManager.clearOrdersFilter()"
                    class="bg-green-500 hover:bg-green-600 text-white px-3 py-0 rounded transition-colors">
                    ❎
                </button>` : '';

            // Сохраняем ссылку на текущее поле ввода
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

                // Восстанавливаем фокус и позицию курсора
                const newInput = filterContainer.querySelector('input');
                if (newInput) {
                    newInput.focus();
                    newInput.setSelectionRange(newInput.value.length, newInput.value.length);
                }
            }
        }
    }

    /**
     * Возвращает отфильтрованный список заказов
     * @returns {Array} Массив заказов, отфильтрованных по текущему фильтру
     */
    getFilteredOrders() {
        if (!this.ordersData || !this.ordersData.orders) return [];

        if (!this.ordersFilter) {
            return this.ordersData.orders;
        }

        return this.ordersData.orders.filter(order =>
            order.name.toLowerCase().includes(this.ordersFilter)
        );
    }

    /**
     * Загружает данные заказов с сервера
     * @throws {Error} Если не удалось загрузить данные
     */
    async loadOrdersData() {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to load orders data');
        this.ordersData = await response.json();
    }

    /**
     * Очищает текущий фильтр заказов
     * Сбрасывает фильтр и обновляет отображение
     */
    clearOrdersFilter() {
        this.ordersFilter = '';
        localStorage.removeItem('lastOrdersFilter');
        const filterInput = document.getElementById('orders-filter-input');
        if (filterInput) filterInput.value = '';
        this.updateOrdersList();
    }

    // === МЕТОДЫ РАБОТЫ С МОДАЛЬНЫМИ ОКНАМИ ===

    /**
     * Открывает модальное окно для создания/редактирования заказа
     * @param {number|null} orderId - ID заказа для редактирования, null для создания нового
     */
    openOrderModal(orderId = null) {
        this.orderModal.open(orderId);
    }

    // === CRUD ОПЕРАЦИИ С ЗАКАЗАМИ ===

    /**
     * Добавляет новый заказ
     * Отправляет данные на сервер и обновляет интерфейс
     */
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

    /**
     * Обновляет существующий заказ
     * @param {number} orderId - ID заказа для обновления
     */
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

    /**
     * Удаляет заказ после подтверждения
     * @param {number} orderId - ID заказа для удаления
     */
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

    /**
     * Изменяет приоритет заказа (перемещает вверх/вниз в списке)
     * @param {number} orderId - ID заказа для перемещения
     * @param {string} direction - Направление перемещения: 'up' или 'down'
     */
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