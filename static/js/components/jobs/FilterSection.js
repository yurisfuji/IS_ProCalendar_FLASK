export class FilterSection {
    /**
     * Конструктор компонента фильтров
     * @param {JobsManager} jobsManager - менеджер работ
     */
    constructor(jobsManager) {
        this.jobsManager = jobsManager;
    }

    /**
     * Рендерит секцию фильтров
     * @returns {string} HTML-разметка
     */
    render() {
        const { jobsFilter, jobsEquipmentFilter, activeJobsTab } = this.jobsManager;
        const filteredJobs = this.jobsManager.getFilteredJobs();
        const totalJobs = this.jobsManager.jobsData?.jobs?.length || 0;

        return `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mb-4">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold dark:text-white">Фильтр работ</h4>
                    <span id="jobs-counter" class="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                        Показано: <strong>${filteredJobs.length}</strong> из <strong>${totalJobs}</strong>
                    </span>
                </div>
                <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    ${this.renderTextFilter(jobsFilter)}
                    ${this.renderClearButton(jobsFilter)}
                    ${this.renderEquipmentFilter(jobsEquipmentFilter)}
                    ${this.renderStatusTabs(activeJobsTab)}
                </div>
            </div>
        `;
    }

    /**
     * Рендерит текстовый фильтр
     * @param {string} currentFilter - текущее значение фильтра
     * @returns {string} HTML-разметка
     */
    renderTextFilter(currentFilter) {
        return `
            <div class="flex-1">
                <input type="text" 
                       id="jobs-filter-input"
                       placeholder="Введите название заказа или оборудования..."
                       value="${currentFilter}"
                       class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                       oninput="app.jobsManager.filterJobs(this.value)">
            </div>
        `;
    }

    /**
     * Рендерит кнопку очистки фильтра
     * @param {string} currentFilter - текущее значение фильтра
     * @returns {string} HTML-разметка
     */
    renderClearButton(currentFilter) {
        return currentFilter ? `
            <button onclick="app.jobsManager.clearJobsFilter()"
                    class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded transition-colors whitespace-nowrap">
                ❎
            </button>
        ` : '';
    }

    /**
     * Рендерит фильтр по оборудованию
     * @param {string} currentEquipmentFilter - текущий фильтр оборудования
     * @returns {string} HTML-разметка
     */
    renderEquipmentFilter(currentEquipmentFilter) {
        const equipmentOptions = this.jobsManager.getUniqueEquipment();

        return `
            <div>
                <select id="jobs-equipment-filter"
                        class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        onchange="app.jobsManager.filterJobsByEquipment(this.value)">
                    <option value="all" ${currentEquipmentFilter === 'all' ? 'selected' : ''}>Все оборудование</option>
                    ${equipmentOptions.map(eq => `
                        <option value="${eq.id}" ${currentEquipmentFilter === eq.id.toString() ? 'selected' : ''}>
                            ${eq.name}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    /**
     * Рендерит вкладки статусов
     * @param {string} activeTab - активная вкладка
     * @returns {string} HTML-разметка
     */
    renderStatusTabs(activeTab) {
        const tabs = [
            { id: 'all', label: 'Все', icon: '' },
            { id: 'planned', label: 'Запланированы', icon: '📅' },
            { id: 'started', label: 'В работе', icon: '⚙️' },
            { id: 'completed', label: 'Завершены', icon: '✅' }
        ];

        return `
            <div class="flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                ${tabs.map(tab => `
                    <button class="tab-button ${activeTab === tab.id ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} px-3 py-1 rounded-md text-xs transition-colors"
                            onclick="app.jobsManager.switchJobsTab('${tab.id}')">
                        ${tab.icon ? `${tab.icon} ` : ''}${tab.label}
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Обновляет компонент фильтров
     */
    update() {
        const filterContainer = document.querySelector('.bg-white.dark\\:bg-gray-800 .flex.flex-col.sm\\:flex-row');
        if (filterContainer) {
            filterContainer.innerHTML = `
                ${this.renderTextFilter(this.jobsManager.jobsFilter)}
                ${this.renderClearButton(this.jobsManager.jobsFilter)}
                ${this.renderEquipmentFilter(this.jobsManager.jobsEquipmentFilter)}
                ${this.renderStatusTabs(this.jobsManager.activeJobsTab)}
            `;

            // Восстанавливаем фокус если был ввод
            if (this.jobsManager.jobsFilter) {
                const newInput = filterContainer.querySelector('#jobs-filter-input');
                if (newInput) {
                    newInput.focus();
                    newInput.setSelectionRange(newInput.value.length, newInput.value.length);
                }
            }
        }

        this.updateCounter();
    }

    /**
     * Обновляет счетчик работ
     */
    updateCounter() {
        const counter = document.getElementById('jobs-counter');
        if (counter) {
            const filteredJobs = this.jobsManager.getFilteredJobs();
            const totalJobs = this.jobsManager.jobsData?.jobs?.length || 0;
            counter.innerHTML = `Показано: <strong>${filteredJobs.length}</strong> из <strong>${totalJobs}</strong>`;
        }
    }
}