/**
 * Шаблон списка оборудования
 * @param {Array} equipment - массив оборудования для отображения
 * @param {Object} equipmentManager - экземпляр менеджера оборудования
 * @returns {string} HTML-разметка списка оборудования
 */
export const equipmentListTemplate = (equipment, equipmentManager) => {
    if (equipment.length === 0) {
        return `
            <div class="text-center py-8">
                <p class="text-gray-500 dark:text-gray-400 text-sm mb-3">Оборудование не найдено</p>
            </div>
        `;
    } else {
        // Контейнер для элементов оборудования (рендерится отдельно)
        return `<div id="equipment-list-items" class="space-y-2"></div>`;
    }
};