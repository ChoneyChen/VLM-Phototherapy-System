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

export interface AssessmentTreatmentPlan {
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
  treatment_plan: AssessmentTreatmentPlan;
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
  treatmentPlanId: string;
}

export interface NumericControlOption {
  min: number;
  max: number;
  step: number;
  unit: string;
}

export interface TreatmentControlOptions {
  mask_zone_codes: string[];
  light_color_codes: LightColorCode[];
  brightness_percent: NumericControlOption;
  temperature_celsius: NumericControlOption;
  humidification_frequency_level: NumericControlOption;
  timer_minutes: NumericControlOption;
}

export interface GlobalMaskSettings {
  brightness_percent: number;
  temperature_celsius: number;
  humidification_frequency_level: number;
  timer_minutes: number;
}

export interface TreatmentPlanZone {
  zone_name: string;
  issue_category_code: string;
  severity: Severity;
  led_color_code: LightColorCode;
  notes_texts: LocalizedText;
}

export interface GeneratedTreatmentPlanListItem {
  id: string;
  user_public_id: string;
  assessment_id: string;
  planner_model_provider: "qwen_plus";
  overall_severity: Severity;
  summary_texts: LocalizedText;
  zones: TreatmentPlanZone[];
  created_at: string;
}

export interface GeneratedTreatmentPlanDetail extends GeneratedTreatmentPlanListItem {
  rationale_texts: LocalizedText;
  global_settings: GlobalMaskSettings;
}

export interface ZoneLedSetting {
  zone_name: string;
  issue_category_code: string;
  severity: Severity;
  led_color_code: LightColorCode;
}

export interface TreatmentControlSession {
  schema_version: string;
  execution_channel: string;
  treatment_plan_id: string;
  user_public_id: string;
  overall_severity: Severity;
  summary_texts: LocalizedText;
  global_settings: GlobalMaskSettings;
  zone_led_settings: ZoneLedSetting[];
}

export type TreatmentRecordStatus = "running" | "paused" | "completed";

export interface TreatmentRecord {
  id: string;
  user_public_id: string;
  treatment_plan_id: string;
  plan_summary_texts: LocalizedText;
  overall_severity: Severity;
  status: TreatmentRecordStatus;
  timer_minutes: number;
  created_at: string;
  updated_at: string;
  global_settings: GlobalMaskSettings;
  zone_led_settings: ZoneLedSetting[];
}
