import GanttManager from "./modules/GanttManager.js";
import CalendarManager from "./modules/CalendarManager.js";
import OrdersManager from "./modules/OrdersManager.js";
import JobsManager from "./modules/JobsManager.js";
import EquipmentManager from "./modules/EquipmentManager.js";
import BackupManager from "./modules/BackupManager.js";
import HistoryManager from "./modules/HistoryManager.js";

class App {
    constructor() {
        this.isDark = window.APP_CONFIG?.isDark || false;

        this.currentPage = localStorage.getItem('lastVisitedPage') || window.APP_CONFIG?.currentPage || 'home';
        this.sidebarOpen = true;

        this.edit_button_class = "p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors tooltip"
        this.move_button_class = "p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors tooltip"
        this.delete_button_class = "p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors tooltip"
        this.cant_delete_button_class = "p-2 flex items-center justify-center rounded bg-gray-300 dark:bg-gray-600 cursor-not-allowed"

        this.sun_svg = '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">\n' +
            '    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>\n' +
            '</svg>'
        this.moon_svg = '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">\n' +
            '    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>\n' +
            '</svg>'

        this.move_up_button_svg = "" +
            "<svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">" +
            "    <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 15l7-7 7 7\"></path>" +
            "</svg>"
        this.move_down_button_svg = "<svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">" +
            "    <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M19 9l-7 7-7-7\"></path>" +
            "</svg>"
        this.edit_button_svg = '                                ' +
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>' +
            '</svg>'
        this.delete_button_svg = '                                 ' +
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>' +
            '</svg>'
        this.change_button_svg = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n' +
            '    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>\n' +
            '</svg>'

        // Система подсказок
        this.tips = [
            {
                title: "Горячие клавиши (Ctrl+Z)",
                content: "Используйте Ctrl+Z для отмены последнего действия по изменению параметров работ."
            },
            {
                title: "Горячие клавиши (Ctrl+Y)",
                content: "Используйте Ctrl+Y для повтора действия по изменению параметров работ."
            },
            {
                title: "Горячие клавиши (Ctrl+←)",
                content: "Используйте Ctrl+стрелка влево на диаграмме загрузки оборудования для прижатия выбранной работы вплотную к предыдущей."
            },
            {
                title: "Горячие клавиши (Ctrl+→)",
                content: "Используйте Ctrl+стрелка вправо на диаграмме загрузки оборудования для прижатия выбранной работы вплотную к следующей за ней."
            },
            {
                title: "Горячие клавиши (Delete)",
                content: "На диаграмме загрузки оборудования используйте Delete для удаления выбранной работы."
            },
            {
                title: "Горячие клавиши",
                content: "На диаграмме загрузки оборудования используйте двойной клик мышкой по работе, чтобы вызвать окно редактирования параметров работы."
            },
            {
                title: "Горячие клавиши",
                content: "На диаграмме загрузки оборудования используйте клавишу Ctrl и двойной клик мышкой по выбранной работы, чтобы вызвать окно редактирования параметров заказа из этой работы."
            },
            {
                title: "Быстрое создание",
                content: "Используйте кнопки в боковой панели для быстрого создания оборудования, заказов и работ без переключения между страницами."
            },
            {
                title: "Быстрое изменение",
                content: "Используйте двойной клик мышкой на ячейке даты в календаре для быстрого изменения количества рабочих дней."
            },
        ]
        this.initManagers();
        this.init();
    }

    initManagers() {
        this.ganttManager = new GanttManager(this);
        this.calendarManager = new CalendarManager(this);
        this.ordersManager = new OrdersManager(this);
        this.equipmentManager = new EquipmentManager(this);
        this.jobsManager = new JobsManager(this);
        this.backupManager = new BackupManager(this);
        this.historyManager = new HistoryManager(this);
    }

