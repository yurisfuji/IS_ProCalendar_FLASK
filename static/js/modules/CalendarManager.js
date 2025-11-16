export default class CalendarManager {
    constructor(app) {
        this.app = app;
        this.currentMonth = localStorage.getItem('currentMonth') || new Date().toISOString().slice(0, 7); // YYYY-MM
        this.selectedDate = this.currentMonth + "-01"; // YYYY-MM-DD
    }

    // Метод для рендера страницы календаря
    async renderCalendarPage() {
        try {
            // Загружаем данные календаря для текущего месяца
            await this.loadCalendarData(this.currentMonth);

            return `
            <div class="fade-in">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-3xl font-bold dark:text-white">📅 Управление календарем</h2>
                    <div class="flex space-x-2">
                        <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                                onclick="app.calendarManager.changeCalendarMonth(-1)">
                            ${this.app.move_down_button_svg}
                        </button>
                        <span class="bg-gray-100 w-64 text-center dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium">
                            ${this.formatMonth(this.currentMonth)}
                        </span>
                        <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                                onclick="app.calendarManager.changeCalendarMonth(1)">
                            ${this.app.move_up_button_svg}
                        </button>
                    </div>
                </div>

                <!-- Компактный двухколоночный layout -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Левая колонка - управление -->
                    <div class="lg:col-span-1 space-y-2">
                        <!-- Выбор даты -->
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
                            <label class="block text-sm font-medium dark:text-gray-300 mb-2">
                                Выберите дату
                            </label>
                            <input type="date" 
                                   id="calendar-date-picker"
                                   value="${this.selectedDate}"
                                   class="w-full p-2 mb-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                   onchange="app.calendarManager.selectDate(this.value)">

                        <!-- Рабочие часы -->
                            <div class="grid grid-cols-4 gap-2">
                                ${[
                {hours: 0, color: 'red', text: 'Выходной'},
                {hours: 8, color: 'default', text: '8 ч.'},
                {hours: 12, color: 'yellow', text: '12 ч.'},
                {hours: 24, color: 'blue', text: '24 ч.'}
            ].map(item => {
                const isSelected = this.getSelectedDateHours() === item.hours;
                const borderClass = isSelected ? 'border-2' : 'border';
                let colorClasses = '';

                switch (item.color) {
                    case 'red':
                        colorClasses = 'bg-red-500 hover:bg-red-600 text-white border-red-600';
                        break;
                    case 'yellow':
                        colorClasses = 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600';
                        break;
                    case 'blue':
                        colorClasses = 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600';
                        break;
                    default:
                        colorClasses = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600';
                }

                return `
                                        <button class="work-hours-btn py-2 px-1 rounded ${borderClass} transition-colors text-sm ${colorClasses} ${
                    isSelected ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600' : ''
                }"
                                                onclick="app.calendarManager.setWorkHours(${item.hours})">
                                            ${item.text}
                                        </button>
                                    `;
            }).join('')}
                            </div>
                        </div>

                        <!-- Сервисные функции -->
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
                            <div class="space-y-2">
                                <button class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded transition-colors text-sm flex items-center justify-center space-x-2"
                                        onclick="app.calendarManager.setAllSundaysOff()">
                                    <span>📅</span>
                                    <span>Все воскресенья - выходные</span>
                                </button>
                                
                                <button class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded transition-colors text-sm flex items-center justify-center space-x-2"
                                        onclick="app.calendarManager.setAllSaturdaysOff()">
                                    <span>📅</span>
                                    <span>Все субботы - выходные</span>
                                </button>
                                
                                <button class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded transition-colors text-sm flex items-center justify-center space-x-2"
                                        onclick="app.calendarManager.setAllDays8Hours()">
                                    <span>🔄</span>
                                    <span>Все дни рабочие - по 8 часов</span>
                                </button>
                            </div>
                        </div>

                    </div>

                    <!-- Правая колонка - календарь -->
                    <div class="lg:col-span-2">
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
                            <!-- Заголовки дней недели -->
                            <div class="grid grid-cols-7 gap-1 mb-2">
                                ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => `
                                    <div class="text-center text-xs font-semibold dark:text-gray-300 py-1">
                                        ${day}
                                    </div>
                                `).join('')}
                            </div>
                            
                            <!-- Сетка дней -->
                            <div id="calendar-days-grid" class="grid grid-cols-7 gap-1">
                                ${this.renderColorfulCalendarDays()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        } catch (error) {
            console.error('Ошибка загрузки страницы календаря:', error);
            return `
            <div class="text-center py-12">
                <div class="text-red-500 text-xl mb-4">❌ Ошибка загрузки календаря</div>
                <button onclick="app.navigateTo('calendar')" 
                        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                    Попробовать снова
                </div>
            </div>
        `;
        }
    }

    // Метод для рендера цветных дней календаря
    renderColorfulCalendarDays() {
        if (!this.calendarData || !this.calendarData.days) {
            return '<div class="col-span-7 text-center py-4 text-sm">Загрузка календаря...</div>';
        }

        // Получаем первый день месяца и определяем отступ
        const firstDay = new Date(this.currentMonth + '-01');
        const startOffset = (firstDay.getDay() + 6) % 7;

        let html = '';

        // Пустые ячейки в начале (без обработки кликов)
        for (let i = 0; i < startOffset; i++) {
            html += '<div class="h-12 bg-transparent rounded"></div>';
        }

        // Дни месяца
        this.calendarData.days.forEach(day => {
            const date = new Date(day.date);
            const isToday = this.isToday(day.date);
            const isSelected = day.date === this.selectedDate;

            // Определяем цвет фона по количеству рабочих часов
            let bgColor = '';
            let textColor = 'text-gray-900 dark:text-white';

            switch (day.work_hours) {
                case 0:
                    bgColor = 'bg-red-100 dark:bg-red-900';
                    textColor = 'text-red-800 dark:text-red-200';
                    break;
                case 8:
                    bgColor = 'bg-white dark:bg-gray-700';
                    textColor = 'text-gray-900 dark:text-white';
                    break;
                case 12:
                    bgColor = 'bg-yellow-100 dark:bg-yellow-900';
                    textColor = 'text-yellow-800 dark:text-yellow-200';
                    break;
                case 24:
                    bgColor = 'bg-blue-100 dark:bg-blue-900';
                    textColor = 'text-blue-800 dark:text-blue-200';
                    break;
                default:
                    bgColor = 'bg-gray-100 dark:bg-gray-800';
                    textColor = 'text-gray-700 dark:text-gray-300';
            }

            // Получаем классы границы
            const borderClasses = this.getDayBorderClasses(day.work_hours);

            // Выделение выбранного дня
            let borderClass = borderClasses.join(' ') + ' border';
            if (isSelected) {
                borderClass = 'border-2 border-purple-500 dark:border-purple-400';
            }

            html += `
        <div class="h-12 ${bgColor} ${borderClass} rounded cursor-pointer hover:shadow-lg hover:scale-105 transition-all relative group select-none"
             onclick="app.calendarManager.handleDayClick('${day.date}')"
             ondblclick="app.calendarManager.cycleWorkHours('${day.date}')">
            <!-- Число дня -->
            <div class="flex justify-between items-start p-1">
                <span class="text-xs font-bold ${textColor} select-none">${date.getDate()}</span>
            </div>
            
            <!-- Индикатор рабочих часов -->
            <div class="absolute bottom-1 left-1 right-1 flex justify-center">
                <div class="text-lg font-bold ${textColor} select-none pointer-events-none calendar-hours">
                    ${day.work_hours}ч
                </div>
            </div>
        </div>
    `;
        });

        return html;
    }

    // Вспомогательный метод для описания рабочих часов
    getHoursDescription(hours) {
        switch (hours) {
            case 0:
                return 'Выходной';
            case 8:
                return '8 часов';
            case 12:
                return '12 часов';
            case 24:
                return '24 часа';
            default:
                return `${hours} часов`;
        }
    }

    // Вспомогательные методы для календаря
    async loadCalendarData(yearMonth) {
        const response = await fetch(`/api/calendar/month/${yearMonth}`);
        if (!response.ok) throw new Error('Failed to load calendar data');
        this.calendarData = await response.json();
    }

    selectDate(date) {
        this.selectedDate = date;

        // Обновляем поле ввода
        this.updateDatePicker();

        // Обновляем выделение в календаре
        this.updateDaySelection();

        // Обновляем кнопки рабочих часов
        this.updateWorkHoursButtons();
    }

    getSelectedDateHours() {
        if (!this.calendarData || !this.calendarData.days) return 8;

        const selectedDay = this.calendarData.days.find(day => day.date === this.selectedDate);
        return selectedDay ? selectedDay.work_hours : 8;
    }

    // Обновленный setWorkHours
    async setWorkHours(hours) {
        await this.updateSingleDay(this.selectedDate, hours);
        this.app.showNotification(`${this.formatShortDate(this.selectedDate)}: ${this.getHoursDescription(hours)}`, 'info');
    }

    async changeCalendarMonth(direction) {
        const current = new Date(this.currentMonth + '-01');
        current.setMonth(current.getMonth() + direction);
        this.currentMonth = current.toISOString().slice(0, 7);

        // Устанавливаем выбранную дату на первое число нового месяца
        this.selectedDate = this.currentMonth + '-01';
        localStorage.setItem("currentMonth", this.currentMonth);

        await this.app.loadPage('calendar');
    }

    // Сервисные функции
    async setAllSundaysOff() {
        //if (!confirm('Установить все воскресенья этого месяца как выходные?')) return;

        try {
            const response = await fetch(`/api/calendar/month/${this.currentMonth}/set-sundays-off`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification(`✅ ${result.updated_dates} воскресений установлены как выходные`, 'success');
                await this.loadCalendarData(this.currentMonth);
                this.app.loadPage('calendar');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка установки воскресений как выходных:', error);
            this.app.showNotification('❌ Ошибка при настройке воскресений', 'error');
        }
    }

    async setAllSaturdaysOff() {
        //if (!confirm('Установить все субботы этого месяца как выходные?')) return;

        try {
            const response = await fetch(`/api/calendar/month/${this.currentMonth}/set-saturdays-off`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification(`✅ ${result.updated_dates} суббот установлены как выходные`, 'success');
                await this.loadCalendarData(this.currentMonth);
                this.app.loadPage('calendar');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка установки суббот как выходных:', error);
            this.app.showNotification('❌ Ошибка при настройке суббот', 'error');
        }
    }

    async setAllDays8Hours() {
        //if (!confirm('Сбросить все настройки месяца и установить все дни как рабочие по 8 часов?')) return;

        try {
            const response = await fetch(`/api/calendar/month/${this.currentMonth}/set-all-8hours`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.app.showNotification(`✅ Удалено ${result.deleted_records} записей, все дни установлены по 8 часов`, 'success');
                await this.loadCalendarData(this.currentMonth);
                this.app.loadPage('calendar');
            } else {
                this.app.showNotification(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка сброса настроек месяца:', error);
            this.app.showNotification('❌ Ошибка при сбросе настроек месяца', 'error');
        }
    }

    formatMonth(yearMonth) {
        const date = new Date(yearMonth + '-01');
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long'
        });
    }

    isToday(dateString) {
        const today = new Date().toISOString().slice(0, 10);
        return dateString === today;
    }

    // Обработчик одинарного клика (выбор даты)
    async handleDayClick(date) {
        this.selectedDate = date;

        // Обновляем поле ввода даты
        this.updateDatePicker();

        // Обновляем выделение дней
        this.updateDaySelection();

        // Обновляем кнопки рабочих часов
        this.updateWorkHoursButtons();
    }

    // Обработчик двойного клика (циклическое переключение рабочих часов)
    async cycleWorkHours(date) {
        const currentHours = this.getDayWorkHours(date);
        const nextHours = this.getNextWorkHours(currentHours);

        await this.updateSingleDay(date, nextHours);

        // Обновляем кнопки если это выбранная дата
        if (date === this.selectedDate) {
            this.updateWorkHoursButtons();
        }

        this.app.showNotification(`${this.formatShortDate(date)}: ${this.getHoursDescription(nextHours)}`, 'info');
    }

    // Вспомогательный метод для получения следующих рабочих часов по кругу
    getNextWorkHours(currentHours) {
        const hoursSequence = [0, 8, 12, 24];
        const currentIndex = hoursSequence.indexOf(currentHours);
        const nextIndex = (currentIndex + 1) % hoursSequence.length;
        return hoursSequence[nextIndex];
    }

    // Вспомогательный метод для получения рабочих часов конкретного дня
    getDayWorkHours(date) {
        if (!this.calendarData || !this.calendarData.days) return 8;

        const day = this.calendarData.days.find(d => d.date === date);
        return day ? day.work_hours : 8;
    }

    // Вспомогательный метод для короткого форматирования даты
    formatShortDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short'
        });
    }

    // Метод для обновления только одного дня в календаре
    async updateSingleDay(date, hours = null) {
        try {
            // Если переданы часы - обновляем на сервере
            if (hours !== null) {
                const response = await fetch(`/api/calendar/date/${date}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({work_hours: hours})
                });

                if (!response.ok) throw new Error('Failed to update date');
            }

            // Перезагружаем данные календаря
            await this.loadCalendarData(this.currentMonth);

            // Находим элемент дня в DOM
            const dayElement = this.findDayElement(date);
            if (dayElement) {
                // Получаем новые данные для этого дня
                const dayData = this.calendarData.days.find(d => d.date === date);
                if (dayData) {
                    // Заменяем только этот элемент
                    const newElementHtml = this.renderSingleDay(dayData);
                    dayElement.outerHTML = newElementHtml;
                }
            }

        } catch (error) {
            console.error('Ошибка обновления дня:', error);
            this.app.showNotification('❌ Ошибка при обновлении дня', 'error');
        }
    }

