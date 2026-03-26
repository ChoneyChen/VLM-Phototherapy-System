import { useState, type FormEvent } from "react";
import type { User } from "../shared/types";
import { useI18n } from "../shared/i18n";

interface UsersPageProps {
  users: User[];
  activeUser: User | null;
  onSelectUser: (user: User) => void;
  onCreateUser: (payload: { name: string; notes?: string }) => Promise<void>;
  onDeleteUser: (user: User) => Promise<void>;
}

export function UsersPage({ users, activeUser, onSelectUser, onCreateUser, onDeleteUser }: UsersPageProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    await onCreateUser({ name: name.trim(), notes: notes.trim() || undefined });
    setName("");
    setNotes("");
  }

  async function handleDelete(user: User) {
    const confirmed = window.confirm(t("deleteUserConfirm"));
    if (!confirmed) {
      return;
    }
    await onDeleteUser(user);
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">{t("roster")}</span>
            <h2>{t("userManagement")}</h2>
          </div>
        </div>

        <div className="user-list">
          {users.map((user) => (
            <div key={user.public_id} className={`list-card user-card ${activeUser?.public_id === user.public_id ? "active" : ""}`}>
              <button type="button" className="list-card-main" onClick={() => onSelectUser(user)}>
                <div className="user-card-head">
                  <div className="user-card-meta">
                    <strong>{user.name}</strong>
                    <span>{user.public_id}</span>
                  </div>
                  <div className="user-card-status">
                    {activeUser?.public_id === user.public_id ? <span className="user-active-pill">{t("activeBadge")}</span> : null}
                    <span className={`selection-indicator ${activeUser?.public_id === user.public_id ? "active" : ""}`} aria-hidden="true" />
                  </div>
                </div>
                {user.notes ? <span className="muted">{user.notes}</span> : null}
              </button>
              <button type="button" className="danger-button" onClick={() => void handleDelete(user)}>
                {t("deleteUserAction")}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">{t("create")}</span>
            <h2>{t("createUser")}</h2>
          </div>
        </div>

        <form className="form-stack" onSubmit={handleCreate}>
          <label className="field">
            <span>{t("userName")}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("userPlaceholder")} />
          </label>

          <label className="field">
            <span>{t("notes")}</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t("notesPlaceholder")} />
          </label>

          <button className="primary-button" type="submit">
            {t("createUser")}
          </button>
        </form>
      </section>
    </div>
  );
}
