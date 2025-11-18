/**
 * Шаблон списка типов оборудования
 * @param {Array} types - массив типов оборудования для отображения
 * @param {Object} equipmentManager - экземпляр менеджера оборудования
 * @returns {string} HTML-разметка списка типов оборудования
 */
export const typesListTemplate = (types, equipmentManager) => {
    if (types.length === 0) {
        return `
            <div class="text-center py-8">
                <p class="text-gray-500 dark:text-gray-400 text-sm mb-3">Типы оборудования не найдены</p>
            </div>
        `;
    } else {
        // Контейнер для элементов типов (рендерится отдельно)
        return `<div id="types-list-items" class="space-y-2"></div>`;
    }
};
