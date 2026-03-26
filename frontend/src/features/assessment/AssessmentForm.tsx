import { useMemo, useState, type FormEvent } from "react";
import type { Provider, User } from "../../shared/types";
import { useI18n } from "../../shared/i18n";
import { CameraCaptureModal } from "./CameraCaptureModal";

interface AssessmentFormProps {
  activeUser: User;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (payload: { provider: Provider; image: File; clinicianNotes?: string }) => Promise<void>;
}

export function AssessmentForm({ activeUser, isSubmitting, error, onSubmit }: AssessmentFormProps) {
  const { t } = useI18n();
  const [provider, setProvider] = useState<Provider>("gemini");
  const [clinicianNotes, setClinicianNotes] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const imageName = useMemo(() => image?.name ?? "", [image?.name]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!image) {
      return;
    }
    await onSubmit({
      provider,
      image,
      clinicianNotes: clinicianNotes.trim() || undefined
    });
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">{t("liveCapture")}</span>
            <h2>{t("assessmentTitle")}</h2>
          </div>
          <div className="badge">{activeUser.public_id}</div>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>{t("visionModel")}</span>
            <select value={provider} onChange={(event) => setProvider(event.target.value as Provider)}>
              <option value="gemini">gemini-3-flash-preview</option>
              <option value="qwen">qwen3.5-flash</option>
            </select>
          </label>

          <label className="field">
            <span>{t("uploadImage")}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            />
            <small className="muted">{t("uploadImageHint")}</small>
          </label>

          <div className="camera-inline-card">
            <div>
              <span>{t("cameraCapture")}</span>
              <p className="muted">{image ? `${t("capturedPhoto")}: ${imageName}` : t("cameraModalDescription")}</p>
            </div>
            <div className="camera-inline-actions">
              <button type="button" className="ghost-button" onClick={() => setIsCameraOpen(true)}>
                {image ? t("retake") : t("openCamera")}
              </button>
            </div>
          </div>

          <label className="field">
            <span>{t("supplementNotes")}</span>
            <textarea
              value={clinicianNotes}
              onChange={(event) => setClinicianNotes(event.target.value)}
              placeholder={t("supplementPlaceholder")}
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={isSubmitting || !image}>
            {isSubmitting ? t("submittingAssessment") : t("submitAssessment")}
          </button>
        </form>
      </section>

      <CameraCaptureModal
        open={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => setImage(file)}
      />
    </>
  );
}
