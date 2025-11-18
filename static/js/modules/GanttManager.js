class JobDataManager {
    constructor() {
        this.jobs = [];
    }

    setJobs(jobsData) {
        this.jobs = jobsData.map(job => ({
            id: job.id,
            //name: job.name,
            //equipment: job.equipment,
            //start_time: job.start_time,
            //end_time: job.end_time,
            coordinates: job.coordinates, // {x1, y1, x2, y2} - координаты прямоугольника работы
            equipment_name: job.equipment_name,
            order_name: job.order_name,
            order_id: job.order_id
            //color: job.color
        }));
    }

    findJobByCoordinates(x, y) {
        return this.jobs.find(job => {
            const coords = job.coordinates;
            return x >= coords.x1 && x <= coords.x2 &&
                y >= coords.y1 && y <= coords.y2;
        });
    }

    getJobInfo(jobId) {
        return this.jobs.find(job => job.id === jobId);
    }
}

export default class GanttManager {
    constructor(app) {
        this.app = app;
        this.selectedJob = null;
        this.ganttSettings = {
            startDate: localStorage.getItem('ganttStartDate') || this.app.getTodayDate(),
            viewMode: localStorage.getItem('ganttViewMode') || 'week',
            equipmentFilter: localStorage.getItem('ganttEquipmentFilter') || 'visible',
            pixelsPerHour: parseInt(localStorage.getItem('ganttPixelsPerHour')) || 20,
            rowHeight: parseInt(localStorage.getItem('ganttRowHeight')) || 60,
            jobHeightRatio: parseInt(localStorage.getItem('ganttJobHeightRatio')) || 80,
            scale: parseFloat(localStorage.getItem('ganttScale')) || 0.5
        };
        this.ganttUpdateTimeout = null;

        this.resizeTimeout = null;
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);

        this.jobDataManager = new JobDataManager();

