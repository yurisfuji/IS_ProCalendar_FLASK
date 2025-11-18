/**
 * Шаблон сервисных функций календаря
 * @returns {string} HTML разметка сервисных кнопок
 */
export const serviceFunctionsTemplate = () => `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
        <div class="space-y-2">
            <button class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded transition-colors text-sm flex items-center justify-center space-x-2"
                    onclick="app.calendarManager.setAllSundaysOff()"
                    title="Установить все воскресенья как выходные">
                <span>📅</span>
                <span>Все воскресенья - выходные</span>
            </button>
            
            <button class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded transition-colors text-sm flex items-center justify-center space-x-2"
                    onclick="app.calendarManager.setAllSaturdaysOff()"
                    title="Установить все субботы как выходные">
                <span>📅</span>
                <span>Все субботы - выходные</span>
            </button>
            
            <button class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded transition-colors text-sm flex items-center justify-center space-x-2"
                    onclick="app.calendarManager.setAllDays8Hours()"
                    title="Сбросить все настройки и установить 8-часовой рабочий день">
                <span>🔄</span>
                <span>Все дни рабочие - по 8 часов</span>
            </button>
        </div>
    </div>
`;