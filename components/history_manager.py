from sqlmodel import select, func, and_
from database import get_session
from models import JobHistory, HistoryVersion, Job


class HistoryManager:
    def __init__(self):
        pass

    def create_snapshot(self, description: str = None) -> int:
        """
        Создает снимок текущего состояния всех работ
        """
        with get_session() as session:
            try:
                # Получаем или создаем запись управления версиями
                version_stmt = select(HistoryVersion).where(HistoryVersion.id == 1)
                version_record = session.exec(version_stmt).first()

                if not version_record:
                    version_record = HistoryVersion(
                        id=1,
                        current_version=0,
                        max_version=0,
                        max_history_depth=50
                    )
                    session.add(version_record)
                    session.commit()
                    session.refresh(version_record)

                # Увеличиваем максимальную версию
                version_record.max_version += 1
                new_version = version_record.max_version

                # Очищаем старые записи если превышен лимит истории
                self._cleanup_old_history()

                # Сохраняем текущее состояние всех работ
                jobs_stmt = select(Job)
                jobs = session.exec(jobs_stmt).all()

                for job in jobs:
                    history_record = JobHistory(
                        job_id=job.id,
                        version=new_version,
                        order_id=job.order_id,
                        equipment_id=job.equipment_id,
                        duration_hours=job.duration_hours,
                        hour_offset=job.hour_offset,
                        start_date=job.start_date,
                        status=job.status,
                        is_locked=job.is_locked,
                        operation_type='SNAPSHOT',
                        user_action=description
                    )
                    session.add(history_record)

                # Обновляем текущую версию
                version_record.current_version = new_version

                session.commit()
                print(f"✅ Создан снимок истории версии {new_version}")
                return new_version

            except Exception as e:
                session.rollback()
                print(f"❌ Ошибка при создании снимка: {e}")
                return 0

    def _cleanup_old_history(self):
        """Удаляет старые записи истории при превышении лимита"""
        with get_session() as session:
            try:
                version_stmt = select(HistoryVersion).where(HistoryVersion.id == 1)
                version_record = session.exec(version_stmt).first()

                if not version_record:
                    return

                # Рассчитываем минимальную версию для сохранения
                min_version_to_keep = version_record.max_version - version_record.max_history_depth

                if min_version_to_keep > 0:
                    # Удаляем записи старше минимальной версии
                    delete_stmt = JobHistory.__table__.delete().where(
                        JobHistory.version < min_version_to_keep
                    )
                    session.exec(delete_stmt)
                    session.commit()
                    print(f"🧹 Очищена история версий до {min_version_to_keep}")

            except Exception as e:
                print(f"❌ Ошибка очистки старой истории: {e}")

    def get_history_state(self) -> dict:
        """
        Возвращает текущее состояние истории
        """
        with get_session() as session:
            version_stmt = select(HistoryVersion).where(HistoryVersion.id == 1)
            version_record = session.exec(version_stmt).first()

            if not version_record:
                return {
                    'current_version': 0,
                    'max_version': 0,
                    'can_undo': False,
                    'can_redo': False
                }

            can_undo = version_record.current_version > 1
            can_redo = version_record.current_version < version_record.max_version

            return {
                'current_version': version_record.current_version,
                'max_version': version_record.max_version,
                'can_undo': can_undo,
                'can_redo': can_redo
            }

    def undo(self) -> bool:
        """Откатывает изменения на одну версию назад"""
        history_state = self.get_history_state()

        if not history_state['can_undo']:
            print("❌ Невозможно выполнить отмену")
            return False

        target_version = history_state['current_version'] - 1
        return self._restore_to_version(target_version)

    def redo(self) -> bool:
        """Повторяет изменения на одну версию вперед"""
        history_state = self.get_history_state()

        if not history_state['can_redo']:
            print("❌ Невозможно выполнить повтор")
            return False

        target_version = history_state['current_version'] + 1
        return self._restore_to_version(target_version)

    def _restore_to_version(self, target_version: int) -> bool:
        """
        Восстанавливает состояние до указанной версии
        """
        with get_session() as session:
            try:
                print(f"🔄 Восстановление до версии {target_version}")

                # Очищаем текущую таблицу jobs
                delete_stmt = select(Job)
                jobs_to_delete = session.exec(delete_stmt).all()
                for job in jobs_to_delete:
                    session.delete(job)

                # Восстанавливаем состояние на момент целевой версии
                if target_version >= 1:
                    # Находим последние записи для каждой работы на момент целевой версии
                    subquery = (
                        select(
                            JobHistory.job_id,
                            func.max(JobHistory.version).label('max_version')
                        )
                        .where(JobHistory.version <= target_version)
                        .group_by(JobHistory.job_id)
                        .subquery()
                    )

                    # Основной запрос для получения актуальных записей
                    history_stmt = (
                        select(JobHistory)
                        .join(
                            subquery,
                            and_(
                                JobHistory.job_id == subquery.c.job_id,
                                JobHistory.version == subquery.c.max_version
                            )
                        )
                        .where(JobHistory.operation_type != 'DELETE')
                    )

                    history_records = session.exec(history_stmt).all()

                    # Восстанавливаем работы
                    for history_record in history_records:
                        job = Job(
                            id=history_record.job_id,
                            order_id=history_record.order_id,
                            equipment_id=history_record.equipment_id,
                            duration_hours=history_record.duration_hours,
                            hour_offset=history_record.hour_offset,
                            start_date=history_record.start_date,
                            status=history_record.status,
                            is_locked=history_record.is_locked
                        )
                        session.add(job)

                # Обновляем текущую версию
                version_stmt = select(HistoryVersion).where(HistoryVersion.id == 1)
                version_record = session.exec(version_stmt).first()
                version_record.current_version = target_version

                session.commit()
                print(f"✅ Успешно восстановлена версия {target_version}")
                return True

            except Exception as e:
                session.rollback()
                print(f"❌ Ошибка при восстановлении версии {target_version}: {e}")
                return False

    def clear_history(self) -> bool:
        """
        Полностью очищает историю изменений и создает начальный снимок
        """
        try:
            # Очищаем историю в отдельной сессии
            with get_session() as session:
                # Очищаем таблицу истории работ
                session.exec(JobHistory.__table__.delete())

                # Сбрасываем таблицу версий к начальному состоянию
                version_stmt = select(HistoryVersion).where(HistoryVersion.id == 1)
                version_record = session.exec(version_stmt).first()

                if version_record:
                    version_record.current_version = 0
                    version_record.max_version = 0
                else:
                    # Создаем новую запись если её нет
                    version_record = HistoryVersion(
                        id=1,
                        current_version=0,
                        max_version=0,
                        max_history_depth=50
                    )
                    session.add(version_record)

                session.commit()
                print("✅ История изменений полностью очищена")

            # СОЗДАЕМ НАЧАЛЬНЫЙ СНИМОК ПОСЛЕ ОЧИСТКИ В ОТДЕЛЬНОЙ СЕССИИ
            # Это гарантирует, что снимок будет создан после полной очистки
            self.create_snapshot("Начальное состояние после очистки истории")

            return True

        except Exception as e:
            print(f"❌ Ошибка очистки истории: {e}")
            return False
