import { modalTemplate } from '../modalTemplate.js';

/**
 * Шаблон модального окна разрешения конфликтов
 * @param {string} availableDate - доступная дата для размещения работы
 * @param {number} availableOffset - доступное смещение в часах
 * @returns {string} HTML-разметка модального окна конфликтов
 */
export const conflictModalTemplate = (availableDate, availableOffset) => {
    const formattedDate = new Date(availableDate).toLocaleDateString('ru-RU');

    const content = `
        <div class="mb-6">
            <p class="text-gray-700 dark:text-gray-300 mb-3">
                Выбранное время для работы пересекается с другими работами на этом оборудовании.
            </p>
            <p class="text-gray-700 dark:text-gray-300">
                Первое доступное время: <strong>${formattedDate}</strong> в <strong>${availableOffset}ч.</strong>
            </p>
        </div>
        
        <div class="space-y-3" id="conflict-resolution-buttons">
            <button class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded transition-colors conflict-resolution-btn"
                    data-type="insert">
                📅 Вклинить работу, подвинув остальные
            </button>
            
            <button class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors conflict-resolution-btn"
                    data-type="move"
                    data-available-date="${availableDate}"
                    data-available-offset="${availableOffset}">
                📍 Добавить на первое свободное время
            </button>
        </div>
    `;

    const footer = `
        <div class="flex justify-end">
            <button onclick="app.closeModal()"
                    class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors">
                ❌ Отмена
            </button>
        </div>
    `;

    return modalTemplate('⚠️ Обнаружены конфликты по времени', content, footer);
};
