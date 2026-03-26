import { buildImageUrl } from "../../shared/api/client";
import { useI18n } from "../../shared/i18n";
import type { AssessmentDetail } from "../../shared/types";

interface AssessmentResultProps {
  assessment: AssessmentDetail | null;
  isSubmitting: boolean;
  progressValue: number;
}

export function AssessmentResult({ assessment, isSubmitting, progressValue }: AssessmentResultProps) {
  const { labelBoolean, labelIssue, labelLight, labelSeverity, labelZone, pickList, pickText, t } = useI18n();

  if (isSubmitting) {
    return (
      <section className="panel progress-panel">
        <span className="eyebrow">{t("output")}</span>
        <div
          className="progress-ring"
          style={{
            background: `conic-gradient(var(--accent) ${progressValue * 3.6}deg, rgba(201, 103, 45, 0.14) 0deg)`
          }}
        >
          <div className="progress-ring-inner">
            <strong>{progressValue}%</strong>
          </div>
        </div>
        <h2>{t("assessmentInProgress")}</h2>
        <p>{t("assessmentInProgressDescription")}</p>
      </section>
    );
  }

  if (!assessment) {
    return (
      <section className="panel empty-state">
        <span className="eyebrow">{t("output")}</span>
        <h2>{t("waitingAssessment")}</h2>
        <p>{t("waitingAssessmentDescription")}</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">{t("todayAnalysis")}</span>
          <h2>{pickText(assessment.overall_condition_texts)}</h2>
        </div>
        <div className={`severity-pill ${assessment.overall_severity}`}>{labelSeverity(assessment.overall_severity)}</div>
      </div>

      <div className="result-grid">
        <img className="preview-image" src={buildImageUrl(assessment.image_path)} alt="assessment capture" />
        <div className="summary-card">
          <p>{pickText(assessment.overall_summary_texts)}</p>
          <strong>{t("focusAreas")}</strong>
          <div className="focus-list">
            {pickList(assessment.recommended_focus_texts).map((focus) => (
              <span key={focus} className="focus-chip">
                {focus}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="zone-grid">
        {assessment.zones.map((zone) => (
          <article key={zone.zone_name} className="zone-card">
            <div className="zone-head">
              <strong>{labelZone(zone.zone_name)}</strong>
              <span className={`severity-pill ${zone.severity}`}>{labelSeverity(zone.severity)}</span>
            </div>
            <p className="zone-category">{labelIssue(zone.issue_category_code)}</p>
            <p>{pickText(zone.summary_texts)}</p>
            <div className="treatment-box">
              <strong>{t("treatmentRecommendation")}</strong>
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
              <span>{pickText(zone.treatment_plan.notes_texts)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
