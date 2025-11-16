import database as db
from sqlmodel import select, func
from models import Order, Job


class OrderManager:
    def __init__(self):
        pass

    def get_all_data(self):
        """Возвращает все данные заказов из БД"""
        try:
            orders = db.get_all_orders()

            # Преобразуем объекты в словари для JSON
            orders_data = [self._order_to_dict(order) for order in orders]

            return {
                'orders': sorted(orders_data, key=lambda x: x['priority_order'])
            }
        except Exception as e:
            print(f"Ошибка получения данных заказов из БД: {e}")
            return {'orders': []}

    def get_order(self, order_id):
        """Получает работу по ID"""
        try:
            order = db.get_order_by_id(order_id)
            if order:
                return {'success': True, 'order': self._order_to_dict(order)}
            else:
                return {'success': False, 'error': 'Order not found'}
        except Exception as e:
            print(f"Ошибка получения заказа: {e}")
            return {'success': False, 'error': str(e)}

    def _order_to_dict(self, order_obj):
        """Преобразует объект заказа в словарь"""
        # Получаем количество работ и информацию о статусах
        jobs_info = self._get_jobs_info_for_order(order_obj.id)

        return {
            'id': order_obj.id,
            'name': order_obj.name,
            'color': order_obj.color,
            'quantity': order_obj.quantity,
            'priority_order': order_obj.priority_order,
            'jobs_count': jobs_info['count'],
            'stage': jobs_info['stage']  # Добавляем информацию о этапе
        }

    def _get_jobs_info_for_order(self, order_id):
        """Получает информацию о работах для заказа (количество и этап)"""
        try:
            with db.get_session() as session:
                # Получаем все работы заказа
                statement = select(Job).where(Job.order_id == order_id)
                jobs = session.exec(statement).all()

                jobs_count = len(jobs)

                # Определяем этап заказа
                if jobs_count == 0:
                    stage = "запланирован"
                else:
                    # Проверяем статусы работ
                    has_started = any(job.status == "started" for job in jobs)
                    all_completed = all(job.status == "completed" for job in jobs)

                    if all_completed:
                        stage = "завершён"
                    elif has_started:
                        stage = "в производстве"
                    else:
                        stage = "запланирован"

                return {
                    'count': jobs_count,
                    'stage': stage
                }

        except Exception as e:
            print(f"Ошибка получения информации о работах для заказа {order_id}: {e}")
            return {'count': 0, 'stage': 'запланирован'}

    def _get_jobs_count_for_order(self, order_id):
        """Получает количество работ для заказа"""
        try:
            # Импортируем здесь чтобы избежать циклических импортов
            with db.get_session() as session:
                statement = select(func.count()).select_from(Job).where(Job.order_id == order_id)
                count = session.exec(statement).one()
                return count
        except Exception as e:
            print(f"Ошибка получения количества работ для заказа {order_id}: {e}")
            return 0

    def get_next_priority_order(self):
        """Генерирует следующий порядковый номер для приоритета"""
        try:
            orders = db.get_all_orders()
            return max([o.priority_order for o in orders], default=0) + 1
        except Exception as e:
            print(f"Ошибка получения порядка приоритета: {e}")
            return 1

    def add_order(self, name, color, quantity=1):
        """Добавляет новый заказ в БД"""
        try:
            priority_order = self.get_next_priority_order()

            order_data = {
                'name': name.strip(),
                'color': color,
                'quantity': quantity,
                'priority_order': priority_order
            }

            new_order = db.create_order(order_data)
            return {'success': True, 'order': self._order_to_dict(new_order)}

        except Exception as e:
            print(f"Ошибка добавления заказа в БД: {e}")
            return {'success': False, 'error': str(e)}

    def update_order(self, order_id, data):
        """Обновляет заказ в БД"""
        try:
            result = db.update_order(order_id, data)
            if result:
                return {'success': True, 'order': self._order_to_dict(result)}
            else:
                return {'success': False, 'error': 'Order not found'}
        except Exception as e:
            print(f"Ошибка обновления заказа в БД: {e}")
            return {'success': False, 'error': str(e)}

    def delete_order(self, order_id):
        """Удаляет заказ из БД"""
        try:
            # Проверяем, есть ли связанные работы через отдельный запрос
            jobs_count = self._get_jobs_count_for_order(order_id)
            if jobs_count > 0:
                return {
                    'success': False,
                    'error': f'Нельзя удалить заказ: связано {jobs_count} работ'
                }

            # Удаляем заказ напрямую через сессию
            with db.get_session() as session:
                order = session.get(Order, order_id)
                if order:
                    session.delete(order)
                    session.commit()
                    return {'success': True}
                else:
                    return {'success': False, 'error': 'Order not found'}

        except Exception as e:
            print(f"Ошибка удаления заказа из БД: {e}")
            return {'success': False, 'error': str(e)}

    def move_order(self, order_id, direction):
        """Перемещает заказ вверх или вниз по приоритету"""
        try:
            orders = db.get_all_orders()
            sorted_orders = sorted(orders, key=lambda x: x.priority_order)
            current_index = next((i for i, o in enumerate(sorted_orders) if o.id == order_id), -1)

            if current_index == -1:
                return {'success': False, 'error': 'Order not found'}

            if direction == 'up' and current_index > 0:
                target_order = sorted_orders[current_index - 1]
                # Меняем порядок местами в БД
                db.update_order(order_id, {'priority_order': target_order.priority_order})
                db.update_order(target_order.id, {'priority_order': sorted_orders[current_index].priority_order})

            elif direction == 'down' and current_index < len(sorted_orders) - 1:
                target_order = sorted_orders[current_index + 1]
                # Меняем порядок местами в БД
                db.update_order(order_id, {'priority_order': target_order.priority_order})
                db.update_order(target_order.id, {'priority_order': sorted_orders[current_index].priority_order})

            else:
                return {'success': False, 'error': 'Invalid move'}

            # Возвращаем обновленные данные
            updated_orders = sorted(db.get_all_orders(), key=lambda x: x.priority_order)
            orders_data = [self._order_to_dict(o) for o in updated_orders]
            return {'success': True, 'orders': orders_data}

        except Exception as e:
            print(f"Ошибка перемещения заказа в БД: {e}")
            return {'success': False, 'error': str(e)}

    def get_orders_list(self):
        """Получает упрощенный список заказов для выпадающего списка"""
        try:
            orders = db.get_all_orders()
            orders_list = [{'id': order.id, 'name': order.name} for order in orders]
            return {'success': True, 'orders': orders_list}
        except Exception as e:
            print(f"Ошибка получения списка заказов: {e}")
            return {'success': False, 'error': str(e)}
