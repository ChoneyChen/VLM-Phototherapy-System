import type { AssessmentDetail, GeneratedTreatmentPlanDetail, User } from "../shared/types";
import { ArchivePanel } from "../features/archive/ArchivePanel";

interface ArchivePageProps {
  activeUser: User;
  refreshToken: number;
  latestAssessment: AssessmentDetail | null;
  onCreateTreatmentPlan: (assessmentId: string) => Promise<GeneratedTreatmentPlanDetail>;
  onDeleteAssessment: (assessmentId: string) => Promise<void>;
}

export function ArchivePage({
  activeUser,
  refreshToken,
  latestAssessment,
  onCreateTreatmentPlan,
  onDeleteAssessment
}: ArchivePageProps) {
  return (
    <ArchivePanel
      activeUser={activeUser}
      refreshToken={refreshToken}
      initialAssessment={latestAssessment}
      onCreateTreatmentPlan={onCreateTreatmentPlan}
      onDeleteAssessment={onDeleteAssessment}
    />
  );
}