    async toggleTheme() {
        try {
            const response = await fetch('/api/theme/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            this.ganttManager.preserveSelection();

            const data = await response.json();
            this.isDark = data.is_dark;
            this.applyTheme(this.isDark);
            if (this.currentPage == "gantt")
                this.ganttManager.renderGanttChart(this.ganttManager.ganttSettings)

        } catch (error) {
            console.error('Ошибка переключения темы:', error);
            // Fallback: переключаем тему локально если сервер не ответил
            this.isDark = !this.isDark;
            this.applyTheme(this.isDark);
        }
    }

    applyTheme(isDark) {
        this.isDark = isDark;
        const themeIcon = document.getElementById('theme-icon');

        if (isDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
            if (themeIcon) themeIcon.innerHTML = this.sun_svg;
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
            if (themeIcon) themeIcon.innerHTML = this.moon_svg;
        }

        // Сохраняем тему в localStorage для сохранения между перезагрузками
        localStorage.setItem('isDark', isDark);
    }

    async navigateTo(page) {
        try {
            const response = await fetch(`/api/navigation/${page}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                this.currentPage = page;
                // Сохраняем текущую страницу в localStorage
                localStorage.setItem('lastVisitedPage', page);
                this.loadPage(page);
                this.updateActiveNavButton(page);
                this.toggleQuickActionsVisibility((page === "gantt"));
                if (page !== "gantt")
                    await this.updateJobDetails(null);
                this.ganttManager.updateJobMoveButtonsVisibility();
            } else {
                throw new Error('Navigation failed');
            }
        } catch (error) {
            console.error('Ошибка навигации:', error);
            // Fallback: переходим на страницу локально
            this.currentPage = page;
            // Сохраняем текущую страницу в localStorage
            localStorage.setItem('lastVisitedPage', page);
            this.loadPage(page);
            this.updateActiveNavButton(page);
        }
    }

    init() {
        this.applyTheme(this.isDark);
        this.updateActiveNavButton(this.currentPage);
        this.initTipsSystem();
        // Загружаем последнюю посещенную страницу при инициализации
        this.loadPage(this.currentPage);
        // Инициализируем обработку горячих клавиш
        this.initKeyboardShortcuts();

        console.log('IS ProCalendar инициализирован. Текущая страница:', this.currentPage);
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Z для Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.historyManager.undo();
            }

            // Ctrl+Y или Ctrl+Shift+Z для Redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.historyManager.redo();
            }

            // Ctrl+Стрелка влево для перемещения работы влево
            if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
                e.preventDefault();
                if (this.ganttManager && this.ganttManager.moveJobLeft) {
                    this.ganttManager.moveJobLeft();
                }
            }

            // Ctrl+Стрелка вправо для перемещения работы вправо
            if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
                e.preventDefault();
                if (this.ganttManager && this.ganttManager.moveJobRight) {
                    this.ganttManager.moveJobRight();
                }
            }

            // Delete для удаления работы
            if (e.key === 'Delete') {
                e.preventDefault();
                if (this.ganttManager && this.ganttManager.selectedJob) {
                    this.jobsManager.deleteJob(this.ganttManager.selectedJob.id);
                }
            }
        });
    }

    updateActiveNavButton(activePage) {
        // Убираем активный класс со всех кнопок
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('bg-blue-600', 'bg-blue-700');
            btn.classList.add('bg-transparent');
        });

        // Добавляем активный класс к текущей кнопке
        const activeBtn = document.querySelector(`.nav-btn[data-page="${activePage}"]`);
        if (activeBtn) {
            activeBtn.classList.remove('bg-transparent');
            activeBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }
    }

    async loadPage(page) {
        const content = document.getElementById('page-content');

        // Показываем индикатор загрузки
        content.innerHTML = `
            <div class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span class="ml-3 text-lg dark:text-white">Загрузка...</span>
            </div>
        `;

        try {
            let html = '';

            switch (page) {
                case 'gantt':
                    html = await this.ganttManager.renderGanttPage();
                    break;
                case 'equipment':
                    html = await this.equipmentManager.renderEquipmentPage();
                    break;
                case 'orders':
                    html = await this.ordersManager.renderOrdersPage();
                    break;
                case 'jobs':
                    html = await this.jobsManager.renderJobsPage();
                    break;
                case 'calendar':
                    html = await this.calendarManager.renderCalendarPage();
                    break;
                default:
                    html = this.renderHomePage();
            }

            // Плавное появление контента
            content.innerHTML = html;
            this.animateContent(content);
            await this.updateEquipmentButtonState();
            await this.updateJobButtonState();

            // Инициализация специфичных для страницы функций
            if (page === 'gantt') {
                await this.ganttManager.initGanttPage();
                await this.updateJobDetails(null);
            }

            this.ganttManager.updateJobMoveButtonsVisibility();

        } catch (error) {
            console.error('Ошибка загрузки страницы:', error);
            content.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-red-500 text-xl mb-4">❌ Ошибка загрузки страницы</div>
                    <button onclick="app.navigateTo('home')" 
                            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                        Вернуться на главную
                    </button>
                </div>
            `;
            this.animateContent(content);
        }
    }

    animateContent(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(10px)';

        setTimeout(() => {
            element.style.transition = 'all 0.3s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 50);
    }

    renderHomePage() {
        return `
            <div class="max-w-4xl mx-auto">
                <div class="text-center mb-12">
                    <h2 class="text-4xl font-bold text-black dark:text-white mb-4">Добро пожаловать в IS ProCalendar</h2>
                    <p class="text-xl text-gray-700 dark:text-gray-300">Система управления производственным календарем</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                        <h3 class="text-xl font-semibold text-black dark:text-white mb-3">📊 Диаграмма загрузки оборудования</h3>
                        <p class="text-gray-700 dark:text-gray-300 mb-4">Визуализация производственного плана с временными интервалами</p>
                        <button onclick="app.navigateTo('gantt')" 
                                class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors">
                            Перейти к диаграмме
                        </button>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                        <h3 class="text-xl font-semibold text-black dark:text-white mb-3">🏭 Оборудование</h3>
                        <p class="text-gray-700 dark:text-gray-300 mb-4">Управление типами оборудования и их настройками</p>
                        <button onclick="app.navigateTo('equipment')" 
                                class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors">
                            Управление оборудованием
                        </button>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                        <h3 class="text-xl font-semibold text-black dark:text-white mb-3">📋 Заказы</h3>
                        <p class="text-gray-700 dark:text-gray-300 mb-4">Создание и отслеживание производственных заказов</p>
                        <button onclick="app.navigateTo('orders')" 
                                class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors">
                            Управление заказами
                        </button>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                        <h3 class="text-xl font-semibold text-black dark:text-white mb-3">⚙️ Работы</h3>
                        <p class="text-gray-700 dark:text-gray-300 mb-4">Планирование и учет производственных работ</p>
                        <button onclick="app.navigateTo('jobs')" 
                                class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors">
                            Управление работами
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle');
        const mainContent = document.getElementById('main-content');
        const body = document.body;

        if (this.sidebarOpen) {
            // Показываем sidebar
            sidebar.classList.remove('hidden', 'transform', '-translate-x-full');
            sidebar.classList.add('block');

            // Убираем класс скрытого sidebar
            body.classList.remove('sidebar-hidden');

            // Перемещаем кнопку вправо
            toggleBtn.style.left = '200px';
            toggleBtn.innerHTML = '«';
            toggleBtn.title = 'Скрыть боковую панель';
            mainContent.classList.remove('pl-8');
            mainContent.classList.add('pl-4');

        } else {
            // Скрываем sidebar
            sidebar.classList.remove('block');
            sidebar.classList.add('hidden');

            // Добавляем класс скрытого sidebar
            body.classList.add('sidebar-hidden');

            // Перемещаем кнопку влево
            toggleBtn.style.left = '0.5rem';
            toggleBtn.innerHTML = '»';
            toggleBtn.title = 'Показать боковую панель';
            mainContent.classList.add('pl-8');
            mainContent.classList.remove('pl-4');
        }

        // Обновляем размер контейнера Ганта
        if (this.currentPage === 'gantt') {
            setTimeout(() => {
                this.ganttManager.adjustGanttContainer();
            }, 300);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
            type === 'success' ? 'bg-green-500' :
                type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white max-w-sm`;
        notification.innerHTML = `
            <div class="flex items-center">
                <!--<span class="text-lg mr-2">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span><--!>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showModal(html) {
        // Удаляем существующие модальные окна
        this.closeModal();

        const modalContainer = document.createElement('div');
        modalContainer.id = 'modal-container';
        modalContainer.innerHTML = html;

        document.body.appendChild(modalContainer);

        // Инициализируем перетаскивание для модального окна
        this.initModalDragging();
    }

    closeModal() {
        const existingModal = document.getElementById('modal-container');
        if (existingModal) {
            existingModal.remove();
        }
        this.ganttManager.updateJobMoveButtonsVisibility();
    }

    // Вспомогательный метод для получения сегодняшней даты
    getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    createNewJob(equipmentId = null, startDate = null) {
        // Открываем модальное окно без переключения страниц
        if (this.jobsManager && this.jobsManager.openJobModal) {
            this.jobsManager.openJobModal(null, equipmentId, startDate);
        } else {
            console.error('JobsManager не доступен');
            this.showNotification('Ошибка открытия формы работы', 'error');
        }
    }

    // В классе App добавьте метод:
    async updateEquipmentButtonState() {
        try {
            const response = await fetch('/api/equipment/types');
            if (response.ok) {
                const data = await response.json();
                const hasTypes = data.types && data.types.length > 0;
                const equipmentBtns = document.getElementsByClassName('new-equipment-btn');

                for (const equipmentBtn of equipmentBtns) {
                    if (hasTypes) {
                        equipmentBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
                        equipmentBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
                        equipmentBtn.disabled = false;
                        equipmentBtn.title = '';
                    } else {
                        equipmentBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                        equipmentBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
                        equipmentBtn.disabled = true;
                        equipmentBtn.title = 'Сначала добавьте тип оборудования';
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка проверки типов оборудования:', error);
        }
    }

    async updateJobButtonState() {
        try {
            const [ordersResponse, equipmentResponse] = await Promise.all([
                fetch('/api/orders/list'),
                fetch('/api/equipment/list')
            ]);
            if ((equipmentResponse.ok) && (ordersResponse.ok)) {
                const equipment_data = await equipmentResponse.json();
                const hasEquipment = equipment_data.equipment && equipment_data.equipment.length > 0;
                const orders_data = await ordersResponse.json();
                const hasOrders = orders_data.orders && orders_data.orders.length > 0;
                const jobBtns = document.getElementsByClassName('new-job-btn');

                for (const jobBtn of jobBtns) {
                    if (hasEquipment && hasOrders) {
                        jobBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
                        jobBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
                        jobBtn.disabled = false;
                        jobBtn.title = '';
                    } else {
                        jobBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                        jobBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
                        jobBtn.disabled = true;
                        jobBtn.title = 'Сначала добавьте оборудование и заказы';
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка проверки оборудования или заказов:', error);
        }
    }

    async createNewType() {
        try {
            if (this.equipmentManager) {
                this.equipmentManager.openTypeModal();
            }
        } catch (error) {
            console.error('Ошибка добавления типа оборудования:', error);
            this.showNotification('❌ Ошибка проверки типов оборудования', 'error');
        }
    }

    async createNewEquipment() {
        // Проверяем наличие типов перед открытием модального окна
        try {
            const response = await fetch('/api/equipment/types');
            if (response.ok) {
                const data = await response.json();
                if (!data.types || data.types.length === 0) {
                    this.showNotification('❌ Сначала добавьте тип оборудования', 'error');
                    return;
                }
            }

            // Если типы есть, открываем модальное окно
            if (this.equipmentManager) {
                this.equipmentManager.openEquipmentModal();
            }
        } catch (error) {
            console.error('Ошибка проверки типов оборудования:', error);
            this.showNotification('❌ Ошибка проверки типов оборудования', 'error');
        }
    }

    createNewOrder() {
        if (this.ordersManager && this.ordersManager.openOrderModal) {
            this.ordersManager.openOrderModal();
        } else {
            console.error('OrdersManager не доступен');
            this.showNotification('Ошибка открытия формы заказа', 'error');
        }
    }

    openBackupManager() {
        if (this.backupManager && this.backupManager.openBackupManager) {
            this.backupManager.openBackupManager();
        } else {
            console.error('BackupManager не доступен');
            this.showNotification('Ошибка открытия менеджера бэкапов', 'error');
        }
    }

    // Добавляем методы для работы с историей
    async saveHistorySnapshot(type = 'full') {
        const snapshot = await this.historyManager.createSnapshot(type);
        if (snapshot) {
            this.historyManager.pushState(snapshot);
        }
    }

    async clearHistory(auto_confirm = false) {
        if (!auto_confirm)
            if (!confirm('Вы уверены, что хотите полностью очистить историю изменений?\n\nПосле очистки будет создан новый начальный снимок текущего состояния.\n\nЭто действие нельзя отменить.')) {
                return;
            }

        try {
            const response = await fetch('/api/history/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('✅ История изменений очищена и создан новый снимок', 'success');

                // Обновляем состояние истории в интерфейсе
                if (this.historyManager) {
                    this.historyManager.updateHistoryState();
                }

                // Обновляем текущую страницу
                this.loadPage(this.currentPage);

            } else {
                this.showNotification(`❌ ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка очистки истории:', error);
            this.showNotification('❌ Ошибка очистки истории', 'error');
        }
    }

    async updateJobDetails(job) {
        const jobDetailsElement = document.getElementById('job-details');
        if (!jobDetailsElement) return;
        this.toggleQuickActionsVisibility(job);

        if (!job) {
            jobDetailsElement.innerHTML = `
            <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                Выберите работу на диаграмме
            </div>
        `;
            return;
        }

        try {
            // Получаем полную информацию о работе
            const response = await fetch(`/api/jobs/${job.id}`);
            if (!response.ok) throw new Error('Ошибка загрузки данных работы');

            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            const jobData = result.job;

            const date_format_options = {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            }

            // Получаем информацию о заказе для тиража
            const orderResponse = await fetch(`/api/orders/${jobData.order_id}`);
            const orderResult = await orderResponse.json();
            const quantity = orderResult.success ? orderResult.order.quantity : 'Неизвестно';
            const orderName = orderResult.success ? orderResult.order.name : '';

            // Рассчитываем время финиша и расписание
            const finishData = await this.calculateJobFinishData(jobData);

            // Форматируем даты
            const startDate = new Date(jobData.start_date);
            const formattedStartDate = startDate.toLocaleDateString('ru-RU', date_format_options);
            //const formattedStartTime = this.formatTime(jobData.hour_offset);

            const finishDate = new Date(finishData.finish_date);
            const formattedFinishDate = finishDate.toLocaleDateString('ru-RU', date_format_options);
            //const formattedFinishTime = this.formatTime(finishData.finish_offset);

            // Генерируем HTML для деталей
            jobDetailsElement.innerHTML = `
            <div class="space-y-1 p-2 text-black dark:text-gray-300">
                <div class="flex justify-between">
                    <span class="font-medium">Заказ:</span>
                    <span>${orderName}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">Тираж:</span>
                    <span>${quantity}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">Время старта:</span>
                    <span>${formattedStartDate}  (${jobData.hour_offset})</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">Длительность:</span>
                    <span>${jobData.duration_hours} ч</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">Время финиша:</span>
                    <span>${formattedFinishDate} (${finishData.finish_offset})</span>
                </div>
                <div class="border-t border-gray-300 dark:border-gray-600 pt-2">
                    <div class="font-medium mb-1">Расписание по дням:</div>
                    <div class="space-y-1 text-xs">
                        ${this.generateDailyScheduleHTML(finishData.daily_schedule)}
                    </div>
                </div>
            </div>
        `;

        } catch (error) {
            console.error('Ошибка загрузки деталей работы:', error);
            jobDetailsElement.innerHTML = `
            <div class="text-center py-4 text-red-500">
                Ошибка загрузки данных
            </div>
        `;
        }
    }

    // Вспомогательный метод для расчета данных финиша
    async calculateJobFinishData(jobData) {
        try {
            const response = await fetch('/api/jobs/calculate-finish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    start_date: jobData.start_date,
                    duration_hours: jobData.duration_hours,
                    hour_offset: jobData.hour_offset || 0
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    return result.data;
                }
            }

            // Fallback: простой расчет если API недоступно
            const startDate = new Date(jobData.start_date);
            const finishDate = new Date(startDate.getTime() + jobData.duration_hours * 60 * 60 * 1000);

            return {
                finish_date: finishDate.toISOString().split('T')[0],
                finish_offset: (jobData.hour_offset || 0) + jobData.duration_hours,
                daily_schedule: [{
                    date: jobData.start_date,
                    hours: jobData.duration_hours,
                    offset: jobData.hour_offset || 0
                }]
            };

        } catch (error) {
            console.error('Ошибка расчета финиша:', error);
            throw error;
        }
    }

    // Вспомогательный метод для форматирования времени
    formatTime(hours) {
        const totalMinutes = Math.round(hours * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    // Вспомогательный метод для генерации HTML расписания по дням
    generateDailyScheduleHTML(schedule) {
        if (!schedule || schedule.length === 0) {
            return '<div class="text-gray-500">Нет данных о расписании</div>';
        }

        return schedule.map(day => {
            const date = new Date(day.date);
            const formattedDate = date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
            });
            const startOffset = day.offset >= 10 ? day.offset.toFixed(2) : "0" + day.offset.toFixed(2);
            const finishOffset = (day.offset + day.hours) >= 10 ? (day.offset + day.hours).toFixed(2) : "0" + (day.offset + day.hours).toFixed(2);
            const endTime = this.formatTime(day.offset + day.hours);

            return `
            <div class="flex justify-start items-center py-0">
                <span class="w-16">${formattedDate}</span>
                <span class="font-mono w-24">${startOffset}-${finishOffset}</span>
                <span class="text-gray-500">(${day.hours}ч)</span>
            </div>
        `;
        }).join('');
    }

    toggleQuickActionsVisibility(show) {
        const quickActions = document.querySelector('.quick-actions');
        if (!quickActions) return;

        if (!show) {
            quickActions.classList.remove('hidden');
        } else {
            quickActions.classList.add('hidden');
        }
    }

    initModalDragging() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        // Находим элементы модального окна
        const modalDialog = modalContainer.querySelector('.modal-dialog');
        const dragHandle = modalContainer.querySelector('#modal-drag-handle');

        if (!modalDialog || !dragHandle) return;

        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        // Функция для установки позиции
        const setPosition = (left, top) => {
            const maxLeft = window.innerWidth - modalDialog.offsetWidth - 20;
            const maxTop = window.innerHeight - modalDialog.offsetHeight - 20;

            const boundedLeft = Math.max(20, Math.min(left, maxLeft));
            const boundedTop = Math.max(20, Math.min(top, maxTop));

            modalDialog.style.position = 'fixed';
            modalDialog.style.left = `${boundedLeft}px`;
            modalDialog.style.top = `${boundedTop}px`;
            modalDialog.style.margin = '0';
            modalDialog.style.transform = 'none';
        };

        // Центрируем модальное окно при открытии
        setTimeout(() => {
            const rect = modalDialog.getBoundingClientRect();
            const centerX = (window.innerWidth - rect.width) / 2;
            const centerY = (window.innerHeight - rect.height) / 2;
            setPosition(centerX, centerY);
        }, 10);

        // Обработчики для drag handle
        dragHandle.addEventListener('mousedown', startDrag);
        dragHandle.addEventListener('touchstart', startDragTouch);

        function startDrag(e) {
            isDragging = true;
            const rect = modalDialog.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = rect.left;
            initialTop = rect.top;

            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);

            // Визуальная обратная связь
            dragHandle.style.cursor = 'grabbing';
            modalDialog.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';

            e.preventDefault();
        }

        function startDragTouch(e) {
            if (e.touches.length !== 1) return;

            isDragging = true;
            const rect = modalDialog.getBoundingClientRect();
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            initialLeft = rect.left;
            initialTop = rect.top;

            document.addEventListener('touchmove', onDragTouch);
            document.addEventListener('touchend', stopDrag);

            e.preventDefault();
        }

        function onDrag(e) {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            setPosition(initialLeft + deltaX, initialTop + deltaY);
        }

        function onDragTouch(e) {
            if (!isDragging || e.touches.length !== 1) return;

            const deltaX = e.touches[0].clientX - startX;
            const deltaY = e.touches[0].clientY - startY;

            setPosition(initialLeft + deltaX, initialTop + deltaY);

            e.preventDefault();
        }

        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('touchmove', onDragTouch);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchend', stopDrag);

            // Возвращаем нормальный курсор и тень
            dragHandle.style.cursor = 'move';
            modalDialog.style.boxShadow = '';
        }