// Метод для поиска элемента дня в DOM
    findDayElement(date) {
        const dayElements = document.querySelectorAll('#calendar-days-grid > div');
        for (let element of dayElements) {
            if (element.onclick && element.onclick.toString().includes(date)) {
                return element;
            }
        }
        return null;
    }

    // Метод для рендера одного дня
    renderSingleDay(day) {
        const date = new Date(day.date);
        const isToday = this.isToday(day.date);
        const isSelected = day.date === this.selectedDate;

        // Определяем цвет фона по количеству рабочих часов
        let bgColor = '';
        let textColor = 'text-gray-900 dark:text-white';

        switch (day.work_hours) {
            case 0:
                bgColor = 'bg-red-100 dark:bg-red-900';
                textColor = 'text-red-800 dark:text-red-200';
                break;
            case 8:
                bgColor = 'bg-white dark:bg-gray-700';
                textColor = 'text-gray-900 dark:text-white';
                break;
            case 12:
                bgColor = 'bg-yellow-100 dark:bg-yellow-900';
                textColor = 'text-yellow-800 dark:text-yellow-200';
                break;
            case 24:
                bgColor = 'bg-blue-100 dark:bg-blue-900';
                textColor = 'text-blue-800 dark:text-blue-200';
                break;
            default:
                bgColor = 'bg-gray-100 dark:bg-gray-800';
                textColor = 'text-gray-700 dark:text-gray-300';
        }

        // Получаем классы границы
        const borderClasses = this.getDayBorderClasses(day.work_hours);

        // Выделение выбранного дня
        let borderClass = borderClasses.join(' ') + ' border';
        if (isSelected) {
            borderClass = 'border-2 border-purple-500 dark:border-purple-400';
        }

        return `
    <div class="h-12 ${bgColor} ${borderClass} rounded cursor-pointer hover:shadow-lg hover:scale-105 transition-all relative group select-none"
         onclick="app.calendarManager.handleDayClick('${day.date}')"
         ondblclick="app.calendarManager.cycleWorkHours('${day.date}')">
        <!-- Число дня -->
        <div class="flex justify-between items-start p-1">
            <span class="text-xs font-bold ${textColor} select-none">${date.getDate()}</span>
        </div>
        
        <!-- Индикатор рабочих часов -->
        <div class="absolute bottom-1 left-1 right-1 flex justify-center">
            <div class="text-lg font-bold ${textColor} select-none pointer-events-none calendar-hours">
                ${day.work_hours}ч
            </div>
        </div>  
    </div>
    `;
    }

