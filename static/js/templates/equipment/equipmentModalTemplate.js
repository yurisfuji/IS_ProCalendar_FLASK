import { modalTemplate } from '../modalTemplate.js';

/**
 * Шаблон модального окна для создания/редактирования оборудования
 * @param {Object|null} equipment - данные оборудования (null для создания нового)
 * @param {Array} types - массив типов оборудования
 * @returns {string} HTML-разметка модального окна
 */
export const equipmentModalTemplate = (equipment = null, types = []) => {
    const title = equipment ? '✏️ Редактировать оборудование' : '🏭 Добавить оборудование';
    const equipmentId = equipment?.id || '';

    const content = `
        <form id="equipment-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                    Наименование оборудования*
                </label>
                <input type="text" name="name" value="${equipment?.name || ''}"
                       class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                       placeholder="Введите название..." required>
            </div>
            
            <div>
                <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                    Тип оборудования*
                </label>
                <select name="type_id" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                    <option value="">Выберите тип</option>
                    ${types.map(type => `
                        <option value="${type.id}" ${equipment?.type_id === type.id ? 'selected' : ''}>
                            ${type.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="flex items-center">
                <input type="checkbox" name="show_on_chart" ${equipment?.show_on_chart !== false ? 'checked' : ''}
                       class="rounded text-green-500 focus:ring-green-500 mr-2">
                <label class="text-sm dark:text-gray-300">Показывать на диаграмме</label>
            </div>
        </form>
    `;

    const footer = `
        <div class="flex justify-end space-x-3">
            <button onclick="app.closeModal()"
                    class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Отмена
            </button>
            <button onclick="app.equipmentManager.${equipment ? 'updateEquipment' : 'addEquipment'}(${equipmentId})"
                    class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">
                ${equipment ? 'Обновить' : 'Добавить'}
            </button>
        </div>
    `;

    return modalTemplate(title, content, footer);
};