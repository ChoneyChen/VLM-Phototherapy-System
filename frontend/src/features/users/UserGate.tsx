import { useMemo, useState } from "react";
import type { User } from "../../shared/types";
import { useI18n } from "../../shared/i18n";

interface UserGateProps {
  visible: boolean;
  users: User[];
  onSelectUser: (user: User) => void;
  onCreateUser: (payload: { name: string; notes?: string }) => Promise<void>;
}

export function UserGate({ visible, users, onSelectUser, onCreateUser }: UserGateProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const hasUsers = useMemo(() => users.length > 0, [users.length]);

  if (!visible) {
    return null;
  }

  async function handleCreate() {
    if (!name.trim()) {
      return;
    }

    try {
      setIsSaving(true);
      await onCreateUser({ name: name.trim(), notes: notes.trim() || undefined });
      setName("");
      setNotes("");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <span className="eyebrow">Entry Gate</span>
        <h2>{t("entryGateTitle")}</h2>
        <p>{t("entryGateDescription")}</p>

        <div className="gate-grid">
          <section className="panel">
            <h3>{t("selectExistingUser")}</h3>
            {hasUsers ? (
              <div className="user-list">
                {users.map((user) => (
                  <button key={user.public_id} type="button" className="list-card" onClick={() => onSelectUser(user)}>
                    <strong>{user.name}</strong>
                    <span>{user.public_id}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">{t("noUserYet")}</p>
            )}
          </section>

          <section className="panel">
            <h3>{t("createNewUser")}</h3>
            <label className="field">
              <span>{t("userName")}</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("userPlaceholder")} />
            </label>
            <label className="field">
              <span>{t("notes")}</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={t("notesPlaceholder")}
              />
            </label>
            <button className="primary-button" type="button" disabled={isSaving || !name.trim()} onClick={handleCreate}>
              {isSaving ? "..." : t("createAndEnter")}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
