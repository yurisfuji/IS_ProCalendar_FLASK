import { jobsListTemplate } from '../../templates/jobs/jobsListTemplate.js';
import { JobItem } from './JobItem.js';

/**
 * Компонент списка работ
 * Отвечает за рендеринг и управление списком работ
 */
export class JobsList {
    /**
     * Конструктор компонента списка работ
     * @param {Object} jobsManager - экземпляр менеджера работ
     */
    constructor(jobsManager) {
        this.jobsManager = jobsManager;
    }

    /**
     * Рендерит список работ
     * @param {Array} jobs - массив работ для отображения
     * @returns {string} HTML-разметка списка работ
     */
    render(jobs) {
        const containerHtml = jobsListTemplate(jobs, this.jobsManager);

        // Если есть работы, рендерим элементы после вставки в DOM
        if (jobs.length > 0) {
            setTimeout(() => {
                this.renderJobItems(jobs);
            }, 0);
        }

        return containerHtml;
    }

    /**
     * Рендерит элементы работ в контейнере
     * @param {Array} jobs - массив работ для отображения
     */
    renderJobItems(jobs) {
        const container = document.getElementById('jobs-list-items');
        if (container) {
            const jobsHtml = jobs.map(job => {
                const jobItem = new JobItem(job, this.jobsManager);
                return jobItem.render();
            }).join('');

            container.innerHTML = jobsHtml;
        }
    }

    /**
     * Обновляет отображение списка работ
     */
    update() {
        const jobsContainer = document.querySelector('.bg-white.dark\\:bg-gray-800:last-child');
        if (jobsContainer) {
            const filteredJobs = this.jobsManager.getFilteredJobs();
            jobsContainer.innerHTML = this.render(filteredJobs);
        }
    }
}
