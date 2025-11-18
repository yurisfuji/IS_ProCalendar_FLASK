    import { formatMonth } from '../../utils/calendarHelpers.js';

/**
 * Шаблон панели управления календарем (переключение месяцев)
 * @param {string} currentMonth - Текущий месяц (YYYY-MM)
 * @returns {string} HTML разметка управления
 */
export const calendarControlsTemplate = (currentMonth) => `
    <div class="flex space-x-2">
        <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                onclick="app.calendarManager.changeCalendarMonth(-1)"
                title="Предыдущий месяц">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
        </button>
        <span class="bg-gray-100 w-64 text-center dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium">
            ${formatMonth(currentMonth)}
        </span>
        <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                onclick="app.calendarManager.changeCalendarMonth(1)"
                title="Следующий месяц">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
        </button>
    </div>
`;