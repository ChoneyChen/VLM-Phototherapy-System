import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createTreatmentControlPreset,
  createTreatmentRecord,
  getTreatmentControlOptions,
  updateTreatmentRecordStatus
} from "../shared/api/client";
import { useI18n } from "../shared/i18n";
import type {
  GeneratedTreatmentPlanDetail,
  GlobalMaskSettings,
  LightColorCode,
  TreatmentControlOptions,
  TreatmentControlSession,
  TreatmentRecord,
  User,
  ZoneLedSetting
} from "../shared/types";

interface TreatmentControlPageProps {
  activeUser: User;
  treatmentPlan: GeneratedTreatmentPlanDetail | null;
  onRecordMutated: () => void;
}

export function TreatmentControlPage({ activeUser, treatmentPlan, onRecordMutated }: TreatmentControlPageProps) {
  const { labelColor, labelIssue, labelSeverity, labelZone, pickText, t } = useI18n();
  const [options, setOptions] = useState<TreatmentControlOptions | null>(null);
  const [session, setSession] = useState<TreatmentControlSession | null>(null);
  const [globalSettings, setGlobalSettings] = useState<GlobalMaskSettings | null>(null);
  const [zoneSettings, setZoneSettings] = useState<ZoneLedSetting[]>([]);
  const [activeZoneName, setActiveZoneName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentRecord, setCurrentRecord] = useState<TreatmentRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
      if (!treatmentPlan) {
        setSession(null);
        setGlobalSettings(null);
        setZoneSettings([]);
        setActiveZoneName(null);
        setCurrentRecord(null);
        return;
      }

      try {
        setLoading(true);
        setLoadError(null);
        setCurrentRecord(null);
        const preset = await createTreatmentControlPreset({ treatmentPlanId: treatmentPlan.id });
        setSession(preset);
        setGlobalSettings(preset.global_settings);
        setZoneSettings(preset.zone_led_settings);
        setActiveZoneName(preset.zone_led_settings[0]?.zone_name ?? null);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : t("genericError"));
      } finally {
        setLoading(false);
      }
    }

    void loadPreset();
  }, [treatmentPlan, t]);

  const activeZone = useMemo(
    () => zoneSettings.find((zone) => zone.zone_name === activeZoneName) ?? zoneSettings[0] ?? null,
    [activeZoneName, zoneSettings]
  );

  async function handleStartTreatment() {
    if (!treatmentPlan || !globalSettings || zoneSettings.length === 0) {
      return;
    }

    try {
      setActionLoading(true);
      if (currentRecord && currentRecord.status === "paused") {
        const updatedRecord = await updateTreatmentRecordStatus(currentRecord.id, "running");
        setCurrentRecord(updatedRecord);
      } else if (!currentRecord || currentRecord.status === "completed") {
        const record = await createTreatmentRecord({
          treatmentPlanId: treatmentPlan.id,
          globalSettings,
          zoneLedSettings: zoneSettings
        });
        setCurrentRecord(record);
      }
      onRecordMutated();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t("genericError"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePauseTreatment() {
    if (!currentRecord || currentRecord.status !== "running") {
      return;
    }

    try {
      setActionLoading(true);
      const updatedRecord = await updateTreatmentRecordStatus(currentRecord.id, "paused");
      setCurrentRecord(updatedRecord);
      onRecordMutated();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t("genericError"));
    } finally {
      setActionLoading(false);
    }
  }

  function updateGlobalSetting<K extends keyof GlobalMaskSettings>(key: K, value: number) {
    setGlobalSettings((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateZoneColor(zoneName: string, colorCode: LightColorCode) {
    setZoneSettings((current) =>
      current.map((zone) => (zone.zone_name === zoneName ? { ...zone, led_color_code: colorCode } : zone))
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">{t("controlWorkspace")}</span>
          <h2>{t("controlTitle")}</h2>
          <p className="muted">{t("maskControlDescription")}</p>
        </div>
        <div className="badge">{activeUser.public_id}</div>
      </div>

      {loadError ? <p className="error-text">{loadError}</p> : null}

      {!treatmentPlan ? (
        <div className="notice-card">
          <strong>{t("selectPlanToControl")}</strong>
          <p>{t("goToTreatmentPlans")}</p>
          <Link className="ghost-button" to="/treatment">
            {t("navTreatment")}
          </Link>
        </div>
      ) : null}

      {loading ? <p className="muted">{t("controlLoading")}</p> : null}

      {treatmentPlan && session && globalSettings && options ? (
        <div className="mask-control-layout">
          <div className="control-column">
            <article className="control-card">
              <div className="plan-card-head">
                <div>
                  <span className="eyebrow">{t("recommendedPlan")}</span>
                  <strong>{pickText(treatmentPlan.summary_texts)}</strong>
                </div>
                <span className={`severity-pill ${treatmentPlan.overall_severity}`}>{labelSeverity(treatmentPlan.overall_severity)}</span>
              </div>

              <div className="plan-row">
                <span className="plan-row-label">{t("recommendedSummary")}</span>
                <p>{pickText(treatmentPlan.rationale_texts)}</p>
              </div>

              <div className="plan-row">
                <span className="plan-row-label">{t("zonesAndIssues")}</span>
                <div className="zone-issue-list">
                  {treatmentPlan.zones.map((zone) => (
                    <div key={zone.zone_name} className="zone-issue-item">
                      <strong>{labelZone(zone.zone_name)}</strong>
                      <span>
                        {labelIssue(zone.issue_category_code)} · {labelSeverity(zone.severity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="control-card">
              <div className="plan-card-head">
                <div>
                  <span className="eyebrow">{t("globalTreatmentControls")}</span>
                  <strong>{t("globalTreatmentControls")}</strong>
                </div>
                {currentRecord ? (
                  <span className={`severity-pill ${recordStatusToClass(currentRecord.status)}`}>{t(recordStatusToKey(currentRecord.status))}</span>
                ) : null}
              </div>

              <SliderField
                label={t("brightness")}
                value={globalSettings.brightness_percent}
                options={options.brightness_percent}
                onChange={(value) => updateGlobalSetting("brightness_percent", value)}
              />
              <SliderField
                label={t("temperature")}
                value={globalSettings.temperature_celsius}
                options={options.temperature_celsius}
                onChange={(value) => updateGlobalSetting("temperature_celsius", value)}
              />
              <SliderField
                label={t("humidificationFrequency")}
                value={globalSettings.humidification_frequency_level}
                options={options.humidification_frequency_level}
                onChange={(value) => updateGlobalSetting("humidification_frequency_level", value)}
              />
              <SliderField
                label={t("timer")}
                value={globalSettings.timer_minutes}
                options={options.timer_minutes}
                onChange={(value) => updateGlobalSetting("timer_minutes", value)}
              />

              <div className="control-action-row">
                <button type="button" className="primary-button" disabled={actionLoading} onClick={() => void handleStartTreatment()}>
                  {currentRecord?.status === "paused" ? t("resumeTreatment") : t("startTreatment")}
                </button>
                <button type="button" className="ghost-button" disabled={actionLoading || currentRecord?.status !== "running"} onClick={() => void handlePauseTreatment()}>
                  {t("pauseTreatment")}
                </button>
              </div>
            </article>
          </div>

          <div className="control-column">
            <article className="control-card">
              <span className="eyebrow">{t("maskFaceMap")}</span>
              <div className="mask-map-layout">
                <MaskFaceMap
                  zones={zoneSettings}
                  activeZoneName={activeZoneName}
                  onSelectZone={setActiveZoneName}
                />

                <div className="selected-zone-panel">
                  {activeZone ? (
                    <>
                      <div className="plan-row">
                        <span className="plan-row-label">{t("selectedZone")}</span>
                        <strong>{labelZone(activeZone.zone_name)}</strong>
                        <span>
                          {labelIssue(activeZone.issue_category_code)} · {labelSeverity(activeZone.severity)}
                        </span>
                      </div>

                      <div className="control-field">
                        <div className="range-header">
                          <span>{t("zoneLedColor")}</span>
                          <strong>{labelColor(activeZone.led_color_code)}</strong>
                        </div>
                        <div className="color-grid compact">
                          {options.light_color_codes.map((colorCode) => (
                            <button
                              key={`${activeZone.zone_name}-${colorCode}`}
                              type="button"
                              className={`color-swatch ${activeZone.led_color_code === colorCode ? "active" : ""}`}
                              onClick={() => updateZoneColor(activeZone.zone_name, colorCode)}
                            >
                              <span className={`color-swatch-dot color-${colorCode}`} aria-hidden="true" />
                              <span>{labelColor(colorCode)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="muted">{t("pickZoneToControl")}</p>
                  )}
                </div>
              </div>
            </article>

            <article className="control-card">
              <span className="eyebrow">{t("commandPreview")}</span>
              <pre className="command-preview">
                {JSON.stringify(
                  {
                    treatment_plan_id: treatmentPlan.id,
                    global_settings: globalSettings,
                    zone_led_settings: zoneSettings
                  },
                  null,
                  2
                )}
              </pre>
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

interface MaskFaceMapProps {
  zones: ZoneLedSetting[];
  activeZoneName: string | null;
  onSelectZone: (zoneName: string) => void;
}

function MaskFaceMap({ zones, activeZoneName, onSelectZone }: MaskFaceMapProps) {
  return (
    <div className="mask-map">
      <div className="mask-face-outline" />
      {zones.map((zone) => (
        <button
          key={zone.zone_name}
          type="button"
          className={`mask-zone-button ${maskZoneClass(zone.zone_name)} ${activeZoneName === zone.zone_name ? "active" : ""}`}
          onClick={() => onSelectZone(zone.zone_name)}
        >
          <span className={`color-swatch-dot color-${zone.led_color_code}`} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function maskZoneClass(zoneName: string) {
  switch (zoneName) {
    case "Forehead Zone":
      return "zone-forehead";
    case "Periorbital Zone":
      return "zone-periorbital";
    case "Nasal Zone":
      return "zone-nasal";
    case "Left Malar Zone":
      return "zone-left-malar";
    case "Right Malar Zone":
      return "zone-right-malar";
    case "Perioral Zone":
      return "zone-perioral";
    case "Mandibular/Chin Zone":
      return "zone-chin";
    case "Jawline Zone":
      return "zone-jawline";
    default:
      return "";
  }
}

function recordStatusToKey(status: TreatmentRecord["status"]) {
  if (status === "running") {
    return "recordStatusRunning";
  }
  if (status === "paused") {
    return "recordStatusPaused";
  }
  return "recordStatusCompleted";
}

function recordStatusToClass(status: TreatmentRecord["status"]) {
  if (status === "running") {
    return "medium";
  }
  if (status === "paused") {
    return "low";
  }
  return "high";
}