// Метод для обновления кнопок рабочих часов
    // Метод для обновления кнопок рабочих часов
    updateWorkHoursButtons() {
        const currentHours = this.getSelectedDateHours();
        const buttons = document.querySelectorAll('.work-hours-btn');

        buttons.forEach(button => {
            const match = button.onclick.toString().match(/setWorkHours\((\d+)\)/);
            if (match) {
                const hours = parseInt(match[1]);
                const isSelected = hours === currentHours;

                // Обновляем классы выделения
                if (isSelected) {
                    button.classList.add('ring-2', 'ring-offset-2', 'ring-gray-400', 'dark:ring-gray-600');
                    button.classList.remove('border');
                } else {
                    button.classList.remove('ring-2', 'ring-offset-2', 'ring-gray-400', 'dark:ring-gray-600');
                    button.classList.add('border');
                }
            }
        });
    }

    // Метод для обновления выделения всех дней
    // Метод для обновления выделения всех дней
    updateDaySelection() {
        const dayElements = document.querySelectorAll('#calendar-days-grid > div');

        dayElements.forEach(element => {
            // Пропускаем пустые ячейки (без даты)
            const date = this.extractDateFromElement(element);
            if (!date) return;

            // Снимаем выделение со всех дней
            element.classList.remove('border-2', 'border-purple-500', 'dark:border-purple-400');

            // Восстанавливаем оригинальные классы границ
            const dayData = this.calendarData.days.find(d => d.date === date);
            if (dayData) {
                // Удаляем все возможные классы границ
                element.classList.remove(
                    'border-red-300', 'dark:border-red-700',
                    'border-gray-300', 'dark:border-gray-600',
                    'border-yellow-300', 'dark:border-yellow-700',
                    'border-blue-300', 'dark:border-blue-700',
                    'border-gray-400', 'dark:border-gray-600'
                );

                // Добавляем правильные классы границ
                const borderClasses = this.getDayBorderClasses(dayData.work_hours);
                borderClasses.forEach(className => element.classList.add(className));
            }

            // Добавляем обычный border если его нет
            if (!element.classList.contains('border')) {
                element.classList.add('border');
            }
        });

        // Добавляем выделение выбранному дню
        const selectedElement = this.findDayElement(this.selectedDate);
        if (selectedElement) {
            selectedElement.classList.remove('border');
            selectedElement.classList.add('border-2', 'border-purple-500', 'dark:border-purple-400');
        }
    }

