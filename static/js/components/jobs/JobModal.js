import { jobModalTemplate } from '../../templates/jobs/jobModalTemplate.js';

/**
 * Компонент модального окна работы
 * Отвечает за управление модальными окнами создания/редактирования работ
 */
export class JobModal {
    /**
     * Конструктор компонента модального окна работы
     * @param {Object} jobsManager - экземпляр менеджера работ
     */
    constructor(jobsManager) {
        this.jobsManager = jobsManager;
    }

    /**
     * Открывает модальное окно для создания/редактирования работы
     * @param {number|null} jobId - ID работы для редактирования (null для создания новой)
     * @param {number|null} presetEquipmentId - предустановленный ID оборудования
     * @param {string|null} presetStartDate - предустановленная дата начала
     */
    async open(jobId = null, presetEquipmentId = null, presetStartDate = null) {
        try {
            await this.jobsManager.app.updateJobDetails(null);

            // Загружаем данные для выпадающих списков
            const [ordersResponse, equipmentResponse] = await Promise.all([
                fetch('/api/orders/list'),
                fetch('/api/equipment/list')
            ]);

            if (!ordersResponse.ok || !equipmentResponse.ok) {
                throw new Error('Failed to load form data');
            }

            const ordersData = await ordersResponse.json();
            const equipmentData = await equipmentResponse.json();

            let jobData = null;
            if (jobId) {
                // Загружаем данные работы для редактирования
                const jobResponse = await fetch(`/api/jobs/${jobId}`);
                if (jobResponse.ok) {
                    const jobResult = await jobResponse.json();
                    if (jobResult.success) {
                        jobData = jobResult.job;
                    }
                }
            }

            // Используем предустановленные значения если переданы
            const finalEquipmentId = presetEquipmentId || jobData?.equipment_id;
            const finalStartDate = presetStartDate || jobData?.start_date || this.jobsManager.app.getTodayDate();

            const modalHtml = jobModalTemplate(
                jobData,
                ordersData.orders,
                equipmentData.equipment,
                finalEquipmentId,
                finalStartDate
            );

            this.jobsManager.app.showModal(modalHtml);

        } catch (error) {
            console.error('Ошибка загрузки формы работы:', error);
            this.jobsManager.app.showNotification('❌ Ошибка загрузки формы', 'error');
        }
    }
}
