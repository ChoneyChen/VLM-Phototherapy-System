import { useEffect, useState } from "react";
import { listTreatmentRecords } from "../shared/api/client";
import { useI18n } from "../shared/i18n";
import type { TreatmentRecord, User } from "../shared/types";

interface TreatmentRecordsPageProps {
  activeUser: User;
  refreshToken: number;
}

export function TreatmentRecordsPage({ activeUser, refreshToken }: TreatmentRecordsPageProps) {
  const { labelColor, labelSeverity, labelZone, pickText, t, language } = useI18n();
  const [records, setRecords] = useState<TreatmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecords() {
      setLoading(true);
      try {
        const items = await listTreatmentRecords(activeUser.public_id);
        setRecords(items);
      } finally {
        setLoading(false);
      }
    }

    void loadRecords();
  }, [activeUser.public_id, refreshToken]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">{t("navRecords")}</span>
          <h2>{t("recordsTitle")}</h2>
          <p className="muted">{t("recordsDescription")}</p>
        </div>
        <div className="badge">{activeUser.public_id}</div>
      </div>

      {loading ? (
        <p className="muted">{t("loadingRecords")}</p>
      ) : records.length === 0 ? (
        <div className="notice-card">
          <strong>{t("noTreatmentRecordsYet")}</strong>
          <p>{t("noTreatmentRecordsDescription")}</p>
        </div>
      ) : (
        <div className="treatment-record-list">
          {records.map((record) => (
            <article key={record.id} className="treatment-record-card">
              <div className="plan-card-head">
                <div>
                  <span className="eyebrow">
                    {new Date(record.created_at).toLocaleString(language === "zh" ? "zh-CN" : "en-US")}
                  </span>
                  <strong>{pickText(record.plan_summary_texts)}</strong>
                </div>
                <div className="user-card-status">
                  <span className={`severity-pill ${recordStatusToClass(record.status)}`}>{t(recordStatusToKey(record.status))}</span>
                  <span className={`severity-pill ${record.overall_severity}`}>{labelSeverity(record.overall_severity)}</span>
                </div>
              </div>

              <div className="plan-meta-grid">
                <div className="plan-meta-item">
                  <span className="plan-row-label">{t("recordStartedAt")}</span>
                  <strong>{new Date(record.created_at).toLocaleString(language === "zh" ? "zh-CN" : "en-US")}</strong>
                </div>
                <div className="plan-meta-item">
                  <span className="plan-row-label">{t("recordUpdatedAt")}</span>
                  <strong>{new Date(record.updated_at).toLocaleString(language === "zh" ? "zh-CN" : "en-US")}</strong>
                </div>
                <div className="plan-meta-item">
                  <span className="plan-row-label">{t("recordDuration")}</span>
                  <strong>{record.timer_minutes} {language === "zh" ? "分钟" : "min"}</strong>
                </div>
                <div className="plan-meta-item">
                  <span className="plan-row-label">{t("recordStatus")}</span>
                  <strong>{t(recordStatusToKey(record.status))}</strong>
                </div>
              </div>

              <div className="plan-row">
                <span className="plan-row-label">{t("recordLinkedPlan")}</span>
                <strong>{record.treatment_plan_id}</strong>
              </div>

              <div className="plan-row">
                <span className="plan-row-label">{t("controlValues")}</span>
                <div className="record-setting-grid">
                  <span>{t("brightness")}: {record.global_settings.brightness_percent}%</span>
                  <span>{t("temperature")}: {record.global_settings.temperature_celsius}°C</span>
                  <span>{t("humidificationFrequency")}: {record.global_settings.humidification_frequency_level}</span>
                  <span>{t("timer")}: {record.global_settings.timer_minutes} min</span>
                </div>
              </div>

              <div className="plan-row">
                <span className="plan-row-label">{t("zoneLedColor")}</span>
                <div className="record-zone-grid">
                  {record.zone_led_settings.map((zone) => (
                    <span key={`${record.id}-${zone.zone_name}`} className="record-zone-pill">
                      {labelZone(zone.zone_name)} · {labelColor(zone.led_color_code)}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
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
