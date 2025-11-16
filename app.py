import pandas as pd
from flask import Flask, render_template, jsonify, request, send_file
from components.draw_functions import draw_chart_image
from datetime import datetime, timedelta
import base64
from io import BytesIO
from sqlmodel import select
import os
from werkzeug.utils import secure_filename
import shutil
from pathlib import Path

from components.calendar_manager import CalendarManager
from components.equipment_manager import EquipmentManager
from components.excel_functions import export_to_excel
from components.job_manager import JobManager
from components.order_manager import OrderManager
from components.history_manager import HistoryManager
from components.worktime_functions import adjust_schedule_and_fix_conflicts, check_equipment_conflicts, \
    move_job_to_previous, move_job_to_next, calculate_finish_date
from database import get_session, create_backup, restore_backup, get_backup_files, init_backup_dirs, \
    create_db_and_tables, get_jobs_count_by_equipment_id
from models import Equipment, EquipmentType, Job, Order, Calendar, JobHistory, HistoryVersion

app = Flask(__name__)

# Конфигурация для продакшена
app.config.update(
    SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-secret-key'),
    DEBUG=os.environ.get('DEBUG', 'False').lower() == 'true',
    HOST=os.environ.get('HOST', '0.0.0.0'),
    PORT=int(os.environ.get('PORT', 8080))
)

class ThemeManager:
    def __init__(self):
        self.is_dark = False

    def toggle(self):
        self.is_dark = not self.is_dark
        return self.is_dark


# Инициализация менеджеров
theme_manager = ThemeManager()
equipment_manager = EquipmentManager()
order_manager = OrderManager()
job_manager = JobManager()
calendar_manager = CalendarManager()
history_manager = HistoryManager()


@app.route('/')
def index():
    return render_template('index.html', is_dark=theme_manager.is_dark)


# API для темы
@app.route('/api/theme/toggle', methods=['POST'])
def toggle_theme():
    new_theme = theme_manager.toggle()
    return jsonify({'is_dark': new_theme})


# API для навигации
@app.route('/api/navigation/<page>', methods=['POST'])
def navigate_to(page):
    return jsonify({'success': True, 'page': page})


# API для оборудования (прокси к EquipmentManager)
@app.route('/api/equipment/types', methods=['GET'])
def get_equipment_types():
    result = equipment_manager.get_all_data()

    # Добавляем количество работ для каждого оборудования
    for equipment in result['equipment']:
        equipment['jobs_count'] = get_jobs_count_by_equipment_id(equipment['id'])

    return jsonify(result)


@app.route('/api/equipment/types', methods=['POST'])
def add_equipment_type():
    data = request.json
    result = equipment_manager.add_type(data['name'], data['color'])
    return jsonify(result)


@app.route('/api/equipment/types/<int:type_id>', methods=['PUT'])
def update_equipment_type(type_id):
    data = request.json
    result = equipment_manager.update_type(type_id, data)
    return jsonify(result)


@app.route('/api/equipment/types/<int:type_id>', methods=['DELETE'])
def delete_equipment_type(type_id):
    result = equipment_manager.delete_type(type_id)
    return jsonify(result)


@app.route('/api/equipment/types/<int:type_id>/move/<direction>', methods=['POST'])
def move_equipment_type(type_id, direction):
    result = equipment_manager.move_type(type_id, direction)
    return jsonify(result)


@app.route('/api/equipment', methods=['POST'])
def add_equipment():
    data = request.json
    result = equipment_manager.add_equipment(
        data['name'],
        data['type_id'],
        data.get('show_on_chart', True)
    )
    return jsonify(result)


@app.route('/api/equipment/<int:equipment_id>', methods=['PUT'])
def update_equipment(equipment_id):
    data = request.json
    result = equipment_manager.update_equipment(equipment_id, data)
    return jsonify(result)


@app.route('/api/equipment/<int:equipment_id>', methods=['DELETE'])
def delete_equipment(equipment_id):
    result = equipment_manager.delete_equipment(equipment_id)
    return jsonify(result)


@app.route('/api/equipment/<int:equipment_id>/toggle', methods=['POST'])
def toggle_equipment_visibility(equipment_id):
    result = equipment_manager.toggle_visibility(equipment_id)
    return jsonify(result)


