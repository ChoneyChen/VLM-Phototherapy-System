import { useState } from "react";
import type { AssessmentDetail, User } from "../shared/types";
import { useI18n } from "../shared/i18n";

interface TreatmentPageProps {
  activeUser: User;
  assessment: AssessmentDetail | null;
}

export function TreatmentPage({ activeUser, assessment }: TreatmentPageProps) {
  const { labelBoolean, labelIssue, labelLight, labelZone, pickText, t } = useI18n();
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
                <article key={zone.zone_name} className="zone-card">
                  <strong>{labelZone(zone.zone_name)}</strong>
                  <span>
                    {t("problem")}: {labelIssue(zone.issue_category_code)}
                  </span>
                  <span>
                    {t("lightType")}: {labelLight(zone.treatment_plan.light_type_code)}
                  </span>
                  <span>
                    {t("temperature")}: {zone.treatment_plan.temperature_celsius}°C
                  </span>
                  <span>
                    {t("duration")}: {zone.treatment_plan.duration_minutes} min
                  </span>
                  <span>
                    {t("humidification")}: {labelBoolean(zone.treatment_plan.humidification_enabled)}
                  </span>
                  <p>{pickText(zone.treatment_plan.notes_texts)}</p>
                </article>
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
