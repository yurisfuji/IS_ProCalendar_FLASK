import os
from datetime import timedelta

import pandas as pd
from PIL import Image, ImageDraw, ImageFont

from .worktime_functions import calculate_finish_date, get_order_quantity, get_equipment_total_work_hours

margin = 90


def draw_chart_image(view_mode, chart_start_date, calendar_data, equipment_data, jobs_data, pixels_per_hour,
                     row_height, job_height_ratio, is_dark=False):
    y_header_start = 40
    y_content_start = y_header_start + 40
    total_chart_width, total_chart_height, chart_end_date = 0, 0, None
    jobs_info = []

    job_height = int(row_height * job_height_ratio / 100)

    # Загружаем шрифты
    font_small, font_medium, font_large = load_fonts_for_deployment()
    stats_font = ImageFont.truetype("arial.ttf", 9) if hasattr(font_small, 'getsize') else font_small

    def get_chart_end_date():
        chart_end_date = None
        if view_mode == 'year':
            chart_end_date = chart_start_date + timedelta(days=365)
        elif view_mode == 'month':
            chart_end_date = chart_start_date + timedelta(days=30)
        else:  # week
            chart_end_date = chart_start_date + timedelta(days=6)
        return chart_end_date

    def calc_total_chart_width():
        total_virtual_hours = 0
        current_date = chart_start_date
        while current_date <= chart_end_date:
            work_hours = calendar_data.get(current_date.isoformat(), 8)
            is_weekend = (work_hours == 0)
            day_virtual_duration = 2 if is_weekend else work_hours
            total_virtual_hours += day_virtual_duration
            current_date += timedelta(days=1)

        chart_width = int(total_virtual_hours * pixels_per_hour)
        total_chart_width = chart_width + margin * 2

        return total_chart_width, total_virtual_hours

    def calc_total_chart_height(equipment_count, header_height=100):
        total_chart_height = equipment_count * row_height + header_height + margin
        return total_chart_height

    def create_metadata_for_days():
        days_metadata = {}

        current_virtual_time = 0
        current_date = chart_start_date

        while current_date <= chart_end_date:
            work_hours = calendar_data.get(current_date.isoformat(), 8)
            is_weekend = (work_hours == 0)
            day_virtual_duration = 2 if is_weekend else work_hours

            days_metadata[current_date] = {
                'short_date': current_date.strftime('%d.%m'),
                'virtual_start': current_virtual_time,
                'virtual_end': current_virtual_time + day_virtual_duration,
                'work_hours': work_hours,
                'is_weekend': is_weekend
            }
            current_virtual_time += day_virtual_duration
            current_date += timedelta(days=1)

        return days_metadata

    def draw_chart_days_grid(draw, day_metadata):

        for day in day_metadata:
            day_info = day_metadata[day]
            x_start = day_info['virtual_start'] * pixels_per_hour + margin
            x_end = day_info['virtual_end'] * pixels_per_hour + margin

            # Фон дня
            color = (200, 200, 200) if day_info['is_weekend'] else (173, 216, 230)
            draw.rectangle([x_start, y_header_start, x_end, y_content_start - 5],
                           fill=color, outline='gray', width=1)
            if day_info['is_weekend']:
                draw.rectangle([x_start, y_content_start, x_end, total_chart_height - margin],
                               fill=color, outline='gray', width=1)

            xs_date, xs_hours = day_info['short_date'], f"[{day_info['work_hours']}]"
            if day_info['is_weekend']:
                if pixels_per_hour == 5:
                    xs_date, xs_hours = "", ""
                elif pixels_per_hour < 15:
                    xs_date = xs_date[:2]

            # Название дня
            if pixels_per_hour < 30:
                day_text, duration = xs_date, xs_hours
                text_width = draw.textlength(day_text, font=font_small)
                text_x = x_start + (x_end - x_start - text_width) / 2
                draw.text((text_x, y_header_start + 5), day_text, fill='black', font=font_small)
                text_width = draw.textlength(duration, font=font_small)
                text_x = x_start + (x_end - x_start - text_width) / 2
                draw.text((text_x, y_header_start + 15), duration, fill='black', font=font_small)
            else:
                day_text = f"{xs_date} {xs_hours}"
                text_width = draw.textlength(day_text, font=font_medium)
                text_x = x_start + (x_end - x_start - text_width) / 2
                draw.text((text_x, y_header_start + 5), day_text, fill='black', font=font_medium)

    def draw_chart_equipment_rows(draw, day_metadata, text_color='black'):
        for i, (_, equipment) in enumerate(equipment_data.iterrows()):

            y_pos = y_content_start + i * row_height + row_height // 2
            y_row_top = y_content_start + i * row_height
            y_row_bottom = y_row_top + row_height

            equipment_jobs = jobs_data[jobs_data['equipment_name'] == equipment['name']]
            # Рассчитываем общее время работы оборудования в диапазоне
            total_work_hours = get_equipment_total_work_hours(chart_start_date, chart_end_date, equipment_jobs,
                                                              calendar_data)

            # Получаем цвет типа оборудования
            type_color = equipment['type_color']
            rgb_color = hex_to_rgb(equipment['type_color'])
            background_color = lighten_color(rgb_color, 0.75)

            # Рисуем прямоугольник фона для всей строки
            draw.rectangle(
                [margin, y_row_top, total_chart_width - margin, y_row_bottom],
                fill=background_color,
                outline=None
            )
            # ПРИТЕМНЕНИЕ ФОНА ТИПА ОБОРУДОВАНИЯ В ВЫХОДНЫЕ ДНИ'
            for day in day_metadata:
                day_info = day_metadata[day]
                if day_info['is_weekend']:
                    day_x_start = day_info['virtual_start'] * pixels_per_hour + margin
                    day_x_end = day_info['virtual_end'] * pixels_per_hour + margin

                    # Притемняем исходный цвет типа оборудования
                    darkened_color = darken_color(background_color, 0.1)  # Притемняем на 30%
                    draw.rectangle(
                        [day_x_start, y_row_top, day_x_end, y_row_bottom],
                        fill=darkened_color,
                        outline=None
                    )
            # === ОТОБРАЖЕНИЕ НАЗВАНИЯ ОБОРУДОВАНИЯ И СТАТИСТИКИ ===
            equipment_text = equipment['name']
            # Рассчитываем позиции текста
            text_width = draw.textlength(equipment_text, font=font_large)
            # Основное название оборудования
            draw.text((margin - text_width - 10, y_pos - 15), equipment_text,
                      fill=text_color, font=font_large)
            # Статистика времени работы (вторая строка)
            stats_text = f"{total_work_hours:.2f} ч"
            stats_width = draw.textlength(stats_text, font=stats_font)
            draw.text((margin - stats_width - 20, y_pos + 2), stats_text,
                      fill=text_color, font=font_medium)
            # Линия оборудования
            draw.line([margin, y_row_bottom, total_chart_width - margin, y_row_bottom],
                      fill='gray', width=4)

    def draw_chart_days_lines(draw, day_metadata):

        for day in day_metadata:
            day_info = day_metadata[day]
            x_start = day_info['virtual_start'] * pixels_per_hour + margin

            # Линия дня
            draw.line([x_start, y_content_start, x_start, total_chart_height - margin],
                      fill='gray', width=2)

            # Линии часов для рабочих дней
            if not day_info['is_weekend'] and view_mode == "week":
                for hour in range(day_info['work_hours'] + 1):
                    x_hour = x_start + hour * pixels_per_hour
                    draw_dotted_line(draw, [x_hour, y_content_start, x_hour, total_chart_height - margin],
                                     fill='gray', width=1, dot_interval=2)

    def get_virtual_start_time(start_date, offset, day_metadata):
        """Время начала работы на оси X диаграммы"""

        # Если работа началась до начала диаграммы
        if start_date < chart_start_date:
            return 0  # Начинаем отрисовывать с самого начала диаграммы

        if start_date not in day_metadata:
            return None

        day_info = day_metadata[start_date]
        if day_info['is_weekend']:
            return day_info['virtual_start'] + (offset / 24) * 2
        else:
            return day_info['virtual_start'] + min(offset, day_info['work_hours'])

    def get_virtual_finish_time(start_dt, offset, duration):
        """Точное время окончания работы с учетом всей продолжительности"""

        # Получаем полное расписание работы по дням
        finish_date_str, daily_schedule = calculate_finish_date(
            start_dt.isoformat(),
            duration,
            offset
        )

        if not daily_schedule:
            return None

        finish_dt = pd.to_datetime(finish_date_str)
        work_start_date = start_dt.date()

        # Если работа началась до начала диаграммы
        if work_start_date < chart_start_date:
            # Суммируем продолжительность ВСЕХ дней, которые попадают в диапазон диаграммы
            total_visible_hours = 0
            last_visible_day = None

            for day_str, hours, day_offset in daily_schedule:
                day_date = pd.to_datetime(day_str).date()

                if day_date >= chart_start_date:  # День попадает в диапазон диаграммы
                    total_visible_hours += hours
                    last_visible_day = (day_date, hours, day_offset)

            if last_visible_day:
                day_date, hours, day_offset = last_visible_day

                if day_date in day_metadata:
                    day_info = day_metadata[day_date]

                    # Виртуальное время окончания = начало последнего дня + продолжительность в этот день
                    if day_info['is_weekend']:
                        # Для выходных: пропорционально 24 часам
                        time_in_last_day = day_offset + hours
                        return day_info['virtual_start'] + (time_in_last_day / 24) * 2
                    else:
                        # Для рабочих дней: начало дня + смещение + часы
                        return day_info['virtual_start'] + day_offset + hours

            return 0  # Если нет видимых дней

        # Стандартный расчет для работ, начинающихся в диапазоне диаграммы
        finish_date = finish_dt.date()

        if finish_date not in day_metadata:
            if finish_date < chart_start_date:
                return 0
            else:
                return total_virtual_hours

        day_info = day_metadata[finish_date]
        last_day_str, hours_in_last_day, offset_in_last_day = daily_schedule[-1]
        total_time_in_last_day = offset_in_last_day + hours_in_last_day

        if day_info['is_weekend']:
            return day_info['virtual_start'] + (total_time_in_last_day / 24) * 2
        else:
            return day_info['virtual_start'] + total_time_in_last_day

    def draw_chart_jobs(draw):

        equipment_list = [x['id'] for (_, x) in equipment_data.iterrows()]

        for _, job in jobs_data.iterrows():

            hour_offset = float(job['hour_offset']) if job['hour_offset'] else 0.0
            duration_hours = float(job['duration_hours'])
            start_dt = pd.to_datetime(job['start_date'])

            virtual_start = get_virtual_start_time(start_dt.date(), hour_offset, day_metadata)
            virtual_finish = get_virtual_finish_time(start_dt, hour_offset, duration_hours)
            # Если даты выходят за границы - пропускаем
            if virtual_start is None or virtual_finish is None:
                continue

            # Проверяем, началась ли работа до начала диаграммы
            work_started_before_chart = start_dt.date() < chart_start_date

            if work_started_before_chart:
                # Работа началась до начала диаграммы
                if virtual_finish > 0:  # Работа продолжается в диапазоне диаграммы
                    # Начинаем отрисовку с начала диаграммы
                    x_start = margin
                    x_finish = virtual_finish * pixels_per_hour + margin

                else:
                    # Вся работа завершилась до начала диаграммы - не отрисовываем
                    continue
            else:
                # Обычная отрисовка для работ, начинающихся в диапазоне диаграммы
                x_start = virtual_start * pixels_per_hour + margin
                x_finish = virtual_finish * pixels_per_hour + margin

            # Убеждаемся, что работа видима на диаграмме
            if x_finish <= margin or x_start >= total_chart_width - margin:
                continue  # Работа полностью за пределами видимой области

            # Обеспечиваем минимальную ширину для коротких работ
            min_width = 3
            if x_finish - x_start < min_width:
                x_finish = x_start + min_width

            # Обеспечиваем попадание в границы диаграммы
            x_start = max(margin, min(x_start, total_chart_width - margin))
            x_finish = max(margin, min(x_finish, total_chart_width - margin))

            # Цвет работы
            status_color_map = {
                'planned': None,
                'started': '#00FF00',
                'completed': '#FF0000'
            }
            color = hex_to_rgb(job['order_color'])

            # Рисуем блок работы
            idx = equipment_list.index(job['equipment_id'])
            y_pos = y_content_start + idx * row_height + row_height // 2
            y_top = y_pos - job_height // 2
            y_bottom = y_pos + job_height // 2

            # Основной прямоугольник
            outline_color = lighten_color(hex_to_rgb(job['order_color']), 0.6)
            outline_thickness = 1
            draw_rounded_rectangle(draw,
                                   [x_start, y_top, x_finish, y_bottom],
                                   radius=0,  # Радиус скругления
                                   fill=color,
                                   outline=outline_color,
                                   width=outline_thickness
                                   )

            jobs_info.append({
                'coordinates': {'x1': x_start, 'y1': y_top, 'x2': x_finish, 'y2': y_bottom},
                'order_name': job['order_name'],
                'order_id': job['order_id'],
                'equipment_name': job['equipment_name'],
                'id': job['id']
            })
            # Проверяем все дни, которые пересекаются с работой

            for day in day_metadata:
                day_info = day_metadata[day]
                if day_info['is_weekend']:
                    day_x_start = day_info['virtual_start'] * pixels_per_hour + margin
                    day_x_end = day_info['virtual_end'] * pixels_per_hour + margin

                    # Ограничиваем границы текущей работой
                    day_x_start = max(x_start, day_x_start)
                    day_x_end = min(x_finish, day_x_end)

                    if day_x_end > day_x_start:  # Если выходной попадает в видимую часть работы
                        # Рисуем полупрозрачный серый прямоугольник поверх работы
                        weekend_color = tuple(max(0, int(c * 0.7)) for c in color)
                        draw.rectangle([day_x_start, y_top, day_x_end, y_bottom],
                                       fill=weekend_color, outline=None)

            # Текст внутри блока работы
            text_color = get_contrast_text_color(job['order_color'])
            job_width = x_finish - x_start

            if job_width > 60:
                # Основной текст - название заказа
                text = job['order_name']
                if start_dt.date() < chart_start_date:
                    text = "← " + text

                if len(text) > 20:
                    text = text[:20] + '...'

                text_font = font_small if job_height < 30 else font_medium
                text_width_px = draw.textlength(text, font=text_font)

                if text_width_px > job_width - 10:
                    text_font = font_small
                    text_width_px = draw.textlength(text, font=text_font)
                    if text_width_px > job_width - 10 and len(text) > 8:
                        text = text[:8] + '...'
                        text_width_px = draw.textlength(text, font=text_font)

                if text_width_px <= job_width - 10:
                    text_x = x_start + (job_width - text_width_px) / 2
                    text_y = y_pos - 10 if job_height >= 30 else y_pos - 7

                    draw.text((text_x, text_y), text, fill=text_color, font=text_font)
                    if job['status'] in ('started', 'completed'):
                        icon_color = status_color_map.get(job['status'], text_color)
                        draw.ellipse((text_x-20, text_y+0, text_x-6, text_y+14), fill=hex_to_rgb(icon_color), outline=text_color, width=2)

            # === НОВЫЙ КОД ДЛЯ ОТОБРАЖЕНИЯ ТИРАЖА ===
            if job_height >= 40:  # Только если высота блока позволяет
                # Получаем информацию о тираже заказа
                order_quantity = get_order_quantity(job['order_id'])

                if order_quantity and order_quantity > 0:
                    quantity_text = f"{order_quantity} шт."
                    quantity_font = font_medium

                    # Рассчитываем ширину текста тиража
                    quantity_width_px = draw.textlength(quantity_text, font=quantity_font)

                    # Проверяем, помещается ли текст тиража
                    if quantity_width_px <= job_width - 10:
                        # Позиционируем текст тиража под названием заказа
                        quantity_x = x_start + (job_width - quantity_width_px) / 2
                        quantity_y = y_pos + 5 if job_height >= 50 else y_pos + 2

                        draw.text((quantity_x, quantity_y), quantity_text,
                                  fill=text_color, font=quantity_font)

    chart_end_date = get_chart_end_date()
    # вычисляем размеры диаграммы
    total_chart_width, total_virtual_hours = calc_total_chart_width()
    total_chart_height = calc_total_chart_height(len(equipment_data))

    image = Image.new('RGB', (total_chart_width, total_chart_height), color='#1F2937' if is_dark else 'white')
    draw = ImageDraw.Draw(image)

    viewport_width = total_chart_width
    viewport_height = min(total_chart_height + margin / 2, 800)

    # Рисуем заголовок с указанием даты начала
    title = f"График загрузки - { {'year': 'на год', 'month': 'на месяц', 'week': 'на неделю'}[view_mode]} " \
            f"(с {chart_start_date.strftime('%d.%m.%Y')})"
    draw.text((margin, 10), title, fill='white' if is_dark else 'black', font=font_large)

    # Создаем метаданные дней для позиционирования
    day_metadata = create_metadata_for_days()
    # Рисуем сетку дней
    draw_chart_days_grid(draw, day_metadata)
    # Рисуем строки по оборудованию
    draw_chart_equipment_rows(draw, day_metadata, 'white' if is_dark else 'black')
    # отрисовываем работы
    draw_chart_jobs(draw)
    # Рисуем линии дней поверх работ
    draw_chart_days_lines(draw, day_metadata)
    return [image, jobs_info]


