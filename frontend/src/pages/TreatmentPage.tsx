import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTreatmentPlan, listTreatmentPlans } from "../shared/api/client";
import type { GeneratedTreatmentPlanDetail, GeneratedTreatmentPlanListItem, User } from "../shared/types";
import { useI18n } from "../shared/i18n";

interface TreatmentPageProps {
  activeUser: User;
  refreshToken: number;
  selectedPlan: GeneratedTreatmentPlanDetail | null;
  onSelectPlan: (plan: GeneratedTreatmentPlanDetail) => void;
}

export function TreatmentPage({ activeUser, refreshToken, selectedPlan, onSelectPlan }: TreatmentPageProps) {
  const navigate = useNavigate();
  const { labelIssue, labelSeverity, labelZone, pickText, t, language } = useI18n();
  const [plans, setPlans] = useState<GeneratedTreatmentPlanListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlans() {
      setLoading(true);
      try {
        const items = await listTreatmentPlans(activeUser.public_id);
        setPlans(items);
      } finally {
        setLoading(false);
      }
    }

    void loadPlans();
  }, [activeUser.public_id, refreshToken]);

  async function handleOpenControl(planId: string) {
    const detail = selectedPlan?.id === planId ? selectedPlan : await getTreatmentPlan(planId);
    onSelectPlan(detail);
    navigate("/control");
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">{t("treatmentWorkspace")}</span>
          <h2>{t("treatmentTitle")}</h2>
          <p className="muted">{t("treatmentPlansPageDescription")}</p>
        </div>
        <div className="badge">{activeUser.public_id}</div>
      </div>

      {loading ? (
        <p className="muted">{t("loadingTreatmentPlans")}</p>
      ) : plans.length === 0 ? (
        <div className="notice-card">
          <strong>{t("noTreatmentPlansYet")}</strong>
          <p>{t("noTreatmentPlansDescription")}</p>
        </div>
      ) : (
        <div className="treatment-plan-list">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              className={`treatment-summary-card ${selectedPlan?.id === plan.id ? "active" : ""}`}
              onClick={() => void handleOpenControl(plan.id)}
            >
              <div className="plan-card-head">
                <div>
                  <span className="eyebrow">
                    {new Date(plan.created_at).toLocaleString(language === "zh" ? "zh-CN" : "en-US")}
                  </span>
                  <strong>{pickText(plan.summary_texts)}</strong>
                </div>
                <span className={`severity-pill ${plan.overall_severity}`}>{labelSeverity(plan.overall_severity)}</span>
              </div>

              <div className="plan-row">
                <span className="plan-row-label">{t("planSourceAssessment")}</span>
                <strong>{plan.assessment_id}</strong>
              </div>

              <div className="plan-row">
                <span className="plan-row-label">{t("zonesAndIssues")}</span>
                <div className="zone-issue-list">
                  {plan.zones.map((zone) => (
                    <div key={`${plan.id}-${zone.zone_name}`} className="zone-issue-item">
                      <strong>{labelZone(zone.zone_name)}</strong>
                      <span>
                        {labelIssue(zone.issue_category_code)} · {labelSeverity(zone.severity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="plan-card-footer">
                <span>{t("openControl")}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
