import { modalTemplate } from '../modalTemplate.js';

/**
 * Шаблон модального окна для создания/редактирования типа оборудования
 * @param {Object|null} type - данные типа оборудования (null для создания нового)
 * @returns {string} HTML-разметка модального окна
 */
export const typeModalTemplate = (type = null) => {
    const title = type ? '✏️ Редактировать тип' : '🎨 Добавить тип оборудования';
    const typeId = type?.id || '';

    const content = `
        <form id="type-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                    Наименование типа*
                </label>
                <input type="text" name="name" value="${type?.name || ''}"
                       class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                       placeholder="Введите название типа..." required>
            </div>
            
            <div>
                <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                    Цвет типа*
                </label>
                <input type="color" name="color" value="${type?.color || '#FF0000'}"
                       class="w-full h-10 rounded border border-gray-300 dark:border-gray-600">
            </div>
        </form>
    `;

    const footer = `
        <div class="flex justify-end space-x-3 mt-6">
            <button onclick="app.closeModal()"
                    class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Отмена
            </button>
            <button onclick="app.equipmentManager.${type ? 'updateType' : 'addType'}(${typeId})"
                    class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">
                ${type ? 'Обновить' : 'Добавить'}
            </button>
        </div>
    `;

    return modalTemplate(title, content, footer);
};