def lighten_color(color, factor=0.3):
    """Осветляет цвет, добавляя белого"""
    r, g, b = color
    return (
        min(255, int(r + (255 - r) * factor)),
        min(255, int(g + (255 - g) * factor)),
        min(255, int(b + (255 - b) * factor))
    )


def darken_color(color, factor=0.3):
    """Затемняет цвет, уменьшая его яркость"""
    r, g, b = color
    return (
        max(0, int(r * (1 - factor))),
        max(0, int(g * (1 - factor))),
        max(0, int(b * (1 - factor)))
    )


def draw_rounded_rectangle(draw, xy, radius=5, fill=None, outline=None, width=1):
    """Рисует прямоугольник со скругленными углами"""
    x1, y1, x2, y2 = xy

    if (x2 - radius) <= (x1 + radius):
        pass

    # Основной прямоугольник (без углов)
    draw.rectangle([x1 + radius, y1, x2 - radius, y2], fill=fill, outline=None)
    draw.rectangle([x1, y1 + radius, x2, y2 - radius], fill=fill, outline=None)

    # Углы - рисуем круги в каждом углу
    # if radius > 0:
    #     draw.ellipse([x1, y1, x1 + radius * 2, y1 + radius * 2], fill=fill, outline=None)
    #     draw.ellipse([x2 - radius * 2, y1, x2, y1 + radius * 2], fill=fill, outline=None)
    #     draw.ellipse([x1, y2 - radius * 2, x1 + radius * 2, y2], fill=fill, outline=None)
    #     draw.ellipse([x2 - radius * 2, y2 - radius * 2, x2, y2], fill=fill, outline=None)

    # Обводка (если нужна)
    if outline and width > 0:
        # Вертикальные линии
        draw.line([x1, y1 + radius, x1, y2 - radius], fill=outline, width=width)
        draw.line([x2, y1 + radius, x2, y2 - radius], fill=outline, width=width)

        # Горизонтальные линии
        draw.line([x1 + radius, y1, x2 - radius, y1], fill=outline, width=width)
        draw.line([x1 + radius, y2, x2 - radius, y2], fill=outline, width=width)

        # Дуги в углах
        # draw.arc([x1, y1, x1 + corrected_radius * 2, y1 + corrected_radius * 2], 180, 270, fill=outline, width=width)
        # draw.arc([x2 - corrected_radius * 2, y1, x2, y1 + corrected_radius * 2], 270, 360, fill=outline, width=width)
        # draw.arc([x1, y2 - corrected_radius * 2, x1 + corrected_radius * 2, y2], 90, 180, fill=outline, width=width)
        # draw.arc([x2 - corrected_radius * 2, y2 - corrected_radius * 2, x2, y2], 0, 90, fill=outline, width=width)


