import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createTreatmentControlPreset, getTreatmentControlOptions } from "../shared/api/client";
import { useI18n } from "../shared/i18n";
import type {
  AssessmentDetail,
  LightColorCode,
  TreatmentControlOptions,
  TreatmentControlSession,
  TreatmentControlTarget,
  TreatmentControlValues,
  User
} from "../shared/types";

interface TreatmentControlPageProps {
  activeUser: User;
  assessment: AssessmentDetail | null;
  controlTarget: TreatmentControlTarget | null;
  onSelectZone: (assessment: AssessmentDetail, zoneName: string) => void;
}

export function TreatmentControlPage({
  activeUser,
  assessment,
  controlTarget,
  onSelectZone
}: TreatmentControlPageProps) {
  const { labelBoolean, labelColor, labelIssue, labelLight, labelSeverity, labelZone, pickText, t } = useI18n();
  const [options, setOptions] = useState<TreatmentControlOptions | null>(null);
  const [session, setSession] = useState<TreatmentControlSession | null>(null);
  const [controlValues, setControlValues] = useState<TreatmentControlValues | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const nextOptions = await getTreatmentControlOptions();
        setOptions(nextOptions);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : t("genericError"));
      }
    }

    void loadOptions();
  }, [t]);

  useEffect(() => {
    async function loadPreset() {
      if (!controlTarget) {
        setSession(null);
        setControlValues(null);
        return;
      }

      try {
        setLoading(true);
        setLoadError(null);
        setSession(null);
        setControlValues(null);
        const preset = await createTreatmentControlPreset({
          assessmentId: controlTarget.assessmentId,
          zoneName: controlTarget.zoneName
        });
        setSession(preset);
        setControlValues(preset.control_values);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : t("genericError"));
      } finally {
        setLoading(false);
      }
    }

    void loadPreset();
  }, [controlTarget, t]);

  const previewPayload = useMemo(() => {
    if (!session || !controlValues) {
      return null;
    }

    return {
      schema_version: session.schema_version,
      execution_channel: session.execution_channel,
      assessment_id: session.assessment_id,
      zone_code: session.zone_code,
      recommended_issue_category_code: session.recommended_issue_category_code,
      recommended_light_type_code: session.recommended_light_type_code,
      control_values: controlValues
    };
  }, [controlValues, session]);

  function updateValue<K extends keyof TreatmentControlValues>(key: K, value: TreatmentControlValues[K]) {
    setControlValues((current) => (current ? { ...current, [key]: value } : current));
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">{t("controlWorkspace")}</span>
          <h2>{t("controlTitle")}</h2>
          <p className="muted">{t("controlDescription")}</p>
        </div>
        <div className="badge">{activeUser.public_id}</div>
      </div>

      {loadError ? <p className="error-text">{loadError}</p> : null}

      {!controlTarget && assessment ? (
        <div className="control-picker-section">
          <div className="notice-card">
            <strong>{t("pickZoneToControl")}</strong>
            <p>{t("selectPlanToControl")}</p>
          </div>
          <div className="zone-grid compact">
            {assessment.zones.map((zone) => (
              <button
                key={zone.zone_name}
                type="button"
                className="control-picker-card"
                onClick={() => onSelectZone(assessment, zone.zone_name)}
              >
                <div className="plan-card-head">
                  <div>
                    <span className="eyebrow">{labelZone(zone.zone_name)}</span>
                    <strong>{labelIssue(zone.issue_category_code)}</strong>
                  </div>
                  <span className={`severity-pill ${zone.severity}`}>{labelSeverity(zone.severity)}</span>
                </div>
                <p>{pickText(zone.treatment_plan.notes_texts)}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!controlTarget && !assessment ? (
        <div className="notice-card">
          <strong>{t("selectPlanToControl")}</strong>
          <p>{t("goToTreatmentPlans")}</p>
          <Link className="ghost-button" to="/treatment">
            {t("navTreatment")}
          </Link>
        </div>
      ) : null}

      {loading ? <p className="muted">{t("controlLoading")}</p> : null}

      {session && controlValues && options ? (
        <div className="control-layout">
          <div className="control-column">
            <article className="control-card">
              <span className="eyebrow">{t("recommendedPlan")}</span>
              <h3>{labelZone(session.zone_code)}</h3>
              <div className="control-summary-list">
                <div className="plan-row">
                  <span className="plan-row-label">{t("recommendedIssue")}</span>
                  <strong>{labelIssue(session.recommended_issue_category_code)}</strong>
                </div>
                <div className="plan-row">
                  <span className="plan-row-label">{t("recommendedSummary")}</span>
                  <p>{pickText(session.recommended_summary_texts)}</p>
                </div>
                <div className="plan-row">
                  <span className="plan-row-label">{t("lightType")}</span>
                  <strong>{labelLight(session.recommended_light_type_code)}</strong>
                </div>
                <div className="plan-row">
                  <span className="plan-row-label">{t("duration")}</span>
                  <strong>{session.recommended_duration_minutes} min</strong>
                </div>
                <div className="plan-row">
                  <span className="plan-row-label">{t("humidification")}</span>
                  <strong>{labelBoolean(session.recommended_humidification_enabled)}</strong>
                </div>
                <div className="plan-row">
                  <span className="plan-row-label">{t("notes")}</span>
                  <p>{pickText(session.recommended_notes_texts)}</p>
                </div>
              </div>
            </article>

            <article className="notice-card">
              <strong>{t("deviceBindingReserved")}</strong>
              <p>{t("deviceBindingReservedDescription")}</p>
            </article>
          </div>

          <div className="control-column">
            <article className="control-card">
              <div className="panel-header compact">
                <div>
                  <span className="eyebrow">{t("controlValues")}</span>
                  <h3>{t("controlTitle")}</h3>
                </div>
                <span className={`severity-pill ${session.recommended_severity}`}>{labelSeverity(session.recommended_severity)}</span>
              </div>

              <div className="control-field">
                <div className="range-header">
                  <span>{t("lightColor")}</span>
                  <strong>{labelColor(controlValues.light_color_code)}</strong>
                </div>
                <div className="color-grid">
                  {options.light_color_codes.map((colorCode) => (
                    <button
                      key={colorCode}
                      type="button"
                      className={`color-swatch ${controlValues.light_color_code === colorCode ? "active" : ""}`}
                      onClick={() => updateValue("light_color_code", colorCode as LightColorCode)}
                    >
                      <span className={`color-swatch-dot color-${colorCode}`} aria-hidden="true" />
                      <span>{labelColor(colorCode)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <SliderField
                label={t("brightness")}
                value={controlValues.brightness_percent}
                options={options.brightness_percent}
                onChange={(value) => updateValue("brightness_percent", value)}
              />
              <SliderField
                label={t("temperature")}
                value={controlValues.temperature_celsius}
                options={options.temperature_celsius}
                onChange={(value) => updateValue("temperature_celsius", value)}
              />
              <SliderField
                label={t("humidificationFrequency")}
                value={controlValues.humidification_frequency_level}
                options={options.humidification_frequency_level}
                onChange={(value) => updateValue("humidification_frequency_level", value)}
              />
              <SliderField
                label={t("timer")}
                value={controlValues.timer_minutes}
                options={options.timer_minutes}
                onChange={(value) => updateValue("timer_minutes", value)}
              />
            </article>

            <article className="control-card">
              <span className="eyebrow">{t("commandPreview")}</span>
              <pre className="command-preview">{previewPayload ? JSON.stringify(previewPayload, null, 2) : ""}</pre>
            </article>
          </div>
        </div>
      ) : null}
    </section>
  );
}

interface SliderFieldProps {
  label: string;
  value: number;
  options: TreatmentControlOptions["brightness_percent"];
  onChange: (value: number) => void;
}

function SliderField({ label, value, options, onChange }: SliderFieldProps) {
  return (
    <div className="control-field">
      <div className="range-header">
        <span>{label}</span>
        <strong>
          {value} {options.unit === "percent" ? "%" : options.unit === "celsius" ? "°C" : options.unit === "minutes" ? "min" : ""}
        </strong>
      </div>
      <input
        type="range"
        min={options.min}
        max={options.max}
        step={options.step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="slider-meta">
        <span>{options.min}</span>
        <span>{options.max}</span>
      </div>
    </div>
  );
}
