export type Severity = "low" | "medium" | "high";
export type Provider = "gemini" | "qwen";
export type AppLanguage = "en" | "zh";

export interface User {
  public_id: string;
  sequence_number: number;
  name: string;
  notes: string | null;
  created_at: string;
}

export interface LocalizedText {
  en: string;
  zh: string;
}

export interface LocalizedStringList {
  en: string[];
  zh: string[];
}

export interface SafetyRange {
  min: number;
  max: number;
  unit: string;
}

export interface HardwareSafetyProfile {
  temperature_celsius: SafetyRange;
  duration_minutes: SafetyRange;
}

export interface HardwareProfile {
  schema_version: string;
  execution_channel: string;
  zone_code: string;
  light_type_code: string;
  temperature_celsius: number;
  duration_minutes: number;
  humidification_enabled: boolean;
  safety_profile: HardwareSafetyProfile;
}

export interface TreatmentPlan {
  light_type_code: string;
  temperature_celsius: number;
  duration_minutes: number;
  humidification_enabled: boolean;
  notes_texts: LocalizedText;
  hardware_profile: HardwareProfile;
}

export interface ZoneAssessment {
  zone_name: string;
  issue_category_code: string;
  severity: Severity;
  summary_texts: LocalizedText;
  treatment_plan: TreatmentPlan;
}

export interface AssessmentListItem {
  id: string;
  user_public_id: string;
  model_provider: Provider;
  analysis_language: AppLanguage;
  overall_condition_texts: LocalizedText;
  overall_severity: Severity;
  overall_summary_texts: LocalizedText;
  image_path: string;
  captured_at: string;
}

export interface AssessmentDetail extends AssessmentListItem {
  recommended_focus_texts: LocalizedStringList;
  zones: ZoneAssessment[];
}
