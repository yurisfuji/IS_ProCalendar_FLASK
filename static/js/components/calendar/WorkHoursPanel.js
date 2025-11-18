/**
 * Компонент панели выбора рабочих часов
 */
export class WorkHoursPanel {
    /**
     * @param {Object} calendarManager - Экземпляр менеджера календаря
     */
    constructor(calendarManager) {
        this.calendarManager = calendarManager;
    }

    /**
     * Обновляет состояние кнопок рабочих часов
     */
    updateButtons() {
        const currentHours = this.calendarManager.getSelectedDateHours();
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

    /**
     * Обновляет поле выбора даты
     */
    updateDatePicker() {
        const datePicker = document.getElementById('calendar-date-picker');
        if (datePicker) {
            datePicker.value = this.calendarManager.selectedDate;
        }
    }
}