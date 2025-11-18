import { calendarDayTemplate } from './calendarDayTemplate.js';
import { getMonthStartOffset } from '../../utils/dateCalculations.js';

/**
 * Шаблон сетки календаря
 * @param {Array} days - Массив дней месяца
 * @param {string} currentMonth - Текущий месяц (YYYY-MM)
 * @param {string} selectedDate - Выбранная дата
 * @returns {string} HTML разметка сетки календаря
 */
export const calendarGridTemplate = (days, currentMonth, selectedDate) => {
    if (!days || days.length === 0) {
        return '<div class="col-span-7 text-center py-4 text-sm">Загрузка календаря...</div>';
    }

    const startOffset = getMonthStartOffset(currentMonth);
    let html = '';

    // Пустые ячейки в начале
    for (let i = 0; i < startOffset; i++) {
        html += '<div class="h-12 bg-transparent rounded"></div>';
    }

    // Дни месяца
    days.forEach(day => {
        html += calendarDayTemplate(day, selectedDate);
    });

    return html;
};

/**
 * Шаблон заголовков дней недели
 * @returns {string} HTML разметка заголовков
 */
export const weekDaysHeaderTemplate = () => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    return days.map(day => `
        <div class="text-center text-xs font-semibold dark:text-gray-300 py-1">
            ${day}
        </div>
    `).join('');
};