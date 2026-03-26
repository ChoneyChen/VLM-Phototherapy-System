import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildImageUrl, getAssessment, listAssessments } from "../../shared/api/client";
import { useI18n } from "../../shared/i18n";
import type { AssessmentDetail, AssessmentListItem, User } from "../../shared/types";

interface ArchivePanelProps {
  activeUser: User;
  refreshToken: number;
  initialAssessment: AssessmentDetail | null;
  onTreatAssessment: (assessment: AssessmentDetail) => void;
  onDeleteAssessment: (assessmentId: string) => Promise<void>;
}

export function ArchivePanel({
  activeUser,
  refreshToken,
  initialAssessment,
  onTreatAssessment,
  onDeleteAssessment
}: ArchivePanelProps) {
  const { labelIssue, labelSeverity, labelZone, pickText, t, language } = useI18n();
  const navigate = useNavigate();
  const [history, setHistory] = useState<AssessmentListItem[]>([]);
  const [selected, setSelected] = useState<AssessmentDetail | null>(initialAssessment);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        const items = await listAssessments(activeUser.public_id);
        setHistory(items);
        if (initialAssessment) {
          setSelected(initialAssessment);
          return;
        }
        if (items[0]) {
          const detail = await getAssessment(items[0].id);
          setSelected(detail);
        } else {
          setSelected(null);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadHistory();
  }, [activeUser.public_id, initialAssessment, refreshToken]);

  async function handleSelect(item: AssessmentListItem) {
    const detail = await getAssessment(item.id);
    setSelected(detail);
    setOpenMenuId(null);
  }

  async function handleTreat(item: AssessmentListItem) {
    const detail = await getAssessment(item.id);
    setSelected(detail);
    onTreatAssessment(detail);
    setOpenMenuId(null);
    navigate("/treatment");
  }

  async function handleDelete(item: AssessmentListItem) {
    const confirmed = window.confirm(t("deleteRecordConfirm"));
    if (!confirmed) {
      return;
    }

    await onDeleteAssessment(item.id);
    const nextHistory = history.filter((entry) => entry.id !== item.id);
    setHistory(nextHistory);
    setOpenMenuId(null);

    if (selected?.id === item.id) {
      if (nextHistory[0]) {
        const detail = await getAssessment(nextHistory[0].id);
        setSelected(detail);
      } else {
        setSelected(null);
      }
    }
  }

  return (
    <div className="archive-layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">{t("history")}</span>
            <h2>{t("archiveTitle")}</h2>
          </div>
          <div className="badge">{activeUser.name}</div>
        </div>

        {loading ? (
          <p className="muted">{t("loadingArchive")}</p>
        ) : history.length === 0 ? (
          <p className="muted">{t("emptyArchive")}</p>
        ) : (
          <div className="timeline">
            {history.map((item) => (
              <div key={item.id} className="timeline-card">
                <button type="button" className="timeline-item" onClick={() => void handleSelect(item)}>
                  <strong>{new Date(item.captured_at).toLocaleString(language === "zh" ? "zh-CN" : "en-US")}</strong>
                  <span>{pickText(item.overall_condition_texts)}</span>
                  <span>{pickText(item.overall_summary_texts)}</span>
                </button>

                <button
                  type="button"
                  className="menu-dot-button"
                  onClick={() => setOpenMenuId((current) => (current === item.id ? null : item.id))}
                >
                  ··
                </button>

                {openMenuId === item.id ? (
                  <div className="context-menu">
                    <button type="button" className="context-menu-item" onClick={() => void handleTreat(item)}>
                      {t("treatThisRecord")}
                    </button>
                    <button type="button" className="context-menu-item danger" onClick={() => void handleDelete(item)}>
                      {t("deleteRecordAction")}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">{t("recordDetail")}</span>
            <h2>{t("recordDetail")}</h2>
          </div>
        </div>

        {selected ? (
          <div className="archive-detail">
            <img className="archive-image" src={buildImageUrl(selected.image_path)} alt="archived face" />
            <p>{pickText(selected.overall_summary_texts)}</p>
            <div className="zone-grid compact">
              {selected.zones.map((zone) => (
                <article key={zone.zone_name} className="zone-card">
                  <div className="zone-head">
                    <strong>{labelZone(zone.zone_name)}</strong>
                    <span className={`severity-pill ${zone.severity}`}>{labelSeverity(zone.severity)}</span>
                  </div>
                  <p className="zone-category">{labelIssue(zone.issue_category_code)}</p>
                  <p>{pickText(zone.summary_texts)}</p>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="muted">{t("selectHistory")}</p>
        )}
      </section>
    </div>
  );
}