# API для заказов
@app.route('/api/orders', methods=['GET'])
def get_orders():
    return jsonify(order_manager.get_all_data())


@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """Получает конкретнй заказ по ID"""
    result = order_manager.get_order(order_id)
    return jsonify(result)


@app.route('/api/orders', methods=['POST'])
def add_order():
    data = request.json
    result = order_manager.add_order(
        data['name'],
        data['color'],
        data.get('quantity', 1)
    )
    return jsonify(result)


@app.route('/api/orders/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    data = request.json
    result = order_manager.update_order(order_id, data)
    return jsonify(result)


@app.route('/api/orders/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    result = order_manager.delete_order(order_id)
    return jsonify(result)


@app.route('/api/orders/<int:order_id>/move/<direction>', methods=['POST'])
def move_order(order_id, direction):
    result = order_manager.move_order(order_id, direction)
    return jsonify(result)


# API для получения списков для форм
@app.route('/api/orders/list', methods=['GET'])
def get_orders_list():
    """Получает упрощенный список заказов для выпадающего списка"""
    result = order_manager.get_orders_list()
    return jsonify(result)


@app.route('/api/equipment/list', methods=['GET'])
def get_equipment_list():
    """Получает упрощенный список оборудования для выпадающего списка"""
    result = equipment_manager.get_equipment_list()
    return jsonify(result)


@app.route('/api/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Получает конкретную работу по ID"""
    result = job_manager.get_job(job_id)
    return jsonify(result)


# API для работ
@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    return jsonify(job_manager.get_all_data())


@app.route('/api/jobs', methods=['POST'])
def add_job():
    print("1111")
    data = request.json
    result = job_manager.add_job(
        data['order_id'],
        data['equipment_id'],
        data['duration_hours'],
        data.get('hour_offset', 0),
        data['start_date'],
        data.get('status', 'planned')
    )
    return jsonify(result)


@app.route('/api/jobs/<int:job_id>', methods=['PUT'])
def update_job(job_id):
    data = request.json
    result = job_manager.update_job(job_id, data)
    return jsonify(result)


@app.route('/api/jobs/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    result = job_manager.delete_job(job_id)
    return jsonify(result)


@app.route('/api/jobs/<int:job_id>/status', methods=['POST'])
def change_job_status(job_id):
    data = request.json
    result = job_manager.change_job_status(job_id, data['status'])
    return jsonify(result)


# Добавим в существующий app.py после других API
# API для календаря
@app.route('/api/calendar/month/<year_month>', methods=['GET'])
def get_calendar_month(year_month):
    """Получает данные календаря для указанного месяца (формат: YYYY-MM)"""
    result = calendar_manager.get_month_data(year_month)
    return jsonify(result)


@app.route('/api/calendar/date/<date_str>', methods=['GET'])
def get_calendar_date(date_str):
    """Получает данные для конкретной даты"""
    result = calendar_manager.get_date_data(date_str)
    return jsonify(result)


@app.route('/api/calendar/date/<date_str>', methods=['POST'])
def set_calendar_date(date_str):
    """Устанавливает рабочие часы для конкретной даты"""
    data = request.json
    result = calendar_manager.set_date_data(date_str, data['work_hours'])
    return jsonify(result)


@app.route('/api/calendar/month/<year_month>/set-sundays-off', methods=['POST'])
def set_sundays_off(year_month):
    """Устанавливает все воскресенья месяца как выходные"""
    result = calendar_manager.set_sundays_off(year_month)
    return jsonify(result)


@app.route('/api/calendar/month/<year_month>/set-saturdays-off', methods=['POST'])
def set_saturdays_off(year_month):
    """Устанавливает все субботы месяца как выходные"""
    result = calendar_manager.set_saturdays_off(year_month)
    return jsonify(result)


@app.route('/api/calendar/month/<year_month>/set-all-8hours', methods=['POST'])
def set_all_8hours(year_month):
    """Устанавливает все дни месяца как рабочие по 8 часов"""
    result = calendar_manager.set_all_8hours(year_month)
    return jsonify(result)


@app.route('/api/gantt/image', methods=['POST'])
def generate_gantt_image():
    """Генерирует изображение диаграммы Ганта"""
    try:
        data = request.json
        view_mode = data.get('view_mode', 'week')
        chart_start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date()
        pixels_per_hour = data.get('pixels_per_hour', 20)
        row_height = data.get('row_height', 60)
        job_height_ratio = data.get('job_height_ratio', 80)
        equipment_filter = data.get('equipment_filter', 'all')
        is_dark = data.get('is_dark', False)

        jobs_df, equipment_df, calendar_data = get_gantt_data(equipment_filter)

        # Генерируем изображение
        image, jobs = draw_chart_image(
            view_mode=view_mode,
            chart_start_date=chart_start_date,
            calendar_data=calendar_data,
            equipment_data=equipment_df,
            jobs_data=jobs_df,
            pixels_per_hour=pixels_per_hour,
            row_height=row_height,
            job_height_ratio=job_height_ratio,
            is_dark=is_dark
        )

        # Конвертируем в base64
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()

        return jsonify({
            'success': True,
            'image_data': f"data:image/png;base64,{img_str}",
            'jobs': jobs,
            'width': image.width,
            'height': image.height,
            'equipment_count': len(equipment_df),
            'jobs_count': len(jobs_df)
        })

    except Exception as e:
        print(f"Ошибка генерации диаграммы: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/gantt/export-excel', methods=['POST'])
def export_gantt_excel():
    try:
        data = request.get_json()

        # Получаем параметры из запроса
        view_mode = data.get('view_mode', 'week')
        start_date_str = data.get('start_date')
        equipment_filter = data.get('equipment_filter', 'all')

        # Преобразуем дату
        start_date = datetime.fromisoformat(start_date_str).date()

        # Рассчитываем end_date в зависимости от view_mode
        if view_mode == 'week':
            end_date = start_date + timedelta(days=6)
        elif view_mode == 'month':
            end_date = start_date + timedelta(days=30)
        else:  # year
            end_date = start_date + timedelta(days=365)

        # Получаем данные для диаграммы (аналогично генерации изображения)
        jobs_df, equipment_df, calendar_dict = get_gantt_data(equipment_filter)

        # Генерируем Excel файл
        excel_buffer = export_to_excel(
            jobs_df, equipment_df, start_date, end_date, calendar_dict
        )

        # Возвращаем файл
        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name=f'gantt_{start_date_str}.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    except Exception as e:
        print(f"Ошибка при экспорте в Excel: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


def get_gantt_data(equipment_filter='all'):

    with get_session() as session:
        # Загружаем данные календаря
        calendar_stmt = select(Calendar)
        calendar_records = session.exec(calendar_stmt).all()

        calendar_data = {}
        for record in calendar_records:
            calendar_data[record.date] = record.work_hours

        # Загружаем оборудование с JOIN
        equipment_stmt = select(Equipment, EquipmentType).join(EquipmentType)
        equipment_results = session.exec(equipment_stmt).all()

        equipment_data = []
        for equipment, eq_type in equipment_results:
            equipment_data.append({
                'id': equipment.id,
                'name': equipment.name,
                'type_id': equipment.type_id,
                'type_color': eq_type.color,
                'show_on_chart': equipment.show_on_chart,
                'sort_order': equipment.sort_order
            })

        equipment_df = pd.DataFrame(equipment_data)

        # Загружаем работы с JOIN
        jobs_stmt = select(Job, Order, Equipment).join(Order).join(Equipment)
        jobs_results = session.exec(jobs_stmt).all()

        jobs_data = []
        for job, order, equipment in jobs_results:
            jobs_data.append({
                'id': job.id,
                'equipment_id': job.equipment_id,
                'duration_hours': float(job.duration_hours),
                'hour_offset': float(job.hour_offset) if job.hour_offset else 0.0,
                'start_date': job.start_date,
                'status': job.status,
                'is_locked': job.is_locked,
                'order_name': order.name,
                'order_color': order.color,
                'order_id': order.id,
                'equipment_name': equipment.name
            })

        jobs_df = pd.DataFrame(jobs_data)

        # Применяем фильтр оборудования если нужно
        if equipment_filter != 'all':
            # Если equipment_filter - число (ID оборудования), фильтруем по ID
            if equipment_filter.isdigit():
                equipment_id = int(equipment_filter)
                jobs_df = jobs_df[jobs_df['equipment_id'] == equipment_id]
                equipment_df = equipment_df[equipment_df['id'] == equipment_id]
            # Если equipment_filter = 'visible', фильтруем только видимое оборудование
            elif equipment_filter == 'visible' and len(equipment_df):
                visible_equipment = equipment_df[equipment_df['show_on_chart']]
                visible_equipment_ids = visible_equipment['id'].tolist()
                jobs_df = jobs_df[jobs_df['equipment_id'].isin(visible_equipment_ids)]
                equipment_df = visible_equipment

    return jobs_df, equipment_df, calendar_data


@app.post("/api/jobs/check-conflicts")
def check_job_conflicts():
    """Проверка конфликтов для работы"""
    try:
        data = request.get_json()

        equipment_id = data.get('equipment_id')
        start_date = data.get('start_date')
        hour_offset = data.get('hour_offset', 0)
        duration_hours = data.get('duration_hours')
        job_id = data.get('job_id')
        only_check = data.get('only_check', True)

        if not all([equipment_id, start_date, duration_hours]):
            return jsonify({
                "success": False,
                "error": "Отсутствуют обязательные параметры"
            })

        # Проверяем конфликты
        has_conflicts = adjust_schedule_and_fix_conflicts(
            start_date, hour_offset, duration_hours, equipment_id, job_id, only_check
        )

        if has_conflicts and only_check:
            # Если есть конфликты и мы только проверяем, находим первое свободное время
            available_date, available_offset = check_equipment_conflicts(
                equipment_id, job_id, start_date, hour_offset, duration_hours
            )

            return jsonify({
                "success": True,
                "has_conflicts": True,
                "available_date": available_date,
                "available_offset": available_offset
            })
        else:
            return jsonify({
                "success": True,
                "has_conflicts": False
            })

    except Exception as e:
        print(f"Ошибка проверки конфликтов: {e}")
        return jsonify({
            "success": False,
            "error": f"Ошибка сервера: {str(e)}"
        })


@app.route('/api/backup/create', methods=['POST'])
def create_backup_route():
    """Создает бэкап базы данных"""
    try:
        backup_path, filename = create_backup()
        if backup_path:
            return jsonify({
                'success': True,
                'message': 'Бэкап успешно создан',
                'filename': filename,
                'path': backup_path
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Ошибка создания бэкапа'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Ошибка создания бэкапа: {str(e)}'
        }), 500


@app.route('/api/backup/download/<filename>')
def download_backup(filename):
    """Скачивает файл бэкапа"""
    try:
        backup_path = os.path.join("backups", filename)
        if not os.path.exists(backup_path):
            return jsonify({'success': False, 'message': 'Файл не найден'}), 404

        return send_file(backup_path, as_attachment=True)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Ошибка скачивания: {str(e)}'
        }), 500


@app.route('/api/backup/restore', methods=['POST'])
def restore_backup_route():
    """Восстанавливает базу данных из бэкапа и добавляет его в список"""
    try:
        if 'backup_file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'Файл не выбран'
            }), 400

        backup_file = request.files['backup_file']
        if backup_file.filename == '':
            return jsonify({
                'success': False,
                'message': 'Файл не выбран'
            }), 400

        # Проверяем что файл zip
        if not backup_file.filename.lower().endswith('.zip'):
            return jsonify({
                'success': False,
                'message': 'Файл должен быть в формате ZIP'
            }), 400

        # Создаем папку для временных файлов
        os.makedirs("temp_upload", exist_ok=True)

        # Генерируем уникальное имя файла с timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        original_filename = secure_filename(backup_file.filename)
        backup_filename = f"uploaded_backup_{timestamp}_{original_filename}"
        temp_path = os.path.join("temp_upload", backup_filename)

        # Сохраняем временный файл
        backup_file.save(temp_path)

        # Копируем файл в папку бэкапов
        backups_dir = Path("backups")
        backups_dir.mkdir(exist_ok=True)
        permanent_backup_path = backups_dir / backup_filename
        shutil.copy2(temp_path, permanent_backup_path)

        # Восстанавливаем из бэкапа
        success = restore_backup(temp_path)

        # Удаляем временный файл
        os.remove(temp_path)

        if success:
            return jsonify({
                'success': True,
                'message': 'База данных успешно восстановлена и бэкап сохранен',
                'filename': backup_filename
            })
        else:
            # Если восстановление не удалось, удаляем сохраненный бэкап
            if os.path.exists(permanent_backup_path):
                os.remove(permanent_backup_path)
            return jsonify({
                'success': False,
                'message': 'Ошибка восстановления базы данных'
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Ошибка восстановления: {str(e)}'
        }), 500


@app.route('/api/backup/list', methods=['GET'])
def list_backups():
    """Возвращает список доступных бэкапов"""
    try:
        backup_files = get_backup_files()
        return jsonify({
            'success': True,
            'backups': backup_files
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Ошибка получения списка бэкапов: {str(e)}'
        }), 500


@app.route('/api/backup/restore_from_list', methods=['POST'])
def restore_backup_from_list():
    """Восстанавливает базу данных из существующего бэкапа"""
    try:
        data = request.get_json()
        filename = data.get('filename')

        if not filename:
            return jsonify({
                'success': False,
                'message': 'Имя файла не указано'
            }), 400

        backup_path = os.path.join("backups", filename)
        if not os.path.exists(backup_path):
            return jsonify({
                'success': False,
                'message': 'Файл бэкапа не найден'
            }), 404

        # Восстанавливаем из бэкапа
        success = restore_backup(backup_path)

        if success:
            return jsonify({
                'success': True,
                'message': 'База данных успешно восстановлена'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Ошибка восстановления базы данных'
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Ошибка восстановления: {str(e)}'
        }), 500


@app.route('/api/backup/delete', methods=['POST'])
def delete_backup():
    """Удаляет файл бэкапа"""
    try:
        data = request.get_json()
        filename = data.get('filename')

        if not filename:
            return jsonify({
                'success': False,
                'message': 'Имя файла не указано'
            }), 400

        # Защита от path traversal атак
        if '..' in filename or filename.startswith('/'):
            return jsonify({
                'success': False,
                'message': 'Некорректное имя файла'
            }), 400

        backup_path = os.path.join("backups", filename)
        if not os.path.exists(backup_path):
            return jsonify({
                'success': False,
                'message': 'Файл бэкапа не найден'
            }), 404

        # Удаляем файл
        os.remove(backup_path)

        return jsonify({
            'success': True,
            'message': 'Бэкап успешно удален'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Ошибка удаления бэкапа: {str(e)}'
        }), 500


# Добавить в routes.py или аналогичный файл:

@app.route('/api/jobs/move-to-previous', methods=['POST'])
def move_job_left():
    data = request.get_json()
    job_id = data.get('job_id')

    try:
        result = move_job_to_previous(job_id)
        if result:
            return jsonify({'success': True, 'message': 'Работа прижата к предыдущей', 'data': result})
        else:
            return jsonify({'success': False, 'message': 'Не найдена работа'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/jobs/move-to-next', methods=['POST'])
def move_job_right():
    data = request.get_json()
    job_id = data.get('job_id')

    try:
        # Нужно создать аналогичную функцию move_job_to_next или использовать существующую логику
        result = move_job_to_next(job_id)
        if result:
            return jsonify({'success': True, 'message': 'Работа прижата к следующей', 'data': result})
        else:
            return jsonify({'success': False, 'message': 'Не найдена работа'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# API для управления историей
@app.route('/api/history/state', methods=['GET'])
def get_history_state():
    """Возвращает текущее состояние истории"""
    state = history_manager.get_history_state()
    return jsonify({'success': True, 'state': state})


@app.route('/api/history/undo', methods=['POST'])
def undo_history():
    """Откатывает последнее изменение"""
    success = history_manager.undo()
    if success:
        return jsonify({'success': True, 'message': 'Изменения отменены'})
    else:
        return jsonify({'success': False, 'message': 'Невозможно выполнить отмену'})


@app.route('/api/history/redo', methods=['POST'])
def redo_history():
    """Повторяет отмененное изменение"""
    success = history_manager.redo()
    if success:
        return jsonify({'success': True, 'message': 'Изменения повторены'})
    else:
        return jsonify({'success': False, 'message': 'Невозможно выполнить повтор'})


@app.route('/api/history/snapshot', methods=['POST'])
def create_history_snapshot():
    """Создает снимок текущего состояния"""
    data = request.json
    description = data.get('description', 'Автоматическое сохранение')
    version = history_manager.create_snapshot(description)
    if version > 0:
        return jsonify({'success': True, 'version': version, 'message': 'Снимок создан'})
    else:
        return jsonify({'success': False, 'message': 'Ошибка создания снимка'})


@app.route('/api/history/clear', methods=['POST'])
def clear_history():
    """Полностью очищает историю изменений"""
    try:
        history_manager.clear_history()
        # history_manager.create_snapshot("Начальное состояние")

        return jsonify({
            'success': True,
            'message': 'История изменений полностью очищена'
        })

    except Exception as e:
        session.rollback()
        print(f"❌ Ошибка очистки истории: {e}")
        return jsonify({
            'success': False,
            'message': f'Ошибка очистки истории: {str(e)}'
        }), 500


@app.route('/api/jobs/calculate-finish', methods=['POST'])
def calculate_job_finish():
    """Рассчитывает дату окончания и расписание работы"""
    try:
        data = request.json
        start_date = data.get('start_date')
        duration_hours = float(data.get('duration_hours', 0))
        hour_offset = float(data.get('hour_offset', 0))

        if not start_date or not duration_hours:
            return jsonify({
                'success': False,
                'message': 'Отсутствуют обязательные параметры'
            }), 400

        # Используем существующую функцию расчета
        finish_date, daily_schedule = calculate_finish_date(
            start_date, duration_hours, hour_offset
        )

        # Рассчитываем смещение финиша в последний день
        if daily_schedule:
            last_day = daily_schedule[-1]
            finish_offset = last_day[2] + last_day[1]  # offset + hours
        else:
            finish_offset = hour_offset + duration_hours

        # Форматируем расписание для ответа
        formatted_schedule = []
        for day in daily_schedule:
            formatted_schedule.append({
                'date': day[0],
                'hours': day[1],
                'offset': day[2]
            })

        return jsonify({
            'success': True,
            'data': {
                'finish_date': finish_date,
                'finish_offset': finish_offset,
                'daily_schedule': formatted_schedule
            }
        })

    except Exception as e:
        print(f"Ошибка расчета финиша работы: {e}")
        return jsonify({
            'success': False,
            'message': f'Ошибка расчета: {str(e)}'
        }), 500


# Обработчик ошибок для продакшена
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Ресурс не найден'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Внутренняя ошибка сервера'}), 500


if __name__ == '__main__':
    # Инициализация базы данных
    create_db_and_tables()
    init_backup_dirs()

    # Инициализируем историю при запуске
    try:
        with get_session() as session:
            from sqlmodel import select
            from models import Job, JobHistory

            # ПРАВИЛЬНО: получаем количество записей
            jobs_stmt = select(Job)
            jobs_result = session.exec(jobs_stmt)
            jobs_list = jobs_result.all()
            jobs_count = len(jobs_list)

            history_stmt = select(JobHistory)
            history_result = session.exec(history_stmt)
            history_list = history_result.all()
            history_count = len(history_list)

            # Если есть работы, но история пуста - создаем начальный снимок
            if jobs_count > 0 and history_count == 0:
                print(f"✅ Найдено {jobs_count} работ, создаем начальный снимок истории")
                history_manager.create_snapshot("Начальное состояние")
            elif jobs_count == 0 and history_count == 0:
                # Если нет ни работ, ни истории - создаем пустой снимок
                print("✅ База данных пуста, создаем начальный снимок")
                history_manager.create_snapshot("Пустое начальное состояние")
            else:
                print(f"✅ История уже инициализирована: {jobs_count} работ, {history_count} записей истории")

    except Exception as e:
        print(f"⚠️ Не удалось инициализировать историю: {e}")
        import traceback
        traceback.print_exc()

    # Запуск приложения с конфигурацией из переменных окружения
    app.run(
        host=app.config['HOST'],
        port=app.config['PORT'],
        debug=app.config['DEBUG']
    )