        this.scrollSaveTimeout = null;
        this.debouncedSaveScroll = this.debouncedSaveScroll.bind(this);
    }

    // Добавим метод обработки изменения размера окна
    handleResize() {
        if (this.app.currentPage === 'gantt') {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.adjustGanttContainer();
            }, 100);
        }
    }

    async renderGanttPage() {
        return `
        <div>         
            <!-- Элементы управления диаграммой -->
            <div class="gantt-page-container bg-white dark:bg-gray-800 rounded-lg shadow-md px-3 py-1 border border-gray-200 dark:border-gray-700 mb-2">
                <div class="flex">
                    <!-- Длительность диаграммы -->
                    <div class="min-w-0 flex-1 w-32 mr-6">
                        <label class="block text-xs font-medium dark:text-gray-300 mb-1 truncate">
                            Период
                        </label>
                        <select class="w-full p-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                id="gantt-duration"
                                onchange="app.ganttManager.applyGanttSettings()">
                            <option value="week">Неделя</option>
                            <option value="month">Месяц</option>
                            <option value="year">Год</option>
                        </select>
                    </div>

                    <!-- Навигация по времени -->
                    <div class="flex-1 mr-6">
                        <label class="block text-xs text-center font-medium dark:text-gray-300 mb-1 truncate">
                            Начальная дата
                        </label>
                        <div class="flex justify-center space-x-1">
                            <button class="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-1 rounded transition-colors text-xs w-6 h-6 flex items-center justify-center"
                                    title="На неделю назад"
                                    onclick="app.ganttManager.ganttNavigate('week-back')">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11 17L6 12L11 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M18 17L13 12L18 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button class="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-1 rounded transition-colors text-xs w-6 h-6 flex items-center justify-center"
                                    title="На день назад"
                                    onclick="app.ganttManager.ganttNavigate('day-back')">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                            </button>
                            <input type="date" 
                                   class="w-40 p-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                   id="gantt-start-date"
                                   value="${this.app.getTodayDate()}"
                                   onchange="app.ganttManager.applyGanttSettings()">
                            <button class="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-1 rounded transition-colors text-xs w-6 h-6 flex items-center justify-center"
                                    title="На день вперед"
                                    onclick="app.ganttManager.ganttNavigate('day-forward')">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </button>
                            <button class="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-1 rounded transition-colors text-xs w-6 h-6 flex items-center justify-center"
                                    title="На неделю вперед"
                                    onclick="app.ganttManager.ganttNavigate('week-forward')">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 17L18 12L13 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M6 17L11 12L6 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Фильтр оборудования -->
                    <div class="min-w-0 flex-1 w-32 mr-6">
                        <label class="block text-xs font-medium dark:text-gray-300 mb-1 truncate">
                            Оборудование
                        </label>
                        <select class="w-full p-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                id="gantt-equipment-filter"
                                onchange="app.ganttManager.applyGanttSettings()">
                            <!--<option value="all">Все</option>-->
                            <option value="visible">Всё видимое оборудование</option>
                        </select>
                    </div>

                    <!-- Масштаб -->
                    <div class="min-w-0 w-32 mr-6">
                        <label class="block text-xs font-medium dark:text-gray-300 mb-1 truncate">
                            Масштаб: <span id="pixels-per-hour-value" class="font-bold">20</span>
                        </label>
                        <input type="range" 
                               class="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded appearance-none cursor-pointer slider"
                               id="gantt-pixels-per-hour"
                               min="5"
                               max="50"
                               step="5"
                               value="20"
                               oninput="app.ganttManager.updatePixelsPerHourValue(this.value); app.ganttManager.debouncedGanttUpdate()"
                               onchange="app.ganttManager.applyGanttSettings()">
                        <div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                            <span>5</span>
                            <span>50</span>
                        </div>
                    </div>

                    <!-- Высота строки -->
                    <div class="min-w-0 w-32 mr-6">
                        <label class="block text-xs font-medium dark:text-gray-300 mb-1 truncate">
                            Строка: <span id="row-height-value" class="font-bold">60</span>
                        </label>
                        <input type="range" 
                               class="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded appearance-none cursor-pointer slider"
                               id="gantt-row-height"
                               min="30"
                               max="100"
                               step="5"
                               value="60"
                               oninput="app.ganttManager.updateRowHeightValue(this.value); app.ganttManager.debouncedGanttUpdate()"
                               onchange="app.ganttManager.applyGanttSettings()">
                        <div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                            <span>30</span>
                            <span>100</span>
                        </div>
                    </div>

                    <!-- Высота работы -->
                    <div class="min-w-0 w-32 mr-6">
                        <label class="block text-xs font-medium dark:text-gray-300 mb-1 truncate">
                            Работа: <span id="job-height-value" class="font-bold">80</span>%
                        </label>
                        <input type="range" 
                               class="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded appearance-none cursor-pointer slider"
                               id="gantt-job-height"
                               min="20"
                               max="100"
                               step="5"
                               value="80"
                               oninput="app.ganttManager.updateJobHeightValue(this.value); app.ganttManager.debouncedGanttUpdate()"
                               onchange="app.ganttManager.applyGanttSettings()">
                        <div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                            <span>20%</span>
                            <span>100%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Область диаграммы Ганта -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md px-6 py-1 border border-gray-200 dark:border-gray-700">
                <div class="flex flex-col items-center justify-center py-12">
                    <div class="text-4xl mb-4">📊</div>
                    <h3 class="text-xl font-semibold dark:text-white mb-2">Диаграмма загрузки оборудования</h3>
                    <p class="dark:text-gray-300 text-center mb-4">Настройте параметры отображения - диаграмма обновится автоматически</p>
                    
                    <!-- Статус загрузки данных -->
                    <div class="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 max-w-md">
                        <div class="flex items-center space-x-3">
                            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            <div class="text-sm text-blue-700 dark:text-blue-300">
                                <div class="font-semibold">Ожидание настроек...</div>
                                <div>Измените параметры для отображения диаграммы</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    }

    applyGanttSettings() {
        // Собираем текущие настройки ИЗ DOM ЭЛЕМЕНТОВ
        const durationSelect = document.getElementById('gantt-duration');
        const startDateInput = document.getElementById('gantt-start-date');
        const equipmentFilterSelect = document.getElementById('gantt-equipment-filter');
        const pixelsPerHourSlider = document.getElementById('gantt-pixels-per-hour');
        const rowHeightSlider = document.getElementById('gantt-row-height');
        const jobHeightSlider = document.getElementById('gantt-job-height');

        // Обновляем объект настроек
        this.ganttSettings = {
            viewMode: durationSelect?.value || 'week',
            startDate: startDateInput?.value || this.getTodayDate(),
            equipmentFilter: equipmentFilterSelect?.value || 'all',
            pixelsPerHour: parseInt(pixelsPerHourSlider?.value) || 20,
            rowHeight: parseInt(rowHeightSlider?.value) || 60,
            jobHeightRatio: parseInt(jobHeightSlider?.value) || 80,
            scale: this.ganttSettings.scale
        };

        // Сохраняем настройки
        this.saveGanttSettings();

        console.log('Настройки диаграммы применены и сохранены:', this.ganttSettings);

        // Обновляем диаграмму
        this.renderGanttChart(this.ganttSettings);
    }

    // Сохраняем все настройки диаграммы
    saveGanttSettings() {
        localStorage.setItem('ganttStartDate', this.ganttSettings.startDate);
        localStorage.setItem('ganttViewMode', this.ganttSettings.viewMode);
        localStorage.setItem('ganttEquipmentFilter', this.ganttSettings.equipmentFilter);
        localStorage.setItem('ganttPixelsPerHour', this.ganttSettings.pixelsPerHour.toString());
        localStorage.setItem('ganttRowHeight', this.ganttSettings.rowHeight.toString());
        localStorage.setItem('ganttJobHeightRatio', this.ganttSettings.jobHeightRatio.toString());
        localStorage.setItem('ganttScale', this.ganttSettings.scale.toString());
    }

    ganttNavigate(direction) {
        const dateInput = document.getElementById('gantt-start-date');
        if (!dateInput) return;

        const currentDate = new Date(dateInput.value);

        switch (direction) {
            case 'week-back':
                currentDate.setDate(currentDate.getDate() - 7);
                break;
            case 'day-back':
                currentDate.setDate(currentDate.getDate() - 1);
                break;
            case 'day-forward':
                currentDate.setDate(currentDate.getDate() + 1);
                break;
            case 'week-forward':
                currentDate.setDate(currentDate.getDate() + 7);
                break;
        }
        this.ganttSettings.startDate =

            dateInput.value = currentDate.toISOString().split('T')[0];
        this.applyGanttSettings();
        this.clearScrollPosition();
    }

    async initGanttPage() {
        // Восстанавливаем настройки в элементы управления
        this.restoreGanttControls();

        // Загружаем список оборудования для фильтра
        await this.loadEquipmentForGantt();

        // Применяем настройки и рендерим диаграмму
        this.applyGanttSettings();

        // Обновляем видимость кнопок
        this.updateJobMoveButtonsVisibility();

        // Настраиваем контейнер
        this.adjustGanttContainer();
    }

    debouncedGanttUpdate() {
        clearTimeout(this.ganttUpdateTimeout);
        this.ganttUpdateTimeout = setTimeout(() => {
            this.applyGanttSettings();
        }, 500);
    }

    async loadEquipmentForGantt() {
        try {
            const response = await fetch('/api/equipment/list');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.populateEquipmentFilter(data.equipment);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки оборудования для диаграммы:', error);
        }
    }

    // Заполнение фильтра оборудования
    populateEquipmentFilter(equipmentList) {
        const filterSelect = document.getElementById('gantt-equipment-filter');
        if (!filterSelect) return;

        // Очищаем существующие опции (кроме первых двух)
        while (filterSelect.children.length > 2) {
            filterSelect.removeChild(filterSelect.lastChild);
        }

        // Добавляем оборудование
        equipmentList.forEach(eq => {
            const option = document.createElement('option');
            option.value = eq.id;
            option.textContent = eq.name;
            filterSelect.appendChild(option);
        });
    }

    exportGanttImage() {
        const img = document.querySelector('.gantt-container img');
        if (!img) return;

        const link = document.createElement('a');
        const fileName = `gantt-${new Date().toISOString().split('T')[0]}-${Date.now()}.png`;
        link.download = fileName;
        link.href = img.src;
        link.click();

        this.showNotification(`Диаграмма экспортирована как ${fileName}`, 'success');
    }

    updateViewportInfo() {
        const container = document.querySelector('.gantt-container');
        const infoElement = document.getElementById('gantt-viewport-info');

        if (!container || !infoElement) return;

        const scrollX = container.scrollLeft;
        const scrollY = container.scrollTop;
        const maxScrollX = container.scrollWidth - container.clientWidth;
        const maxScrollY = container.scrollHeight - container.clientHeight;

        let info = `Прокрутка: X ${Math.round(scrollX)} Y ${Math.round(scrollY)}`;

        if (maxScrollX > 0 || maxScrollY > 0) {
            info += ` | Масштаб: ${Math.round(this.ganttSettings.scale * 100)}%`;
        }

        //infoElement.textContent = info;
    }

    // Метод для автоматического ресайза контейнера
    adjustGanttContainer() {
        const container = document.querySelector('.gantt-container');
        if (!container) return;

        // Находим все элементы выше контейнера
        const header = document.querySelector('header');
        const ganttControls = document.querySelector('.gantt-page-container');
        const ganttControls2 = document.querySelector('.gantt-controls');

        // Рассчитываем общую высоту занятых элементов
        let occupiedHeight = 0;

        if (header) occupiedHeight += header.offsetHeight;
        if (ganttControls) occupiedHeight += ganttControls.offsetHeight;
        if (ganttControls2) occupiedHeight += ganttControls2.offsetHeight;

        // Добавляем отступы (примерно 20px сверху и снизу)
        const padding = 40;

        // Рассчитываем доступную высоту для контейнера
        const availableHeight = window.innerHeight - occupiedHeight - padding;

        console.log('Height calculation:', {
            windowHeight: window.innerHeight,
            occupiedHeight,
            padding,
            availableHeight
        });

        // Устанавливаем высоту контейнера (минимум 300px)
        const finalHeight = Math.max(300, availableHeight);
        container.style.height = `${finalHeight}px`;

        console.log(`Gantt container height set to: ${finalHeight}px`);

        // Обновляем viewport info
        this.updateViewportInfo();
    }

    // Метод для подгонки масштаба (только масштаб!)
    fitGanttScale() {
        console.log('Fit scale called');

        const container = document.querySelector('.gantt-container');
        const img = document.querySelector('.gantt-container img');
        const wrapper = document.getElementById('gantt-image-wrapper');

        if (!container || !img || !wrapper) {
            console.error('Fit scale: Required elements not found');
            return;
        }

        const containerWidth = container.clientWidth;
        const originalWidth = parseInt(img.dataset.originalWidth) || img.naturalWidth;

        console.log('Container width:', containerWidth, 'Image width:', originalWidth);

        if (containerWidth === 0 || originalWidth === 0) {
            console.warn('Cannot calculate scale: zero dimensions');
            return;
        }

        // Рассчитываем масштаб чтобы изображение по ширине заполнило контейнер
        let newScale = containerWidth / originalWidth;

        // Ограничиваем масштаб
        newScale = Math.max(0.1, Math.min(2.0, newScale));

        console.log('Calculated scale:', newScale);

        // Применяем трансформацию
        wrapper.style.transform = `scale(${newScale})`;

        // Обновляем размеры wrapper'а
        const originalHeight = parseInt(img.dataset.originalHeight) || img.naturalHeight;
        const scaledWidth = originalWidth * newScale;
        const scaledHeight = originalHeight * newScale;

        wrapper.style.width = `${scaledWidth}px`;
        wrapper.style.height = `${scaledHeight}px`;

        // Обновляем глобальную переменную масштаба
        this.ganttSettings.scale = newScale;

        // Обновляем отображение масштаба
        const scaleValue = document.getElementById('gantt-scale-value');
        if (scaleValue) {
            scaleValue.textContent = `${Math.round(newScale * 100)}%`;
        }

        // Сохраняем настройки
        this.saveGanttSettings();
        this.updateViewportInfo();

        this.showNotification(`Масштаб установлен на ${Math.round(newScale * 100)}%`, 'success');
        console.log('Fit scale completed. Scale:', this.ganttSettings.scale);
    }

    restoreGanttControls() {
        // Восстанавливаем значения в полях ввода
        const durationSelect = document.getElementById('gantt-duration');
        const startDateInput = document.getElementById('gantt-start-date');
        const equipmentFilterSelect = document.getElementById('gantt-equipment-filter');
        const pixelsPerHourSlider = document.getElementById('gantt-pixels-per-hour');
        const rowHeightSlider = document.getElementById('gantt-row-height');
        const jobHeightSlider = document.getElementById('gantt-job-height');
        const scaleValue = document.getElementById('gantt-scale-value');

        if (durationSelect) durationSelect.value = this.ganttSettings.viewMode;
        if (startDateInput) startDateInput.value = this.ganttSettings.startDate;
        if (equipmentFilterSelect) equipmentFilterSelect.value = this.ganttSettings.equipmentFilter;
        if (pixelsPerHourSlider) {
            pixelsPerHourSlider.value = this.ganttSettings.pixelsPerHour;
            this.updatePixelsPerHourValue(this.ganttSettings.pixelsPerHour);
        }
        if (rowHeightSlider) {
            rowHeightSlider.value = this.ganttSettings.rowHeight;
            this.updateRowHeightValue(this.ganttSettings.rowHeight);
        }
        if (jobHeightSlider) {
            jobHeightSlider.value = this.ganttSettings.jobHeightRatio;
            this.updateJobHeightValue(this.ganttSettings.jobHeightRatio);
        }

        // Восстанавливаем отображение масштаба
        if (scaleValue) {
            scaleValue.textContent = `${Math.round(this.ganttSettings.scale * 100)}%`;
        }

        console.log('Gantt controls restored. Scale:', this.ganttSettings.scale);
    }

    renderGanttChart(settings) {
        console.log('Загрузка диаграммы с настройками:', settings);

        const chartContainer = document.querySelector('.bg-white.dark\\:bg-gray-800:last-child');
        if (!chartContainer) return;

        const mainContent = document.getElementById('main-content');
        const mainContentRect = mainContent.getBoundingClientRect();
        const viewportWidth = mainContentRect.width - 48; // minus padding

        // Показываем индикатор загрузки
        chartContainer.innerHTML = `
            <div class="gantt-viewport flex flex-col items-center justify-center py-8" style="visibility: hidden;>
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                <p class="dark:text-gray-300">Генерация диаграммы...</p>
            </div>
        `;

        // Формируем данные для запроса
        const requestData = {
            view_mode: settings.duration || this.ganttSettings.viewMode,
            start_date: settings.startDate || this.ganttSettings.startDate,
            pixels_per_hour: settings.pixelsPerHour || this.ganttSettings.pixelsPerHour,
            row_height: settings.rowHeight || this.ganttSettings.rowHeight,
            job_height_ratio: settings.jobHeightRatio || this.ganttSettings.jobHeightRatio,
            equipment_filter: settings.equipmentFilter || this.ganttSettings.equipmentFilter,
            is_dark: this.app.isDark
        };

        // Отправляем запрос на генерацию изображения
        fetch('/api/gantt/image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {

                    this.jobDataManager.setJobs(result.jobs || []);

                    const content = `
                        <div class="gantt-viewport">
                            <!-- Панель управления диаграммой -->
                            <div class="gantt-controls bg-white dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <div class="flex items-center space-x-4">
                                    <button onclick="app.ganttManager.zoomGantt(0.8)" 
                                            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                            title="Уменьшить масштаб">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                                            <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                            <path d="M8 11H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </button>
                                    <button onclick="app.ganttManager.zoomGantt(1.2)" 
                                            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                            title="Увеличить масштаб">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                                            <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                            <path d="M11 8V14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                            <path d="M8 11H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </button>
                                    <button onclick="app.ganttManager.fitGanttScale()" 
                                            class="flex space-x-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                            title="Подогнать масштаб по ширине контейнера">
                                            <svg fill="#FFFFFF" width="24px" height="24px" viewBox="0 0 32 32">
                                            <path d="M23.977 28.965v-1.932h3.988v-3.988h2.057v5.92h-6.045zM27.965 5.967h-3.988v-1.932h6.045v5.92h-2.057v-3.988zM3.035 9.955h-2.056v-5.92h6.045v1.932h-3.989v3.988zM4.967 8.023h21.066v16.953h-21.066v-16.953zM7.023 23.045h16.953v-13.090h-16.953v13.090zM9.018 12.012h13.027v8.977h-13.027v-8.977zM3.035 27.033h3.988v1.932h-6.044v-5.92h2.057v3.988z"></path>
                                            </svg>
                                            <!--span>Подогнать масштаб</span-->
                                    </button>
                                    <button onclick="app.ganttManager.exportGanttImage()" 
                                            class="flex space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                            title="Экспорт изображения">
                                        <!--span>Экспорт </span-->                                                                   
                                        <svg fill="transparent" height="24px" width="24px" viewBox="0 0 24 24" >
                                            <path d="M4,5 C4,3.89543 4.89543,3 6,3 L15.1716,3 C15.702,3 16.2107,3.21071 16.5858,3.58579 L19.4142,6.41421 C19.7893,6.78929 20,7.29799 20,7.82843 L20,19 C20,20.1046 19.1046,21 18,21 L6,21 C4.89543,21 4,20.1046 4,19 L4,5 Z" id="Path" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
                                            <path d="M15,4 L15,6 C15,7.10457 15.8954,8 17,8 L19,8" id="Path" stroke-width="2" stroke="#FFFFFF" stroke-linecap="round"/>
                                            <path d="M9.56527,14.06 C9.56527,14.308 9.51927,14.518 9.42727,14.69 C9.33527,14.858 9.21127,14.994 9.05527,15.098 C8.89927,15.202 8.71927,15.278 8.51527,15.326 C8.31127,15.374 8.09927,15.398 7.87927,15.398 L7.36927,15.398 L7.36927,17 L6.34327,17 L6.34327,12.752 L7.90327,12.752 C8.13527,12.752 8.35127,12.776 8.55127,12.824 C8.75527,12.868 8.93127,12.942 9.07927,13.046 C9.23127,13.146 9.34927,13.28 9.43327,13.448 C9.52127,13.612 9.56527,13.816 9.56527,14.06 Z M8.53927,14.066 C8.53927,13.966 8.51927,13.884 8.47927,13.82 C8.43927,13.756 8.38527,13.706 8.31727,13.67 C8.24927,13.634 8.17127,13.61 8.08327,13.598 C7.99927,13.586 7.91127,13.58 7.81927,13.58 L7.36927,13.58 L7.36927,14.582 L7.80127,14.582 C7.89727,14.582 7.98927,14.574 8.07727,14.558 C8.16527,14.542 8.24327,14.514 8.31127,14.474 C8.38327,14.434 8.43927,14.382 8.47927,14.318 C8.51927,14.25 8.53927,14.166 8.53927,14.066 Z M12.8812,17 L11.1712,14.222 L11.1532,14.222 L11.1772,17 L10.1812,17 L10.1812,12.752 L11.3512,12.752 L13.0552,15.524 L13.0732,15.524 L13.0492,12.752 L14.0452,12.752 L14.0452,17 L12.8812,17 Z M18.6954,16.742 C18.4874,16.85 18.2434,16.938 17.9634,17.006 C17.6874,17.074 17.3854,17.108 17.0574,17.108 C16.7174,17.108 16.4034,17.054 16.1154,16.946 C15.8314,16.838 15.5854,16.686 15.3774,16.49 C15.1734,16.294 15.0134,16.06 14.8974,15.788 C14.7814,15.512 14.7234,15.206 14.7234,14.87 C14.7234,14.53 14.7814,14.222 14.8974,13.946 C15.0174,13.67 15.1814,13.436 15.3894,13.244 C15.5974,13.048 15.8414,12.898 16.1214,12.794 C16.4014,12.69 16.7034,12.638 17.0274,12.638 C17.3634,12.638 17.6754,12.69 17.9634,12.794 C18.2514,12.894 18.4854,13.03 18.6654,13.202 L18.0174,13.94 C17.9174,13.824 17.7854,13.73 17.6214,13.658 C17.4574,13.582 17.2714,13.544 17.0634,13.544 C16.8834,13.544 16.7174,13.578 16.5654,13.646 C16.4134,13.71 16.2814,13.802 16.1694,13.922 C16.0574,14.038 15.9694,14.178 15.9054,14.342 C15.8454,14.502 15.8154,14.678 15.8154,14.87 C15.8154,15.066 15.8434,15.246 15.8994,15.41 C15.9554,15.574 16.0374,15.716 16.1454,15.836 C16.2574,15.952 16.3934,16.044 16.5534,16.112 C16.7174,16.176 16.9034,16.208 17.1114,16.208 C17.2314,16.208 17.3454,16.2 17.4534,16.184 C17.5614,16.164 17.6614,16.134 17.7534,16.094 L17.7534,15.32 L16.9434,15.32 L16.9434,14.492 L18.6954,14.492 L18.6954,16.742 Z" id="Shape" fill="#FFFFFF"/>
                                        </svg>
                                                               
                                    </button>
                                    <button onclick="app.ganttManager.exportGanttToExcel()" 
                                            class="flex space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                            title="Экспорт в Excel">
                                        <!--span>Экспорт </span-->  
                                        <svg fill="#FFFFFF" width="24px" height="24px" viewBox="0 0 24 24" role="img"">
                                            <path d="M23 1.5q.41 0 .7.3.3.29.3.7v19q0 .41-.3.7-.29.3-.7.3H7q-.41 0-.7-.3-.3-.29-.3-.7V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h5V2.5q0-.41.3-.7.29-.3.7-.3zM6 13.28l1.42 2.66h2.14l-2.38-3.87 2.34-3.8H7.46l-1.3 2.4-.05.08-.04.09-.64-1.28-.66-1.29H2.59l2.27 3.82-2.48 3.85h2.16zM14.25 21v-3H7.5v3zm0-4.5v-3.75H12v3.75zm0-5.25V7.5H12v3.75zm0-5.25V3H7.5v3zm8.25 15v-3h-6.75v3zm0-4.5v-3.75h-6.75v3.75zm0-5.25V7.5h-6.75v3.75zm0-5.25V3h-6.75v3Z"/>
                                        </svg>
                            
                                    </button>
                                </div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">
                                    Масштаб: <span id="gantt-scale-value">${Math.round(this.ganttSettings.scale * 100)}%</span>
                                </div>
                            </div>
                            
                            <!-- КОНТЕЙНЕР ДЛЯ СКРОЛЛА -->
                            <div class="gantt-container" style="width: ${viewportWidth}; overflow: auto;">
                                <div id="gantt-image-wrapper" style="transform-origin: 0 0; transition: transform 0.2s ease; transform: scale(${this.ganttSettings.scale})">
                                    <img src="${result.image_data}" 
                                         alt="Диаграмма Ганта" 
                                         class="max-w-none gantt-image" 
                                         style="display: block;"
                                         data-original-width="${result.width}"
                                         data-original-height="${result.height}"
                                         data-jobs-data="${encodeURIComponent(JSON.stringify(result.jobs || []))}">
                                </div>
                            </div>
                            
                            <!-- Статусная строка -->
                            <div class="gantt-status bg-white dark:bg-gray-800 p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 flex justify-between">
                                <div>
                                    Размер оригинала: ${result.width} × ${result.height}px | 
                                    Оборудование: ${result.equipment_count} | 
                                    Работы: ${result.jobs_count}
                                </div>
                                <div id="gantt-job-info">
                                    <!-- Здесь будет динамически обновляться информация о выбранной работе -->
                                </div>
                            </div>
                        </div>
                    `;

                    // Создаем временный элемент
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = content;

                    // Находим контейнер во временном элементе
                    const tempContainer = tempDiv.querySelector('.gantt-container');

                    // Сохраняем данные скролла для восстановления ПОСЛЕ вставки в DOM
                    let savedScrollData = null;
                    const saved = localStorage.getItem('ganttScrollPosition');
                    if (saved) {
                        try {
                            const scrollData = JSON.parse(saved);
                            if (scrollData && Date.now() - scrollData.timestamp < 3600000) {
                                savedScrollData = scrollData;
                            }
                        } catch (e) {
                            console.error('Ошибка парсинга скролла:', e);
                        }
                    }

                    // Быстрая замена контента
                    chartContainer.innerHTML = '';
                    chartContainer.appendChild(tempDiv);

                    // ВОССТАНАВЛИВАЕМ СКРОЛЛ ПОСЛЕ ВСТАВКИ В DOM
                    if (savedScrollData) {
                        // Ждем следующего цикла событий чтобы DOM полностью обновился
                        setTimeout(() => {
                            const actualContainer = document.querySelector('.gantt-container');
                            if (actualContainer) {
                                console.log('Restoring scroll:', savedScrollData);
                                actualContainer.scrollLeft = savedScrollData.scrollLeft;
                                actualContainer.scrollTop = savedScrollData.scrollTop;

                                // Проверяем что скролл установился
                                setTimeout(() => {
                                    console.log('Scroll after restoration:', {
                                        left: actualContainer.scrollLeft,
                                        top: actualContainer.scrollTop,
                                        expected: savedScrollData
                                    });
                                }, 50);
                            }
                        }, 10);
                    }

                    // ДАЛЬШЕ ИНИЦИАЛИЗАЦИЯ
                    this.initGanttInteractions();
                    this.adjustGanttContainer();

                    // Убираем скрытие
                    const ganttViewport = document.querySelector('.gantt-viewport');
                    if (ganttViewport) {
                        ganttViewport.style.visibility = 'visible';
                    }

                    // Даем время на полную перерисовку диаграммы
                    setTimeout(() => {
                        this.restoreSelection();
                    }, 50);

                } else {
                    //
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                chartContainer.innerHTML = `
            <div class="text-center py-12 text-red-500">
                <div class="text-xl mb-2">❌ Ошибка соединения</div>
                <button onclick="app.ganttManager.renderGanttChart(app.ganttManager.ganttSettings)" 
                        class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                    Попробовать снова
                </button>
            </div>
        `;
            });
    }

    // В методе initGanttInteractions добавьте обработчик клика по изображению
    initGanttInteractions() {

        const container = document.querySelector('.gantt-container');
        if (!container) return;

        let isDragging = false;
        let startX, startY, scrollLeft, scrollTop;

        // Drag to scroll
        container.addEventListener('mousedown', (e) => {
            // Игнорируем клики на кнопках масштабирования
            if (e.target.closest('button')) return;

            isDragging = true;
            startX = e.pageX - container.offsetLeft;
            startY = e.pageY - container.offsetTop;
            scrollLeft = container.scrollLeft;
            scrollTop = container.scrollTop;
            container.style.cursor = 'grabbing';
            e.preventDefault();
        });

        container.addEventListener('mouseleave', () => {
            isDragging = false;
            container.style.cursor = 'grab';
        });

        container.addEventListener('mouseup', () => {
            isDragging = false;
            container.style.cursor = 'grab';
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const x = e.pageX - container.offsetLeft;
            const y = e.pageY - container.offsetTop;
            const walkX = (x - startX) * 2;
            const walkY = (y - startY) * 2;
            container.scrollLeft = scrollLeft - walkX;
            container.scrollTop = scrollTop - walkY;

            this.updateViewportInfo();
        });

        // Обработчик клика по изображению диаграммы
        container.addEventListener('click', (e) => {

            // Проверяем, что кликнули именно по изображению диаграммы
            const img = e.target.closest('img');
            if (!img || !img.classList.contains('gantt-image')) return;
            // Предотвращаем обработку, если был drag
            if (isDragging) return;

            // Получаем координаты относительно изображения
            const rect = img.getBoundingClientRect();
            const scale = this.ganttSettings.scale;

            // Координаты относительно оригинального изображения (без масштаба)
            const originalX = Math.round((e.clientX - rect.left) / scale);
            const originalY = Math.round((e.clientY - rect.top) / scale);

            const clickedJob = this.jobDataManager.findJobByCoordinates(originalX, originalY)
            if (clickedJob) {
                this.updateJobInfo(clickedJob);
                this.highlightJob(clickedJob, scale);
                // this.app.showNotification(
                //     `Клик по диаграмме: заказ ${clickedJob.order_name}, оборудование ${clickedJob.equipment_name}`,
                //     'info'
                // );
            } else {
                this.updateJobInfo(null);
                this.removeJobHighlight();
            }

        });

        container.addEventListener('dblclick', (e) => {
            // Проверяем, что кликнули именно по изображению диаграммы
            const img = e.target.closest('img');
            if (!img || !img.classList.contains('gantt-image')) return;

            // Получаем координаты относительно изображения
            const rect = img.getBoundingClientRect();
            const scale = this.ganttSettings.scale;

            // Координаты относительно оригинального изображения (без масштаба)
            const originalX = Math.round((e.clientX - rect.left) / scale);
            const originalY = Math.round((e.clientY - rect.top) / scale);

            const clickedJob = this.jobDataManager.findJobByCoordinates(originalX, originalY)
            if (clickedJob) {
                // Проверяем, зажат ли Ctrl
                if (e.ctrlKey || e.metaKey) {
                    // Двойной клик с зажатым Ctrl - специальное действие
                    this.editOrderFromGantt(clickedJob.order_id);
                } else {
                    // Обычный двойной клик - редактирование работы
                    this.editJobFromGantt(clickedJob.id);
                }
            }

        });

        // Zoom with mouse wheel
        container.addEventListener('wheel', (e) => {
            e.preventDefault();

            // Ctrl+wheel для масштабирования
            if (e.ctrlKey) {
                const zoomIntensity = 0.1;
                const zoom = e.deltaY < 0 ? (1 + zoomIntensity) : (1 - zoomIntensity);
                this.zoomGantt(zoom);
            } else {
                // Обычный скролл
                container.scrollLeft += e.deltaY;
            }
        }, {passive: false});

        // Обновляем информацию о viewport при скролле
        container.addEventListener('scroll', () => {
            this.updateViewportInfo();
            this.debouncedSaveScroll();
            this.updateViewportInfo();
        });

        // Принудительно восстанавливаем скролл после инициализации взаимодействий
        setTimeout(() => {
            this.restoreScrollPosition();
        }, 200);
    }

    updatePixelsPerHourValue(value) {
        const valueElement = document.getElementById('pixels-per-hour-value');
        if (valueElement) {
            valueElement.textContent = value;
        }
    }

    updateRowHeightValue(value) {
        const valueElement = document.getElementById('row-height-value');
        if (valueElement) {
            valueElement.textContent = value;
        }
    }

    updateJobHeightValue(value) {
        const valueElement = document.getElementById('job-height-value');
        if (valueElement) {
            valueElement.textContent = value;
        }
    }

    zoomGantt(zoomFactor) {
        console.log('Zoom called with factor:', zoomFactor, 'Current scale:', this.ganttSettings.scale);

        const wrapper = document.getElementById('gantt-image-wrapper');
        const img = document.querySelector('.gantt-container img');
        const scaleValue = document.getElementById('gantt-scale-value');

        if (!wrapper || !img) {
            console.error('Zoom: Required elements not found');
            return;
        }

        // Убедимся, что масштаб - число
        let currentScale = parseFloat(this.ganttSettings.scale);
        if (isNaN(currentScale)) {
            currentScale = 1.0;
            this.ganttSettings.scale = currentScale;
        }

        // Ограничиваем масштаб от 10% до 500%
        const newScale = Math.max(0.1, Math.min(5.0, currentScale * zoomFactor));
        console.log('New scale:', newScale);

        // Применяем трансформацию
        wrapper.style.transform = `scale(${newScale})`;

        // Получаем оригинальные размеры изображения
        const originalWidth = parseInt(img.dataset.originalWidth) || img.naturalWidth;
        const originalHeight = parseInt(img.dataset.originalHeight) || img.naturalHeight;

        console.log('Original dimensions:', originalWidth, 'x', originalHeight);

        if (originalWidth && originalHeight) {
            // Рассчитываем новые размеры с учетом масштаба
            const scaledWidth = originalWidth * newScale;
            const scaledHeight = originalHeight * newScale;

            console.log('Scaled dimensions:', scaledWidth, 'x', scaledHeight);

            // Устанавливаем размеры wrapper'а в масштабированные размеры
            wrapper.style.width = `${scaledWidth}px`;
            wrapper.style.height = `${scaledHeight}px`;
        }

        // Обновляем глобальную переменную масштаба
        this.ganttSettings.scale = newScale;

        // Обновляем отображение масштаба
        if (scaleValue) {
            scaleValue.textContent = `${Math.round(newScale * 100)}%`;
        }

        // Обновляем выделение с правильным масштабом
        if (this.selectedJob) {
            const job = this.jobDataManager.jobs.find(j => j.id === this.selectedJob.id);
            if (job) {
                setTimeout(() => {
                    this.highlightJob(job, newScale); // Передаем newScale напрямую
                }, 50);
            }
        }

        // Сохраняем настройки
        this.saveGanttSettings();
        this.updateViewportInfo();

        console.log('Zoom completed. Scale:', this.ganttSettings.scale);
    }

    // Добавьте методы для клиентского выделения
    createJobHighlighter() {
        const highlighter = document.createElement('div');
        highlighter.id = 'job-highlighter';
        highlighter.style.cssText = `
        position: absolute;
        border: 5px dashed #ffffff;
        background: rgba(255, 0, 0, 0.1);
        pointer-events: none;
        z-index: 10;
        box-shadow: 0 0 0 3px 000000, 0 0 10px rgba(255, 0, 0, 0.8);
        border-radius: 2px;
        transform-origin: 0 0; /* Важно для правильного масштабирования */
    `;
        return highlighter;
    }

    highlightJob(job, scale) {
        this.removeJobHighlight();

        if (!job || !job.coordinates) return;

        const highlighter = this.createJobHighlighter();
        const wrapper = document.getElementById('gantt-image-wrapper');
        const img = document.querySelector('.gantt-image');

        if (!wrapper || !img) return;

        const coords = job.coordinates;

        // ВАРИАНТ 1: Без transform - только позиционирование
        // Устанавливаем координаты в оригинальном масштабе
        highlighter.style.left = `${coords.x1}px`;
        highlighter.style.top = `${coords.y1}px`;
        highlighter.style.width = `${coords.x2 - coords.x1}px`;
        highlighter.style.height = `${coords.y2 - coords.y1}px`;

        // НЕ применяем transform к выделению - wrapper уже масштабирует всё содержимое
        // highlighter.style.transform = `scale(${effectiveScale})`; // УБРАТЬ ЭТУ СТРОКУ!

        wrapper.appendChild(highlighter);
        this.currentHighlight = highlighter;

        console.log('Highlight debug:', {
            job: job.order_name,
            originalCoords: coords,
            scale: scale,
            position: {
                left: coords.x1,
                top: coords.y1,
                width: coords.x2 - coords.x1,
                height: coords.y2 - coords.y1
            }
        });
    }

    removeJobHighlight() {
        if (this.currentHighlight && this.currentHighlight.parentElement) {
            this.currentHighlight.remove();
        }
        this.currentHighlight = null;

        // ОЧИЩАЕМ ДЕТАЛИ ПРИ СНЯТИИ ВЫДЕЛЕНИЯ
        //this.updateJobDetails(null);
    }

    // Добавьте этот метод в класс GanttManager
    async exportGanttToExcel() {
        try {
            // Показываем индикатор загрузки
            this.app.showNotification('Подготовка Excel файла...', 'info');

            // Формируем данные для запроса
            const requestData = {
                view_mode: this.ganttSettings.viewMode,
                start_date: this.ganttSettings.startDate,
                pixels_per_hour: this.ganttSettings.pixelsPerHour,
                row_height: this.ganttSettings.rowHeight,
                job_height_ratio: this.ganttSettings.jobHeightRatio,
                equipment_filter: this.ganttSettings.equipmentFilter
            };

            // Отправляем запрос на генерацию Excel
            const response = await fetch('/api/gantt/export-excel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Получаем blob с Excel файлом
            const blob = await response.blob();

            // Создаем ссылку для скачивания
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            const fileName = `gantt-${new Date().toISOString().split('T')[0]}-${Date.now()}.xlsx`;

            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();

            // Очищаем
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            this.app.showNotification(`Диаграмма экспортирована в Excel как ${fileName}`, 'success');

        } catch (error) {
            console.error('Ошибка экспорта в Excel:', error);
            this.app.showNotification('Ошибка при экспорте в Excel', 'error');
        }
    }

    updateJobInfo(clickedJob) {
        this.selectedJob = clickedJob;
        const jobInfoElement = document.getElementById('gantt-job-info');
        if (!jobInfoElement) {
            console.error('Element gantt-job-info not found');
            return;
        }

        if (this.selectedJob) {
            jobInfoElement.innerHTML = `
            <span class="font-semibold">Выбрано: ${this.selectedJob.order_name}</span>
            <span class="text-gray-500 ml-2">(${this.selectedJob.equipment_name})</span>
        `;

            // ОБНОВЛЯЕМ ДЕТАЛИ В SIDEBAR
            this.app.updateJobDetails(this.selectedJob);
        } else {
            jobInfoElement.innerHTML = '<span class="text-gray-500">Кликните по работе для выбора</span>';

            // ОЧИЩАЕМ ДЕТАЛИ В SIDEBAR
            this.app.updateJobDetails(null);
        }

        // Обновляем видимость кнопок
        this.updateJobMoveButtonsVisibility();

        console.log('Job info updated:', this.selectedJob);
    }

    editJobFromGantt(jobId) {

        this.preserveSelection();

        if (this.app.jobsManager && this.app.jobsManager.openJobModal) {
            this.app.jobsManager.openJobModal(jobId);
            this.app.showNotification('Редактирование работы', 'info');
        } else {
            console.error('JobsManager не доступен для редактирования работы');
            this.app.showNotification('Ошибка открытия формы редактирования', 'error');
        }
    }

    async editOrderFromGantt(orderId) {

        this.preserveSelection();

        if (this.app.ordersManager && this.app.ordersManager.openOrderModal) {
            await this.app.ordersManager.loadOrdersData();
            this.app.ordersManager.openOrderModal(orderId);
            this.app.showNotification('Редактирование заказа', 'info');
        } else {
            console.error('OrdersManager не доступен для редактирования заказа');
            this.app.showNotification('Ошибка открытия формы редактирования', 'error');
        }
    }

    // Метод для обновления видимости кнопок прижатия
    updateJobMoveButtonsVisibility() {
        const buttonsContainer = document.getElementById('job-move-buttons');
        if (!buttonsContainer) return;

        const isGanttPage = this.app.currentPage === 'gantt';
        const hasSelectedJob = this.selectedJob !== null;

        if (isGanttPage && hasSelectedJob) {
            buttonsContainer.classList.remove('hidden');
        } else {
            buttonsContainer.classList.add('hidden');
        }
    }

    // Метод прижатия влево (к предыдущей работе)
    async moveJobLeft() {
        this.preserveSelection();

        if (!this.selectedJob) {
            this.app.showNotification('Выберите работу для перемещения', 'error');
            return;
        }

        try {
            const response = await fetch('/api/jobs/move-to-previous', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    job_id: this.selectedJob.id
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    const jobResponse = await fetch(`/api/jobs/${this.selectedJob.id}`);
                    if (jobResponse.ok) {
                        const jobResult = await jobResponse.json();
                        if (jobResult.success) {
                            let job = jobResult.job;
                            job.start_date = result.data.start_date;
                            job.hour_offset = result.data.hour_offset;
                            this.app.jobsManager.saveJob(job, this.selectedJob.id);

                            // Ждем завершения сохранения и обновляем диаграмму
                            await this.applyGanttSettings();

                        }
                    }
                } else {
                    this.app.showNotification(result.message || 'Ошибка при перемещении', 'error');
                }
            } else {
                throw new Error('Network error');
            }
        } catch (error) {
            console.error('Ошибка при перемещении работы:', error);
            this.app.showNotification('Ошибка при перемещении работы', 'error');
        }
    }

    // Метод прижатия вправо (к следующей работе)
    async moveJobRight() {
        this.preserveSelection();

        if (!this.selectedJob) {
            this.app.showNotification('Выберите работу для перемещения', 'error');
            return;
        }

        try {
            const response = await fetch('/api/jobs/move-to-next', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    job_id: this.selectedJob.id
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    const jobResponse = await fetch(`/api/jobs/${this.selectedJob.id}`);
                    if (jobResponse.ok) {
                        const jobResult = await jobResponse.json();
                        if (jobResult.success) {
                            let job = jobResult.job;
                            job.start_date = result.data.start_date;
                            job.hour_offset = result.data.hour_offset;
                            this.app.jobsManager.saveJob(job, this.selectedJob.id);

                            // Ждем завершения сохранения и обновляем диаграмму
                            await this.applyGanttSettings();
                        }
                    }
                } else {
                    this.app.showNotification(result.message || 'Ошибка при перемещении', 'error');
                }
            } else {
                throw new Error('Network error');
            }
        } catch (error) {
            console.error('Ошибка при перемещении работы:', error);
            this.app.showNotification('Ошибка при перемещении работы', 'error');
        }
    }

    // Метод для сохранения текущего выделения
    preserveSelection() {
        this.lastSelectedJobId = this.selectedJob ? this.selectedJob.id : null;
    }

    // Метод для восстановления выделения после обновления
    async restoreSelection() {
        if (this.lastSelectedJobId && this.jobDataManager) {
            // Даем дополнительное время для полной загрузки данных
            await new Promise(resolve => setTimeout(resolve, 100));

            const jobToSelect = this.jobDataManager.jobs.find(job => job.id === this.lastSelectedJobId);
            if (jobToSelect) {
                this.selectedJob = jobToSelect;
                this.highlightJob(jobToSelect, this.ganttSettings.scale);
                this.updateJobInfo(jobToSelect);
                console.log('Selection restored for job:', jobToSelect.id);
            } else {
                console.warn('Job not found for restoration:', this.lastSelectedJobId);
            }
        }
        this.lastSelectedJobId = null;
    }

    // Сохранить позицию скролла
    saveScrollPosition() {
        const container = document.querySelector('.gantt-container');
        if (container) {
            const scrollData = {
                scrollLeft: container.scrollLeft,
                scrollTop: container.scrollTop,
                timestamp: Date.now(),
                page: this.app.currentPage,
                settings: {...this.ganttSettings} // сохраняем настройки для проверки
            };
            localStorage.setItem('ganttScrollPosition', JSON.stringify(scrollData));
            console.log('Scroll saved:', scrollData);
        }
    }

    // Восстановить позицию скролла
    restoreScrollPosition() {
        const saved = localStorage.getItem('ganttScrollPosition');
        if (saved) {
            try {
                const scrollData = JSON.parse(saved);
                const container = document.querySelector('.gantt-container');

                // Проверяем, что данные не устарели (например, старше 1 часа)
                if (container && scrollData && Date.now() - scrollData.timestamp < 3600000) {
                    // Используем requestAnimationFrame для гарантии что DOM готов
                    requestAnimationFrame(() => {
                        container.scrollLeft = scrollData.scrollLeft;
                        container.scrollTop = scrollData.scrollTop;

                        // Дополнительная проверка через небольшой таймаут
                        setTimeout(() => {
                            if (container.scrollLeft !== scrollData.scrollLeft ||
                                container.scrollTop !== scrollData.scrollTop) {
                                console.log('Forcing scroll restoration');
                                container.scrollLeft = scrollData.scrollLeft;
                                container.scrollTop = scrollData.scrollTop;
                            }
                        }, 100);
                    });
                }
            } catch (e) {
                console.error('Ошибка восстановления скролла:', e);
            }
        }
    }

    // Очистить сохраненную позицию (при смене настроек)
    clearScrollPosition() {
        localStorage.removeItem('ganttScrollPosition');
    }

    // Дебаунс для частых событий скролла
    debouncedSaveScroll() {
        clearTimeout(this.scrollSaveTimeout);
        this.scrollSaveTimeout = setTimeout(() => {
            this.saveScrollPosition();
        }, 500);
    }

    // В класс GanttManager добавьте метод:


}