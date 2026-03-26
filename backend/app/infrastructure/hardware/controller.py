from abc import ABC, abstractmethod

from app.infrastructure.hardware.protocol import PhototherapyCommand, TreatmentControlCommand


class HardwareController(ABC):
    @abstractmethod
    def set_light_type(self, light_type: str) -> None: ...

    @abstractmethod
    def set_temperature(self, temperature_celsius: int) -> None: ...

    @abstractmethod
    def set_humidification(self, enabled: bool) -> None: ...

    @abstractmethod
    def start_treatment(self, duration_minutes: int) -> None: ...

    @abstractmethod
    def apply_zone_command(self, command: PhototherapyCommand) -> None: ...

    @abstractmethod
    def set_light_color(self, light_color_code: str) -> None: ...

    @abstractmethod
    def set_brightness(self, brightness_percent: int) -> None: ...

    @abstractmethod
    def set_humidification_frequency(self, frequency_level: int) -> None: ...

    @abstractmethod
    def set_timer(self, timer_minutes: int) -> None: ...

    @abstractmethod
    def apply_control_command(self, command: TreatmentControlCommand) -> None: ...
