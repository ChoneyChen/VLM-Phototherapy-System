import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { createAssessment, createUser, deleteAssessment, deleteUser, listUsers } from "../shared/api/client";
import type { AssessmentDetail, Provider, User } from "../shared/types";
import { AppShell } from "../shared/components/AppShell";
import { UserGate } from "../features/users/UserGate";
import { AssessmentPage } from "../pages/AssessmentPage";
import { ArchivePage } from "../pages/ArchivePage";
import { TreatmentPage } from "../pages/TreatmentPage";
import { UsersPage } from "../pages/UsersPage";
import { useI18n } from "../shared/i18n";

const ACTIVE_USER_STORAGE_KEY = "vlm-phototherapy-active-user";

export default function App() {
  const { language, t } = useI18n();
  const [users, setUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [showUserGate, setShowUserGate] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState<AssessmentDetail | null>(null);
  const [treatmentAssessment, setTreatmentAssessment] = useState<AssessmentDetail | null>(null);
  const [archiveRefreshToken, setArchiveRefreshToken] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    void refreshUsers();
  }, []);

  useEffect(() => {
    if (users.length === 0) {
      setShowUserGate(true);
      return;
    }

    const storedUserId = window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (storedUserId) {
      const matched = users.find((user) => user.public_id === storedUserId) ?? users[0];
      setActiveUser((current) => current ?? matched);
      setShowUserGate(false);
      return;
    }

    setActiveUser((current) => current ?? null);
    setShowUserGate(true);
  }, [users]);

  const activeUserLabel = useMemo(() => activeUser?.name ?? t("selectUser"), [activeUser?.name, t]);

  async function refreshUsers() {
    const nextUsers = await listUsers();
    setUsers(nextUsers);
    return nextUsers;
  }

  function handleSelectUser(user: User) {
    setActiveUser(user);
    setShowUserGate(false);
    window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, user.public_id);
  }

  async function handleCreateUser(payload: { name: string; notes?: string }) {
    const user = await createUser(payload);
    await refreshUsers();
    handleSelectUser(user);
  }

  async function handleAssessmentSubmit(payload: {
    provider: Provider;
    image: File;
    clinicianNotes?: string;
  }) {
    if (!activeUser) {
      return;
    }

    try {
      setSubmitError(null);
      setIsSubmitting(true);
      const assessment = await createAssessment({
        userPublicId: activeUser.public_id,
        provider: payload.provider,
        language,
        clinicianNotes: payload.clinicianNotes,
        image: payload.image
      });
      setLatestAssessment(assessment);
      setTreatmentAssessment(assessment);
      setArchiveRefreshToken((value) => value + 1);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSelectTreatmentAssessment(assessment: AssessmentDetail) {
    setTreatmentAssessment(assessment);
  }

  async function handleDeleteUser(user: User) {
    await deleteUser(user.public_id);
    const remainingUsers = await refreshUsers();

    if (activeUser?.public_id === user.public_id) {
      const nextActiveUser = remainingUsers[0] ?? null;
      setActiveUser(nextActiveUser);
      if (nextActiveUser) {
        window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, nextActiveUser.public_id);
      } else {
        window.localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
        setShowUserGate(true);
      }
    }

    if (latestAssessment?.user_public_id === user.public_id) {
      setLatestAssessment(null);
    }

    if (treatmentAssessment?.user_public_id === user.public_id) {
      setTreatmentAssessment(null);
    }
  }

  async function handleDeleteAssessment(assessmentId: string) {
    await deleteAssessment(assessmentId);

    if (latestAssessment?.id === assessmentId) {
      setLatestAssessment(null);
    }

    if (treatmentAssessment?.id === assessmentId) {
      setTreatmentAssessment(null);
    }

    setArchiveRefreshToken((value) => value + 1);
  }

  return (
    <>
      <AppShell activeUser={activeUser} onOpenUserGate={() => setShowUserGate(true)}>
        <header className="page-hero">
          <span className="eyebrow">{t("heroEyebrow")}</span>
          <h2>{activeUserLabel}</h2>
          <p>{t("heroDelivered")}</p>
        </header>

        {activeUser ? (
          <Routes>
            <Route
              path="/assessment"
              element={
                <AssessmentPage
                  activeUser={activeUser}
                  latestAssessment={latestAssessment}
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                  onSubmit={handleAssessmentSubmit}
                />
              }
            />
            <Route
              path="/archive"
              element={
                <ArchivePage
                  activeUser={activeUser}
                  refreshToken={archiveRefreshToken}
                  latestAssessment={latestAssessment}
                  onTreatAssessment={handleSelectTreatmentAssessment}
                  onDeleteAssessment={handleDeleteAssessment}
                />
              }
            />
            <Route
              path="/treatment"
              element={
                <TreatmentPage
                  activeUser={activeUser}
                  assessment={treatmentAssessment ?? latestAssessment}
                />
              }
            />
            <Route
              path="/users"
              element={
                <UsersPage
                  users={users}
                  activeUser={activeUser}
                  onSelectUser={handleSelectUser}
                  onCreateUser={handleCreateUser}
                  onDeleteUser={handleDeleteUser}
                />
              }
            />
            <Route path="*" element={<Navigate to="/assessment" replace />} />
          </Routes>
        ) : (
          <section className="panel empty-state">
            <h2>{t("waitingUser")}</h2>
            <p>{t("waitingUserDescription")}</p>
          </section>
        )}
      </AppShell>

      <UserGate
        visible={showUserGate}
        users={users}
        onSelectUser={handleSelectUser}
        onCreateUser={handleCreateUser}
      />
    </>
  );
}
