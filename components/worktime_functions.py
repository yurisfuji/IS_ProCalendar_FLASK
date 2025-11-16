from datetime import datetime, timedelta
from typing import Tuple, List, Optional

import pandas as pd
from sqlmodel import select
from models import Calendar, Order, Job
from database import get_session, get_job_by_id, get_previous_job_by_id, update_job, get_next_job_by_id


def adjust_date_for_work_hours(date_str: str, offset: float) -> tuple[str, float]:
    """Корректирует дату и смещение с учетом рабочих часов"""
    work_hours = get_work_hours_for_date(date_str)

    # Если день выходной, ищем следующий рабочий день
    if work_hours == 0:
        next_working_day = ensure_working_day(date_str)
        return next_working_day, 0.0  # Начинаем с начала рабочего дня

    # Если смещение превышает рабочий день, переходим к следующему дню
    if offset >= work_hours:
        next_working_day = (datetime.fromisoformat(date_str) + timedelta(days=1)).date().isoformat()
        next_work_hours = get_work_hours_for_date(next_working_day)

        # Если следующий день выходной, ищем рабочий
        if next_work_hours == 0:
            next_working_day = ensure_working_day(next_working_day)
            next_work_hours = get_work_hours_for_date(next_working_day)

        # Корректируем смещение для следующего дня
        adjusted_offset = offset - work_hours

        return next_working_day, adjusted_offset

    return date_str, offset


def adjust_schedule_and_fix_conflicts(start_date: str, offset: float, duration: float,
                                      equipment_id: int, job_id: Optional[int] = None,
                                      only_check: bool = True) -> bool:
    """
    Корректирует расписание и устраняет конфликты, перепланируя последующие работы.

    Args:
        start_date: исходная дата начала в формате ISO
        offset: смещение от начала дня в часах
        duration: длительность работы в часах
        equipment_id: ID оборудования
        job_id: ID текущей работы (опционально)
        only_check: не устранять конфликты, только проверить их существование

     Returns:
        bool: True если есть конфликты, False если конфликтов нет
    """
    # 1. Проверяем конфликты и получаем доступную дату
    available_date, available_offset = check_equipment_conflicts(
        equipment_id, job_id, start_date, offset, duration
    )

    # 2. Если дата и смещение совпадают с исходными - нет конфликтов
    if available_date == start_date and abs(available_offset - offset) < 0.01:
        return False

    if not only_check:
        with get_session() as session:
            # 3. Вычисляем финишные параметры для исходной работы
            finish_date, daily_schedule = calculate_finish_date(
                start_date, duration, offset
            )
            # Получаем время окончания из последнего дня расписания
            if daily_schedule:
                last_day_date, last_day_hours, last_day_offset = daily_schedule[-1]
                finish_offset = last_day_offset + last_day_hours
            else:
                finish_offset = 0

            # 4. Вычисляем next_start_date как finish_date + finish_offset + 0.25 часа
            finish_dt = datetime.fromisoformat(finish_date)
            next_start_dt = finish_dt + timedelta(hours=finish_offset + 0.25 if finish_offset != 0 else finish_offset)
            next_start_date = next_start_dt.date().isoformat()
            next_start_offset = next_start_dt.hour + next_start_dt.minute / 60.0

            # 5. Получаем список будущих работ, исключая текущую
            future_jobs = get_future_jobs_excluding_current_optimized(
                start_date, offset, job_id, equipment_id
            )

            # 6. Перебираем работы и перепланируем их если нужно
            for future_job_id, future_duration in future_jobs:
                # Получаем текущие параметры работы
                future_job = session.get(Job, future_job_id)
                if not future_job:
                    continue

                current_start_date = future_job.start_date
                current_offset = future_job.hour_offset or 0.0

                # Если работа начинается после next_start_date - выходим из цикла
                current_start_dt = datetime.fromisoformat(current_start_date) + timedelta(hours=current_offset)
                if current_start_dt >= next_start_dt:
                    break

                # Перепланируем работу на next_start_date
                future_job.start_date = next_start_date
                future_job.hour_offset = next_start_offset
                session.add(future_job)

                # Вычисляем новые параметры финиша для перепланированной работы
                new_finish_date, new_daily_schedule = calculate_finish_date(
                    next_start_date, future_duration, next_start_offset
                )

                # Обновляем next_start_date для следующей работы
                if new_daily_schedule:
                    last_day_date, last_day_hours, last_day_offset = new_daily_schedule[-1]
                    new_finish_offset = last_day_offset + last_day_hours
                else:
                    new_finish_offset = 0

                new_finish_dt = datetime.fromisoformat(new_finish_date)
                next_start_dt = new_finish_dt + timedelta(hours=new_finish_offset + 0.25)
                next_start_date = next_start_dt.date().isoformat()
                next_start_offset = next_start_dt.hour + next_start_dt.minute / 60.0

            # Фиксируем изменения в БД
            session.commit()

    # 7. Возвращаем исходные доступные дату и смещение
    return True


