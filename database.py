from sqlmodel import create_engine, Session, select
from models import *
import os
import zipfile
import shutil
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Для Supabase
if os.environ.get("SUPABASE_DB_URL"):
    DATABASE_URL = os.environ.get("SUPABASE_DB_URL", "sqlite:///production.db")
else:
    DATABASE_URL = "sqlite:///production.db"

engine = create_engine(DATABASE_URL, echo=False)

print(DATABASE_URL)

def create_db_and_tables():
    """Создает все таблицы в правильном порядке"""
    try:
        # Импортируем модели в правильном порядке
        from models import (
            EquipmentType, Equipment, Order,  # Базовые таблицы
            Calendar, Job,  # Зависимые таблицы
            HistoryVersion, JobHistory  # Таблицы истории
        )

        # Создаем таблицы в правильном порядке
        SQLModel.metadata.create_all(engine)
        print("✅ Все таблицы созданы успешно")

        # Инициализируем начальные данные
        init_default_data()

    except Exception as e:
        print(f"❌ Ошибка при создании таблиц: {e}")
        raise


def init_default_data():
    """Инициализирует начальные данные"""
    with get_session() as session:
        from sqlmodel import select
        from models import HistoryVersion, EquipmentType

        # Проверяем и создаем запись управления версиями если её нет
        version = session.exec(select(HistoryVersion).where(HistoryVersion.id == 1)).first()
        if not version:
            version = HistoryVersion(
                id=1,
                current_version=0,
                max_version=0,
                max_history_depth=50
            )
            session.add(version)

        session.commit()
        print("✅ Инициализированы начальные данные")


def get_session():
    return Session(engine)


# Функции для работы с заказами
def get_all_orders():
    with get_session() as session:
        return session.exec(select(Order).order_by(Order.priority_order)).all()


def create_order(order_data):
    with get_session() as session:
        order = Order(**order_data)
        session.add(order)
        session.commit()
        session.refresh(order)
        return order


def update_order(order_id, update_data):
    with get_session() as session:
        order = session.get(Order, order_id)
        if order:
            for key, value in update_data.items():
                setattr(order, key, value)
            session.commit()
            session.refresh(order)
            return order
        return None


# Функции для работы с работами
def get_all_jobs_with_details():
    with get_session() as session:
        statement = select(Job, Order, Equipment).join(Order).join(Equipment)
        results = session.exec(statement)
        jobs_with_details = []
        for job, order, equipment in results:
            job_dict = {
                'id': job.id,
                'order_id': job.order_id,
                'equipment_id': job.equipment_id,
                'duration_hours': job.duration_hours,
                'hour_offset': job.hour_offset,
                'start_date': job.start_date,
                'status': job.status,
                'is_locked': job.is_locked,
                'order_name': order.name,
                'order_color': order.color,
                'equipment_name': equipment.name,
                'equipment_type_id': equipment.type_id
            }
            jobs_with_details.append(job_dict)
        return jobs_with_details


def create_job(job_data):
    with get_session() as session:
        job = Job(**job_data)
        session.add(job)
        session.commit()
        session.refresh(job)
        return job


def update_job(job_id, update_data):
    with get_session() as session:
        job = session.get(Job, job_id)
        if job:
            for key, value in update_data.items():
                setattr(job, key, value)
            session.commit()
            session.refresh(job)
            return job
        return None


def delete_job(job_id):
    with get_session() as session:
        job = session.get(Job, job_id)
        if job:
            session.delete(job)
            session.commit()
            return True
        return False


def get_job_by_id(job_id):
    with get_session() as session:
        return session.get(Job, job_id)


def get_previous_job_by_id(job_id):
    with get_session() as session:

        current_job = session.get(Job, job_id)

        equipment_id = current_job.equipment_id
        current_start_date = current_job.start_date
        current_offset = current_job.hour_offset or 0

        # Находим предыдущую работу
        statement = select(Job).where(
            Job.equipment_id == equipment_id,
            Job.id != job_id,
            (
                    (Job.start_date < current_start_date) |
                    (
                            (Job.start_date == current_start_date) &
                            (Job.hour_offset < current_offset)
                    )
            )
        ).order_by(Job.start_date.desc(), Job.hour_offset.desc()).limit(1)
        return session.exec(statement).first()


def get_next_job_by_id(job_id):
    with get_session() as session:

        current_job = session.get(Job, job_id)

        equipment_id = current_job.equipment_id
        current_start_date = current_job.start_date
        current_offset = current_job.hour_offset or 0

        # Находим предыдущую работу
        statement = select(Job).where(
            Job.equipment_id == equipment_id,
            Job.id != job_id,
            (
                    (Job.start_date > current_start_date) |
                    (
                            (Job.start_date == current_start_date) &
                            (Job.hour_offset > current_offset)
                    )
            )
        ).order_by(Job.start_date, Job.hour_offset).limit(1)
        return session.exec(statement).first()


# Функции для работы с оборудованием
def get_all_equipment():
    with get_session() as session:
        statement = select(Equipment, EquipmentType).join(EquipmentType)
        results = session.exec(statement)
        return [eq.Equipment for eq in results.all()]


def create_equipment(equipment_data):
    with get_session() as session:
        equipment = Equipment(**equipment_data)
        session.add(equipment)
        session.commit()
        session.refresh(equipment)
        return equipment


def update_equipment(equipment_id, update_data):
    with get_session() as session:
        equipment = session.get(Equipment, equipment_id)
        for key, value in update_data.items():
            setattr(equipment, key, value)
        session.commit()
        session.refresh(equipment)
        return equipment


def delete_equipment(equipment_id):
    with get_session() as session:
        equipment = session.get(Equipment, equipment_id)
        session.delete(equipment)
        session.commit()


