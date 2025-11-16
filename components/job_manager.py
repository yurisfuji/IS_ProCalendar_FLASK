import database as db
from models import Job


class JobManager:
    def __init__(self):
        pass

    def _job_to_dict(self, job_obj):
        """Преобразует объект работы в словарь"""
        if not job_obj:
            return None

        return {
            'id': job_obj.id,
            'order_id': job_obj.order_id,
            'equipment_id': job_obj.equipment_id,
            'duration_hours': job_obj.duration_hours,
            'hour_offset': job_obj.hour_offset,
            'start_date': job_obj.start_date,
            'status': job_obj.status,
            'is_locked': job_obj.is_locked
        }

    def get_all_data(self):
        """Возвращает все данные работ из БД"""
        try:
            jobs_with_details = db.get_all_jobs_with_details()
            return {
                'jobs': sorted(jobs_with_details, key=lambda x: x['start_date'])
            }
        except Exception as e:
            print(f"Ошибка получения данных работ из БД: {e}")
            return {'jobs': []}

    def add_job(self, order_id, equipment_id, duration_hours, hour_offset, start_date, status="planned"):
        """Добавляет новую работу в БД"""
        print("2222")
        try:
            job_data = {
                'order_id': order_id,
                'equipment_id': equipment_id,
                'duration_hours': duration_hours,
                'hour_offset': hour_offset,
                'start_date': start_date,
                'status': status,
                'is_locked': False
            }

            new_job = db.create_job(job_data)
            return {'success': True, 'job': self._job_to_dict(new_job)}

        except Exception as e:
            print(f"Ошибка добавления работы в БД: {e}")
            return {'success': False, 'error': str(e)}

    def update_job(self, job_id, data):
        """Обновляет работу в БД"""
        try:
            # Преобразуем boolean для is_locked
            if 'is_locked' in data:
                data['is_locked'] = bool(data['is_locked'])

            result = db.update_job(job_id, data)
            if result:
                return {'success': True, 'job': self._job_to_dict(result)}
            else:
                return {'success': False, 'error': 'Job not found'}
        except Exception as e:
            print(f"Ошибка обновления работы в БД: {e}")
            return {'success': False, 'error': str(e)}

    def delete_job(self, job_id):
        """Удаляет работу из БД"""
        try:
            result = db.delete_job(job_id)
            if result:
                return {'success': True}
            else:
                return {'success': False, 'error': 'Job not found'}
        except Exception as e:
            print(f"Ошибка удаления работы из БД: {e}")
            return {'success': False, 'error': str(e)}

    def change_job_status(self, job_id, new_status):
        """Изменяет статус работы"""
        try:
            result = db.update_job(job_id, {'status': new_status})
            if result:
                return {'success': True, 'job': self._job_to_dict(result)}
            else:
                return {'success': False, 'error': 'Job not found'}
        except Exception as e:
            print(f"Ошибка изменения статуса работы: {e}")
            return {'success': False, 'error': str(e)}

    def get_job(self, job_id):
        """Получает работу по ID"""
        try:
            job = db.get_job_by_id(job_id)
            if job:
                return {'success': True, 'job': self._job_to_dict(job)}
            else:
                return {'success': False, 'error': 'Job not found'}
        except Exception as e:
            print(f"Ошибка получения работы: {e}")
            return {'success': False, 'error': str(e)}