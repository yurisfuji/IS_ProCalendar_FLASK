/**
 * Шаблон списка работ
 * @param {Array} jobs - массив работ для отображения
 * @param {Object} jobsManager - экземпляр менеджера работ
 * @returns {string} HTML-разметка списка работ
 */
export const jobsListTemplate = (jobs, jobsManager) => {
    if (jobs.length === 0) {
        return jobsManager.jobsData.jobs.length === 0 ?
            '<div class="text-center py-8">' +
            '<p class="text-gray-500 dark:text-gray-400 text-sm mb-3">Работы не найдены</p>' +
            '<button onclick="app.jobsManager.openJobModal()" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">' +
            '⚙️ Новая работа' +
            '</button>' +
            '</div>' :
            '<div class="text-center py-8">' +
            '<p class="text-gray-500 dark:text-gray-400 text-sm mb-3">Работы по фильтру не найдены</p>' +
            '<button onclick="app.jobsManager.clearJobsFilter()" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">' +
            'Очистить фильтр' +
            '</button>' +
            '</div>';
    } else {
        // Контейнер для элементов работ (рендерится отдельно)
        return `<div id="jobs-list-items" class="space-y-2"></div>`;
    }
};
