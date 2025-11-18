/**
 * Шаблон страницы управления работами
 * @param {Object} jobsManager - экземпляр менеджера работ
 * @param {string} filterSection - HTML-разметка секции фильтров
 * @param {string} jobsList - HTML-разметка списка работ
 * @returns {string} HTML-разметка страницы работ
 */
export const jobsPageTemplate = (jobsManager, filterSection, jobsList) => `
    <div class="fade-in">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-3xl font-bold dark:text-white">⚙️ Управление работами</h2>
            <button class="new-job-btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                    onclick="app.jobsManager.openJobModal()">
                ⚙️ Новая работа
            </button>
        </div>
        
        <!-- Секция фильтров -->
        ${filterSection}
        
        <!-- Список работ -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            ${jobsList}
        </div>
    </div>
`;
