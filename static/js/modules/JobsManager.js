export default class JobsManager {
    constructor(app) {
        this.app = app;
        this.jobsData = null;
        this.jobsFilter = localStorage.getItem('lastJobsFilter') || '';
        this.filterTimeout = null;
        this.activeJobsTab = 'all'; // all, planned, started, completed
        // Восстанавливаем активную вкладку оборудования
        this.jobsEquipmentFilter = localStorage.getItem('lastJobsEquipmentFilter') || 'all';
    }

    async renderJobsPage() {
        try {
            // Загружаем данные работ
            await this.loadJobsData();

            return `
                <div class="fade-in">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-3xl font-bold dark:text-white">⚙️ Управление работами</h2>
                        <button class="new-job-btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                                onclick="app.jobsManager.openJobModal()">
                            ⚙️ Новая работа
                        </button>
                    </div>
                    
                    <!-- Фильтр работ -->
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="text-sm font-semibold dark:text-white">Фильтр работ</h4>
                            <span class="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                                Показано: <strong>${this.getFilteredJobs().length}</strong> из <strong>${this.jobsData.jobs.length}</strong>
                            </span>
                        </div>
                        <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                            <!-- Текстовый фильтр -->
                            <div class="flex-1">
                                <input type="text" 
                                       id="jobs-filter-input"
                                       placeholder="Введите название заказа или оборудования..."
                                       value="${this.jobsFilter}"
                                       class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                       oninput="app.jobsManager.filterJobs(this.value)">
                            </div>
                            ${this.jobsFilter || this.activeJobsTab !== 'all' ? `
                                <button onclick="app.jobsManager.clearJobsFilter()"
                                        class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded transition-colors">
                                    ❎
                                </button>
                            ` : ''}
                            <!-- Фильтр по оборудованию -->
                            <div>
                                <select id="jobs-equipment-filter"
                                        class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        onchange="app.jobsManager.filterJobsByEquipment(this.value)">
                                    <option value="all" ${this.jobsEquipmentFilter === 'all' ? 'selected' : ''}>Все оборудование</option>
                                    ${this.getUniqueEquipment().map(eq => `
                                        <option value="${eq.id}" ${this.jobsEquipmentFilter === eq.id.toString() ? 'selected' : ''}>
                                            ${eq.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <!-- Вкладки статусов -->
                            <div class="flex     space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                                <button class="tab-button ${this.activeJobsTab === 'all' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} px-3 py-1 rounded-md text-xs transition-colors"
                                        onclick="app.jobsManager.switchJobsTab('all')">
                                    Все
                                </button>
                                <button class="tab-button ${this.activeJobsTab === 'planned' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} px-3 py-1 rounded-md text-xs transition-colors"
                                        onclick="app.jobsManager.switchJobsTab('planned')">
                                    📅 Запланированы
                                </button>
                                <button class="tab-button ${this.activeJobsTab === 'started' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} px-3 py-1 rounded-md text-xs transition-colors"
                                        onclick="app.jobsManager.switchJobsTab('started')">
                                    ⚙️ В работе
                                </button>
                                <button class="tab-button ${this.activeJobsTab === 'completed' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} px-3 py-1 rounded-md text-xs transition-colors"
                                        onclick="app.jobsManager.switchJobsTab('completed')">
                                    ✅ Завершены
                                </button>
                            </div>

                        </div>
                    </div>
                    
                    <!-- Список работ -->
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                        ${this.getFilteredJobs().length === 0 ?
                this.jobsData.jobs.length === 0 ?
                    '<div class="text-center py-8">' +
                    '<p class="text-gray-500 dark:text-gray-400 text-sm mb-3">Работы не найдены</p>' +
                    '</div>' :
                    '<div class="text-center py-8">' +
                    '<p class="text-gray-500 dark:text-gray-400 text-sm mb-3">Работы по фильтру не найдены</p>' +
                    '<button onclick="app.jobsManager.clearJobsFilter()" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">' +
                    'Очистить фильтр' +
                    '</button>' +
                    '</div>' :
                `<div class="space-y-2">${this.getFilteredJobs().map((job, index) => this.renderJobItem(job, index)).join('')}</div>`
            }
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Ошибка загрузки страницы работ:', error);
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

    renderJobItem(job, index) {
        // Определяем цвет и иконку статуса
        let statusColor = '';
        let statusIcon = '';
        let statusText = '';

        switch (job.status) {
            case 'planned':
                statusColor = 'text-blue-500 bg-blue-100 dark:bg-blue-900';
                statusIcon = '📅';
                statusText = 'Запланирована';
                break;
            case 'started':
                statusColor = 'text-orange-500 bg-orange-100 dark:bg-orange-900';
                statusIcon = '⚙️';
                statusText = 'В работе';
                break;
            case 'completed':
                statusColor = 'text-green-500 bg-green-100 dark:bg-green-900';
                statusIcon = '✅';
                statusText = 'Завершена';
                break;
            default:
                statusColor = 'text-gray-500 bg-gray-100 dark:bg-gray-900';
                statusIcon = '❓';
                statusText = 'Неизвестно';
        }

        // Форматируем дату
        const startDate = new Date(job.start_date);
        const formattedDate = startDate.toLocaleDateString('ru-RU');

        return `
            <div onclick="app.jobsManager.updateJobDetailsById(${job.id})" class="job-item group bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg p-3 transition-colors border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                        <!-- Цвет заказа -->
                        <div class="w-8 h-8 rounded flex-shrink-0 border border-white dark:border-gray-600 shadow-sm" 
                             style="background-color: ${job.order_color}">
                        </div>
                        
                        <!-- Информация о работе -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center space-x-2 mb-1">
                                <span class="text-xs px-2 py-1 rounded-full ${statusColor}">
                                    ${statusIcon} ${statusText}
                                </span>
                                ${job.is_locked ? '<span class="text-xs text-red-500 bg-red-100 dark:bg-red-900 px-2 py-1 rounded-full">🔒 Заблокирована</span>' : ''}
                            </div>
                            <h4 class="text-sm font-semibold dark:text-white truncate" title="Заказ: ${job.order_name} | Оборудование: ${job.equipment_name}">
                                📦 ${job.order_name} → 🏭 ${job.equipment_name}
                            </h4>
                            <div class="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                                <span>📅 ${formattedDate}</span>
                                <span>•</span>
                                <span>⏱️ ${job.duration_hours} ч.</span>
                                <span>•</span>
                                <span>⏰ Смещение: ${job.hour_offset} ч.</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Кнопки управления -->
                    <div class="flex items-center space-x-1 ml-3 opacity-0 group-hover:opacity-100">
                        <!-- Кнопки смены статуса -->

                            <button class="${this.app.move_button_class}"
                                    onclick="app.jobsManager.changeJobStatus(${job.id}, 'planned')"
                                    title="Сменить статус работы">
                                ${this.app.change_button_svg}
                            </button>
 
                        
                        <button class="${this.app.edit_button_class}"
                                onclick="app.jobsManager.openJobModal(${job.id})"
                                title="Редактировать">
                        ${this.app.edit_button_svg}
                        </button>
                        
                        <button class="${this.app.delete_button_class}"
                                onclick="app.jobsManager.deleteJob(${job.id})"
                                title="Удалить">
                        ${this.app.delete_button_svg}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Методы для работы с работами
    async loadJobsData() {
        const response = await fetch('/api/jobs');
        if (!response.ok) throw new Error('Failed to load jobs data');
        this.jobsData = await response.json();
    }

    switchJobsTab(tabName) {
        this.activeJobsTab = tabName;
        this.updateJobsList();
    }

    filterJobs(filterText) {
        this.jobsFilter = filterText.toLowerCase().trim();
        localStorage.setItem('lastJobsFilter', this.jobsFilter);

        // Debounce для оптимизации
        clearTimeout(this.filterTimeout);
        this.filterTimeout = setTimeout(() => {
            this.updateJobsList();
        }, 300);
    }

    updateJobsList() {
        const jobsContainer = document.getElementById('jobs-list-container') ||
            document.querySelector('.bg-white.dark\\:bg-gray-800:last-child');

        if (jobsContainer) {
            const filteredJobs = this.getFilteredJobs();

            if (filteredJobs.length === 0) {
                jobsContainer.innerHTML = this.jobsData.jobs.length === 0 ?
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
                jobsContainer.innerHTML = `<div class="space-y-2">${filteredJobs.map((job, index) => this.renderJobItem(job, index)).join('')}</div>`;
            }

            // Обновляем счетчик по ID
            const counter = document.getElementById('jobs-counter');
            if (counter) {
                counter.innerHTML = `Показано: <strong>${filteredJobs.length}</strong> из <strong>${this.jobsData.jobs.length}</strong>`;
            }

            // Обновляем кнопку очистки фильтра
            this.updateJobsClearButton();
        }
    }

    // Новый метод для обновления кнопки очистки фильтра работ
    updateJobsClearButton() {
        const filterContainer = document.querySelector('.bg-white.dark\\:bg-gray-800 .flex.flex-col.sm\\:flex-row');
        if (filterContainer) {
            // Обновляем кнопку очистки текстового фильтра
            const clearButtonHtml = (this.jobsFilter || this.activeJobsTab !== 'all') ?
                `<button onclick="app.jobsManager.clearJobsFilter()"
                    class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded transition-colors whitespace-nowrap">
                ❎
            </button>` : '';

            // Сохраняем текущие элементы
            const textFilter = filterContainer.querySelector('.flex-1');
            const equipmentFilter = filterContainer.querySelector('div:has(> #jobs-equipment-filter)');
            const tabsContainer = filterContainer.querySelector('.flex.space-x-1.bg-gray-200');

            if (textFilter && equipmentFilter && tabsContainer) {
                filterContainer.innerHTML = `
                <!-- Текстовый фильтр -->
                <div class="flex-1">
                    <input type="text" 
                           id="jobs-filter-input"
                           placeholder="Введите название заказа или оборудования..."
                           value="${this.jobsFilter}"
                           class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                           oninput="app.jobsManager.filterJobs(this.value)">
                </div>
                ${clearButtonHtml}
                <!-- Фильтр по оборудованию -->
                <div>
                    <select id="jobs-equipment-filter"
                            class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            onchange="app.jobsManager.filterJobsByEquipment(this.value)">
                        <option value="all" ${this.jobsEquipmentFilter === 'all' ? 'selected' : ''}>Все оборудование</option>
                        ${this.getUniqueEquipment().map(eq => `
                            <option value="${eq.id}" ${this.jobsEquipmentFilter === eq.id.toString() ? 'selected' : ''}>
                                ${eq.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <!-- Вкладки статусов -->
                <div class="flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                    <button class="tab-button ${this.activeJobsTab === 'all' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} px-3 py-1 rounded-md text-xs transition-colors"
                            onclick="app.jobsManager.switchJobsTab('all')">
                        Все
                    </button>
                    <button class="tab-button ${this.activeJobsTab === 'planned' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} px-3 py-1 rounded-md text-xs transition-colors"
                            onclick="app.jobsManager.switchJobsTab('planned')">
                        📅 Запланированы
                    </button>
                    <button class="tab-button ${this.activeJobsTab === 'started' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} px-3 py-1 rounded-md text-xs transition-colors"
                            onclick="app.jobsManager.switchJobsTab('started')">
                        ⚙️ В работе
                    </button>
                    <button class="tab-button ${this.activeJobsTab === 'completed' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} px-3 py-1 rounded-md text-xs transition-colors"
                            onclick="app.jobsManager.switchJobsTab('completed')">
                        ✅ Завершены
                    </button>
                </div>
            `;

                // Восстанавливаем фокус в текстовом поле если был ввод
                if (this.jobsFilter) {
                    const newInput = filterContainer.querySelector('#jobs-filter-input');
                    if (newInput) {
                        newInput.focus();
                        newInput.setSelectionRange(newInput.value.length, newInput.value.length);
                    }
                }
            }
        }
    }

    clearJobsFilter() {
        this.jobsFilter = '';
        localStorage.removeItem('lastJobsFilter');
        this.updateJobsList();
    }

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

    // Модальное окно для работы (будет реализовано позже)
    async openJobModal(jobId = null, presetEquipmentId = null, presetStartDate = null) {
        try {
            await this.app.updateJobDetails(null);
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
            const finalStartDate = presetStartDate || jobData?.start_date || this.app.getTodayDate();

            const modalHtml = `
        <div class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="modal-dialog bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                <!-- Заголовок для перетаскивания -->
                <div class="modal-header cursor-move bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 rounded-t-lg flex justify-between items-center select-none"
                     id="modal-drag-handle">
                    <h3 class="text-xl font-semibold text-gray-800 dark:text-white">
                            ${jobData ? '✏️ Редактировать работу' : '⚙️ Новая работа'}
                        </h3>
                        <button onclick="app.closeModal()" 
                                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl font-bold">
                            ×
                        </button>
                    </div>
                
                <div class="modal-content flex-1 overflow-auto p-6">
                    <form id="job-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                                Заказ*
                            </label>
                            <select name="order_id" 
                                    class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                                <option value="">Выберите заказ</option>
                                ${ordersData.orders.map(order => `
                                    <option value="${order.id}" ${jobData?.order_id === order.id ? 'selected' : ''}>
                                        ${order.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                                Оборудование*
                            </label>
                            <select name="equipment_id" 
                                    class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                                <option value="">Выберите оборудование</option>
                                ${equipmentData.equipment.map(eq => `
                                    <option value="${eq.id}" ${finalEquipmentId === eq.id ? 'selected' : ''}>
                                        ${eq.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                                    Длительность (часы)*
                                </label>
                                <input type="number" name="duration_hours" value="${jobData?.duration_hours || 8}"
                                       class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                       min="0.25" step="0.25" required>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                                    Смещение (часы)
                                </label>
                                <input type="number" name="hour_offset" value="${jobData?.hour_offset || 0}"
                                       class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                       min="0" step="0.25">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                                Дата начала*
                            </label>
                            <input type="date" name="start_date" value="${finalStartDate}"
                                   class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                                Статус
                            </label>
                            <select name="status" 
                                    class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option value="planned" ${jobData?.status === 'planned' ? 'selected' : ''}>📅 Запланирована</option>
                                <option value="started" ${jobData?.status === 'started' ? 'selected' : ''}>⚙️ В работе</option>
                                <option value="completed" ${jobData?.status === 'completed' ? 'selected' : ''}>✅ Завершена</option>
                            </select>
                        </div>
                        
                        <div class="flex items-center">
                            <input type="checkbox" name="is_locked" ${jobData?.is_locked ? 'checked' : ''}
                                   class="rounded text-red-500 focus:ring-red-500 mr-2">
                            <label class="text-sm dark:text-gray-300">🔒 Заблокировать (запретить изменения)</label>
                        </div>
                    </form>
                 </div>   
                            <!-- Кнопки действий -->
                <div class="modal-footer bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600 rounded-b-lg">
                    <div class="flex justify-end space-x-3">
                        <button onclick="app.closeModal()"
                                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Отмена
                        </button>
                        <button onclick="app.jobsManager.${jobData ? 'updateJob' : 'addJob'}(${jobId || ''})"
                                class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">
                            ${jobData ? 'Обновить' : 'Добавить'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

            this.app.showModal(modalHtml);

        } catch (error) {
            console.error('Ошибка загрузки формы работы:', error);
            this.app.showNotification('❌ Ошибка загрузки формы', 'error');
        }
    }

    async changeJobStatus(jobId) {
        try {
            const currentJobStatus = this.jobsData.jobs.find(j => j.id === jobId).status;
            const jobStatuses = ['planned', 'started', 'completed']
            const newStatus = jobStatuses[(jobStatuses.indexOf(currentJobStatus)+1) %  jobStatuses.length]

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
                this.app.loadPage('jobs');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления работы:', error);
            this.app.showNotification('❌ Ошибка при удалении работы', 'error');
        }
    }

    // Получение уникального списка оборудования из работ
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

    // Фильтр по оборудованию
    filterJobsByEquipment(equipmentId) {
        this.jobsEquipmentFilter = equipmentId === 'all' ? 'all' : equipmentId.toString();
        // Сохраняем фильтр оборудования
        localStorage.setItem('lastJobsEquipmentFilter', this.jobsEquipmentFilter);
        this.updateJobsList();
    }

    //---------------------------------------------------
    //---------------------------------------------------

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

    showConflictResolutionModal(jobData, jobId, availableDate, availableOffset) {
        const formattedDate = new Date(availableDate).toLocaleDateString('ru-RU');

        const modalHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                <div class="p-6">
                    <h3 class="text-xl font-semibold dark:text-white mb-4">
                        ⚠️ Обнаружены конфликты по времени
                    </h3>
                    
                    <div class="mb-6">
                        <p class="text-gray-700 dark:text-gray-300 mb-3">
                            Выбранное время для работы пересекается с другими работами на этом оборудовании.
                        </p>
                        <p class="text-gray-700 dark:text-gray-300">
                            Первое доступное время: <strong>${formattedDate}</strong> в <strong>${availableOffset}ч.</strong>
                        </p>
                    </div>
                    
                    <div class="space-y-3" id="conflict-resolution-buttons">
                        <button class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded transition-colors conflict-resolution-btn"
                                data-type="insert">
                            📅 Вклинить работу, подвинув остальные
                        </button>
                        
                        <button class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors conflict-resolution-btn"
                                data-type="move"
                                data-available-date="${availableDate}"
                                data-available-offset="${availableOffset}">
                            📍 Добавить на первое свободное время
                        </button>
                        
                        <button onclick="app.closeModal()"
                                class="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
                            ❌ Отмена
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

        this.app.showModal(modalHtml);

        // Добавляем обработчики событий после отрисовки модального окна
        setTimeout(() => {
            this.bindConflictResolutionHandlers(jobData, jobId);
        }, 100);
    }

    bindConflictResolutionHandlers(jobData, jobId) {
        const buttons = document.querySelectorAll('.conflict-resolution-btn');

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const type = button.getAttribute('data-type');

                if (type === 'insert') {
                    this.resolveConflict('insert', jobData, jobId);
                } else if (type === 'move') {
                    const availableDate = button.getAttribute('data-available-date');
                    const availableOffset = parseFloat(button.getAttribute('data-available-offset'));
                    this.resolveConflict('move', jobData, jobId, availableDate, availableOffset);
                }
            });
        });
    }

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