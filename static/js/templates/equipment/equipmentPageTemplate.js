/**
 * Шаблон страницы управления оборудованием
 * @param {Object} equipmentManager - экземпляр менеджера оборудования
 * @param {boolean} hasTypes - флаг наличия типов оборудования
 * @param {string} tabContent - содержимое активной вкладки
 * @returns {string} HTML-разметка страницы оборудования
 */
export const equipmentPageTemplate = (equipmentManager, hasTypes, tabContent) => `
    <div class="fade-in">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-3xl font-bold dark:text-white">🏭 Управление оборудованием</h2>
            <div class="flex space-x-3">
                <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                        onclick="app.equipmentManager.openTypeModal()">
                    🎨 Новый тип
                </button>
                <button class="new-equipment-btn ${hasTypes ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'} text-white px-4 py-2 rounded-lg transition-colors"
                        onclick="app.equipmentManager.openEquipmentModal()"
                        ${!hasTypes ? 'disabled title="Сначала добавьте тип оборудования"' : ''}>
                    🏭 Новое оборудование
                </button>
            </div>
        </div>
        
        <!-- Вкладки -->
        <div class="mb-6">
            <div class="flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                <button class="tab-button ${equipmentManager.activeEquipmentTab === 'types' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} flex-1 py-2 px-4 rounded-md transition-colors"
                        onclick="app.equipmentManager.switchEquipmentTab('types')">
                    🎨 Типы оборудования
                </button>
                <button class="tab-button ${equipmentManager.activeEquipmentTab === 'equipment' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} flex-1 py-2 px-4 rounded-md transition-colors"
                        onclick="app.equipmentManager.switchEquipmentTab('equipment')">
                    🏭 Производственное оборудование
                </button>
            </div>
        </div>
        
        <!-- Контент вкладок -->
        <div id="equipment-tab-content">
            ${tabContent}
        </div>
    </div>
`;
