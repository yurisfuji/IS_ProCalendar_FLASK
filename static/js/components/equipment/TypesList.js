import { typesListTemplate } from '../../templates/equipment/typesListTemplate.js';
import { TypeItem } from './TypeItem.js';

/**
 * Компонент списка типов оборудования
 * Отвечает за рендеринг и управление списком типов оборудования
 */
export class TypesList {
    /**
     * Конструктор компонента списка типов оборудования
     * @param {Object} equipmentManager - экземпляр менеджера оборудования
     */
    constructor(equipmentManager) {
        this.equipmentManager = equipmentManager;
    }

    /**
     * Рендерит список типов оборудования
     * @param {Array} types - массив типов оборудования для отображения
     * @returns {string} HTML-разметка списка типов оборудования
     */
    render(types) {
        const containerHtml = typesListTemplate(types, this.equipmentManager);

        // Если есть типы, рендерим элементы после вставки в DOM
        if (types.length > 0) {
            setTimeout(() => {
                this.renderTypeItems(types);
            }, 0);
        }

        return containerHtml;
    }

    /**
     * Рендерит элементы типов оборудования в контейнере
     * @param {Array} types - массив типов оборудования для отображения
     */
    renderTypeItems(types) {
        const container = document.getElementById('types-list-items');
        if (container) {
            const typesHtml = types.map((type, index) => {
                const typeItem = new TypeItem(type, index, this.equipmentManager);
                return typeItem.render();
            }).join('');

            container.innerHTML = typesHtml;
        }
    }

    /**
     * Обновляет отображение списка типов оборудования
     */
    update() {
        const typesContainer = document.querySelector('#equipment-tab-content .bg-white');
        if (typesContainer) {
            const types = this.equipmentManager.equipmentData.types.sort((a, b) => a.sort_order - b.sort_order);
            typesContainer.innerHTML = this.render(types);
        }
    }
}