def get_equipment_by_id(equipment_id):
    with get_session() as session:
        return session.get(Equipment, equipment_id)


def get_jobs_count_by_equipment_id(equipment_id):
    with get_session() as session:
        return len(session.exec(select(Job).where(Job.equipment_id == equipment_id)).all())


# Функции для работы с типами оборудования
def get_all_equipment_types():
    with get_session() as session:
        return session.exec(select(EquipmentType).order_by(EquipmentType.sort_order)).all()


def create_equipment_type(type_data):
    with get_session() as session:
        equipment_type = EquipmentType(**type_data)
        session.add(equipment_type)
        session.commit()
        session.refresh(equipment_type)
        return equipment_type


def update_equipment_type(type_id, update_data):
    with get_session() as session:
        equipment_type = session.get(EquipmentType, type_id)
        for key, value in update_data.items():
            setattr(equipment_type, key, value)
        session.commit()
        session.refresh(equipment_type)
        return equipment_type


def delete_equipment_type(type_id):
    with get_session() as session:
        equipment_type = session.get(EquipmentType, type_id)
        session.delete(equipment_type)
        session.commit()


def get_order_by_id(order_id):
    with get_session() as session:
        return session.get(Order, order_id)


# Добавим функции для работы с календарем
def get_calendar_by_date(date_str):
    with get_session() as session:
        return session.exec(select(Calendar).where(Calendar.date == date_str)).first()


def create_calendar(calendar_data):
    with get_session() as session:
        calendar = Calendar(**calendar_data)
        session.add(calendar)
        session.commit()
        session.refresh(calendar)
        return calendar


def update_calendar(date_str, work_hours):
    with get_session() as session:
        calendar = get_calendar_by_date(date_str)
        if calendar:
            calendar.work_hours = work_hours
            session.commit()
            session.refresh(calendar)
            return calendar
        else:
            return create_calendar({'date': date_str, 'work_hours': work_hours})


# Функции для работы с бэкапами
def create_backup():
    if not DATABASE_URL.startswith('sqlite'):
        return
    """Создает резервную копию базы данных в zip-архиве"""
    try:
        # Создаем папку для бэкапов если её нет
        backup_dir = Path("backups")
        backup_dir.mkdir(exist_ok=True)

        # Генерируем имя файла с timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"production_backup_{timestamp}.zip"
        backup_path = backup_dir / backup_filename

        # Создаем zip-архив с базой данных
        with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            if os.path.exists("production.db"):
                zipf.write("production.db", "production.db")

            # Можно добавить другие файлы если нужно
            # if os.path.exists("config.json"):
            #     zipf.write("config.json", "config.json")

        return str(backup_path), backup_filename
    except Exception as e:
        print(f"Ошибка создания бэкапа: {e}")
        return None, None


def restore_backup(backup_file_path):
    if not DATABASE_URL.startswith('sqlite'):
        return
    """Восстанавливает базу данных из zip-архива"""
    try:
        # Создаем временную папку для распаковки
        temp_dir = Path("temp_restore")
        temp_dir.mkdir(exist_ok=True)

        # Распаковываем архив
        with zipfile.ZipFile(backup_file_path, 'r') as zipf:
            zipf.extractall(temp_dir)

        # Проверяем наличие файла БД в архиве
        db_path = temp_dir / "production.db"
        if not db_path.exists():
            # Ищем любой .db файл
            db_files = list(temp_dir.glob("*.db"))
            if not db_files:
                raise Exception("В архиве не найдена база данных")
            db_path = db_files[0]

        # Закрываем все соединения с БД перед восстановлением
        import sqlite3
        sqlite3.connect('production.db').close()

        # Создаем резервную копию текущей БД на случай ошибки
        if os.path.exists("production.db"):
            shutil.copy2("production.db", "production.db.backup")

        # Заменяем текущую БД
        shutil.copy2(db_path, "production.db")

        # Очищаем временные файлы
        shutil.rmtree(temp_dir)
        if os.path.exists("production.db.backup"):
            os.remove("production.db.backup")

        return True
    except Exception as e:
        # Восстанавливаем из backup если что-то пошло не так
        if os.path.exists("production.db.backup"):
            shutil.copy2("production.db.backup", "production.db")
            os.remove("production.db.backup")

        # Очищаем временные файлы
        if temp_dir.exists():
            shutil.rmtree(temp_dir)

        print(f"Ошибка восстановления бэкапа: {e}")
        return False


def get_backup_files():
    if not DATABASE_URL.startswith('sqlite'):
        return
    """Возвращает список доступных бэкапов включая загруженные"""
    backup_dir = Path("backups")
    if not backup_dir.exists():
        return []

    backup_files = []

    # Ищем все zip файлы в папке backups
    for file_path in backup_dir.glob("*.zip"):
        try:
            stat = file_path.stat()
            backup_files.append({
                'filename': file_path.name,
                'path': str(file_path),
                'size': stat.st_size,
                'created': datetime.fromtimestamp(stat.st_ctime)
            })
        except Exception as e:
            print(f"Ошибка обработки файла {file_path}: {e}")
            continue

    # Сортируем по дате создания (новые сначала)
    backup_files.sort(key=lambda x: x['created'], reverse=True)
    return backup_files


def init_backup_dirs():
    if not DATABASE_URL.startswith('sqlite'):
        return
    """Создает необходимые папки для бэкапов при запуске приложения"""
    directories = ["backups", "temp_upload", "temp_restore"]

    for directory in directories:
        try:
            os.makedirs(directory, exist_ok=True)
            print(f"Папка {directory} создана или уже существует")
        except Exception as e:
            print(f"Ошибка создания папки {directory}: {e}")
