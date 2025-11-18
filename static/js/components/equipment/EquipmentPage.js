import { equipmentPageTemplate } from '../../templates/equipment/equipmentPageTemplate.js';

/**
 * Компонент страницы управления оборудованием
 * Отвечает за рендеринг основной страницы оборудования
 */
export class EquipmentPage {
    /**
     * Конструктор компонента страницы оборудования
     * @param {Object} equipmentManager - экземпляр менеджера оборудования
     */
    constructor(equipmentManager) {
        this.equipmentManager = equipmentManager;
    }

    /**
     * Рендерит страницу оборудования
     * @returns {Promise<string>} HTML-разметка страницы оборудования
     */
    async render() {
        try {
            await this.equipmentManager.loadEquipmentData();
            const hasTypes = this.equipmentManager.equipmentData?.types?.length > 0;
            
            // Получаем содержимое активной вкладки в зависимости от текущего состояния
            const tabContent = this.equipmentManager.activeEquipmentTab === 'types' 
                ? this.equipmentManager.renderTypesTabContent()
                : this.equipmentManager.renderEquipmentTabContent();
            
            return equipmentPageTemplate(this.equipmentManager, hasTypes, tabContent);
        } catch (error) {
            console.error('Ошибка загрузки страницы оборудования:', error);
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
                <div class="text-red-500 text-xl mb-4">❌ Ошибка загрузки оборудования</div>
                <button onclick="app.navigateTo('equipment')" 
                        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                    Попробовать снова
                </button>
            </div>
        `;
    }
}