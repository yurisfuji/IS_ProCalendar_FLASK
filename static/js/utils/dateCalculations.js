/**
 * Функции для вычислений с датами
 */

/**
 * Вычисляет смещение для первого дня месяца (сколько пустых ячеек в начале)
 * @param {string} yearMonth - Строка в формате YYYY-MM
 * @returns {number} Количество пустых ячеек (0-6)
 */
export const getMonthStartOffset = (yearMonth) => {
    const firstDay = new Date(yearMonth + '-01');
    return (firstDay.getDay() + 6) % 7; // Преобразуем воскресенье (0) в 6, понедельник (1) в 0 и т.д.
};

/**
 * Проверяет, является ли день выходным (суббота или воскресенье)
 * @param {string} dateString - Дата в формате YYYY-MM-DD
 * @returns {boolean} true если выходной
 */
export const isWeekend = (dateString) => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 - воскресенье, 6 - суббота
};