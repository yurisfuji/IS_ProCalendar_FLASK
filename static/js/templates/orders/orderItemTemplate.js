export const orderItemTemplate = (order, index, stageColor, stageIcon, app, totalOrders) => `
    <div class="order-item group bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg p-3 transition-colors border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3 flex-1 min-w-0">
                <!-- Цветной индикатор заказа -->
                <div class="w-9 h-12 rounded flex-shrink-0 border border-white dark:border-gray-600 shadow-sm" 
                     style="background-color: ${order.color}">
                </div>
                
                <!-- Информация о заказе -->
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-semibold dark:text-white truncate" title="${order.name}">
                        ${order.name}
                    </h4>
                    <div class="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>Кол-во: ${order.quantity} шт.</span>
                        <span>•</span>
                        <span>Работ: ${order.jobs_count || 0}</span>
                        <span>•</span>
                        <span class="flex items-center space-x-1">
                            <span>Этап:</span>
                            <span class="${stageColor} font-medium flex items-center space-x-1">
                                <span>${stageIcon}</span>
                                <span>${order.stage}</span>
                            </span>
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Кнопки управления -->
            <div class="flex items-center space-x-1 ml-3 opacity-0 group-hover:opacity-100">
                ${index > 0 ? `
                    <button class="${app.move_button_class}"
                            onclick="app.ordersManager.moveOrder(${order.id}, 'up')"
                            title="Повысить приоритет">
                        ${app.move_up_button_svg}
                    </button>
                ` : ''}
                
                ${index < totalOrders - 1 ? `
                    <button class="${app.move_button_class}"
                            onclick="app.ordersManager.moveOrder(${order.id}, 'down')"
                            title="Понизить приоритет">
                        ${app.move_down_button_svg}
                    </button>
                ` : ''}
                
                <button class="${app.edit_button_class}"
                        onclick="app.ordersManager.openOrderModal(${order.id})"
                        title="Редактировать">
                        ${app.edit_button_svg}
                </button>
                
                ${order.jobs_count === 0 ? `
                    <button class="${app.delete_button_class}"
                            onclick="app.ordersManager.deleteOrder(${order.id})"
                            title="Удалить">
                         ${app.delete_button_svg}
                    </button>
                ` : `
                    <button class="${app.cant_delete_button_class}"
                            title="Нельзя удалить: связано ${order.jobs_count} работ">
                         ${app.delete_button_svg}
                    </button>
                `}
            </div>
        </div>
    </div>
`;