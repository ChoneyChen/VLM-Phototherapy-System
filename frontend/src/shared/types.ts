export type Severity = "low" | "medium" | "high";
export type Provider = "gemini" | "qwen";
export type AppLanguage = "en" | "zh";
export type LightColorCode = "red" | "orange" | "yellow" | "green" | "cyan" | "blue" | "purple";

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

export interface TreatmentControlTarget {
  assessmentId: string;
  zoneName: string;
}

export interface NumericControlOption {
  min: number;
  max: number;
  step: number;
  unit: string;
}

export interface TreatmentControlOptions {
  light_color_codes: LightColorCode[];
  brightness_percent: NumericControlOption;
  temperature_celsius: NumericControlOption;
  humidification_frequency_level: NumericControlOption;
  timer_minutes: NumericControlOption;
}

export interface TreatmentControlValues {
  light_color_code: LightColorCode;
  brightness_percent: number;
  temperature_celsius: number;
  humidification_frequency_level: number;
  timer_minutes: number;
}

export interface TreatmentControlSession {
  schema_version: string;
  execution_channel: string;
  assessment_id: string;
  zone_code: string;
  recommended_issue_category_code: string;
  recommended_severity: Severity;
  recommended_summary_texts: LocalizedText;
  recommended_light_type_code: string;
  recommended_duration_minutes: number;
  recommended_humidification_enabled: boolean;
  recommended_notes_texts: LocalizedText;
  control_values: TreatmentControlValues;
}
