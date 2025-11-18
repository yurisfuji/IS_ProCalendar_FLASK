import {JobsPage} from '../components/jobs/JobsPage.js';
import {JobsList} from '../components/jobs/JobsList.js';
import {JobModal} from '../components/jobs/JobModal.js';
import {ConflictModal} from '../components/jobs/ConflictModal.js';
import {FilterSection} from '../components/jobs/FilterSection.js';

/**
 * Менеджер для работы с работами
 * Отвечает за управление работами, включая CRUD операции, фильтрацию, разрешение конфликтов и отображение
 */
export default class JobsManager {
    /**
     * Конструктор менеджера работ
     * @param {Object} app - Главный экземпляр приложения
     */
    constructor(app) {
        this.app = app;
        this.jobsData = null;
        this.jobsFilter = localStorage.getItem('lastJobsFilter') || '';
        this.filterTimeout = null;
        this.activeJobsTab = localStorage.getItem('lastActiveJobsTab') || 'all'; // all, planned, started, completed
        this.jobsEquipmentFilter = localStorage.getItem('lastJobsEquipmentFilter') || 'all';

        // Инициализируем компоненты
        this.jobsPage = new JobsPage(this);
        this.jobsList = new JobsList(this);
        this.jobModal = new JobModal(this);
        this.conflictModal = new ConflictModal(this);
        this.filterSection = new FilterSection(this);
    }

    /**
     * Рендерит страницу управления работами
     * @returns {Promise<string>} HTML-разметка страницы работ
     */
    async renderJobsPage() {
        return await this.jobsPage.render();
    }

    // === МЕТОДЫ ФИЛЬТРАЦИИ И ОТОБРАЖЕНИЯ ===

    /**
     * Рендерит секцию фильтров работ
     * @returns {string} HTML-разметка секции фильтров
     */
    renderFilterSection() {
        return this.filterSection.render();
    }

    /**
     * Переключает активную вкладку статусов работ
     * @param {string} tabName - название вкладки ('all', 'planned', 'started', 'completed')
     */
    switchJobsTab(tabName) {
        this.activeJobsTab = tabName;
        localStorage.setItem('lastActiveJobsTab', this.activeJobsTab);
        this.updateJobsList();
    }

    /**
     * Фильтрует работы по введенному тексту
     * @param {string} filterText - текст для фильтрации
     */
    filterJobs(filterText) {
        this.jobsFilter = filterText.toLowerCase().trim();
        localStorage.setItem('lastJobsFilter', this.jobsFilter);

        // Debounce для оптимизации
        clearTimeout(this.filterTimeout);
        this.filterTimeout = setTimeout(() => {
            this.updateJobsList();
        }, 300);
    }

    /**
     * Обновляет отображение списка работ
     */
    updateJobsList() {
        this.jobsList.update();
        this.filterSection.update(); // Используем метод компонента
    }

    /**
     * Очищает текущий фильтр работ
     */
    clearJobsFilter() {
        if (this.jobsFilter === '')
            this.activeJobsTab = "all";
        else
            this.jobsFilter = '';
        localStorage.removeItem('lastJobsFilter');
        this.updateJobsList();
    }

    /**
     * Фильтрует работы по оборудованию
     * @param {string} equipmentId - ID оборудования для фильтрации или 'all' для всех
     */
    filterJobsByEquipment(equipmentId) {
        this.jobsEquipmentFilter = equipmentId === 'all' ? 'all' : equipmentId.toString();
        localStorage.setItem('lastJobsEquipmentFilter', this.jobsEquipmentFilter);
        this.updateJobsList();
    }

    /**
     * Возвращает отфильтрованный список работ
     * @returns {Array} массив отфильтрованных работ
     */
    getFilteredJobs() {
        if (!this.jobsData || !this.jobsData.jobs) return [];

        let filtered = this.jobsData.jobs;

        // Фильтр по тексту (название заказа)
        if (this.jobsFilter) {
            filtered = filtered.filter(job =>
                job.order_name.toLowerCase().includes(this.jobsFilter)
            );
        }

        // Фильтр по оборудованию
        if (this.jobsEquipmentFilter !== 'all') {
            filtered = filtered.filter(job =>
                job.equipment_id.toString() === this.jobsEquipmentFilter
            );
        }

        // Фильтр по статусу
        if (this.activeJobsTab !== 'all') {
            filtered = filtered.filter(job => job.status === this.activeJobsTab);
        }

        return filtered;
    }

    // === МЕТОДЫ РАБОТЫ С ДАННЫМИ ===

    /**
     * Загружает данные работ с сервера
     * @throws {Error} Если не удалось загрузить данные
     */
    async loadJobsData() {
        const response = await fetch('/api/jobs');
        if (!response.ok) throw new Error('Failed to load jobs data');
        this.jobsData = await response.json();
    }