        // Предотвращаем выделение текста при перетаскивании
        dragHandle.style.userSelect = 'none';
        dragHandle.style.webkitUserSelect = 'none';
    }

    initTipsSystem() {
        const tipsToggle = document.getElementById('tips-toggle');
        const tipsModal = document.getElementById('tips-modal');
        const tipsClose = document.getElementById('tips-close');
        const tipsOk = document.getElementById('tips-ok');
        const nextTip = document.getElementById('next-tip');
        const tipsTitle = document.getElementById('tips-title');
        const tipsContent = document.getElementById('tips-content');

        if (!tipsToggle || !tipsModal) return;

        // Показ случайной подсказки
        tipsToggle.addEventListener('click', () => {
            this.showRandomTip();
        });

        // Закрытие модального окна
        const closeTipsModal = () => {
            tipsModal.classList.add('hidden');
        };

        tipsClose.addEventListener('click', closeTipsModal);
        tipsOk.addEventListener('click', closeTipsModal);

        // Следующая подсказка
        nextTip.addEventListener('click', () => {
            this.showRandomTip();
        });

        // Закрытие по клику вне модального окна
        tipsModal.addEventListener('click', (e) => {
            if (e.target === tipsModal) {
                closeTipsModal();
            }
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !tipsModal.classList.contains('hidden')) {
                closeTipsModal();
            }
        });
    }

    getRandomTip() {
        const randomIndex = Math.floor(Math.random() * this.tips.length);
        return this.tips[randomIndex];
    }

    showRandomTip() {
        const tip = this.getRandomTip();
        const tipsModal = document.getElementById('tips-modal');
        const tipsTitle = document.getElementById('tips-title');
        const tipsContent = document.getElementById('tips-content');

        if (!tipsModal || !tipsTitle || !tipsContent) return;

        tipsTitle.textContent = tip.title;
        tipsContent.textContent = tip.content;
        tipsModal.classList.remove('hidden');
    }

}

// Инициализация приложения когда DOM загружен
document.addEventListener('DOMContentLoaded', function () {
    window.app = new App();
    window.backupManager = window.app.backupManager;
    // Глобальные функции для кнопок Undo/Redo
    window.undo = () => window.app.historyManager.undo();
    window.redo = () => window.app.historyManager.redo();
});