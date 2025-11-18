import { typeItemTemplate } from '../../templates/equipment/typeItemTemplate.js';

/**
 * Компонент элемента типа оборудования
 * Отвечает за рендеринг отдельного элемента типа оборудования
 */
export class TypeItem {
    /**
     * Конструктор компонента элемента типа оборудования
     * @param {Object} type - данные типа оборудования
     * @param {number} index - индекс типа в списке
     * @param {Object} equipmentManager - экземпляр менеджера оборудования
     */
    constructor(type, index, equipmentManager) {
        this.type = type;
        this.index = index;
        this.equipmentManager = equipmentManager;
        this.equipmentCount = this.getEquipmentCount();
    }

    /**
     * Подсчитывает количество оборудования данного типа
     * @returns {number} количество оборудования этого типа
     */
    getEquipmentCount() {
        return this.equipmentManager.equipmentData.equipment.filter(
            eq => eq.type_id === this.type.id
        ).length;
    }

    /**
     * Рендерит элемент типа оборудования
     * @returns {string} HTML-разметка элемента типа оборудования
     */
    render() {
        return typeItemTemplate(
            this.type,
            this.index,
            this.equipmentCount,
            this.equipmentManager.equipmentData.types.length,
            this.equipmentManager.app
        );
    }
}
