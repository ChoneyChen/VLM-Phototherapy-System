from app.infrastructure.hardware.controller import HardwareController
from app.infrastructure.hardware.protocol import PhototherapyCommand


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
