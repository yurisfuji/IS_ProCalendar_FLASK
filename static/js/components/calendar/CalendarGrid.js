import { calendarGridTemplate } from '../../templates/calendar/calendarGridTemplate.js';

/**
 * Компонент сетки календаря
 */
export class CalendarGrid {
    /**
     * @param {Object} calendarManager - Экземпляр менеджера календаря
     */
    constructor(calendarManager) {
        this.calendarManager = calendarManager;
    }

    /**
     * Рендерит сетку дней календаря
     * @returns {string} HTML разметка сетки
     */
    render() {
        return calendarGridTemplate(
            this.calendarManager.calendarData?.days,
            this.calendarManager.currentMonth,
            this.calendarManager.selectedDate
        );
    }

    /**
     * Обновляет сетку дней в DOM
     */
    update() {
        const gridContainer = document.getElementById('calendar-days-grid');
        if (gridContainer) {
            gridContainer.innerHTML = this.render();
        }
    }

    /**
     * Обновляет только один день в сетке
     * @param {string} date - Дата для обновления (YYYY-MM-DD)
     */
    updateSingleDay(date) {
        const dayElement = this.findDayElement(date);
        if (dayElement) {
            const dayData = this.calendarManager.calendarData.days.find(d => d.date === date);
            if (dayData) {
                // Импортируем шаблон дня динамически чтобы избежать циклических зависимостей
                import('../../templates/calendar/calendarDayTemplate.js')
                    .then(module => {
                        const newElementHtml = module.calendarDayTemplate(dayData, this.calendarManager.selectedDate);
                        dayElement.outerHTML = newElementHtml;
                    });
            }
        }
    }

    /**
     * Находит элемент дня в DOM по дате
     * @param {string} date - Дата для поиска (YYYY-MM-DD)
     * @returns {HTMLElement|null} Найденный элемент или null
     */
    findDayElement(date) {
        const dayElements = document.querySelectorAll('#calendar-days-grid > div');
        for (let element of dayElements) {
            if (element.onclick && element.onclick.toString().includes(date)) {
                return element;
            }
        }
        return null;
    }
}