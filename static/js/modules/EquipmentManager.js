export default class EquipmentManager {
    constructor(app) {
        this.app = app;
        this.equipmentData = null;
        this.activeEquipmentTab = localStorage.getItem('lastEquipmentTab') || 'types';
        this.equipmentFilter = localStorage.getItem('lastEquipmentFilter') || 'all';
    }

    async renderEquipmentPage() {
        try {
            // Загружаем данные оборудования
            await this.loadEquipmentData();
            // Проверяем наличие типов оборудования
            const hasTypes = this.equipmentData && this.equipmentData.types && this.equipmentData.types.length > 0;

            return `
                <div class="fade-in">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-3xl font-bold dark:text-white">🏭 Управление оборудованием</h2>
                        <div class="flex space-x-3">
                            <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                                    onclick="app.equipmentManager.openTypeModal()">
                                🎨 Новый тип
                            </button>
                            <button class="new-equipment-btn bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'} text-white px-4 py-2 rounded-lg transition-colors"
                                    onclick="app.equipmentManager.openEquipmentModal()"
                                    ${!hasTypes ? 'disabled title="Сначала добавьте тип оборудования"' : ''}>
                                🏭 Новое оборудование
                            </button>
                        </div>
                    </div>
                    
                    <!-- Вкладки -->
                    <div class="mb-6">
                        <div class="flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                            <button class="tab-button ${this.activeEquipmentTab === 'types' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} flex-1 py-2 px-4 rounded-md transition-colors"
                                    onclick="app.equipmentManager.switchEquipmentTab('types')">
                                🎨 Типы оборудования
                            </button>
                            <button class="tab-button ${this.activeEquipmentTab === 'equipment' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} flex-1 py-2 px-4 rounded-md transition-colors"
                                    onclick="app.equipmentManager.switchEquipmentTab('equipment')">
                                🏭 Производственное оборудование
                            </button>
                        </div>
                    </div>
                    
                    <!-- Контент вкладок -->
                    <div id="equipment-tab-content">
                        ${this.activeEquipmentTab === 'types' ? this.renderTypesTab() : this.renderEquipmentTab()}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Ошибка загрузки страницы оборудования:', error);
            return `
                <div class="text-center py-12">
                    <div class="text-red-500 text-xl mb-4">❌ Ошибка загрузки оборудования</div>
                    <button onclick="app.navigateTo('equipment')" 
                            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                        Попробовать снова
                    </button>
                </div>
            `;
        }
    }

    async loadEquipmentData() {
        const response = await fetch('/api/equipment/types');
        if (!response.ok) throw new Error('Failed to load equipment data');
        this.equipmentData = await response.json();
    }

    switchEquipmentTab(tabName) {
        this.activeEquipmentTab = tabName;
        // Сохраняем выбранную вкладку
        localStorage.setItem('lastEquipmentTab', tabName);
        const tabContent = document.getElementById('equipment-tab-content');
        if (tabContent) {
            tabContent.innerHTML = tabName === 'types' ? this.renderTypesTab() : this.renderEquipmentTab();
            this.app.animateContent(tabContent);
        }
    }

    renderEquipmentItem(equipment) {
        const equipmentJobsCount = equipment.jobs_count || 0;
        const equipmentType = this.equipmentData.types.find(t => t.id === equipment.type_id);

        return `
            <div class="type-item group bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg p-1 transition-colors border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                        <!-- Цветной индикатор типа -->
                        <div class="w-4 h-4 rounded flex-shrink-0 border border-white dark:border-gray-600 shadow-sm" 
                             style="background-color: ${equipmentType?.color || '#999'}">
                        </div>
                        
                        <!-- Название оборудования -->
                        <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-semibold dark:text-white truncate" title="${equipment.name}">
                                ${equipment.name}
                            </h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                                ${equipmentType?.name || 'Тип не найден'}
                            </p>
                        </div>
                    </div>
                    
                    <!-- Статус и кнопки -->
                    <div class="flex items-center space-x-1 ml-3 opacity-0 group-hover:opacity-100">
                        <!-- Индикатор видимости -->
                        <button class="p-2 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                onclick="app.equipmentManager.toggleEquipmentVisibility(${equipment.id})"
                                title="${equipment.show_on_chart ? 'Скрыть с диаграммы' : 'Показать на диаграмме'}">
                            ${equipment.show_on_chart ?
            '    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
            '    <path id="Vector" d="M8 12L11 15L16 9M4 16.8002V7.2002C4 6.08009 4 5.51962 4.21799 5.0918C4.40973 4.71547 4.71547 4.40973 5.0918 4.21799C5.51962 4 6.08009 4 7.2002 4H16.8002C17.9203 4 18.4796 4 18.9074 4.21799C19.2837 4.40973 19.5905 4.71547 19.7822 5.0918C20 5.5192 20 6.07899 20 7.19691V16.8036C20 17.9215 20 18.4805 19.7822 18.9079C19.5905 19.2842 19.2837 19.5905 18.9074 19.7822C18.48 20 17.921 20 16.8031 20H7.19691C6.07899 20 5.5192 20 5.0918 19.7822C4.71547 19.5905 4.40973 19.2842 4.21799 18.9079C4 18.4801 4 17.9203 4 16.8002Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>' +
            '       <path id="Vector" d="M4 7.2002V16.8002C4 17.9203 4 18.4801 4.21799 18.9079C4.40973 19.2842 4.71547 19.5905 5.0918 19.7822C5.5192 20 6.07899 20 7.19691 20H16.8031C17.921 20 18.48 20 18.9074 19.7822C19.2837 19.5905 19.5905 19.2842 19.7822 18.9079C20 18.4805 20 17.9215 20 16.8036V7.19691C20 6.07899 20 5.5192 19.7822 5.0918C19.5905 4.71547 19.2837 4.40973 18.9074 4.21799C18.4796 4 17.9203 4 16.8002 4H7.2002C6.08009 4 5.51962 4 5.0918 4.21799C4.71547 4.40973 4.40973 4.71547 4.21799 5.0918C4 5.51962 4 6.08009 4 7.2002Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>' +
            '    </svg>' :
            '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n' +
            '       <path id="Vector" d="M4 7.2002V16.8002C4 17.9203 4 18.4801 4.21799 18.9079C4.40973 19.2842 4.71547 19.5905 5.0918 19.7822C5.5192 20 6.07899 20 7.19691 20H16.8031C17.921 20 18.48 20 18.9074 19.7822C19.2837 19.5905 19.5905 19.2842 19.7822 18.9079C20 18.4805 20 17.9215 20 16.8036V7.19691C20 6.07899 20 5.5192 19.7822 5.0918C19.5905 4.71547 19.2837 4.40973 18.9074 4.21799C18.4796 4 17.9203 4 16.8002 4H7.2002C6.08009 4 5.51962 4 5.0918 4.21799C4.71547 4.40973 4.40973 4.71547 4.21799 5.0918C4 5.51962 4 6.08009 4 7.2002Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>' +
            '    </svg>'
        }
                        </button>
                        
                        <!-- Кнопка редактирования -->
                        <button class="${this.app.edit_button_class}"
                                onclick="app.equipmentManager.openEquipmentModal(${equipment.id})"
                                title="Редактировать">
                                ${this.app.edit_button_svg}
                        </button>
                        
                        <!-- Кнопка удаления -->
                         ${equipmentJobsCount === 0 ? `
                            <button class="${this.app.delete_button_class}"
                                    onclick="app.equipmentManager.deleteEquipment(${equipment.id})"
                                    title="Удалить">
                                 ${this.app.delete_button_svg}
                            </button>
                        ` : `
                            <button class="${this.app.cant_delete_button_class}"
                                    title="Нельзя удалить: используется ${equipmentJobsCount} оборудованием">
                                 ${this.app.delete_button_svg}
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    renderTypeItem(type, index) {
        const equipmentCount = this.equipmentData.equipment.filter(eq => eq.type_id === type.id).length;

        return `
            <div class="type-item group bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg p-1 transition-colors border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                        <!-- Цветной круг с номером -->
                        <div class="w-9 h-12 rounded border-2 border-white dark:border-gray-700 shadow-sm flex items-center justify-center flex-shrink-0" 
                             style="background-color: ${type.color}">
                            <span class="text-white font-bold text-xs">${index + 1}</span>
                        </div>
                        
                        <!-- Информация о типе -->
                        <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-semibold dark:text-white truncate" title="${type.name}">
                                ${type.name}
                            </h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                Оборудование: ${equipmentCount} шт.
                            </p>
                        </div>
                    </div>
                    
                    <!-- Кнопки управления -->
                    <div class="flex items-center space-x-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        ${index > 0 ? `
                            <button class="${this.app.move_button_class}"
                                    onclick="app.equipmentManager.moveType(${type.id}, 'up')"
                                    title="Поднять выше">
                                ${this.app.move_up_button_svg}
                            </button>
                        ` : ''}
                        
                        ${index < this.equipmentData.types.length - 1 ? `
                            <button class="${this.app.move_button_class}"
                                    onclick="app.equipmentManager.moveType(${type.id}, 'down')"
                                    title="Опустить ниже">
                                ${this.app.move_down_button_svg}
                            </button>
                        ` : ''}
                        
                        <button class="${this.app.edit_button_class}"
                                onclick="app.equipmentManager.openTypeModal(${type.id})"
                                title="Редактировать">
                                ${this.app.edit_button_svg}
                        </button>
                        
                        ${equipmentCount === 0 ? `
                            <button class="${this.app.delete_button_class}"
                                    onclick="app.equipmentManager.deleteType(${type.id})"
                                    title="Удалить">
                                 ${this.app.delete_button_svg}
                            </button>
                        ` : `
                            <button class="${this.app.cant_delete_button_class}"
                                    title="Нельзя удалить: используется ${equipmentCount} оборудованием">
                                 ${this.app.delete_button_svg}
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    renderEquipmentTab() {
        if (!this.equipmentData) return '<div class="text-center py-8">Загрузка...</div>';

        const equipment = this.equipmentData.equipment.sort((a, b) => a.sort_order - b.sort_order);
        const types = this.equipmentData.types.sort((a, b) => a.sort_order - b.sort_order);
                // Проверяем наличие типов оборудования
        const hasTypes = types.length > 0;

        return `
            <div class="space-y-4">
                <!-- Фильтр по типам -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="text-sm font-semibold dark:text-white">Фильтр по типу</h4>
                        <span class="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">Показано: <strong>${this.getFilteredEquipment(equipment).length}</strong> из <strong>${equipment.length}</strong></span>
                    </div>
                    <div class="flex flex-wrap gap-1">
                        <button class="filter-type-btn ${this.equipmentFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} px-2 py-1 rounded-lg text-xs transition-colors"
                                onclick="app.equipmentManager.filterEquipmentByType('all')">
                            Все
                        </button>
                        ${types.map(type => `
                            <button class="filter-type-btn ${this.equipmentFilter === type.id.toString() ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} px-2 py-1 rounded-lg text-xs transition-colors"
                                    onclick="app.equipmentManager.filterEquipmentByType(${type.id})"
                                    style="${this.equipmentFilter !== type.id.toString() ? `border-left: 6px solid ${type.color}` : ''}">
                                ${type.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
                               
                <!-- Список оборудования -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700">
                    ${equipment.length === 0 ?
            '<div class="text-center py-8">' +
            '<p class="text-gray-500 dark:text-gray-400 text-sm mb-3">Оборудование не найдено</p>' +
            '</div>' :
            `<div class="space-y-2">${this.getFilteredEquipment(equipment).map(eq => this.renderEquipmentItem(eq)).join('')}</div>`
        }
                </div>
            </div>
        `;
    }

    renderTypesTab() {
        if (!this.equipmentData) return '<div class="text-center py-8">Загрузка...</div>';

        const types = this.equipmentData.types.sort((a, b) => a.sort_order - b.sort_order);

        return `
            <div class="space-y-4">               
                <!-- Список типов -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700">
                    ${types.length === 0 ?
            '<div class="text-center py-8">' +
            '<p class="text-gray-500 dark:text-gray-400 text-sm mb-3">Типы оборудования не найдены</p>' +
            '</div>' :
            `<div class="space-y-2">${types.map((type, index) => this.renderTypeItem(type, index)).join('')}</div>`
        }
                </div>
            </div>
        `;
    }

    getFilteredEquipment(equipment) {
        if (!this.equipmentFilter || this.equipmentFilter === 'all') {
            return equipment;
        }

        return equipment.filter(eq => eq.type_id.toString() === this.equipmentFilter);
    }

    filterEquipmentByType(typeId) {
        this.equipmentFilter = typeId === 'all' ? 'all' : typeId.toString();
        // Сохраняем фильтр оборудования
        localStorage.setItem('lastEquipmentFilter', this.equipmentFilter);
        const tabContent = document.getElementById('equipment-tab-content');
        if (tabContent && this.activeEquipmentTab === 'equipment') {
            tabContent.innerHTML = this.renderEquipmentTab();
            this.app.animateContent(tabContent);
        }
    }

    // Модальные окна
    openTypeModal(typeId = null) {
        const type = typeId ? this.equipmentData.types.find(t => t.id === typeId) : null;

        const modalHtml = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                    <div class="p-6">
                        <h3 class="text-xl font-semibold dark:text-white mb-4">
                            ${type ? '✏️ Редактировать тип' : '🎨 Добавить тип оборудования'}
                        </h3>
                        
                        <form id="type-form" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                                    Наименование типа*
                                </label>
                                <input type="text" name="name" value="${type?.name || ''}"
                                       class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                       placeholder="Введите название типа..." required>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                                    Цвет типа*
                                </label>
                                <input type="color" name="color" value="${type?.color || '#FF0000'}"
                                       class="w-full h-10 rounded border border-gray-300 dark:border-gray-600">
                            </div>
                        </form>
                        
                        <div class="flex justify-end space-x-3 mt-6">
                            <button onclick="app.closeModal()"
                                    class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                Отмена
                            </button>
                            <button onclick="app.equipmentManager.${type ? 'updateType' : 'addType'}(${typeId || ''})"
                                    class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">
                                ${type ? 'Обновить' : 'Добавить'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.app.showModal(modalHtml);
    }

    async openEquipmentModal(equipmentId = null) {

        // Загружаем данные оборудования если они еще не загружены
        if (!this.equipmentData) {
            try {
                await this.loadEquipmentData();
            } catch (error) {
                console.error('Ошибка загрузки данных оборудования:', error);
                this.app.showNotification('❌ Ошибка загрузки данных оборудования', 'error');
                return;
            }
        }

        const equipment = equipmentId ? this.equipmentData.equipment.find(eq => eq.id === equipmentId) : null;
        const types = this.equipmentData.types.sort((a, b) => a.sort_order - b.sort_order);

        const modalHtml = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                    <div class="p-6">
                        <h3 class="text-xl font-semibold dark:text-white mb-4">
                            ${equipment ? '✏️ Редактировать оборудование' : '🏭 Добавить оборудование'}
                        </h3>
                        
                        <form id="equipment-form" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                                    Наименование оборудования*
                                </label>
                                <input type="text" name="name" value="${equipment?.name || ''}"
                                       class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                       placeholder="Введите название..." required>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium dark:text-gray-300 mb-1">
                                    Тип оборудования*
                                </label>
                                <select name="type_id" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                                    <option value="">Выберите тип</option>
                                    ${types.map(type => `
                                        <option value="${type.id}" ${equipment?.type_id === type.id ? 'selected' : ''}>
                                            ${type.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <div class="flex items-center">
                                <input type="checkbox" name="show_on_chart" ${equipment?.show_on_chart !== false ? 'checked' : ''}
                                       class="rounded text-green-500 focus:ring-green-500 mr-2">
                                <label class="text-sm dark:text-gray-300">Показывать на диаграмме</label>
                            </div>
                        </form>
                        
                        <div class="flex justify-end space-x-3 mt-6">
                            <button onclick="app.closeModal()"
                                    class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                Отмена
                            </button>
                            <button onclick="app.equipmentManager.${equipment ? 'updateEquipment' : 'addEquipment'}(${equipmentId || ''})"
                                    class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">
                                ${equipment ? 'Обновить' : 'Добавить'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.app.showModal(modalHtml);
    }

    async deleteType(typeId) {
        if (!confirm('Вы уверены, что хотите удалить этот тип оборудования?')) return;

        try {
            const response = await fetch(`/api/equipment/types/${typeId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification('✅ Тип оборудования удален!', 'success');
                await this.loadEquipmentData();
                await this.app.updateEquipmentButtonState();
                this.switchEquipmentTab('types');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления типа:', error);
            this.app.showNotification('❌ Ошибка при удалении типа', 'error');
        }
    }

    async moveType(typeId, direction) {
        try {
            const response = await fetch(`/api/equipment/types/${typeId}/move/${direction}`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification('✅ Порядок типа обновлен!', 'success');
                await this.loadEquipmentData();
                this.switchEquipmentTab('types');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка перемещения типа:', error);
            this.app.showNotification('❌ Ошибка при перемещении типа', 'error');
        }
    }

    async deleteEquipment(equipmentId) {
        if (!confirm('Вы уверены, что хотите удалить это оборудование?')) return;

        try {
            const response = await fetch(`/api/equipment/${equipmentId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification('✅ Оборудование удалено!', 'success');

                await this.loadEquipmentData();
                await this.app.updateJobButtonState();

                this.switchEquipmentTab('equipment');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления оборудования:', error);
            this.app.showNotification('❌ Ошибка при удалении оборудования', 'error');
        }
    }

    async toggleEquipmentVisibility(equipmentId) {
        try {
            const response = await fetch(`/api/equipment/${equipmentId}/toggle`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                const status = result.equipment.show_on_chart ? 'показано' : 'скрыто';
                this.app.showNotification(`✅ Оборудование ${status} на диаграмме`, 'success');
                await this.loadEquipmentData();
                this.switchEquipmentTab('equipment');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка переключения видимости:', error);
            this.app.showNotification('❌ Ошибка при обновлении видимости', 'error');
        }
    }

    async addType() {
        try {
            const form = document.getElementById('type-form');
            const formData = new FormData(form);

            const response = await fetch('/api/equipment/types', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    color: formData.get('color')
                })
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification('✅ Тип оборудования добавлен!', 'success');
                this.app.closeModal();
                await this.loadEquipmentData();
                await this.app.updateEquipmentButtonState();
                this.switchEquipmentTab('types');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка добавления типа:', error);
            this.app.showNotification('❌ Ошибка при добавлении типа', 'error');
        }
    }

    async updateType(typeId) {
        try {
            const form = document.getElementById('type-form');
            const formData = new FormData(form);

            const response = await fetch(`/api/equipment/types/${typeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    color: formData.get('color')
                })
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification('✅ Тип оборудования обновлен!', 'success');
                this.app.closeModal();
                await this.loadEquipmentData();
                this.switchEquipmentTab('types');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка обновления типа:', error);
            this.app.showNotification('❌ Ошибка при обновлении типа', 'error');
        }
    }

    async addEquipment() {
        try {
            const form = document.getElementById('equipment-form');
            const formData = new FormData(form);

            const response = await fetch('/api/equipment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    type_id: parseInt(formData.get('type_id')),
                    show_on_chart: formData.get('show_on_chart') === 'on'
                })
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification('✅ Оборудование добавлено!', 'success');
                this.app.closeModal();

                await this.loadEquipmentData();
                await this.app.updateJobButtonState();

                this.switchEquipmentTab('equipment');
                // ОБНОВЛЯЕМ ДИАГРАММУ ГАНТА ЕСЛИ МЫ НА СТРАНИЦЕ ГАНТА
                if (this.app.currentPage === 'gantt' && this.app.ganttManager) {
                    this.app.ganttManager.applyGanttSettings();
                }
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка добавления оборудования:', error);
            this.app.showNotification('❌ Ошибка при добавлении оборудования', 'error');
        }
    }

    async updateEquipment(equipmentId) {
        try {
            const form = document.getElementById('equipment-form');
            const formData = new FormData(form);

            const response = await fetch(`/api/equipment/${equipmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    type_id: parseInt(formData.get('type_id')),
                    show_on_chart: formData.get('show_on_chart') === 'on'
                })
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification('✅ Оборудование обновлено!', 'success');
                this.app.closeModal();

                await this.loadEquipmentData();
                this.switchEquipmentTab('equipment');
                // ОБНОВЛЯЕМ ДИАГРАММУ ГАНТА ЕСЛИ МЫ НА СТРАНИЦЕ ГАНТА
                if (this.app.currentPage === 'gantt' && this.app.ganttManager) {
                    this.app.ganttManager.applyGanttSettings();
                }
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка обновления оборудования:', error);
            this.app.showNotification('❌ Ошибка при обновлении оборудования', 'error');
        }
    }
}