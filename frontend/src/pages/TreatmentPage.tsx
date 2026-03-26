import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AssessmentDetail, User } from "../shared/types";
import { useI18n } from "../shared/i18n";

interface TreatmentPageProps {
  activeUser: User;
  assessment: AssessmentDetail | null;
  onOpenControl: (assessment: AssessmentDetail, zoneName: string) => void;
}

export function TreatmentPage({ activeUser, assessment, onOpenControl }: TreatmentPageProps) {
  const navigate = useNavigate();
  const { labelBoolean, labelIssue, labelLight, labelSeverity, labelZone, pickText, t } = useI18n();
  const [filter, setFilter] = useState<"all" | "nonLow" | "highOnly">("all");
  const visibleZones =
    assessment?.zones.filter((zone) => {
      if (filter === "highOnly") {
        return zone.severity === "high";
      }
      if (filter === "nonLow") {
        return zone.severity !== "low";
      }
      return true;
    }) ?? [];

  function handleOpenZoneControl(zoneName: string) {
    if (!assessment) {
      return;
    }
    onOpenControl(assessment, zoneName);
    navigate("/control");
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">{t("treatmentWorkspace")}</span>
          <h2>{t("treatmentTitle")}</h2>
        </div>
        <div className="badge">{activeUser.public_id}</div>
      </div>

      {assessment ? (
        <>
          <div className="filter-row">
            <span className="eyebrow">{t("treatmentFilter")}</span>
            <div className="filter-pills">
              <button type="button" className={`filter-pill ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
                {t("showAll")}
              </button>
              <button
                type="button"
                className={`filter-pill ${filter === "nonLow" ? "active" : ""}`}
                onClick={() => setFilter("nonLow")}
              >
                {t("showNonLow")}
              </button>
              <button
                type="button"
                className={`filter-pill ${filter === "highOnly" ? "active" : ""}`}
                onClick={() => setFilter("highOnly")}
              >
                {t("showHighOnly")}
              </button>
            </div>
          </div>

          {visibleZones.length > 0 ? (
            <div className="zone-grid compact">
              {visibleZones.map((zone) => (
                <button
                  key={zone.zone_name}
                  type="button"
                  className="treatment-plan-card"
                  onClick={() => handleOpenZoneControl(zone.zone_name)}
                >
                  <div className="plan-card-head">
                    <div>
                      <span className="eyebrow">{labelZone(zone.zone_name)}</span>
                      <strong>{labelIssue(zone.issue_category_code)}</strong>
                    </div>
                    <span className={`severity-pill ${zone.severity}`}>{labelSeverity(zone.severity)}</span>
                  </div>

                  <div className="plan-card-body">
                    <div className="plan-row">
                      <span className="plan-row-label">{t("problem")}</span>
                      <strong>{labelIssue(zone.issue_category_code)}</strong>
                    </div>
                    <div className="plan-row">
                      <span className="plan-row-label">{t("treatmentRecommendation")}</span>
                      <div className="plan-meta-grid">
                        <div className="plan-meta-item">
                          <span className="plan-row-label">{t("lightType")}</span>
                          <strong>{labelLight(zone.treatment_plan.light_type_code)}</strong>
                        </div>
                        <div className="plan-meta-item">
                          <span className="plan-row-label">{t("temperature")}</span>
                          <strong>{zone.treatment_plan.temperature_celsius}°C</strong>
                        </div>
                        <div className="plan-meta-item">
                          <span className="plan-row-label">{t("duration")}</span>
                          <strong>{zone.treatment_plan.duration_minutes} min</strong>
                        </div>
                        <div className="plan-meta-item">
                          <span className="plan-row-label">{t("humidification")}</span>
                          <strong>{labelBoolean(zone.treatment_plan.humidification_enabled)}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="plan-row">
                      <span className="plan-row-label">{t("notes")}</span>
                      <p>{pickText(zone.treatment_plan.notes_texts)}</p>
                    </div>
                  </div>

                  <div className="plan-card-footer">
                    <span>{t("openControl")}</span>
                    <span aria-hidden="true">+</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="muted">{t("noMatchingPlans")}</p>
          )}
        </>
      ) : (
        <p className="muted">{t("completeAssessmentFirst")}</p>
      )}

      <div className="notice-card">
        <strong>{t("hardwareReserve")}</strong>
        <p>{t("hardwareReserveDescription")}</p>
      </div>
    </section>
  );
}
