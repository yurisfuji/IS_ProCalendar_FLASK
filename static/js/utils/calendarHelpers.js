/**
 * Вспомогательные функции для работы с календарем
 */

/**
 * Форматирует месяц в читаемый вид (например "январь 2024")
 * @param {string} yearMonth - Строка в формате YYYY-MM
 * @returns {string} Отформатированное название месяца
 */
export const formatMonth = (yearMonth) => {
    const date = new Date(yearMonth + '-01');
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long'
    });
};

/**
 * Проверяет, является ли дата сегодняшним днем
 * @param {string} dateString - Дата в формате YYYY-MM-DD
 * @returns {boolean} true если это сегодня
 */
export const isToday = (dateString) => {
    const today = new Date().toISOString().slice(0, 10);
    return dateString === today;
};

/**
 * Форматирует дату в короткий вид (например "5 янв.")
 * @param {string} dateString - Дата в формате YYYY-MM-DD
 * @returns {string} Короткое представление даты
 */
export const formatShortDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short'
    });
};

/**
 * Возвращает описание для количества рабочих часов
 * @param {number} hours - Количество рабочих часов
 * @returns {string} Текстовое описание
 */
export const getHoursDescription = (hours) => {
    switch (hours) {
        case 0:
            return 'Выходной';
        case 8:
            return '8 часов';
        case 12:
            return '12 часов';
        case 24:
            return '24 часа';
        default:
            return `${hours} часов`;
    }
};

/**
 * Возвращает следующий режим рабочих часов по кругу
 * @param {number} currentHours - Текущее количество часов
 * @returns {number} Следующее количество часов
 */
export const getNextWorkHours = (currentHours) => {
    const hoursSequence = [0, 8, 12, 24];
    const currentIndex = hoursSequence.indexOf(currentHours);
    const nextIndex = (currentIndex + 1) % hoursSequence.length;
    return hoursSequence[nextIndex];
};