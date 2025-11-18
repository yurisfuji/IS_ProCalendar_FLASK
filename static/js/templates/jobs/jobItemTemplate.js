/**
 * Шаблон элемента работы
 * @param {Object} job - данные работы
 * @param {Object} app - главный экземпляр приложения
 * @returns {string} HTML-разметка элемента работы
 */
export const jobItemTemplate = (job, app) => {
    // Определяем цвет и иконку статуса
    let statusColor = '';
    let statusIcon = '';
    let statusText = '';

    switch (job.status) {
        case 'planned':
            statusColor = 'text-blue-500 bg-blue-100 dark:bg-blue-900';
            statusIcon = '📅';
            statusText = 'Запланирована';
            break;
        case 'started':
            statusColor = 'text-orange-500 bg-orange-100 dark:bg-orange-900';
            statusIcon = '⚙️';
            statusText = 'В работе';
            break;
        case 'completed':
            statusColor = 'text-green-500 bg-green-100 dark:bg-green-900';
            statusIcon = '✅';
            statusText = 'Завершена';
            break;
        default:
            statusColor = 'text-gray-500 bg-gray-100 dark:bg-gray-900';
            statusIcon = '❓';
            statusText = 'Неизвестно';
    }

    // Форматируем дату
    const startDate = new Date(job.start_date);
    const formattedDate = startDate.toLocaleDateString('ru-RU');

    return `
        <div onclick="app.jobsManager.updateJobDetailsById(${job.id})" class="job-item group bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg p-3 transition-colors border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3 flex-1 min-w-0">
                    <!-- Цвет заказа -->
                    <div class="w-8 h-8 rounded flex-shrink-0 border border-white dark:border-gray-600 shadow-sm" 
                         style="background-color: ${job.order_color}">
                    </div>
                    
                    <!-- Информация о работе -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center space-x-2 mb-1">
                            <span class="text-xs px-2 py-1 rounded-full ${statusColor}">
                                ${statusIcon} ${statusText}
                            </span>
                            ${job.is_locked ? '<span class="text-xs text-red-500 bg-red-100 dark:bg-red-900 px-2 py-1 rounded-full">🔒 Заблокирована</span>' : ''}
                        </div>
                        <h4 class="text-sm font-semibold dark:text-white truncate" title="Заказ: ${job.order_name} | Оборудование: ${job.equipment_name}">
                            📦 ${job.order_name} → 🏭 ${job.equipment_name}
                        </h4>
                        <div class="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>📅 ${formattedDate}</span>
                            <span>•</span>
                            <span>⏱️ ${job.duration_hours} ч.</span>
                            <span>•</span>
                            <span>⏰ Смещение: ${job.hour_offset} ч.</span>
                        </div>
                    </div>
                </div>
                
                <!-- Кнопки управления -->
                <div class="flex items-center space-x-1 ml-3 opacity-0 group-hover:opacity-100">
                    <!-- Кнопка смены статуса -->
                    <button class="${app.move_button_class}"
                            onclick="app.jobsManager.changeJobStatus(${job.id}, 'planned')"
                            title="Сменить статус работы">
                        ${app.change_button_svg}
                    </button>
                    
                    <button class="${app.edit_button_class}"
                            onclick="app.jobsManager.openJobModal(${job.id})"
                            title="Редактировать">
                    ${app.edit_button_svg}
                    </button>
                    
                    <button class="${app.delete_button_class}"
                            onclick="app.jobsManager.deleteJob(${job.id})"
                            title="Удалить">
                    ${app.delete_button_svg}
                    </button>
                </div>
            </div>
        </div>
    `;
};
