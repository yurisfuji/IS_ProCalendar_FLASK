import database as db
from models import Calendar
from datetime import datetime, date, timedelta
from sqlmodel import select
import calendar as cal_lib


class CalendarManager:
    def __init__(self):
        pass

    def get_month_data(self, year_month):
        """Получает данные календаря для указанного месяца"""
        try:
            year, month = map(int, year_month.split('-'))

            # Получаем все даты месяца
            month_dates = self._get_dates_in_month(year, month)

            # Получаем существующие записи из БД
            existing_records = self._get_existing_records(month_dates)

            # Формируем результат
            result = []
            for day_date in month_dates:
                date_str = day_date.isoformat()
                record = existing_records.get(date_str)

                if record:
                    work_hours = record.work_hours
                else:
                    # ИСПРАВЛЕНИЕ: Любой день без записи - рабочий 8 часов
                    work_hours = 8

                result.append({
                    'date': date_str,
                    'work_hours': work_hours,
                    'day_of_week': day_date.weekday(),
                    'day_name': ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][day_date.weekday()],
                    'is_weekend': day_date.weekday() >= 5  # Только для визуального отличия, не влияет на часы
                })

            return {'success': True, 'days': result}

        except Exception as e:
            print(f"Ошибка получения данных месяца: {e}")
            return {'success': False, 'error': str(e)}

    def get_date_data(self, date_str):
        """Получает данные для конкретной даты"""
        try:
            with db.get_session() as session:
                statement = select(Calendar).where(Calendar.date == date_str)
                record = session.exec(statement).first()

                if record:
                    return {'success': True, 'work_hours': record.work_hours}
                else:
                    # ИСПРАВЛЕНИЕ: Любой день без записи - рабочий 8 часов
                    return {'success': True, 'work_hours': 8}

        except Exception as e:
            print(f"Ошибка получения данных даты: {e}")
            return {'success': False, 'error': str(e)}

    def set_date_data(self, date_str, work_hours):
        """Устанавливает рабочие часы для даты"""
        try:
            # Проверяем валидность значения
            valid_hours = [0, 8, 12, 24]
            if work_hours not in valid_hours:
                return {'success': False, 'error': f'Недопустимое значение часов. Допустимо: {valid_hours}'}

            with db.get_session() as session:
                # Проверяем существующую запись
                statement = select(Calendar).where(Calendar.date == date_str)
                existing_record = session.exec(statement).first()

                if existing_record:
                    # Обновляем существующую запись
                    existing_record.work_hours = work_hours
                    session.add(existing_record)
                else:
                    # Создаем новую запись
                    new_record = Calendar(date=date_str, work_hours=work_hours)
                    session.add(new_record)

                session.commit()

                return {'success': True, 'work_hours': work_hours}

        except Exception as e:
            print(f"Ошибка установки данных даты: {e}")
            return {'success': False, 'error': str(e)}

    def set_sundays_off(self, year_month):
        """Устанавливает все воскресенья месяца как выходные"""
        try:
            year, month = map(int, year_month.split('-'))
            sundays = self._get_sundays_in_month(year, month)

            for sunday in sundays:
                self.set_date_data(sunday.isoformat(), 0)

            return {'success': True, 'updated_dates': len(sundays)}

        except Exception as e:
            print(f"Ошибка установки воскресений как выходных: {e}")
            return {'success': False, 'error': str(e)}

    def set_saturdays_off(self, year_month):
        """Устанавливает все субботы месяца как выходные"""
        try:
            year, month = map(int, year_month.split('-'))
            saturdays = self._get_saturdays_in_month(year, month)

            for saturday in saturdays:
                self.set_date_data(saturday.isoformat(), 0)

            return {'success': True, 'updated_dates': len(saturdays)}

        except Exception as e:
            print(f"Ошибка установки суббот как выходных: {e}")
            return {'success': False, 'error': str(e)}

    def set_all_8hours(self, year_month):
        """Устанавливает все дни месяца как рабочие по 8 часов (удаляет кастомные настройки)"""
        try:
            year, month = map(int, year_month.split('-'))
            month_dates = self._get_dates_in_month(year, month)

            # Удаляем все записи для этого месяца
            deleted_count = self._delete_month_records(year_month)

            return {'success': True, 'deleted_records': deleted_count}

        except Exception as e:
            print(f"Ошибка установки всех дней по 8 часов: {e}")
            return {'success': False, 'error': str(e)}

    def _get_dates_in_month(self, year, month):
        """Возвращает все даты указанного месяца"""
        _, num_days = cal_lib.monthrange(year, month)
        dates = []
        for day in range(1, num_days + 1):
            dates.append(date(year, month, day))
        return dates

    def _get_existing_records(self, dates):
        """Получает существующие записи календаря для указанных дат"""
        try:
            date_strings = [d.isoformat() for d in dates]

            with db.get_session() as session:
                statement = select(Calendar).where(Calendar.date.in_(date_strings))
                records = session.exec(statement).all()

                return {record.date: record for record in records}

        except Exception as e:
            print(f"Ошибка получения существующих записей: {e}")
            return {}

    def _get_sundays_in_month(self, year, month):
        """Возвращает все воскресенья месяца"""
        dates = self._get_dates_in_month(year, month)
        return [d for d in dates if d.weekday() == 6]

    def _get_saturdays_in_month(self, year, month):
        """Возвращает все субботы месяца"""
        dates = self._get_dates_in_month(year, month)
        return [d for d in dates if d.weekday() == 5]

    def _delete_month_records(self, year_month):
        """Удаляет все записи календаря для указанного месяца"""
        try:
            year, month = map(int, year_month.split('-'))
            start_date = date(year, month, 1)
            next_month = month + 1 if month < 12 else 1
            next_year = year if month < 12 else year + 1
            end_date = date(next_year, next_month, 1) - timedelta(days=1)

            with db.get_session() as session:
                statement = select(Calendar).where(
                    Calendar.date >= start_date.isoformat(),
                    Calendar.date <= end_date.isoformat()
                )
                records = session.exec(statement).all()

                for record in records:
                    session.delete(record)

                session.commit()
                return len(records)

        except Exception as e:
            print(f"Ошибка удаления записей месяца: {e}")
            return 0