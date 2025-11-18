import { EquipmentPage } from '../components/equipment/EquipmentPage.js';
import { EquipmentList } from '../components/equipment/EquipmentList.js';
import { TypesList } from '../components/equipment/TypesList.js';
import { EquipmentModal } from '../components/equipment/EquipmentModal.js';
import { TypeModal } from '../components/equipment/TypeModal.js';

/**
 * Менеджер для работы с оборудованием
 * Отвечает за управление оборудованием и типами оборудования, включая CRUD операции, фильтрацию и отображение
 */
export default class EquipmentManager {
    /**
     * Конструктор менеджера оборудования
     * @param {Object} app - Главный экземпляр приложения
     */
    constructor(app) {
        this.app = app;
        this.equipmentData = null;
        this.activeEquipmentTab = localStorage.getItem('lastEquipmentTab') || 'types';
        this.equipmentFilter = localStorage.getItem('lastEquipmentFilter') || 'all';

        // Инициализируем компоненты
        this.equipmentPage = new EquipmentPage(this);
        this.equipmentList = new EquipmentList(this);
        this.typesList = new TypesList(this);
        this.equipmentModal = new EquipmentModal(this);
        this.typeModal = new TypeModal(this);
    }

    /**
     * Рендерит страницу управления оборудованием
     * @returns {Promise<string>} HTML-разметка страницы оборудования
     */
    async renderEquipmentPage() {
        return await this.equipmentPage.render();
    }

    // === МЕТОДЫ УПРАВЛЕНИЯ ВКЛАДКАМИ ===


    /**
     * Переключает активную вкладку оборудования
     * @param {string} tabName - название вкладки ('types' или 'equipment')
     */
    switchEquipmentTab(tabName) {
        this.activeEquipmentTab = tabName;
        localStorage.setItem('lastEquipmentTab', tabName);

        // Обновляем стили кнопок вкладок
        this.updateTabButtons();

        // Обновляем содержимое вкладки
        const tabContent = document.getElementById('equipment-tab-content');
        if (tabContent) {
            if (tabName === 'types') {
                tabContent.innerHTML = this.renderTypesTabContent();
            } else {
                tabContent.innerHTML = this.renderEquipmentTabContent();
            }
            this.app.animateContent(tabContent);
        }
    }

    /**
     * Обновляет стили кнопок вкладок в соответствии с активной вкладкой
     */
    updateTabButtons() {
        const typeTabButton = document.querySelector('.tab-button:nth-child(1)');
        const equipmentTabButton = document.querySelector('.tab-button:nth-child(2)');

        if (typeTabButton && equipmentTabButton) {
            // Сбрасываем стили обеих кнопок
            typeTabButton.className = typeTabButton.className.replace(/bg-white|dark:bg-gray-600|text-blue-600|dark:text-blue-400|text-gray-600|dark:text-gray-400/g, '');
            equipmentTabButton.className = equipmentTabButton.className.replace(/bg-white|dark:bg-gray-600|text-blue-600|dark:text-blue-400|text-gray-600|dark:text-gray-400/g, '');

            // Базовые классы для кнопок вкладок
            const baseClasses = 'tab-button flex-1 py-2 px-4 rounded-md transition-colors';
            const activeClasses = 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400';
            const inactiveClasses = 'text-gray-600 dark:text-gray-400';

            // Применяем соответствующие стили
            if (this.activeEquipmentTab === 'types') {
                typeTabButton.className = `${baseClasses} ${activeClasses}`;
                equipmentTabButton.className = `${baseClasses} ${inactiveClasses}`;
            } else {
                typeTabButton.className = `${baseClasses} ${inactiveClasses}`;
                equipmentTabButton.className = `${baseClasses} ${activeClasses}`;
            }
        }
    }

    /**
     * Рендерит содержимое вкладки с типами оборудования
     * @returns {string} HTML-разметка вкладки типов
     */
    renderTypesTabContent() {
        if (!this.equipmentData) return '<div class="text-center py-8">Загрузка...</div>';
        const types = this.getSortedTypes();
        return `
            <div class="space-y-4">               
                <!-- Список типов -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700">
                    ${this.typesList.render(types)}
                </div>
            </div>
        `;
    }

    /**
     * Рендерит содержимое вкладки с оборудованием
     * @returns {string} HTML-разметка вкладки оборудования
     */
    renderEquipmentTabContent() {
        if (!this.equipmentData) return '<div class="text-center py-8">Загрузка...</div>';

        const equipment = this.getSortedEquipment();
        const types = this.getSortedTypes();
        const filteredEquipment = this.getFilteredEquipment(equipment);

        return `
            <div class="space-y-4">
                <!-- Фильтр по типам -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="text-sm font-semibold dark:text-white">Фильтр по типу</h4>
                        <span class="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                            Показано: <strong>${filteredEquipment.length}</strong> из <strong>${equipment.length}</strong>
                        </span>
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
                    ${this.equipmentList.render(filteredEquipment)}
                </div>
            </div>
        `;
    }

    // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ДЛЯ ДАННЫХ ===

