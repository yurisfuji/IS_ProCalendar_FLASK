/**
 * Шаблон панели выбора рабочих часов
 * @param {number} selectedHours - Текущее количество выбранных часов
 * @returns {string} HTML разметка панели
 */
export const workHoursPanelTemplate = (selectedHours) => {
    const hoursOptions = [
        { hours: 0, color: 'red', text: 'Выходной' },
        { hours: 8, color: 'default', text: '8 ч.' },
        { hours: 12, color: 'yellow', text: '12 ч.' },
        { hours: 24, color: 'blue', text: '24 ч.' }
    ];

    return `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <label class="block text-sm font-medium dark:text-gray-300 mb-2">
                Выберите дату
            </label>
            <input type="date" 
                   id="calendar-date-picker"
                   class="w-full p-2 mb-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   onchange="app.calendarManager.selectDate(this.value)">

            <label class="block text-sm font-medium dark:text-gray-300 mb-2">
                Рабочие часы
            </label>
            <div class="grid grid-cols-4 gap-2">
                ${hoursOptions.map(item => {
                    const isSelected = selectedHours === item.hours;
                    const borderClass = isSelected ? 'border-2' : 'border';
                    let colorClasses = '';

                    switch (item.color) {
                        case 'red':
                            colorClasses = 'bg-red-500 hover:bg-red-600 text-white border-red-600';
                            break;
                        case 'yellow':
                            colorClasses = 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600';
                            break;
                        case 'blue':
                            colorClasses = 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600';
                            break;
                        default:
                            colorClasses = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600';
                    }

                    return `
                        <button class="work-hours-btn py-2 px-1 rounded ${borderClass} transition-colors text-sm ${colorClasses} ${
                        isSelected ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600' : ''
                    }"
                                onclick="app.calendarManager.setWorkHours(${item.hours})">
                            ${item.text}
                        </button>
                    `;
                }).join('')}
            </div>
        </div>
    `;
};