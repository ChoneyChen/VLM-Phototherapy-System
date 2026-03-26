import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../shared/i18n";

interface CameraCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraCaptureModal({ open, onClose, onCapture }: CameraCaptureModalProps) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function startCamera() {
      if (!open) {
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(t("cameraNotSupported"));
        return;
      }

      try {
        setCameraError(null);
        setIsReady(false);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsReady(true);
        }
      } catch (error) {
        setCameraError(error instanceof Error ? error.message : t("cameraNotSupported"));
      }
    }

    void startCamera();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsReady(false);
    };
  }, [open, t]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return;
        }
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: "image/jpeg"
        });
        onCapture(file);
        onClose();
      },
      "image/jpeg",
      0.92
    );
  }

  return (
    <div className={`camera-modal-backdrop ${open ? "visible" : ""}`} aria-hidden={!open}>
      <div className={`camera-modal ${open ? "visible" : ""}`}>
        <div className="panel-header">
          <div>
            <span className="eyebrow">{t("cameraCapture")}</span>
            <h3>{t("cameraModalTitle")}</h3>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            {t("close")}
          </button>
        </div>

        <p className="muted">{t("cameraModalDescription")}</p>

        <div className="camera-frame">
          <video ref={videoRef} autoPlay playsInline muted />
        </div>

        {cameraError ? <p className="error-text">{cameraError}</p> : null}
        {!cameraError && isReady ? <p className="muted">{t("cameraReady")}</p> : null}

        <div className="camera-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            {t("close")}
          </button>
          <button type="button" className="primary-button" disabled={!isReady} onClick={handleCapture}>
            {t("capturePhoto")}
          </button>
        </div>
      </div>
    </div>
  );
}