def get_future_jobs_excluding_current_optimized(need_date: str, offset: float, exclude_job_id: Optional[int],
                                                equipment_id: int) -> List[Tuple[int, float]]:
    """
    Оптимизированная версия - возвращает только ID работы и длительность.
    """
    with get_session() as session:
        # Базовый запрос
        statement = select(Job.id, Job.start_date, Job.duration_hours, Job.hour_offset).where(
            Job.equipment_id == equipment_id,
            Job.status.in_(['planned', 'started'])
        )

        # Добавляем условие исключения если нужно
        if exclude_job_id is not None:
            statement = statement.where(Job.id != exclude_job_id)

        # Сортируем
        statement = statement.order_by(Job.start_date, Job.hour_offset)

        # Выполняем запрос
        results = session.exec(statement)
        jobs = results.all()
        future_jobs = []

        need_date_dt = datetime.fromisoformat(need_date).date()

        for job in jobs:
            job_id, start_date, duration_hours, hour_offset = job
            hour_offset = hour_offset or 0.0

            # Рассчитываем дату завершения работы
            finish_date_str, daily_schedule = calculate_finish_date(
                start_date, duration_hours, hour_offset
            )
            finish_date = datetime.fromisoformat(finish_date_str).date()
            _, last_day_hours, last_day_offset = daily_schedule[-1]
            # Проверяем, что работа завершается после need_date
            if finish_date > need_date_dt or (finish_date == need_date_dt and offset < last_day_offset + last_day_hours):
                future_jobs.append((job_id, duration_hours))

        return future_jobs


def get_work_hours_for_date(date_str: str) -> int:
    """Получает рабочие часы для даты из календаря"""
    with get_session() as session:
        statement = select(Calendar.work_hours).where(Calendar.date == date_str)
        work_hours = session.exec(statement).first()

        return work_hours if work_hours is not None else 8


def ensure_working_day(date_str: str) -> str:
    """
    Гарантированно возвращает рабочую дату.
    Если указанная дата - выходной, возвращает первый рабочий день после нее.
    Если день рабочий, возвращает ту же дату.
    """

    work_hours = get_work_hours_for_date(date_str)

    # Если день рабочий, возвращаем ту же дату
    if work_hours > 0:
        return date_str

    # Если день выходной, ищем следующий рабочий день
    current_date = datetime.fromisoformat(date_str).date()
    max_attempts = 30

    for attempt in range(max_attempts):
        current_date += timedelta(days=1)
        next_date_str = current_date.isoformat()

        work_hours = get_work_hours_for_date(next_date_str)
        if work_hours > 0:
            return next_date_str

    return current_date.isoformat()


def calculate_finish_date(start_date, duration, offset):
    """
    Рассчитывает дату окончания работы с учетом календаря рабочих часов
    """
    try:
        start_date = datetime.fromisoformat(start_date).date()
        remaining_hours = duration
        current_date = start_date
        daily_schedule = []
        current_offset = offset

        # Распределяем часы работы по дням
        first_day = True
        while remaining_hours > 0:
            date_str = current_date.isoformat()
            work_hours = get_work_hours_for_date(date_str)

            if work_hours > 0:  # Рабочий день
                # Получаем текущую загрузку оборудования на этот день
                available_hours = work_hours

                if first_day:
                    available_hours -= current_offset
                    first_day = False

                if available_hours > 0:
                    hours_today = min(available_hours, remaining_hours)
                    daily_schedule.append((date_str, hours_today, current_offset))
                    remaining_hours -= hours_today
                    current_offset = 0

            if remaining_hours > 0:
                current_date += timedelta(days=1)

        return current_date.isoformat(), daily_schedule

    except Exception as e:
        print(f"Ошибка в calculate_finish_date: {e}")
        # Fallback: простой расчет
        start_dt = datetime.fromisoformat(start_date)
        finish_dt = start_dt + timedelta(hours=float(duration))
        daily_schedule = [(start_dt.date().isoformat(), float(duration), float(offset) if offset else 0.0)]
        return finish_dt.date().isoformat(), daily_schedule


