import { typeModalTemplate } from '../../templates/equipment/typeModalTemplate.js';

/**
 * Компонент модального окна типа оборудования
 * Отвечает за управление модальными окнами создания/редактирования типов оборудования
 */
export class TypeModal {
    /**
     * Конструктор компонента модального окна типа оборудования
     * @param {Object} equipmentManager - экземпляр менеджера оборудования
     */
    constructor(equipmentManager) {
        this.equipmentManager = equipmentManager;
    }

    /**
     * Открывает модальное окно для создания/редактирования типа оборудования
     * @param {number|null} typeId - ID типа для редактирования (null для создания нового)
     */
    open(typeId = null) {
        const type = typeId ?
            this.equipmentManager.equipmentData.types.find(t => t.id === typeId) :
            null;

        const modalHtml = typeModalTemplate(type);
        this.equipmentManager.app.showModal(modalHtml);
    }
}
