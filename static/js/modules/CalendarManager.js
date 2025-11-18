import { CalendarPage } from '../components/calendar/CalendarPage.js';
import { CalendarGrid } from '../components/calendar/CalendarGrid.js';
import { WorkHoursPanel } from '../components/calendar/WorkHoursPanel.js';
import {
    formatShortDate,
    getHoursDescription,
    getNextWorkHours
} from '../utils/calendarHelpers.js';

/**
 * Главный менеджер для работы с календарем
 * Отвечает за управление календарем, включая отображение, настройку рабочих часов и массовые операции
 */
export default class CalendarManager {
    /**
     * Конструктор менеджера календаря
     * @param {Object} app - Главный экземпляр приложения
     */
    constructor(app) {
        this.app = app;
        this.currentMonth = localStorage.getItem('currentMonth') || new Date().toISOString().slice(0, 7); // YYYY-MM
        this.selectedDate = this.currentMonth + "-01"; // YYYY-MM-DD
        this.calendarData = null;

        // Инициализируем компоненты
        this.calendarPage = new CalendarPage(this);
        this.calendarGrid = new CalendarGrid(this);
        this.workHoursPanel = new WorkHoursPanel(this);
    }

    // === ОСНОВНЫЕ МЕТОДЫ РЕНДЕРИНГА ===

    /**
     * Рендерит страницу управления календарем
     * @returns {Promise<string>} HTML-разметка страницы календаря
     */
    async renderCalendarPage() {
        return await this.calendarPage.render();
    }

    // === МЕТОДЫ РАБОТЫ С ДАННЫМИ ===

    /**
     * Загружает данные календаря для указанного месяца с сервера
     * @param {string} yearMonth - Месяц в формате YYYY-MM
     * @throws {Error} Если не удалось загрузить данные
     */
    async loadCalendarData(yearMonth) {
        const response = await fetch(`/api/calendar/month/${yearMonth}`);
        if (!response.ok) throw new Error('Failed to load calendar data');
        this.calendarData = await response.json();
    }

    /**
     * Возвращает количество рабочих часов для выбранной даты
     * @returns {number} Количество рабочих часов (по умолчанию 8)
     */
    getSelectedDateHours() {
        if (!this.calendarData || !this.calendarData.days) return 8;

        const selectedDay = this.calendarData.days.find(day => day.date === this.selectedDate);
        return selectedDay ? selectedDay.work_hours : 8;
    }

    /**
     * Возвращает количество рабочих часов для конкретной даты
     * @param {string} date - Дата в формате YYYY-MM-DD
     * @returns {number} Количество рабочих часов
     */
    getDayWorkHours(date) {
        if (!this.calendarData || !this.calendarData.days) return 8;

        const day = this.calendarData.days.find(d => d.date === date);
        return day ? day.work_hours : 8;
    }

    // === МЕТОДЫ ВЗАИМОДЕЙСТВИЯ С ПОЛЬЗОВАТЕЛЕМ ===

    /**
     * Обрабатывает выбор даты пользователем
     * @param {string} date - Выбранная дата в формате YYYY-MM-DD
     */
    selectDate(date) {
        this.selectedDate = date;
        this.updateUI();
    }

    /**
     * Обрабатывает клик по дню календаря (одинарный клик - выбор)
     * @param {string} date - Дата кликнутого дня
     */
    async handleDayClick(date) {
        this.selectedDate = date;
        this.updateUI();
    }

    /**
     * Обрабатывает двойной клик по дню календаря (циклическое переключение рабочих часов)
     * @param {string} date - Дата кликнутого дня
     */
    async cycleWorkHours(date) {
        const currentHours = this.getDayWorkHours(date);
        const nextHours = getNextWorkHours(currentHours);

        await this.updateSingleDay(date, nextHours);

        // Обновляем UI если это выбранная дата
        if (date === this.selectedDate) {
            this.workHoursPanel.updateButtons();
        }

        this.app.showNotification(`${formatShortDate(date)}: ${getHoursDescription(nextHours)}`, 'info');
    }

    /**
     * Устанавливает рабочие часы для выбранной даты
     * @param {number} hours - Количество рабочих часов (0, 8, 12, 24)
     */
    async setWorkHours(hours) {
        await this.updateSingleDay(this.selectedDate, hours);
        this.app.showNotification(
            `${formatShortDate(this.selectedDate)}: ${getHoursDescription(hours)}`,
            'info'
        );
    }

    /**
     * Изменяет отображаемый месяц календаря
     * @param {number} direction - Направление: -1 (предыдущий), 1 (следующий)
     */
    async changeCalendarMonth(direction) {
        const current = new Date(this.currentMonth + '-01');
        current.setMonth(current.getMonth() + direction);
        this.currentMonth = current.toISOString().slice(0, 7);

        // Устанавливаем выбранную дату на первое число нового месяца
        this.selectedDate = this.currentMonth + '-01';
        localStorage.setItem("currentMonth", this.currentMonth);

        await this.app.loadPage('calendar');
    }

    // === СЕРВИСНЫЕ ФУНКЦИИ (МАССОВЫЕ ОПЕРАЦИИ) ===

