import { equipmentModalTemplate } from '../../templates/equipment/equipmentModalTemplate.js';

/**
 * Компонент модального окна оборудования
 * Отвечает за управление модальными окнами создания/редактирования оборудования
 */
export class EquipmentModal {
    /**
     * Конструктор компонента модального окна оборудования
     * @param {Object} equipmentManager - экземпляр менеджера оборудования
     */
    constructor(equipmentManager) {
        this.equipmentManager = equipmentManager;
    }

    /**
     * Открывает модальное окно для создания/редактирования оборудования
     * @param {number|null} equipmentId - ID оборудования для редактирования (null для создания нового)
     */
    async open(equipmentId = null) {
        // Загружаем данные оборудования если они еще не загружены
        if (!this.equipmentManager.equipmentData) {
            try {
                await this.equipmentManager.loadEquipmentData();
            } catch (error) {
                console.error('Ошибка загрузки данных оборудования:', error);
                this.equipmentManager.app.showNotification('❌ Ошибка загрузки данных оборудования', 'error');
                return;
            }
        }

        const equipment = equipmentId ?
            this.equipmentManager.equipmentData.equipment.find(eq => eq.id === equipmentId) :
            null;

        const types = this.equipmentManager.equipmentData.types.sort((a, b) => a.sort_order - b.sort_order);
        const modalHtml = equipmentModalTemplate(equipment, types);

        this.equipmentManager.app.showModal(modalHtml);
    }
}
