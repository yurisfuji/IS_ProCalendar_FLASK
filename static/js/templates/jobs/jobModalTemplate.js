import { modalTemplate } from '../modalTemplate.js';

/**
 * Шаблон модального окна для создания/редактирования работы
 * @param {Object|null} job - данные работы (null для создания новой)
 * @param {Array} orders - массив заказов для выпадающего списка
 * @param {Array} equipment - массив оборудования для выпадающего списка
 * @param {string} finalEquipmentId - предустановленный ID оборудования
 * @param {string} finalStartDate - предустановленная дата начала
 * @returns {string} HTML-разметка модального окна работы
 */
export const jobModalTemplate = (job = null, orders = [], equipment = [], finalEquipmentId = '', finalStartDate = '') => {
    const title = job ? '✏️ Редактировать работу' : '⚙️ Новая работа';
    const jobId = job?.id || '';

    const content = `
        <form id="job-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                    Заказ*
                </label>
                <select name="order_id" 
                        class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                    <option value="">Выберите заказ</option>
                    ${orders.map(order => `
                        <option value="${order.id}" ${job?.order_id === order.id ? 'selected' : ''}>
                            ${order.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div>
                <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                    Оборудование*
                </label>
                <select name="equipment_id" 
                        class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                    <option value="">Выберите оборудование</option>
                    ${equipment.map(eq => `
                        <option value="${eq.id}" ${finalEquipmentId === eq.id ? 'selected' : ''}>
                            ${eq.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                        Длительность (часы)*
                    </label>
                    <input type="number" name="duration_hours" value="${job?.duration_hours || 8}"
                           class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           min="0.25" step="0.25" required>
                </div>
                
                <div>
                    <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                        Смещение (часы)
                    </label>
                    <input type="number" name="hour_offset" value="${job?.hour_offset || 0}"
                           class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           min="0" step="0.25">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                    Дата начала*
                </label>
                <input type="date" name="start_date" value="${finalStartDate}"
                       class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
            </div>
            
            <div>
                <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                    Статус
                </label>
                <select name="status" 
                        class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="planned" ${job?.status === 'planned' ? 'selected' : ''}>📅 Запланирована</option>
                    <option value="started" ${job?.status === 'started' ? 'selected' : ''}>⚙️ В работе</option>
                    <option value="completed" ${job?.status === 'completed' ? 'selected' : ''}>✅ Завершена</option>
                </select>
            </div>
            
            <div class="flex items-center">
                <input type="checkbox" name="is_locked" ${job?.is_locked ? 'checked' : ''}
                       class="rounded text-red-500 focus:ring-red-500 mr-2">
                <label class="text-sm dark:text-gray-300">🔒 Заблокировать (запретить изменения)</label>
            </div>
        </form>
    `;

    const footer = `
        <div class="flex justify-end space-x-3">
            <button onclick="app.closeModal()"
                    class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Отмена
            </button>
            <button onclick="app.jobsManager.${job ? 'updateJob' : 'addJob'}(${jobId})"
                    class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">
                ${job ? 'Обновить' : 'Добавить'}
            </button>
        </div>
    `;

    return modalTemplate(title, content, footer);
};
