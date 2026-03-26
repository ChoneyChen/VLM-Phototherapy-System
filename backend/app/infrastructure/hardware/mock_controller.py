from app.infrastructure.hardware.controller import HardwareController
from app.infrastructure.hardware.protocol import PhototherapyCommand, TreatmentControlCommand


class MockHardwareController(HardwareController):
    def __init__(self) -> None:
        self.last_command: dict[str, object] = {}

    def set_light_type(self, light_type: str) -> None:
        self.last_command["light_type"] = light_type

    def set_temperature(self, temperature_celsius: int) -> None:
        self.last_command["temperature_celsius"] = temperature_celsius

    def set_humidification(self, enabled: bool) -> None:
        self.last_command["humidification"] = enabled

    def start_treatment(self, duration_minutes: int) -> None:
        self.last_command["duration_minutes"] = duration_minutes

    def apply_zone_command(self, command: PhototherapyCommand) -> None:
        self.last_command["zone_command"] = command.model_dump()

    def set_light_color(self, light_color_code: str) -> None:
        self.last_command["light_color_code"] = light_color_code

    def set_brightness(self, brightness_percent: int) -> None:
        self.last_command["brightness_percent"] = brightness_percent

    def set_humidification_frequency(self, frequency_level: int) -> None:
        self.last_command["humidification_frequency_level"] = frequency_level

    def set_timer(self, timer_minutes: int) -> None:
        self.last_command["timer_minutes"] = timer_minutes

    def apply_control_command(self, command: TreatmentControlCommand) -> None:
        self.last_command["control_command"] = command.model_dump()
