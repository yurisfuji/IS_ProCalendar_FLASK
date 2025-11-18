import { jobsPageTemplate } from '../../templates/jobs/jobsPageTemplate.js';

/**
 * Компонент страницы управления работами
 * Отвечает за рендеринг основной страницы работ
 */
export class JobsPage {
    /**
     * Конструктор компонента страницы работ
     * @param {Object} jobsManager - экземпляр менеджера работ
     */
    constructor(jobsManager) {
        this.jobsManager = jobsManager;
    }

    /**
     * Рендерит страницу работ
     * @returns {Promise<string>} HTML-разметка страницы работ
     */
    async render() {
        try {
            await this.jobsManager.loadJobsData();

            const filterSection = this.jobsManager.renderFilterSection();
            const jobsList = this.jobsManager.jobsList.render(this.jobsManager.getFilteredJobs());

            return jobsPageTemplate(this.jobsManager, filterSection, jobsList);
        } catch (error) {
            console.error('Ошибка загрузки страницы работ:', error);
            return this.renderError();
        }
    }

    /**
     * Рендерит сообщение об ошибке
     * @returns {string} HTML-разметка ошибки
     */
    renderError() {
        return `
            <div class="text-center py-12">
                <div class="text-red-500 text-xl mb-4">❌ Ошибка загрузки работ</div>
                <button onclick="app.navigateTo('jobs')" 
                        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                    Попробовать снова
                </button>
            </div>
        `;
    }
}