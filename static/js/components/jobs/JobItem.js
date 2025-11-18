import { jobItemTemplate } from '../../templates/jobs/jobItemTemplate.js';

/**
 * Компонент элемента работы
 * Отвечает за рендеринг отдельного элемента работы
 */
export class JobItem {
    /**
     * Конструктор компонента элемента работы
     * @param {Object} job - данные работы
     * @param {Object} jobsManager - экземпляр менеджера работ
     */
    constructor(job, jobsManager) {
        this.job = job;
        this.jobsManager = jobsManager;
    }

    /**
     * Рендерит элемент работы
     * @returns {string} HTML-разметка элемента работы
     */
    render() {
        return jobItemTemplate(this.job, this.jobsManager.app);
    }
}
