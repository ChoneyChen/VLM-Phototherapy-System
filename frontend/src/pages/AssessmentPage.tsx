import { useEffect, useState } from "react";
import type { AssessmentDetail, Provider, User } from "../shared/types";
import { AssessmentForm } from "../features/assessment/AssessmentForm";
import { AssessmentResult } from "../features/assessment/AssessmentResult";

interface AssessmentPageProps {
  activeUser: User;
  latestAssessment: AssessmentDetail | null;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (payload: { provider: Provider; image: File; clinicianNotes?: string }) => Promise<void>;
}

export function AssessmentPage(props: AssessmentPageProps) {
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    if (!props.isSubmitting) {
      setProgressValue(0);
      return;
    }

    setProgressValue(8);
    const timer = window.setInterval(() => {
      setProgressValue((current) => {
        if (current >= 92) {
          return current;
        }
        return Math.min(92, current + Math.floor(Math.random() * 10) + 3);
      });
    }, 220);

    return () => {
      window.clearInterval(timer);
    };
  }, [props.isSubmitting]);

  return (
    <div className="page-grid">
      <AssessmentForm
        activeUser={props.activeUser}
        isSubmitting={props.isSubmitting}
        error={props.submitError}
        onSubmit={props.onSubmit}
      />
      <AssessmentResult
        assessment={props.latestAssessment}
        isSubmitting={props.isSubmitting}
        progressValue={progressValue}
      />
    </div>
  );
}
