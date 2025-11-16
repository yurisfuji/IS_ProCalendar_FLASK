from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import date, datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .models import EquipmentType, Order


class EquipmentType(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    sort_order: int = Field(default=0)
    color: str = Field(default="#FF0000")

    equipment: List["Equipment"] = Relationship(back_populates="type")


class Equipment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    sort_order: int = Field(default=0)
    show_on_chart: bool = Field(default=True)
    type_id: int = Field(foreign_key="equipmenttype.id")

    type: EquipmentType = Relationship(back_populates="equipment")
    jobs: List["Job"] = Relationship(back_populates="equipment")


class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    color: str = Field(default="#0000FF")
    quantity: int = Field(default=1)
    priority_order: int = Field(default=0)

    jobs: List["Job"] = Relationship(back_populates="order")


class Job(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id")
    equipment_id: int = Field(foreign_key="equipment.id")
    duration_hours: float = Field(default=8.0)
    hour_offset: float = Field(default=0.0)
    start_date: str  # ISO format date string
    status: str = Field(default="planned")  # planned, started, completed
    is_locked: bool = Field(default=False)

    order: Order = Relationship(back_populates="jobs")
    equipment: Equipment = Relationship(back_populates="jobs")


class Calendar(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: str = Field(unique=True, index=True)  # ISO format
    work_hours: int = Field(default=8)


class SystemSettings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    view_mode: str = Field(default="week")
    pixels_per_hour: int = Field(default=20)
    row_height: int = Field(default=70)
    job_height_ratio: int = Field(default=80)
    chart_start_date: str = Field(default=date.today().isoformat())


class JobHistory(SQLModel, table=True):
    """Модель для хранения истории изменений работ"""
    __tablename__ = "jobs_history"

    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: int = Field(index=True)  # Убрали foreign_key временно
    version: int = Field(index=True)
    order_id: int = Field(index=True)  # Убрали foreign_key
    equipment_id: int = Field(index=True)  # Убрали foreign_key
    duration_hours: float
    hour_offset: float
    start_date: str  # ISO format date
    status: str
    is_locked: bool
    operation_type: str  # 'CREATE', 'UPDATE', 'DELETE', 'SNAPSHOT'
    user_action: Optional[str] = None
    changed_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class HistoryVersion(SQLModel, table=True):
    """Модель для управления версиями истории"""
    __tablename__ = "history_versions"

    id: int = Field(default=1, primary_key=True)
    current_version: int = Field(default=0)
    max_version: int = Field(default=0)
    max_history_depth: int = Field(default=50)