    /**
     * Устанавливает все воскресенья текущего месяца как выходные
     */
    async setAllSundaysOff() {
        try {
            const response = await fetch(`/api/calendar/month/${this.currentMonth}/set-sundays-off`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification(
                    `✅ ${result.updated_dates} воскресений установлены как выходные`,
                    'success'
                );
                await this.loadCalendarData(this.currentMonth);
                this.app.loadPage('calendar');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка установки воскресений как выходных:', error);
            this.app.showNotification('❌ Ошибка при настройке воскресений', 'error');
        }
    }

    /**
     * Устанавливает все субботы текущего месяца как выходные
     */
    async setAllSaturdaysOff() {
        try {
            const response = await fetch(`/api/calendar/month/${this.currentMonth}/set-saturdays-off`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification(
                    `✅ ${result.updated_dates} суббот установлены как выходные`,
                    'success'
                );
                await this.loadCalendarData(this.currentMonth);
                this.app.loadPage('calendar');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка установки суббот как выходных:', error);
            this.app.showNotification('❌ Ошибка при настройке суббот', 'error');
        }
    }

    /**
     * Сбрасывает все настройки месяца и устанавливает все дни как рабочие по 8 часов
     */
    async setAllDays8Hours() {
        try {
            const response = await fetch(`/api/calendar/month/${this.currentMonth}/set-all-8hours`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification(
                    `✅ Удалено ${result.deleted_records} записей, все дни установлены по 8 часов`,
                    'success'
                );
                await this.loadCalendarData(this.currentMonth);
                this.app.loadPage('calendar');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка сброса настроек месяца:', error);
            this.app.showNotification('❌ Ошибка при сбросе настроек месяца', 'error');
        }
    }

    // === МЕТОДЫ ОБНОВЛЕНИЯ ИНТЕРФЕЙСА ===

    /**
     * Обновляет все элементы интерфейса календаря
     */
    updateUI() {
        this.workHoursPanel.updateDatePicker();
        this.updateDaySelection();
        this.workHoursPanel.updateButtons();
    }

    /**
     * Обновляет выделение дней в календаре
     */
    updateDaySelection() {
        const dayElements = document.querySelectorAll('#calendar-days-grid > div');

        dayElements.forEach(element => {
            // Пропускаем пустые ячейки (без даты)
            const date = this.extractDateFromElement(element);
            if (!date) return;

            // Снимаем выделение со всех дней
            element.classList.remove('border-2', 'border-purple-500', 'dark:border-purple-400');

            // Восстанавливаем оригинальные классы границ
            const dayData = this.calendarData.days.find(d => d.date === date);
            if (dayData) {
                this.restoreDayBorderStyles(element, dayData.work_hours);
            }

            // Добавляем обычный border если его нет
            if (!element.classList.contains('border')) {
                element.classList.add('border');
            }
        });

        // Добавляем выделение выбранному дню
        const selectedElement = this.calendarGrid.findDayElement(this.selectedDate);
        if (selectedElement) {
            selectedElement.classList.remove('border');
            selectedElement.classList.add('border-2', 'border-purple-500', 'dark:border-purple-400');
        }
    }

    /**
     * Восстанавливает стили границы для элемента дня
     * @param {HTMLElement} element - Элемент дня
     * @param {number} workHours - Количество рабочих часов
     */
    restoreDayBorderStyles(element, workHours) {
        // Удаляем все возможные классы границ
        const borderClasses = [
            'border-red-300', 'dark:border-red-700',
            'border-gray-300', 'dark:border-gray-600',
            'border-yellow-300', 'dark:border-yellow-700',
            'border-blue-300', 'dark:border-blue-700',
            'border-gray-400', 'dark:border-gray-600'
        ];
        borderClasses.forEach(className => element.classList.remove(className));

        // Добавляем правильные классы границ
        const correctBorderClasses = this.getDayBorderClasses(workHours);
        correctBorderClasses.forEach(className => element.classList.add(className));
    }

    /**
     * Возвращает классы границы для дня в зависимости от рабочих часов
     * @param {number} hours - Количество рабочих часов
     * @returns {Array} Массив классов границы
     */
    getDayBorderClasses(hours) {
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
    }

    // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===

    /**
     * Обновляет данные одного дня на сервере и в интерфейсе
     * @param {string} date - Дата для обновления
     * @param {number} hours - Новое количество рабочих часов
     */
    async updateSingleDay(date, hours = null) {
        try {
            // Если переданы часы - обновляем на сервере
            if (hours !== null) {
                const response = await fetch(`/api/calendar/date/${date}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ work_hours: hours })
                });

                if (!response.ok) throw new Error('Failed to update date');
            }

            // Перезагружаем данные календаря
            await this.loadCalendarData(this.currentMonth);

            // Обновляем элемент дня в DOM
            this.calendarGrid.updateSingleDay(date);

        } catch (error) {
            console.error('Ошибка обновления дня:', error);
            this.app.showNotification('❌ Ошибка при обновлении дня', 'error');
        }
    }

    /**
     * Извлекает дату из элемента дня календаря
     * @param {HTMLElement} element - Элемент дня
     * @returns {string|null} Дата в формате YYYY-MM-DD или null
     */
    extractDateFromElement(element) {
        const onclickAttr = element.getAttribute('onclick');
        if (onclickAttr) {
            const match = onclickAttr.match(/handleDayClick\('([^']+)'\)/);
            return match ? match[1] : null;
        }
        return null;
    }
}