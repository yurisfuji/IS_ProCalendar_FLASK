/**
 * Вспомогательные функции для стилей
 */

/**
 * Возвращает классы границы для дня в зависимости от рабочих часов
 * @param {number} hours - Количество рабочих часов
 * @returns {Array} Массив классов границы
 */
export const getDayBorderClasses = (hours) => {
    switch (hours) {
        case 0:
            return ['border-red-300', 'dark:border-red-700'];
        case 8:
            return ['border-gray-300', 'dark:border-gray-600'];
        case 12:
            return ['border-yellow-300', 'dark:border-yellow-700'];
        case 24:
            return ['border-blue-300', 'dark:border-blue-700'];
        default:
            return ['border-gray-400', 'dark:border-gray-600'];
    }
};