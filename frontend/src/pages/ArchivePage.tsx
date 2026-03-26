import type { AssessmentDetail, User } from "../shared/types";
import { ArchivePanel } from "../features/archive/ArchivePanel";

interface ArchivePageProps {
  activeUser: User;
  refreshToken: number;
  latestAssessment: AssessmentDetail | null;
  onTreatAssessment: (assessment: AssessmentDetail) => void;
  onDeleteAssessment: (assessmentId: string) => Promise<void>;
}

export function ArchivePage({
  activeUser,
  refreshToken,
  latestAssessment,
  onTreatAssessment,
  onDeleteAssessment
}: ArchivePageProps) {
  return (
    <ArchivePanel
      activeUser={activeUser}
      refreshToken={refreshToken}
      initialAssessment={latestAssessment}
      onTreatAssessment={onTreatAssessment}
      onDeleteAssessment={onDeleteAssessment}
    />
  );
}
