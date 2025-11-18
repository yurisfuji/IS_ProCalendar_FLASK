import { conflictModalTemplate } from '../../templates/jobs/conflictModalTemplate.js';

/**
 * Компонент модального окна конфликтов
 * Отвечает за управление модальными окнами разрешения конфликтов работ
 */
export class ConflictModal {
    /**
     * Конструктор компонента модального окна конфликтов
     * @param {Object} jobsManager - экземпляр менеджера работ
     */
    constructor(jobsManager) {
        this.jobsManager = jobsManager;
    }

    /**
     * Открывает модальное окно разрешения конфликтов
     * @param {Object} jobData - данные работы
     * @param {number|null} jobId - ID работы (null для новой работы)
     * @param {string} availableDate - доступная дата для размещения работы
     * @param {number} availableOffset - доступное смещение в часах
     */
    open(jobData, jobId, availableDate, availableOffset) {
        const modalHtml = conflictModalTemplate(availableDate, availableOffset);
        this.jobsManager.app.showModal(modalHtml);

        // Добавляем обработчики событий после отрисовки модального окна
        setTimeout(() => {
            this.bindConflictResolutionHandlers(jobData, jobId);
        }, 100);
    }

    /**
     * Привязывает обработчики событий для кнопок разрешения конфликтов
     * @param {Object} jobData - данные работы
     * @param {number|null} jobId - ID работы (null для новой работы)
     */
    bindConflictResolutionHandlers(jobData, jobId) {
        const buttons = document.querySelectorAll('.conflict-resolution-btn');

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const type = button.getAttribute('data-type');

                if (type === 'insert') {
                    this.jobsManager.resolveConflict('insert', jobData, jobId);
                } else if (type === 'move') {
                    const availableDate = button.getAttribute('data-available-date');
                    const availableOffset = parseFloat(button.getAttribute('data-available-offset'));
                    this.jobsManager.resolveConflict('move', jobData, jobId, availableDate, availableOffset);
                }
            });
        });
    }
}
