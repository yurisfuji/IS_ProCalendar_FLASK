import { calendarControlsTemplate } from './calendarControlsTemplate.js';
import { workHoursPanelTemplate } from './workHoursPanelTemplate.js';
import { serviceFunctionsTemplate } from './serviceFunctionsTemplate.js';
import { weekDaysHeaderTemplate, calendarGridTemplate } from './calendarGridTemplate.js';

/**
 * Главный шаблон страницы календаря
 * @param {Object} calendarManager - Экземпляр менеджера календаря
 * @returns {string} HTML разметка всей страницы
 */
export const calendarPageTemplate = (calendarManager) => {
    const selectedHours = calendarManager.getSelectedDateHours();

    return `
        <div class="fade-in">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-3xl font-bold dark:text-white">📅 Управление календарем</h2>
                ${calendarControlsTemplate(calendarManager.currentMonth)}
            </div>

            <!-- Компактный двухколоночный layout -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Левая колонка - управление -->
                <div class="lg:col-span-1 space-y-2">
                    ${workHoursPanelTemplate(selectedHours)}
                    ${serviceFunctionsTemplate()}
                </div>

                <!-- Правая колонка - календарь -->
                <div class="lg:col-span-2">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
                        <!-- Заголовки дней недели -->
                        <div class="grid grid-cols-7 gap-1 mb-2">
                            ${weekDaysHeaderTemplate()}
                        </div>
                        
                        <!-- Сетка дней -->
                        <div id="calendar-days-grid" class="grid grid-cols-7 gap-1">
                            ${calendarGridTemplate(
                                calendarManager.calendarData?.days, 
                                calendarManager.currentMonth, 
                                calendarManager.selectedDate
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};