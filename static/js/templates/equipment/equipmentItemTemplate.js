/**
 * Шаблон элемента оборудования
 * @param {Object} equipment - данные оборудования
 * @param {Object} equipmentType - тип оборудования
 * @param {Object} app - главный экземпляр приложения
 * @returns {string} HTML-разметка элемента оборудования
 */
export const equipmentItemTemplate = (equipment, equipmentType, app) => {
    const equipmentJobsCount = equipment.jobs_count || 0;

    return `
        <div class="equipment-item group bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg p-1 transition-colors border border-gray-200 dark:border-gray-700">
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
                        ${equipment.show_on_chart ? getVisibleIcon() : getHiddenIcon()}
                    </button>
                    
                    <!-- Кнопка редактирования -->
                    <button class="${app.edit_button_class}"
                            onclick="app.equipmentManager.openEquipmentModal(${equipment.id})"
                            title="Редактировать">
                            ${app.edit_button_svg}
                    </button>
                    
                    <!-- Кнопка удаления -->
                    ${equipmentJobsCount === 0 ? `
                        <button class="${app.delete_button_class}"
                                onclick="app.equipmentManager.deleteEquipment(${equipment.id})"
                                title="Удалить">
                             ${app.delete_button_svg}
                        </button>
                    ` : `
                        <button class="${app.cant_delete_button_class}"
                                title="Нельзя удалить: используется ${equipmentJobsCount} оборудованием">
                             ${app.delete_button_svg}
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
};

/**
 * Возвращает иконку для видимого оборудования
 * @returns {string} SVG иконка
 */
const getVisibleIcon = () => `
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path id="Vector" d="M8 12L11 15L16 9M4 16.8002V7.2002C4 6.08009 4 5.51962 4.21799 5.0918C4.40973 4.71547 4.71547 4.40973 5.0918 4.21799C5.51962 4 6.08009 4 7.2002 4H16.8002C17.9203 4 18.4796 4 18.9074 4.21799C19.2837 4.40973 19.5905 4.71547 19.7822 5.0918C20 5.5192 20 6.07899 20 7.19691V16.8036C20 17.9215 20 18.4805 19.7822 18.9079C19.5905 19.2842 19.2837 19.5905 18.9074 19.7822C18.48 20 17.921 20 16.8031 20H7.19691C6.07899 20 5.5192 20 5.0918 19.7822C4.71547 19.5905 4.40973 19.2842 4.21799 18.9079C4 18.4801 4 17.9203 4 16.8002Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
        <path id="Vector" d="M4 7.2002V16.8002C4 17.9203 4 18.4801 4.21799 18.9079C4.40973 19.2842 4.71547 19.5905 5.0918 19.7822C5.5192 20 6.07899 20 7.19691 20H16.8031C17.921 20 18.48 20 18.9074 19.7822C19.2837 19.5905 19.5905 19.2842 19.7822 18.9079C20 18.4805 20 17.9215 20 16.8036V7.19691C20 6.07899 20 5.5192 19.7822 5.0918C19.5905 4.71547 19.2837 4.40973 18.9074 4.21799C18.4796 4 17.9203 4 16.8002 4H7.2002C6.08009 4 5.51962 4 5.0918 4.21799C4.71547 4.40973 4.40973 4.71547 4.21799 5.0918C4 5.51962 4 6.08009 4 7.2002Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
`;

/**
 * Возвращает иконку для скрытого оборудования
 * @returns {string} SVG иконка
 */
const getHiddenIcon = () => `
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path id="Vector" d="M4 7.2002V16.8002C4 17.9203 4 18.4801 4.21799 18.9079C4.40973 19.2842 4.71547 19.5905 5.0918 19.7822C5.5192 20 6.07899 20 7.19691 20H16.8031C17.921 20 18.48 20 18.9074 19.7822C19.2837 19.5905 19.5905 19.2842 19.7822 18.9079C20 18.4805 20 17.9215 20 16.8036V7.19691C20 6.07899 20 5.5192 19.7822 5.0918C19.5905 4.71547 19.2837 4.40973 18.9074 4.21799C18.4796 4 17.9203 4 16.8002 4H7.2002C6.08009 4 5.51962 4 5.0918 4.21799C4.71547 4.40973 4.40973 4.71547 4.21799 5.0918C4 5.51962 4 6.08009 4 7.2002Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
`;