def get_equipment_total_work_hours(start_date, end_date, equipment_jobs, calendar_dict):
    total_work_hours = 0
    # Рассчитываем общее время работы оборудования в диапазоне

    for _, job in equipment_jobs.iterrows():
        hour_offset = float(job['hour_offset']) if not pd.isna(job['hour_offset']) else 0.0
        duration_hours = float(job['duration_hours'])
        start_dt = pd.to_datetime(job['start_date'])

        finish_date_str, daily_schedule = calculate_finish_date(
            start_dt.isoformat(),
            duration_hours,
            hour_offset
        )

        # ДОБАВЛЯЕМ ВЫХОДНЫЕ ДНИ В РАСПИСАНИЕ
        extended_schedule = []
        work_start_date = pd.to_datetime(job['start_date']).date()
        work_finish_date = pd.to_datetime(finish_date_str).date()

        current_schedule_date = work_start_date
        schedule_index = 0

        while current_schedule_date <= work_finish_date:
            current_date_str = current_schedule_date.isoformat()

            # Проверяем, есть ли этот день в оригинальном расписании
            if schedule_index < len(daily_schedule) and daily_schedule[schedule_index][0] == current_date_str:
                # День есть в расписании - добавляем как есть
                extended_schedule.append(daily_schedule[schedule_index])
                schedule_index += 1
            else:
                # Дня нет в расписании - проверяем является ли он выходным
                work_hours = calendar_dict.get(current_date_str, 8)
                if work_hours == 0:  # Выходной день
                    extended_schedule.append((current_date_str, 0, 0))  # hours=0, offset=0
                # else: рабочий день без работы - не добавляем

            current_schedule_date += timedelta(days=1)

        # Используем расширенное расписание с выходными
        daily_schedule_with_weekends = extended_schedule

        # Суммируем часы в диапазоне дат
        for day_str, hours, offset in daily_schedule_with_weekends:
            day_date = pd.to_datetime(day_str).date()
            if start_date <= day_date <= end_date:
                total_work_hours += hours
    return total_work_hours


def get_order_quantity(order_id):
    """Получает количество для заказа"""
    try:
        with get_session() as session:
            from models import Order
            order = session.get(Order, order_id)
            return order.quantity if order else 0
    except Exception as e:
        print(f"Ошибка получения количества заказа {order_id}: {e}")
        return 0


def check_equipment_conflicts(equipment_id: int, job_id: int, start_date_str: str, hour_offset: float,
                              duration_hours: float) -> tuple[str, float]:
    """
    Проверяет конфликты на оборудовании и возвращает доступную дату старта.
    Если есть конфликты, находит следующую доступную дату.
    """

    def get_job_time_range_with_calendar(job_start: str, job_duration: float, job_offset: float) -> tuple[
        datetime, datetime]:
        """Рассчитывает временной диапазон работы с учетом календаря и оборудования"""

        # Используем готовую функцию calculate_finish_date
        finish_date, daily_schedule = calculate_finish_date(job_start, job_duration, job_offset)
        # Начало работы с учетом смещения
        start_dt = datetime.fromisoformat(job_start)
        start_with_offset = start_dt + timedelta(hours=job_offset)

        # Конец работы - дата из calculate_finish_date + время окончания в последний день
        last_day_schedule = daily_schedule[-1] if daily_schedule else (finish_date, 0, 0)
        last_day_date = datetime.fromisoformat(last_day_schedule[0])
        last_day_hours = last_day_schedule[1]
        last_day_offset = last_day_schedule[2] if len(last_day_schedule) > 2 else 0

        # Время окончания в последний день
        end_dt = last_day_date + timedelta(hours=last_day_offset + last_day_hours)

        return start_with_offset, end_dt

    def has_time_conflict(test_start_dt: datetime, test_end_dt: datetime, conflict_start_dt: datetime,
                          conflict_end_dt: datetime) -> bool:
        """Проверяет пересечение временных интервалов"""
        return conflict_start_dt <= test_start_dt < conflict_end_dt or \
            conflict_start_dt < test_end_dt <= conflict_end_dt or \
            (test_start_dt <= conflict_start_dt and test_end_dt >= conflict_end_dt)

    def get_existing_jobs(equipment_id: int, job_id: int = None) -> list[Job]:
        """Получает все работы на оборудовании (кроме текущей)"""
        statement = select(Job).where(
            Job.equipment_id == equipment_id,
            Job.status.in_(['planned', 'started'])
        )
        if job_id:
            statement = statement.where(Job.id != job_id)
        statement = statement.order_by(Job.start_date)

        with get_session() as session:
            existing_jobs = session.exec(statement).all()
            return existing_jobs

    # Начинаем с исходной даты
    current_date = start_date_str
    current_offset = hour_offset
    max_iterations = 100  # Защита от бесконечного цикла

    for iteration in range(max_iterations):
        # Корректируем дату и смещение с учетом рабочих часов
        adjusted_date, adjusted_offset = adjust_date_for_work_hours(current_date, current_offset)

        # Получаем временной диапазон для проверяемой работы с учетом календаря
        test_start_dt, test_end_dt = get_job_time_range_with_calendar(
            adjusted_date, duration_hours, adjusted_offset
        )
        # Получаем все работы на оборудовании (кроме текущей)
        existing_jobs = get_existing_jobs(equipment_id, job_id)
        has_conflict = False

        for job in existing_jobs:

            job_db_id = job.id
            job_start = job.start_date
            job_duration = job.duration_hours
            job_offset = job.hour_offset or 0
            job_locked = job.is_locked

            # Получаем временной диапазон существующей работы с учетом календаря
            conflict_start_dt, conflict_end_dt = get_job_time_range_with_calendar(
                job_start, job_duration, job_offset
            )

            # Проверяем конфликт
            if has_time_conflict(test_start_dt, test_end_dt, conflict_start_dt, conflict_end_dt):
                has_conflict = True

                # Начинаем после окончания конфликтующей работы + 0.25 часа
                new_start_dt = conflict_end_dt + timedelta(hours=0.25)

                # Обновляем текущую дату и смещение
                current_date = new_start_dt.date().isoformat()
                current_offset = new_start_dt.hour + new_start_dt.minute / 60.0
                break

        # Если конфликтов нет, возвращаем текущую дату
        if not has_conflict:
            return adjusted_date, adjusted_offset

        # Если прошли все итерации, возвращаем последнюю проверенную дату
        if iteration == max_iterations - 1:
            return adjusted_date, adjusted_offset