    /**
     * Возвращает уникальный список оборудования из работ
     * @returns {Array} массив уникального оборудования
     */
    getUniqueEquipment() {
        if (!this.jobsData || !this.jobsData.jobs) return [];

        const equipmentMap = new Map();
        this.jobsData.jobs.forEach(job => {
            if (job.equipment_id && job.equipment_name) {
                equipmentMap.set(job.equipment_id, {
                    id: job.equipment_id,
                    name: job.equipment_name
                });
            }
        });

        return Array.from(equipmentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    // === МЕТОДЫ РАБОТЫ С МОДАЛЬНЫМИ ОКНАМИ ===

    /**
     * Открывает модальное окно для создания/редактирования работы
     * @param {number|null} jobId - ID работы для редактирования (null для создания новой)
     * @param {number|null} presetEquipmentId - предустановленный ID оборудования
     * @param {string|null} presetStartDate - предустановленная дата начала
     */
    openJobModal(jobId = null, presetEquipmentId = null, presetStartDate = null) {
        this.jobModal.open(jobId, presetEquipmentId, presetStartDate);
    }

    // ... остальные методы (CRUD операции, разрешение конфликтов и т.д.) будут перенесены из оригинального кода ...

    /**
     * Добавляет новую работу
     */
    async addJob() {
        try {
            const form = document.getElementById('job-form');
            const formData = new FormData(form);

            const jobData = {
                order_id: parseInt(formData.get('order_id')),
                equipment_id: parseInt(formData.get('equipment_id')),
                duration_hours: parseFloat(formData.get('duration_hours')),
                hour_offset: parseFloat(formData.get('hour_offset')),
                start_date: formData.get('start_date'),
                status: formData.get('status'),
                is_locked: formData.get('is_locked') === 'on'
            };

            // Проверяем конфликты перед сохранением
            const conflictCheckResponse = await fetch('/api/jobs/check-conflicts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    equipment_id: jobData.equipment_id,
                    start_date: jobData.start_date,
                    hour_offset: jobData.hour_offset,
                    duration_hours: jobData.duration_hours,
                    only_check: true
                })
            });

            const conflictResult = await conflictCheckResponse.json();

            if (!conflictResult.has_conflicts) {
                // Конфликтов нет - сохраняем работу
                await this.saveJob(jobData, null);
            } else {
                // Есть конфликты - показываем окно выбора
                this.showConflictResolutionModal(jobData, null, conflictResult.available_date, conflictResult.available_offset);
            }

        } catch (error) {
            console.error('Ошибка добавления работы:', error);
            this.app.showNotification('❌ Ошибка при добавлении работы', 'error');
        }
    }

    /**
     * Обновляет существующую работу
     * @param {number} jobId - ID работы для обновления
     */
    async updateJob(jobId) {
        try {
            const form = document.getElementById('job-form');
            const formData = new FormData(form);

            const jobData = {
                order_id: parseInt(formData.get('order_id')),
                equipment_id: parseInt(formData.get('equipment_id')),
                duration_hours: parseFloat(formData.get('duration_hours')),
                hour_offset: parseFloat(formData.get('hour_offset')),
                start_date: formData.get('start_date'),
                status: formData.get('status'),
                is_locked: formData.get('is_locked') === 'on'
            };

            // Проверяем конфликты перед обновлением
            const conflictCheckResponse = await fetch('/api/jobs/check-conflicts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    equipment_id: jobData.equipment_id,
                    start_date: jobData.start_date,
                    hour_offset: jobData.hour_offset,
                    duration_hours: jobData.duration_hours,
                    job_id: jobId,
                    only_check: true
                })
            });

            const conflictResult = await conflictCheckResponse.json();

            if (!conflictResult.has_conflicts) {
                // Конфликтов нет - сохраняем работу
                await this.saveJob(jobData, jobId);
            } else {
                // Есть конфликты - показываем окно выбора
                this.showConflictResolutionModal(jobData, jobId, conflictResult.available_date, conflictResult.available_offset);
            }

        } catch (error) {
            console.error('Ошибка обновления работы:', error);
            this.app.showNotification('❌ Ошибка при обновлении работы', 'error');
        }
    }

    /**
     * Изменяет статус работы
     * @param {number} jobId - ID работы для изменения статуса
     */
    async changeJobStatus(jobId) {
        try {
            const currentJobStatus = this.jobsData.jobs.find(j => j.id === jobId).status;
            const jobStatuses = ['planned', 'started', 'completed']
            const newStatus = jobStatuses[(jobStatuses.indexOf(currentJobStatus) + 1) % jobStatuses.length]

            const response = await fetch(`/api/jobs/${jobId}/status`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({status: newStatus})
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification('✅ Статус работы обновлен!', 'success');

                // СОЗДАЕМ СНИМОК ИСТОРИИ ПОСЛЕ УДАЛЕНИЯ
                await this.createHistorySnapshot('Изменение статуса работы', ``);

                await this.loadJobsData();

                this.app.loadPage('jobs');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка изменения статуса работы:', error);
            this.app.showNotification('❌ Ошибка при изменении статуса', 'error');
        }
    }

    /**
     * Удаляет работу после подтверждения
     * @param {number} jobId - ID работы для удаления
     */
    async deleteJob(jobId) {
        if (!confirm('Вы уверены, что хотите удалить эту работу?')) return;

        try {
            const response = await fetch(`/api/jobs/${jobId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification('✅ Работа удалена!', 'success');

                // СОЗДАЕМ СНИМОК ИСТОРИИ ПОСЛЕ УДАЛЕНИЯ
                await this.createHistorySnapshot('Удаление работы', ``);

                await this.loadJobsData();
                this.app.loadPage(this.app.currentPage);
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления работы:', error);
            this.app.showNotification('❌ Ошибка при удалении работы', 'error');
        }
    }

    /**
     * Сохраняет работу (общая логика для добавления и обновления)
     * @param {Object} jobData - данные работы
     * @param {number|null} jobId - ID работы (null для новой работы)
     */
    async saveJob(jobData, jobId) {
        try {
            const url = jobId ? `/api/jobs/${jobId}` : '/api/jobs';
            const method = jobId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jobData)
            });

            const result = await response.json();

            if (result.success) {
                //this.app.showNotification(jobId ? '✅ Работа обновлена!' : '✅ Работа добавлена!', 'success');
                this.app.closeModal();

                // СОЗДАЕМ СНИМОК ИСТОРИИ ПОСЛЕ СОХРАНЕНИЯ
                await this.createHistorySnapshot(
                    jobId ? 'Обновление работы' : 'Создание работы',
                    `${jobId ? 'Обновлена' : 'Создана'} работа: ${result.job.order_name} → ${result.job.equipment_name}`
                );

                // Обновляем данные
                await this.loadJobsData();

                // Обновляем интерфейс в зависимости от текущей страницы
                if (this.app.currentPage === 'jobs') {
                    this.app.loadPage('jobs');
                } else if (this.app.currentPage === 'gantt') {
                    this.app.ganttManager.applyGanttSettings();
                }
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка сохранения работы:', error);
            this.app.showNotification('❌ Ошибка при сохранении работы', 'error');
        }
    }

    /**
     * Показывает модальное окно разрешения конфликтов
     * @param {Object} jobData - данные работы
     * @param {number|null} jobId - ID работы (null для новой работы)
     * @param {string} availableDate - доступная дата
     * @param {number} availableOffset - доступное смещение
     */
    showConflictResolutionModal(jobData, jobId, availableDate, availableOffset) {
        this.conflictModal.open(jobData, jobId, availableDate, availableOffset);
    }

    /**
     * Разрешает конфликт работ
     * @param {string} resolutionType - тип разрешения ('insert' или 'move')
     * @param {Object} jobData - данные работы
     * @param {number|null} jobId - ID работы (null для новой работы)
     * @param {string|null} availableDate - доступная дата (только для 'move')
     * @param {number|null} availableOffset - доступное смещение (только для 'move')
     */
    async resolveConflict(resolutionType, jobData, jobId, availableDate = null, availableOffset = null) {
        try {
            let finalJobData = {...jobData};

            if (resolutionType === 'insert') {
                // Вклинить работу, подвинув остальные
                const response = await fetch('/api/jobs/check-conflicts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        equipment_id: jobData.equipment_id,
                        start_date: jobData.start_date,
                        hour_offset: jobData.hour_offset,
                        duration_hours: jobData.duration_hours,
                        job_id: jobId,
                        only_check: false // Устраняем конфликты
                    })
                });

                const result = await response.json();

                if (result.success) {
                    // Сохраняем работу с исходными параметрами
                    await this.saveJob(finalJobData, jobId);
                } else {
                    this.app.showNotification(`❌ ${result.error}`, 'error');
                    return;
                }

            } else if (resolutionType === 'move') {
                // Добавить на первое свободное время
                finalJobData.start_date = availableDate;
                finalJobData.hour_offset = availableOffset;
                await this.saveJob(finalJobData, jobId);
            }

            this.app.closeModal();

        } catch (error) {
            console.error('Ошибка разрешения конфликта:', error);
            this.app.showNotification('❌ Ошибка при разрешении конфликта', 'error');
        }
    }

    /**
     * Создает снимок истории изменений
     * @param {string} action - действие для записи в историю
     * @param {string} description - описание действия
     */
    async createHistorySnapshot(action, description) {
        try {
            const response = await fetch('/api/history/snapshot', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    description: `${action}: ${description}`
                })
            });

            const result = await response.json();

            if (result.success) {
                // Обновляем состояние истории в интерфейсе
                if (this.app.historyManager) {
                    this.app.historyManager.updateHistoryState();
                }
            }

            return result;
        } catch (error) {
            console.error('Ошибка создания снимка истории:', error);
            return {success: false};
        }
    }

    /**
     * Обновляет детали работы по ID
     * @param {number} jobId - ID работы для обновления деталей
     */
    async updateJobDetailsById(jobId) {
        const jobResponse = await fetch(`/api/jobs/${jobId}`);
        if (jobResponse.ok) {
            const jobResult = await jobResponse.json();
            if (jobResult.success) {
                await this.app.updateJobDetails(jobResult.job);
            }
        }
    }

}