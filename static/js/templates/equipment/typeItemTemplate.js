/**
 * Шаблон элемента типа оборудования
 * @param {Object} type - данные типа оборудования
 * @param {number} index - индекс типа в списке
 * @param {number} equipmentCount - количество оборудования этого типа
 * @param {number} totalTypes - общее количество типов
 * @param {Object} app - главный экземпляр приложения
 * @returns {string} HTML-разметка элемента типа оборудования
 */
export const typeItemTemplate = (type, index, equipmentCount, totalTypes, app) => `
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
                    <button class="${app.move_button_class}"
                            onclick="app.equipmentManager.moveType(${type.id}, 'up')"
                            title="Поднять выше">
                        ${app.move_up_button_svg}
                    </button>
                ` : ''}
                
                ${index < totalTypes - 1 ? `
                    <button class="${app.move_button_class}"
                            onclick="app.equipmentManager.moveType(${type.id}, 'down')"
                            title="Опустить ниже">
                        ${app.move_down_button_svg}
                    </button>
                ` : ''}
                
                <button class="${app.edit_button_class}"
                        onclick="app.equipmentManager.openTypeModal(${type.id})"
                        title="Редактировать">
                        ${app.edit_button_svg}
                </button>
                
                ${equipmentCount === 0 ? `
                    <button class="${app.delete_button_class}"
                            onclick="app.equipmentManager.deleteType(${type.id})"
                            title="Удалить">
                         ${app.delete_button_svg}
                    </button>
                ` : `
                    <button class="${app.cant_delete_button_class}"
                            title="Нельзя удалить: используется ${equipmentCount} оборудованием">
                         ${app.delete_button_svg}
                    </button>
                `}
            </div>
        </div>
    </div>
`;