def draw_dotted_line(draw, xy, fill, width=1, dot_interval=5):
    """Рисует точечную линию"""
    x1, y1, x2, y2 = xy

    # Вычисляем длину линии
    line_length = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5

    # Количество точек
    num_dots = int(line_length / dot_interval)

    for i in range(num_dots):
        ratio = i * dot_interval / line_length
        x = x1 + (x2 - x1) * ratio
        y = y1 + (y2 - y1) * ratio

        # Рисуем точку как маленький прямоугольник
        dot_size = width
        draw.rectangle(
            [x - dot_size // 2, y - dot_size // 2, x + dot_size // 2, y + dot_size // 2],
            fill=fill
        )


def hex_to_rgb(hex_color):
    """
    Преобразует HEX цвет в RGB tuple
    Пример: "#FF0000" → (255, 0, 0)
    """
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 6:
        return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))
    elif len(hex_color) == 3:
        return tuple(int(hex_color[i:i + 1] * 2, 16) for i in (0, 1, 2))
    else:
        raise ValueError(f"Неверный формат HEX цвета: {hex_color}")


def rgb_to_hex(rgb):
    """
    Преобразует RGB tuple в HEX цвет
    Пример: (255, 0, 0) → "#FF0000"
    """
    return '#{:02x}{:02x}{:02x}'.format(*rgb).upper()


def load_fonts_for_deployment():
    """Функция для загрузки шрифтов в deployment среде"""
    # Пробуем загрузить из папки fonts
    font_path = "./fonts/arial.ttf"
    bold_font_path = "./fonts/arialbd.ttf"
    if os.path.exists(font_path):
        return (
            ImageFont.truetype(font_path, 10),
            ImageFont.truetype(font_path, 12),
            ImageFont.truetype(bold_font_path, 14)
        )


def get_contrast_text_color(hex_color):
    """
    Определяет контрастный цвет текста (черный или белый) на основе фона в формате HEX

    Args:
        hex_color (str): Цвет фона в формате HEX (например, "#FFFFFF" или "FF0000")

    Returns:
        str: "#000000" для черного текста или "#FFFFFF" для белого текста
    """
    # Убираем символ # если есть
    r, g, b = hex_to_rgb(hex_color)
    # Вычисляем относительную яркость (формула W3C)
    luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    # Возвращаем черный для светлых фонов, белый для темных
    return "#000000" if luminance > 0.5 else "#FFFFFF"