// Вспомогательный метод для получения классов границы дня
    getDayBorderClasses(hours) {
        switch (hours) {
            case 0:
                return ['border-red-300', 'dark:border-red-700'];
            case 8:
                return ['border-gray-300', 'dark:border-gray-600'];
            case 12:
                return ['border-yellow-300', 'dark:border-yellow-700'];
            case 24:
                return ['border-blue-300', 'dark:border-blue-700'];
            default:
                return ['border-gray-400', 'dark:border-gray-600'];
        }
    }

    // Вспомогательный метод для извлечения даты из элемента
    extractDateFromElement(element) {
        const onclickAttr = element.getAttribute('onclick');
        if (onclickAttr) {
            const match = onclickAttr.match(/handleDayClick\('([^']+)'\)/);
            return match ? match[1] : null;
        }
        return null;
    }

    // Вспомогательный метод для получения цвета границы дня
    getDayBorderColor(hours) {
        switch (hours) {
            case 0:
                return 'border-red-300 dark:border-red-700';
            case 8:
                return 'border-gray-300 dark:border-gray-600';
            case 12:
                return 'border-yellow-300 dark:border-yellow-700';
            case 24:
                return 'border-blue-300 dark:border-blue-700';
            default:
                return 'border-gray-400 dark:border-gray-600';
        }
    }

    // Метод для обновления поля ввода даты
    updateDatePicker() {
        const datePicker = document.getElementById('calendar-date-picker');
        if (datePicker) {
            datePicker.value = this.selectedDate;
        }
    }
}