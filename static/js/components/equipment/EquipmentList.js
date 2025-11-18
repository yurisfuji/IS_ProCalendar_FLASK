import { equipmentListTemplate } from '../../templates/equipment/equipmentListTemplate.js';
import { EquipmentItem } from './EquipmentItem.js';

/**
 * Компонент списка оборудования
 * Отвечает за рендеринг и управление списком оборудования
 */
export class EquipmentList {
    /**
     * Конструктор компонента списка оборудования
     * @param {Object} equipmentManager - экземпляр менеджера оборудования
     */
    constructor(equipmentManager) {
        this.equipmentManager = equipmentManager;
    }

    /**
     * Рендерит список оборудования
     * @param {Array} equipment - массив оборудования для отображения
     * @returns {string} HTML-разметка списка оборудования
     */
    render(equipment) {
        const containerHtml = equipmentListTemplate(equipment, this.equipmentManager);

        // Если есть оборудование, рендерим элементы после вставки в DOM
        if (equipment.length > 0) {
            setTimeout(() => {
                this.renderEquipmentItems(equipment);
            }, 0);
        }

        return containerHtml;
    }

    /**
     * Рендерит элементы оборудования в контейнере
     * @param {Array} equipment - массив оборудования для отображения
     */
    renderEquipmentItems(equipment) {
        const container = document.getElementById('equipment-list-items');
        if (container) {
            const equipmentHtml = equipment.map(eq => {
                const equipmentItem = new EquipmentItem(eq, this.equipmentManager);
                return equipmentItem.render();
            }).join('');

            container.innerHTML = equipmentHtml;
        }
    }

    /**
     * Обновляет отображение списка оборудования
     */
    update() {
        const equipmentContainer = document.querySelector('#equipment-tab-content .bg-white');
        if (equipmentContainer) {
            const filteredEquipment = this.equipmentManager.getFilteredEquipment(
                this.equipmentManager.equipmentData.equipment
            );
            equipmentContainer.innerHTML = this.render(filteredEquipment);
        }
    }
}
