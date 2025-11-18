import { modalTemplate } from '../modalTemplate.js';

export const orderModalTemplate = (order = null) => {
    const title = order ? '✏️ Редактировать заказ' : '📋 Новый заказ';
    const orderId = order?.id || '';

    const content = `
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
    `;

    const footer = `
        <div class="flex justify-end space-x-3">
            <button onclick="app.closeModal()"
                    class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                Отмена
            </button>
            <button onclick="app.ordersManager.${order ? 'updateOrder' : 'addOrder'}(${orderId})"
                    class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">
                ${order ? 'Обновить' : 'Добавить'}
            </button>
        </div>
    `;

    return modalTemplate(title, content, footer);
};