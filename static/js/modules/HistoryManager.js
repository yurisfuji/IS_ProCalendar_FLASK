export default class HistoryManager {
    constructor(app) {
        this.app = app;
        this.state = {
            can_undo: false,
            can_redo: false
        };
        this.updateHistoryState();
    }

    async updateHistoryState() {
        try {
            const response = await fetch('/api/history/state');
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.state = result.state;
                    this.updateUI();
                }
            }
        } catch (error) {
            console.error('Ошибка получения состояния истории:', error);
        }
    }

    updateUI() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');

        if (undoBtn) {
            undoBtn.disabled = !this.state.can_undo;
            // Обновляем тултип в зависимости от состояния
            undoBtn.title = this.state.can_undo ? 'Отменить (Ctrl+Z)' : 'Нет действий для отмены';
        }
        if (redoBtn) {
            redoBtn.disabled = !this.state.can_redo;
            redoBtn.title = this.state.can_redo ? 'Повторить (Ctrl+Y)' : 'Нет действий для повтора';
        }
    }

    canUndo() {
        return this.state && this.state.can_undo;
    }

    canRedo() {
        return this.state && this.state.can_redo;
    }

    async undo() {
        if (!this.canUndo()) {
            this.app.showNotification('Нет действий для отмены', 'info');
            return;
        }

        // Визуальная обратная связь
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.classList.add('bg-blue-600');
            setTimeout(() => undoBtn.classList.remove('bg-blue-600'), 200);
        }

        // Сохраняем текущее выделение ДО undo
        if (this.app.ganttManager && this.app.ganttManager.selectedJob) {
            this.app.ganttManager.preserveSelection();
        }

        const response = await fetch('/api/history/undo', {method: 'POST'});
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                this.app.showNotification('✅ Изменения отменены', 'success');
                await this.updateHistoryState(); // Ждем обновления состояния
                this.refreshAllInterfaces();
            }
        }
    }

    async redo() {
        if (!this.canRedo()) {
            this.app.showNotification('Нет действий для повтора', 'info');
            return;
        }

        // Визуальная обратная связь
        const redoBtn = document.getElementById('redo-btn');
        if (redoBtn) {
            redoBtn.classList.add('bg-blue-600');
            setTimeout(() => redoBtn.classList.remove('bg-blue-600'), 200);
        }

        // Сохраняем текущее выделение ДО redo
        if (this.app.ganttManager && this.app.ganttManager.selectedJob) {
            this.app.ganttManager.preserveSelection();
        }

        const response = await fetch('/api/history/redo', {method: 'POST'});
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                this.app.showNotification('✅ Изменения повторены', 'success');
                await this.updateHistoryState(); // Ждем обновления состояния
                this.refreshAllInterfaces();
            }
        }
    }

    // Новый метод для обновления всех интерфейсов
    refreshAllInterfaces() {
        // Обновляем текущую страницу
        if (this.app.currentPage === 'gantt') {
            this.app.ganttManager.applyGanttSettings();
        } else if (this.app.currentPage === 'jobs') {
            this.app.jobsManager.loadJobsData().then(() => this.app.loadPage('jobs'));
        } else if (this.app.currentPage === 'orders') {
            this.app.loadPage('orders');
        } else if (this.app.currentPage === 'equipment') {
            this.app.loadPage('equipment');
        }

        // Обновляем статистику в sidebar
        this.updateSidebarStats();
    }

    async updateSidebarStats() {
        try {
            // Можно добавить обновление счетчиков в sidebar если нужно
            const jobsResponse = await fetch('/api/jobs');
            if (jobsResponse.ok) {
                const jobsData = await jobsResponse.json();
                const jobsCount = document.getElementById('jobs-count');
                if (jobsCount) {
                    jobsCount.textContent = jobsData.jobs ? jobsData.jobs.length : 0;
                }
            }
        } catch (error) {
            console.error('Ошибка обновления статистики:', error);
        }
    }
}