def get_adjacent_jobs(conn, job_id):
    """Получает предыдущую и следующую работы на том же оборудовании"""
    cursor = conn.cursor()

    # Получаем информацию о текущей работе
    cursor.execute('''
        SELECT equipment_id, start_date, hour_offset 
        FROM jobs WHERE id = ?
    ''', (job_id,))
    current_job = cursor.fetchone()

    if not current_job:
        return None, None

    # Работаем с кортежем - индексы: 0=equipment_id, 1=start_date, 2=hour_offset
    equipment_id = current_job[0]
    current_start = current_job[1]
    current_offset = current_job[2] or 0

    # Находим предыдущую работу
    cursor.execute('''
        SELECT id, order_id, start_date, hour_offset 
        FROM jobs 
        WHERE equipment_id = ? AND id != ?
        AND (start_date < ? OR (start_date = ? AND (hour_offset OR 0) < ?))
        ORDER BY start_date DESC, (hour_offset OR 0) DESC 
        LIMIT 1
    ''', (equipment_id, job_id, current_start, current_start, current_offset))
    prev_job = cursor.fetchone()

    # Находим следующую работу
    cursor.execute('''
        SELECT id, order_id, start_date, hour_offset 
        FROM jobs 
        WHERE equipment_id = ? AND id != ?
        AND (start_date > ? OR (start_date = ? AND (hour_offset OR 0) > ?))
        ORDER BY start_date ASC, (hour_offset OR 0) ASC 
        LIMIT 1
    ''', (equipment_id, job_id, current_start, current_start, current_offset))
    next_job = cursor.fetchone()

    # Получаем названия заказов
    prev_order_name = None
    next_order_name = None

    if prev_job:
        cursor.execute('SELECT name FROM orders WHERE id = ?', (prev_job[1],))  # order_id по индексу 1
        prev_order_result = cursor.fetchone()
        prev_order_name = prev_order_result[0] if prev_order_result else "Неизвестный заказ"

    if next_job:
        cursor.execute('SELECT name FROM orders WHERE id = ?', (next_job[1],))  # order_id по индексу 1
        next_order_result = cursor.fetchone()
        next_order_name = next_order_result[0] if next_order_result else "Неизвестный заказ"

    prev_info = {'order_name': prev_order_name, 'id': prev_job[0]} if prev_job else None  # id по индексу 0
    next_info = {'order_name': next_order_name, 'id': next_job[0]} if next_job else None  # id по индексу 0

    return prev_info, next_info


