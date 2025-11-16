export default class BackupManager {
    constructor(app) {
        this.app = app;
    }

    async openBackupManager() {
        const modalHtml = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden">
                    <div class="flex justify-between items-center p-6 pt-2 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-xl font-semibold dark:text-white">Управление резервными копиями</h3>
                        <button onclick="app.closeModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="p-2 space-y-3 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div class="flex space-x-3 px-4">
                        <!-- Создание бэкапа -->
                        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <div class="flex flex-col w-full h-full justify-between mt-6 pb-6">
                                    <h4 class="font-semibold dark:text-white">Создать резервную копию</h4>
                                    <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">Создайте zip-архив с текущей базой данных</p>
                                    <button onclick="backupManager.createBackup()" 
                                            class="w-full self-end bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center whitespace-nowrap">
                                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                                        </svg>
                                        Создать бэкап
                                    </button>                                  
                            </div>
                        </div>

                        <!-- Восстановление из бэкапа -->
                        <div class="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div class="flex-shrink-0 w-1/3 mr-4">
                                    <h4 class="font-semibold dark:text-white mb-2">Восстановить из файла</h4>
                                    <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">Загрузите zip-архив для восстановления базы данных</p>
                                </div>                            
                                <div class="flex-1">
                                    <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center mb-3"
                                 id="drop-zone"
                                 ondrop="backupManager.handleDrop(event)"
                                 ondragover="backupManager.handleDragOver(event)"
                                 ondragleave="backupManager.handleDragLeave(event)">
                                <input type="file" id="backup-file-input" accept=".zip" class="hidden" 
                                       onchange="backupManager.handleFileSelect(this.files)">
                                <div class="space-y-2">
                                    <svg class="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                    </svg>
                                    <p class="text-sm text-gray-600 dark:text-gray-300">
                                        Перетащите zip-файл сюда или 
                                        <button type="button" onclick="document.getElementById('backup-file-input').click()" 
                                                class="text-blue-500 hover:text-blue-600 underline">
                                            выберите файл
                                        </button>
                                    </p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400" id="selected-file-name">Файл не выбран</p>
                                </div>
                            </div>
                                </div>
                            </div>                          
                            <button onclick="backupManager.restoreFromUpload()" 
                                    id="restore-upload-btn"
                                    disabled
                                    class="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center w-full justify-center">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                Восстановить из загруженного файла
                            </button>
                        </div>
                    </div>
                        <!-- Список существующих бэкапов -->
                        <div>
                            <div class="flex justify-between items-center mb-3 px-4">
                                <h4 class="font-semibold dark:text-white">Доступные резервные копии</h4>
                                <button onclick="backupManager.loadBackupList()" 
                                        class="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                    Обновить
                                </button>
                            </div>
                            <div id="backup-list" class="space-y-3">
                                <div class="text-center py-8">
                                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Загрузка списка бэкапов...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.app.showModal(modalHtml);
        await this.loadBackupList();
        this.selectedFile = null;
    }

    async loadBackupList() {
        const backupList = document.getElementById('backup-list');
        if (!backupList) return;

        try {
            backupList.innerHTML = `
                <div class="text-center py-4">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Загрузка...</p>
                </div>
            `;

            const response = await fetch('/api/backup/list');
            const data = await response.json();

            if (data.success) {
                if (data.backups.length === 0) {
                    backupList.innerHTML = `
                        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                            <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <p>Резервные копии отсутствуют</p>
                            <p class="text-sm mt-1">Создайте первую резервную копию</p>
                        </div>
                    `;
                } else {
                    backupList.innerHTML = data.backups.map(backup => `
                        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow">
                            <div class="flex-1 min-w-0">
                                <div class="font-medium dark:text-white truncate" title="${backup.filename}">${backup.filename}</div>
                                <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    <span class="inline-flex items-center">
                                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                        ${new Date(backup.created).toLocaleString()}
                                    </span>
                                    <span class="mx-2">•</span>
                                    <span class="inline-flex items-center">
                                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                                        </svg>
                                        ${this.formatFileSize(backup.size)}
                                    </span>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 ml-4 flex-shrink-0">
                                <button onclick="backupManager.downloadBackup('${backup.filename}')" 
                                        class="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors tooltip"
                                        title="Скачать бэкап">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                    </svg>
                                </button>
                                <button onclick="backupManager.restoreFromList('${backup.filename}')" 
                                        class="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors tooltip"
                                        title="Восстановить из этого бэкапа">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                </button>
                                <button onclick="backupManager.deleteBackup('${backup.filename}')" 
                                        class="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors tooltip"
                                        title="Удалить бэкап">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `).join('');

                    // Добавляем тултипы
                    this.initTooltips();
                }
            } else {
                backupList.innerHTML = `
                    <div class="text-center py-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p>Ошибка загрузки списка бэкапов</p>
                        <p class="text-sm mt-1">${data.message || 'Попробуйте обновить страницу'}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Ошибка загрузки списка бэкапов:', error);
            backupList.innerHTML = `
                <div class="text-center py-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p>Ошибка загрузки списка бэкапов</p>
                    <p class="text-sm mt-1">Проверьте подключение к серверу</p>
                </div>
            `;
        }
    }

    initTooltips() {
        // Улучшенная реализация тултипов
        const tooltips = document.querySelectorAll('.tooltip');

        tooltips.forEach(tooltip => {
            let tooltipEl = null;
            let tooltipTimeout = null;

            tooltip.addEventListener('mouseenter', function (e) {
                const title = this.getAttribute('title');
                if (title && !tooltipEl) {
                    // Создаем элемент тултипа
                    tooltipEl = document.createElement('div');
                    tooltipEl.className = 'absolute z-[1000] px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg whitespace-nowrap';
                    tooltipEl.textContent = title;

                    // Добавляем в body
                    document.body.appendChild(tooltipEl);

                    // Позиционируем относительно кнопки
                    const rect = this.getBoundingClientRect();
                    const tooltipRect = tooltipEl.getBoundingClientRect();

                    // Позиционируем над кнопкой по центру
                    let top = rect.top - tooltipRect.height - 8;
                    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

                    // Корректируем позицию, если тултип выходит за границы экрана
                    if (top < 10) {
                        top = rect.bottom + 8; // Показываем под кнопкой
                    }
                    if (left < 10) {
                        left = 10;
                    } else if (left + tooltipRect.width > window.innerWidth - 10) {
                        left = window.innerWidth - tooltipRect.width - 10;
                    }

                    tooltipEl.style.top = `${top}px`;
                    tooltipEl.style.left = `${left}px`;

                    this.removeAttribute('title');
                }
            });

            tooltip.addEventListener('mouseleave', function () {
                if (tooltipEl) {
                    // Небольшая задержка для плавного исчезновения
                    tooltipTimeout = setTimeout(() => {
                        if (tooltipEl) {
                            tooltipEl.remove();
                            tooltipEl = null;
                            this.setAttribute('title', this._originalTitle || '');
                        }
                    }, 100);
                }
            });

            tooltip.addEventListener('mouseenter', function () {
                clearTimeout(tooltipTimeout);
            });

            // Сохраняем оригинальный title
            tooltip._originalTitle = tooltip.getAttribute('title');
        });

        // Очистка тултипов при закрытии модального окна
        const cleanupTooltips = () => {
            document.querySelectorAll('.tooltip-element').forEach(el => el.remove());
        };

        // Добавляем обработчик для очистки
        this.cleanupTooltips = cleanupTooltips;
    }

    async createBackup() {
        try {
            this.app.showNotification('Создание резервной копии...', 'info');

            const response = await fetch('/api/backup/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (data.success) {
                this.app.showNotification('Резервная копия успешно создана', 'success');

                // Автоматически скачиваем файл
                // this.downloadBackup(data.filename);

                // Обновляем список бэкапов
                await this.loadBackupList();
            } else {
                this.app.showNotification(data.message || 'Ошибка создания бэкапа', 'error');
            }
        } catch (error) {
            console.error('Ошибка создания бэкапа:', error);
            this.app.showNotification('Ошибка создания бэкапа', 'error');
        }
    }

    downloadBackup(filename) {
        window.open(`/api/backup/download/${filename}`, '_blank');
    }

    async restoreFromList(filename) {
        if (!confirm('ВНИМАНИЕ: Текущая база данных будет заменена на версию из этого бэкапа. Продолжить?')) {
            return;
        }

        try {
            this.app.showNotification('Восстановление базы данных...', 'info');

            const response = await fetch('/api/backup/restore_from_list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filename: filename })
            });

            const data = await response.json();

            if (data.success) {
                this.app.showNotification('База данных успешно восстановлена', 'success');

                await this.app.clearHistory(true);

                // Закрываем модальное окно и перезагружаем страницу
                setTimeout(() => {
                    this.app.closeModal();
                    window.location.reload();
                }, 1500);
            } else {
                this.app.showNotification(data.message || 'Ошибка восстановления', 'error');
            }
        } catch (error) {
            console.error('Ошибка восстановления бэкапа:', error);
            this.app.showNotification('Ошибка восстановления бэкапа', 'error');
        }
    }

    async deleteBackup(filename) {
        if (!confirm(`Вы уверены, что хотите удалить бэкап "${filename}"?`)) {
            return;
        }

        try {
            this.app.showNotification('Удаление бэкапа...', 'info');

            const response = await fetch('/api/backup/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filename: filename })
            });

            const data = await response.json();

            if (data.success) {
                this.app.showNotification('Бэкап успешно удален', 'success');
                await this.loadBackupList();
            } else {
                this.app.showNotification(data.message || 'Ошибка удаления бэкапа', 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления бэкапа:', error);
            this.app.showNotification('Ошибка удаления бэкапа', 'error');
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
        event.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/30');
    }

    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/30');
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/30');

        const files = event.dataTransfer.files;
        this.handleFileSelect(files);
    }

    handleFileSelect(files) {
        if (files.length === 0) return;

        const file = files[0];
        if (!file.name.endsWith('.zip')) {
            this.app.showNotification('Пожалуйста, выберите zip-файл', 'error');
            return;
        }

        this.selectedFile = file;

        const fileNameElement = document.getElementById('selected-file-name');
        const restoreBtn = document.getElementById('restore-upload-btn');

        if (fileNameElement) {
            fileNameElement.textContent = `Выбран файл: ${file.name} (${this.formatFileSize(file.size)})`;
            fileNameElement.className = 'text-xs text-green-600 dark:text-green-400 font-medium';
        }

        if (restoreBtn) {
            restoreBtn.disabled = false;
        }
    }

    async restoreFromUpload() {
        if (!this.selectedFile) {
            this.app.showNotification('Пожалуйста, выберите файл для восстановления', 'error');
            return;
        }

        if (!confirm('ВНИМАНИЕ: Текущая база данных будет заменена. Продолжить?')) {
            return;
        }

        try {
            this.app.showNotification('Восстановление базы данных...', 'info');

            const formData = new FormData();
            formData.append('backup_file', this.selectedFile);

            const response = await fetch('/api/backup/restore', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.app.showNotification('База данных успешно восстановлена', 'success');
                this.app.closeModal();

                await this.app.clearHistory(true);

                // Обновляем список бэкапов перед закрытием
                await this.loadBackupList();

                // Даем время на обновление списка
                setTimeout(() => {
                    this.app.closeModal();
                    window.location.reload();
                }, 2000);
            } else {
                this.app.showNotification(data.message || 'Ошибка восстановления', 'error');
            }
        } catch (error) {
            console.error('Ошибка восстановления бэкапа:', error);
            this.app.showNotification('Ошибка восстановления бэкапа', 'error');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}