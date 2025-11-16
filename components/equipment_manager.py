import database as db


class EquipmentManager:
    def __init__(self):
        # Больше не используем заглушку, работаем напрямую с БД
        pass

    def get_all_data(self):
        """Возвращает все данные оборудования из БД"""
        try:
            types = db.get_all_equipment_types()
            equipment = db.get_all_equipment()

            # Преобразуем объекты в словари для JSON
            types_data = [self._type_to_dict(t) for t in types]
            equipment_data = [self._equipment_to_dict(eq) for eq in equipment]

            return {
                'types': sorted(types_data, key=lambda x: x['sort_order']),
                'equipment': sorted(equipment_data, key=lambda x: x['sort_order'])
            }
        except Exception as e:
            print(f"Ошибка получения данных из БД: {e}")
            return {'types': [], 'equipment': []}

    def get_types(self):
        """Возвращает отсортированные типы оборудования из БД"""
        try:
            types = db.get_all_equipment_types()
            return sorted(types, key=lambda x: x.sort_order)
        except Exception as e:
            print(f"Ошибка получения типов из БД: {e}")
            return []

    def get_equipment(self):
        """Возвращает отсортированное оборудование из БД"""
        try:
            equipment = db.get_all_equipment()
            return sorted(equipment, key=lambda x: x.sort_order)
        except Exception as e:
            print(f"Ошибка получения оборудования из БД: {e}")
            return []

    def _type_to_dict(self, type_obj):
        """Преобразует объект типа оборудования в словарь"""
        return {
            'id': type_obj.id,
            'name': type_obj.name,
            'color': type_obj.color,
            'sort_order': type_obj.sort_order
        }

    def _equipment_to_dict(self, equipment_obj):
        """Преобразует объект оборудования в словарь"""
        return {
            'id': equipment_obj.id,
            'name': equipment_obj.name,
            'type_id': equipment_obj.type_id,
            'show_on_chart': equipment_obj.show_on_chart,
            'sort_order': equipment_obj.sort_order
        }

    def get_next_type_id(self):
        """Генерирует следующий ID для типа (теперь из БД)"""
        try:
            types = db.get_all_equipment_types()
            return max([t.id for t in types], default=0) + 1
        except Exception as e:
            print(f"Ошибка получения следующего ID типа: {e}")
            return 1

    def get_next_equipment_id(self):
        """Генерирует следующий ID для оборудования (теперь из БД)"""
        try:
            equipment = db.get_all_equipment()
            return max([eq.id for eq in equipment], default=0) + 1
        except Exception as e:
            print(f"Ошибка получения следующего ID оборудования: {e}")
            return 1

    def get_next_type_sort_order(self):
        """Генерирует следующий порядковый номер для типа из БД"""
        try:
            types = db.get_all_equipment_types()
            return max([t.sort_order for t in types], default=0) + 1
        except Exception as e:
            print(f"Ошибка получения порядка типа: {e}")
            return 1

    def get_next_equipment_sort_order(self):
        """Генерирует следующий порядковый номер для оборудования из БД"""
        try:
            equipment = db.get_all_equipment()
            return max([eq.sort_order for eq in equipment], default=0) + 1
        except Exception as e:
            print(f"Ошибка получения порядка оборудования: {e}")
            return 1

    def add_type(self, name, color):
        """Добавляет новый тип оборудования в БД"""
        try:
            sort_order = self.get_next_type_sort_order()

            type_data = {
                'name': name.strip(),
                'color': color,
                'sort_order': sort_order
            }

            new_type = db.create_equipment_type(type_data)
            return {'success': True, 'type': self._type_to_dict(new_type)}

        except Exception as e:
            print(f"Ошибка добавления типа в БД: {e}")
            return {'success': False, 'error': str(e)}

    def update_type(self, type_id, data):
        """Обновляет тип оборудования в БД"""
        try:
            updated_type = db.update_equipment_type(type_id, data)
            if updated_type:
                return {'success': True, 'type': self._type_to_dict(updated_type)}
            else:
                return {'success': False, 'error': 'Type not found'}

        except Exception as e:
            print(f"Ошибка обновления типа в БД: {e}")
            return {'success': False, 'error': str(e)}

    def delete_type(self, type_id):
        """Удаляет тип оборудования из БД"""
        try:
            # Проверяем, используется ли тип в оборудовании
            equipment = db.get_all_equipment()
            equipment_using_type = [eq for eq in equipment if eq.type_id == type_id]

            if equipment_using_type:
                return {
                    'success': False,
                    'error': f'Тип используется {len(equipment_using_type)} оборудованием'
                }

            # Проверяем существование типа
            types = db.get_all_equipment_types()
            type_exists = any(t.id == type_id for t in types)

            if not type_exists:
                return {'success': False, 'error': 'Type not found'}

            # Вызываем метод удаления типа
            db.delete_equipment_type(type_id)

            # Проверяем, действительно ли тип удален
            types_after = db.get_all_equipment_types()
            still_exists = any(t.id == type_id for t in types_after)

            if still_exists:
                return {'success': False, 'error': 'Failed to delete type'}
            else:
                return {'success': True}

        except Exception as e:
            print(f"Ошибка удаления типа из БД: {e}")
            return {'success': False, 'error': str(e)}

    def move_type(self, type_id, direction):
        """Перемещает тип вверх или вниз в БД"""
        try:
            types = self.get_types()
            current_index = next((i for i, t in enumerate(types) if t.id == type_id), -1)

            if current_index == -1:
                return {'success': False, 'error': 'Type not found'}

            if direction == 'up' and current_index > 0:
                target_type = types[current_index - 1]
                # Меняем порядок местами в БД
                db.update_equipment_type(type_id, {'sort_order': target_type.sort_order})
                db.update_equipment_type(target_type.id, {'sort_order': types[current_index].sort_order})

            elif direction == 'down' and current_index < len(types) - 1:
                target_type = types[current_index + 1]
                # Меняем порядок местами в БД
                db.update_equipment_type(type_id, {'sort_order': target_type.sort_order})
                db.update_equipment_type(target_type.id, {'sort_order': types[current_index].sort_order})

            else:
                return {'success': False, 'error': 'Invalid move'}

            # Возвращаем обновленные данные
            updated_types = self.get_types()
            types_data = [self._type_to_dict(t) for t in updated_types]
            return {'success': True, 'types': types_data}

        except Exception as e:
            print(f"Ошибка перемещения типа в БД: {e}")
            return {'success': False, 'error': str(e)}

    def add_equipment(self, name, type_id, show_on_chart=True):
        """Добавляет новое оборудование в БД"""
        try:
            # Проверяем существование типа
            type_exists = self.get_type_by_id(type_id)
            if not type_exists:
                return {'success': False, 'error': 'Type not found'}

            sort_order = self.get_next_equipment_sort_order()

            equipment_data = {
                'name': name.strip(),
                'type_id': type_id,
                'show_on_chart': show_on_chart,
                'sort_order': sort_order
            }

            new_equipment = db.create_equipment(equipment_data)
            return {'success': True, 'equipment': self._equipment_to_dict(new_equipment)}

        except Exception as e:
            print(f"Ошибка добавления оборудования в БД: {e}")
            return {'success': False, 'error': str(e)}

    def update_equipment(self, equipment_id, data):
        """Обновляет оборудование в БД"""
        try:
            # Проверяем тип, если он обновляется
            if 'type_id' in data:
                type_exists = self.get_type_by_id(data['type_id'])
                if not type_exists:
                    return {'success': False, 'error': 'Type not found'}

            updated_equipment = db.update_equipment(equipment_id, data)
            if updated_equipment:
                return {'success': True, 'equipment': self._equipment_to_dict(updated_equipment)}
            else:
                return {'success': False, 'error': 'Equipment not found'}

        except Exception as e:
            print(f"Ошибка обновления оборудования в БД: {e}")
            return {'success': False, 'error': str(e)}

    def delete_equipment(self, equipment_id):
        """Удаляет оборудование из БД"""
        try:
            # Сначала проверяем существование оборудования
            all_equipment = db.get_all_equipment()
            equipment_exists = any(eq.id == equipment_id for eq in all_equipment)

            if not equipment_exists:
                return {'success': False, 'error': 'Equipment not found'}

            # Вызываем метод удаления из БД
            # Предполагаем, что db.delete_equipment() не возвращает значение при успехе
            # или возвращает True/False
            db.delete_equipment(equipment_id)

            # Проверяем, действительно ли оборудование удалено
            all_equipment_after = db.get_all_equipment()
            still_exists = any(eq.id == equipment_id for eq in all_equipment_after)

            if still_exists:
                return {'success': False, 'error': 'Failed to delete equipment'}
            else:
                return {'success': True}

        except Exception as e:
            print(f"Ошибка удаления оборудования из БД: {e}")
            return {'success': False, 'error': str(e)}

    def toggle_visibility(self, equipment_id):
        """Переключает видимость оборудования на диаграмме в БД"""
        try:
            equipment = self.get_equipment_by_id(equipment_id)
            if not equipment:
                return {'success': False, 'error': 'Equipment not found'}

            new_visibility = not equipment.show_on_chart
            updated_equipment = db.update_equipment(equipment_id, {'show_on_chart': new_visibility})

            if updated_equipment:
                return {'success': True, 'equipment': self._equipment_to_dict(updated_equipment)}
            else:
                return {'success': False, 'error': 'Update failed'}

        except Exception as e:
            print(f"Ошибка переключения видимости в БД: {e}")
            return {'success': False, 'error': str(e)}

    def get_equipment_count_by_type(self, type_id):
        """Возвращает количество оборудования по типу из БД"""
        try:
            equipment = db.get_all_equipment()
            return len([eq for eq in equipment if eq.type_id == type_id])
        except Exception as e:
            print(f"Ошибка получения количества оборудования: {e}")
            return 0

    def get_type_by_id(self, type_id):
        """Возвращает тип по ID из БД"""
        try:
            types = db.get_all_equipment_types()
            return next((t for t in types if t.id == type_id), None)
        except Exception as e:
            print(f"Ошибка получения типа по ID: {e}")
            return None

    def get_equipment_by_id(self, equipment_id):
        """Возвращает оборудование по ID из БД"""
        try:
            equipment = db.get_all_equipment()
            return next((eq for eq in equipment if eq.id == equipment_id), None)
        except Exception as e:
            print(f"Ошибка получения оборудования по ID: {e}")
            return None

    def get_equipment_list(self):
        """Получает упрощенный список оборудования для выпадающего списка"""
        try:
            equipment = db.get_all_equipment()
            equipment_list = [{'id': eq.id, 'name': eq.name} for eq in equipment]
            return {'success': True, 'equipment': equipment_list}
        except Exception as e:
            print(f"Ошибка получения списка оборудования: {e}")
            return {'success': False, 'error': str(e)}

