import { getDayBorderClasses } from '../../utils/styleHelpers.js';
import { isToday } from '../../utils/calendarHelpers.js';

/**
 * Шаблон для отображения одного дня календаря
 * @param {Object} day - Данные дня
 * @param {string} selectedDate - Выбранная дата
 * @returns {string} HTML разметка дня
 */
export const calendarDayTemplate = (day, selectedDate) => {
    const date = new Date(day.date);
    const isTodayFlag = isToday(day.date);
    const isSelected = day.date === selectedDate;

    // Определяем цвета в зависимости от рабочих часов
    const { bgColor, textColor } = getDayColors(day.work_hours);

    // Получаем классы границы
    const borderClasses = getDayBorderClasses(day.work_hours);

    // Выделение выбранного дня
    let borderClass = borderClasses.join(' ') + ' border';
    if (isSelected) {
        borderClass = 'border-2 border-purple-500 dark:border-purple-400';
    }

    return `
        <div class="h-12 ${bgColor} ${borderClass} rounded cursor-pointer hover:shadow-lg hover:scale-105 transition-all relative group select-none"
             onclick="app.calendarManager.handleDayClick('${day.date}')"
             ondblclick="app.calendarManager.cycleWorkHours('${day.date}')">
            <!-- Число дня -->
            <div class="flex justify-between items-start p-1">
                <span class="text-xs font-bold ${textColor} select-none">${date.getDate()}</span>
            </div>
            
            <!-- Индикатор рабочих часов -->
            <div class="absolute bottom-1 left-1 right-1 flex justify-center">
                <div class="text-lg font-bold ${textColor} select-none pointer-events-none calendar-hours">
                    ${day.work_hours}ч
                </div>
            </div>
        </div>
    `;
};

/**
 * Возвращает цвета для дня в зависимости от рабочих часов
 * @param {number} workHours - Количество рабочих часов
 * @returns {Object} Объект с классами цветов
 */
const getDayColors = (workHours) => {
    switch (workHours) {
        case 0:
            return {
                bgColor: 'bg-red-100 dark:bg-red-900',
                textColor: 'text-red-800 dark:text-red-200'
            };
        case 8:
            return {
                bgColor: 'bg-white dark:bg-gray-700',
                textColor: 'text-gray-900 dark:text-white'
            };
        case 12:
            return {
                bgColor: 'bg-yellow-100 dark:bg-yellow-900',
                textColor: 'text-yellow-800 dark:text-yellow-200'
            };
        case 24:
            return {
                bgColor: 'bg-blue-100 dark:bg-blue-900',
                textColor: 'text-blue-800 dark:text-blue-200'
            };
        default:
            return {
                bgColor: 'bg-gray-100 dark:bg-gray-800',
                textColor: 'text-gray-700 dark:text-gray-300'
            };
    }
};