    /**
     * Возвращает отсортированный список типов оборудования
     * @returns {Array} отсортированный массив типов
     */
    getSortedTypes() {
        return this.equipmentData ?
            this.equipmentData.types.sort((a, b) => a.sort_order - b.sort_order) :
            [];
    }

    /**
     * Возвращает отсортированный список оборудования
     * @returns {Array} отсортированный массив оборудования
     */
    getSortedEquipment() {
        return this.equipmentData ?
            this.equipmentData.equipment.sort((a, b) => a.sort_order - b.sort_order) :
            [];
    }

    /**
     * Возвращает отфильтрованный список оборудования
     * @param {Array} equipment - массив оборудования для фильтрации
     * @returns {Array} отфильтрованный массив оборудования
     */
    getFilteredEquipment(equipment = null) {
        if (!equipment) {
            equipment = this.getSortedEquipment();
        }

        if (!this.equipmentFilter || this.equipmentFilter === 'all') {
            return equipment;
        }
        return equipment.filter(eq => eq.type_id.toString() === this.equipmentFilter);
    }

    // === МЕТОДЫ ФИЛЬТРАЦИИ ===

    /**
     * Фильтрует оборудование по типу
     * @param {string|number} typeId - ID типа для фильтрации или 'all' для всех
     */
    filterEquipmentByType(typeId) {
        this.equipmentFilter = typeId === 'all' ? 'all' : typeId.toString();
        localStorage.setItem('lastEquipmentFilter', this.equipmentFilter);
        const tabContent = document.getElementById('equipment-tab-content');
        if (tabContent && this.activeEquipmentTab === 'equipment') {
            tabContent.innerHTML = this.renderEquipmentTabContent();
            this.app.animateContent(tabContent);
        }
    }

    // === МЕТОДЫ РАБОТЫ С МОДАЛЬНЫМИ ОКНАМИ ===

    /**
     * Открывает модальное окно для создания/редактирования типа оборудования
     * @param {number|null} typeId - ID типа для редактирования (null для создания нового)
     */
    openTypeModal(typeId = null) {
        this.typeModal.open(typeId);
    }

    /**
     * Открывает модальное окно для создания/редактирования оборудования
     * @param {number|null} equipmentId - ID оборудования для редактирования (null для создания нового)
     */
    openEquipmentModal(equipmentId = null) {
        this.equipmentModal.open(equipmentId);
    }

    // === CRUD ОПЕРАЦИИ С ТИПАМИ ОБОРУДОВАНИЯ ===

    /**
     * Добавляет новый тип оборудования
     */
    async addType() {
        try {
            const form = document.getElementById('type-form');
            const formData = new FormData(form);

            const response = await fetch('/api/equipment/types', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
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

    /**
     * Обновляет существующий тип оборудования
     * @param {number} typeId - ID типа для обновления
     */
    async updateType(typeId) {
        try {
            const form = document.getElementById('type-form');
            const formData = new FormData(form);

            const response = await fetch(`/api/equipment/types/${typeId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
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

    /**
     * Удаляет тип оборудования после подтверждения
     * @param {number} typeId - ID типа для удаления
     */
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

    /**
     * Изменяет порядок типа оборудования (перемещает вверх/вниз в списке)
     * @param {number} typeId - ID типа для перемещения
     * @param {string} direction - Направление перемещения: 'up' или 'down'
     */
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

    // === CRUD ОПЕРАЦИИ С ОБОРУДОВАНИЕМ ===

    /**
     * Добавляет новое оборудование
     */
    async addEquipment() {
        try {
            const form = document.getElementById('equipment-form');
            const formData = new FormData(form);

            const response = await fetch('/api/equipment', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
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
                this.updateGanttChart();
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка добавления оборудования:', error);
            this.app.showNotification('❌ Ошибка при добавлении оборудования', 'error');
        }
    }

    /**
     * Обновляет существующее оборудование
     * @param {number} equipmentId - ID оборудования для обновления
     */
    async updateEquipment(equipmentId) {
        try {
            const form = document.getElementById('equipment-form');
            const formData = new FormData(form);

            const response = await fetch(`/api/equipment/${equipmentId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
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
                this.updateGanttChart();
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка обновления оборудования:', error);
            this.app.showNotification('❌ Ошибка при обновлении оборудования', 'error');
        }
    }

    /**
     * Удаляет оборудование после подтверждения
     * @param {number} equipmentId - ID оборудования для удаления
     */
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

    /**
     * Переключает видимость оборудования на диаграмме
     * @param {number} equipmentId - ID оборудования для переключения видимости
     */
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

    // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===

    /**
     * Загружает данные оборудования с сервера
     * @throws {Error} Если не удалось загрузить данные
     */
    async loadEquipmentData() {
        const response = await fetch('/api/equipment/types');
        if (!response.ok) throw new Error('Failed to load equipment data');
        this.equipmentData = await response.json();
    }

    /**
     * Обновляет диаграмму Ганта если активна страница Ганта
     */
    updateGanttChart() {
        if (this.app.currentPage === 'gantt' && this.app.ganttManager) {
            this.app.ganttManager.applyGanttSettings();
        }
    }
}