def move_job_to_previous(job_id: int):
    """Перемещает работу как можно ближе к предыдущей работе на том же оборудовании"""

    # Получаем информацию о текущей работе
    current_job = get_job_by_id(job_id)

    if not current_job:
        return None

    previous_job = get_previous_job_by_id(job_id)

    if previous_job:
        # Рассчитываем окончание предыдущей работы
        prev_finish_date, prev_schedule = calculate_finish_date(
            previous_job.start_date,
            previous_job.duration_hours,
            previous_job.hour_offset or 0,
        )

        # Устанавливаем новую дату начала сразу после предыдущей работы
        new_start_date = prev_finish_date
        last_day_date, last_day_hours, last_day_offset = prev_schedule[-1]
        new_offset = last_day_offset + last_day_hours
        correct_new_start_date, correct_new_offset = adjust_date_for_work_hours(new_start_date, new_offset)

        # Обновляем работу
        update_data = { 'start_date': correct_new_start_date, 'hour_offset': correct_new_offset}

        # update_job(job_id, update_data);

        return update_data
    else:
        return None


def move_job_to_next(job_id):
    """Перемещает работу как можно ближе к следующей работе на том же оборудовании"""

    current_job = get_job_by_id(job_id)

    if not current_job:
        return None

    # Находим следующую работу
    next_job = get_next_job_by_id(job_id)

    if next_job:
        diff = get_work_hours_between_jobs(current_job, next_job)
        print("DIFF", diff)
        # Устанавливаем новую дату начала - накануне следующей работы
        next_start_date = current_job.start_date
        next_offset = current_job.hour_offset + diff

        correct_new_start_date, correct_new_offset = adjust_date_for_work_hours(next_start_date, next_offset)

        # Обновляем работу
        update_data = {'start_date': correct_new_start_date, 'hour_offset': correct_new_offset}

        update_job(job_id, update_data)

        return update_data
    else:
        return None


def get_work_hours_between_dates(start_date, start_offset, finish_date, finish_offset):
    """
    Рассчитывает количество рабочих часов между двумя датами с учетом смещений

    Args:
        conn: соединение с БД
        start_date (str): дата начала в формате 'YYYY-MM-DD'
        start_offset (float): смещение начала в часах от начала дня
        finish_date (str): дата окончания в формате 'YYYY-MM-DD'
        finish_offset (float): смещение окончания в часах от начала дня

    Returns:
        float: общее количество рабочих часов между указанными точками
    """

    # Преобразуем даты в datetime объекты
    start_dt = datetime.fromisoformat(start_date)
    finish_dt = datetime.fromisoformat(finish_date)

    # Если даты одинаковые, рассчитываем разницу в пределах одного дня
    if start_date == finish_date:
        work_hours = get_work_hours_for_date(start_date)
        if work_hours == 0:  # Выходной день
            return 0.0

        # Ограничиваем смещения рабочими часами дня
        effective_start = min(start_offset, work_hours)
        effective_finish = min(finish_offset, work_hours)

        return max(0.0, effective_finish - effective_start)

    total_hours = 0.0

    # Обрабатываем начальный день
    start_day_hours = get_work_hours_for_date(start_date)
    if start_day_hours > 0:  # Рабочий день
        effective_start = min(start_offset, start_day_hours)
        hours_in_start_day = max(0.0, start_day_hours - effective_start)
        total_hours += hours_in_start_day

    # Обрабатываем конечный день
    finish_day_hours = get_work_hours_for_date(finish_date)
    if finish_day_hours > 0:  # Рабочий день
        effective_finish = min(finish_offset, finish_day_hours)
        hours_in_finish_day = effective_finish
        total_hours += hours_in_finish_day

    # Обрабатываем полные дни между начальным и конечным
    current_date = start_dt + timedelta(days=1)
    while current_date.date() < finish_dt.date():
        date_str = current_date.strftime('%Y-%m-%d')
        day_hours = get_work_hours_for_date(date_str)
        if day_hours > 0:  # Только рабочие дни
            total_hours += day_hours
        current_date += timedelta(days=1)

    return total_hours


def get_work_hours_between_jobs(job1, job2):
    """
    Рассчитывает количество рабочих часов между двумя работами

    Args:
        conn: соединение с БД
        job1 (Job): первая работа
        job2 (Job): вторая работа

    Returns:
        float: количество рабочих часов между работами
        None: если одна из работ не найдена
    """

    # Рассчитываем время окончания первой работы
    job1_finish_date, job1_schedule = calculate_finish_date(
        job1.start_date, job1.duration_hours, job1.hour_offset
    )
    _, last_hours, last_offset = job1_schedule[-1]

    # Рассчитываем разницу между окончанием первой работы и началом второй
    return get_work_hours_between_dates(
        job1_finish_date, last_hours + last_offset, job2.start_date, job2.hour_offset
    )
