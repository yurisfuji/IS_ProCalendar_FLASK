import { calendarPageTemplate } from '../../templates/calendar/calendarPageTemplate.js';

/**
 * Компонент главной страницы календаря
 */
export class CalendarPage {
    /**
     * @param {Object} calendarManager - Экземпляр менеджера календаря
     */
    constructor(calendarManager) {
        this.calendarManager = calendarManager;
    }

    /**
     * Рендерит страницу календаря
     * @returns {Promise<string>} HTML разметка страницы
     */
    async render() {
        try {
            await this.calendarManager.loadCalendarData(this.calendarManager.currentMonth);
            return calendarPageTemplate(this.calendarManager);
        } catch (error) {
            console.error('Ошибка загрузки страницы календаря:', error);
            return this.renderError();
        }
    }

    /**
     * Рендерит страницу ошибки
     * @returns {string} HTML разметка ошибки
     */
    renderError() {
        return `
            <div class="text-center py-12">
                <div class="text-red-500 text-xl mb-4">❌ Ошибка загрузки календаря</div>
                <button onclick="app.navigateTo('calendar')" 
                        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                    Попробовать снова
                </button>
            </div>
        `;
    }
}