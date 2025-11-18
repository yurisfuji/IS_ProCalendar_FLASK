export const modalTemplate = (title, content, footer, modalId = 'modal-drag-handle') => `
    <div class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="modal-dialog bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <!-- Заголовок для перетаскивания -->
            <div class="modal-header cursor-move bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 rounded-t-lg flex justify-between items-center select-none"
                 id="${modalId}">
                <h3 class="text-xl font-semibold text-gray-800 dark:text-white">
                    ${title}
                </h3>
                <button onclick="app.closeModal()" 
                        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    ×
                </button>
            </div>
            
            <!-- Содержимое -->
            <div class="modal-content flex-1 overflow-auto p-6">
                ${content}
            </div>
            
            <!-- Футер -->
            <div class="modal-footer bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600 rounded-b-lg">
                ${footer}
            </div>
        </div>
    </div>
`;