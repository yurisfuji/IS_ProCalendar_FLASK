import { equipmentItemTemplate } from '../../templates/equipment/equipmentItemTemplate.js';

/**
 * Компонент элемента оборудования
 * Отвечает за рендеринг отдельного элемента оборудования
 */
export class EquipmentItem {
    /**
     * Конструктор компонента элемента оборудования
     * @param {Object} equipment - данные оборудования
     * @param {Object} equipmentManager - экземпляр менеджера оборудования
     */
    constructor(equipment, equipmentManager) {
        this.equipment = equipment;
        this.equipmentManager = equipmentManager;
        this.equipmentType = this.getEquipmentType();
    }

    /**
     * Находит тип оборудования по ID
     * @returns {Object|null} данные типа оборудования или null если не найден
     */
    getEquipmentType() {
        return this.equipmentManager.equipmentData.types.find(
            t => t.id === this.equipment.type_id
        ) || null;
    }

    /**
     * Рендерит элемент оборудования
     * @returns {string} HTML-разметка элемента оборудования
     */
    render() {
        return equipmentItemTemplate(
            this.equipment,
            this.equipmentType,
            this.equipmentManager.app
        );
    }
}
