from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_DATABASE_URL = f"sqlite:///{(REPO_ROOT / 'backend' / 'data' / 'runtime' / 'vlm_phototherapy.db').as_posix()}"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(REPO_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = Field(default="development", alias="APP_ENV")
    app_name: str = Field(default="VLM Phototherapy System", alias="APP_NAME")
    api_prefix: str = Field(default="/api", alias="API_PREFIX")
    cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        alias="CORS_ORIGINS",
    )

    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    gemini_model_name: str = Field(default="gemini-3-flash-preview", alias="GEMINI_MODEL_NAME")
    gemini_proxy_url: str | None = Field(default=None, alias="GEMINI_PROXY_URL")

    dashscope_api_key: str = Field(default="", alias="DASHSCOPE_API_KEY")
    qwen_model_name: str = Field(default="qwen3.5-flash", alias="QWEN_MODEL_NAME")
    qwen_plus_model_name: str = Field(default="qwen-plus", alias="QWEN_PLUS_MODEL_NAME")
    qwen_base_url: str = Field(
        default="https://dashscope.aliyuncs.com/compatible-mode/v1",
        alias="QWEN_BASE_URL",
    )

    database_url: str = Field(default=DEFAULT_DATABASE_URL, alias="DATABASE_URL")

    @property
    def backend_dir(self) -> Path:
        return REPO_ROOT / "backend"

    @property
    def common_dir(self) -> Path:
        return REPO_ROOT / "common"

    @property
    def runtime_dir(self) -> Path:
        return self.backend_dir / "data" / "runtime"

    @property
    def archive_dir(self) -> Path:
        return self.backend_dir / "data" / "archive"

    @property
    def prompt_template_path(self) -> Path:
        return self.common_dir / "prompts" / "skin_assessment_system_prompt.md"

    @property
    def knowledge_taxonomy_path(self) -> Path:
        return self.common_dir / "knowledge" / "skin_taxonomy.json"

    @property
    def treatment_case_library_path(self) -> Path:
        return self.common_dir / "knowledge" / "treatment_case_samples.json"

    @property
    def assessment_contract_path(self) -> Path:
        return self.common_dir / "contracts" / "skin_assessment_contract.json"

    @property
    def treatment_plan_contract_path(self) -> Path:
        return self.common_dir / "contracts" / "treatment_plan_contract.json"

    @property
    def treatment_record_contract_path(self) -> Path:
        return self.common_dir / "contracts" / "treatment_record_contract.json"

    @property
    def treatment_control_contract_path(self) -> Path:
        return self.common_dir / "contracts" / "treatment_control_contract.json"

    @property
    def treatment_plan_prompt_template_path(self) -> Path:
        return self.common_dir / "prompts" / "treatment_plan_generation_prompt.md"

    @property
    def treatment_plan_library_dir(self) -> Path:
        return self.common_dir / "knowledge" / "treatment_plan_library"

    @property
    def treatment_plan_case_memory_path(self) -> Path:
        return self.treatment_plan_library_dir / "case_memory.json"

    @property
    def treatment_plan_device_profile_path(self) -> Path:
        return self.treatment_plan_library_dir / "mask_device_profile.json"

    @property
    def treatment_plan_guideline_path(self) -> Path:
        return self.treatment_plan_library_dir / "clinical_guidelines.md"

    @property
    def treatment_plan_note_template_path(self) -> Path:
        return self.treatment_plan_library_dir / "authoring_notes.md"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
